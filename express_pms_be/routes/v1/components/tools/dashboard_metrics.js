/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file dashboard_metrics.js
 * @description Helper bersama untuk perhitungan metrik Dashboard Utama (Occupancy, ADR, RevPAR,
 *              revenue, inventory kamar, business date). Dipakai oleh seluruh endpoint /dashboard/*
 *              agar rumus KPI tidak terduplikasi.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

import DB from "../../../../core/config/knex.js";
import { formatDateSystem, timeZoneMap } from "./date_tools.js";
import { getCurrentBusinessDate } from "./business_date_helper.js";
import { Logging } from "./servertool.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Utilitas tanggal berbasis string YYYY-MM-DD (bebas efek timezone)   */
/* ------------------------------------------------------------------ */

/** Mengubah string YYYY-MM-DD menjadi Date UTC tengah malam. */
const ymdToUtc = (ymd) => new Date(`${ymd}T00:00:00Z`);

/** Mengubah Date UTC menjadi string YYYY-MM-DD. */
const utcToYmd = (date) => date.toISOString().slice(0, 10);

/** Menambah n hari pada tanggal YYYY-MM-DD. */
export const addDays = (ymd, n) => utcToYmd(new Date(ymdToUtc(ymd).getTime() + n * DAY_MS));

/** Selisih hari (b - a) untuk dua tanggal YYYY-MM-DD. */
export const diffDays = (a, b) => Math.round((ymdToUtc(b).getTime() - ymdToUtc(a).getTime()) / DAY_MS);

/** Daftar tanggal dari `from` (inklusif) hingga `toExclusive` (eksklusif). */
export const enumerateDates = (from, toExclusive) => {
  const dates = [];
  for (let d = from; d < toExclusive; d = addDays(d, 1)) {
    dates.push(d);
  }
  return dates;
};

/** Tanggal pertama pada bulan dari tanggal YYYY-MM-DD. */
export const startOfMonth = (ymd) => `${ymd.slice(0, 7)}-01`;

/**
 * Periode pembanding "bulan lalu" untuk rentang MTD.
 * Contoh: MTD 2026-10-01..2026-10-14 -> 2026-09-01..2026-09-14 (di-clamp ke akhir bulan).
 */
export const previousMonthRange = (mtdFrom, mtdTo) => {
  const fromDate = ymdToUtc(mtdFrom);
  const prevMonthStart = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 1, 1));
  const prevMonthEnd = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), 0));
  const dayOfMonth = ymdToUtc(mtdTo).getUTCDate();
  const prevTo = new Date(
    Date.UTC(prevMonthStart.getUTCFullYear(), prevMonthStart.getUTCMonth(), Math.min(dayOfMonth, prevMonthEnd.getUTCDate()))
  );
  return { from: utcToYmd(prevMonthStart), to: utcToYmd(prevTo) };
};

/* ------------------------------------------------------------------ */
/* Utilitas angka                                                      */
/* ------------------------------------------------------------------ */

export const toNumber = (val) => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};

export const round = (val, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(toNumber(val) * factor) / factor;
};

/** Persentase perubahan current terhadap previous. Null bila previous = 0 (tidak terdefinisi). */
export const pctChange = (current, previous) => {
  const c = toNumber(current);
  const p = toNumber(previous);
  if (p === 0) return c === 0 ? 0 : null;
  return round(((c - p) / Math.abs(p)) * 100, 1);
};

/** Menghitung Occupancy %, ADR, RevPAR dengan aman terhadap pembagian nol. */
export const computeKpi = ({ sold = 0, revenue = 0, available = 0 }) => ({
  rooms_sold: sold,
  rooms_available: available,
  room_revenue: round(revenue, 2),
  occupancy_pct: available > 0 ? round((sold / available) * 100, 1) : 0,
  adr: sold > 0 ? round(revenue / sold, 0) : 0,
  revpar: available > 0 ? round(revenue / available, 0) : 0,
});

/* ------------------------------------------------------------------ */
/* Business date & kalender cabang                                     */
/* ------------------------------------------------------------------ */

/** Business date aktif cabang (sumber kebenaran "hari ini" untuk dashboard). */
export const getBusinessDate = async (kodeCabang) => {
  try {
    const info = await getCurrentBusinessDate(kodeCabang);
    return info.current_business_date || formatDateSystem(new Date(), "yyyy-MM-dd");
  } catch {
    return formatDateSystem(new Date(), "yyyy-MM-dd");
  }
};

/** Tanggal kalender saat ini sesuai zona waktu cabang (mst_cabang.zona_waktu). */
export const getBranchCalendarDate = async (kodeCabang) => {
  const branch = await DB("mst_cabang").where("kode_cabang", kodeCabang).select("zona_waktu").first();
  const zone = branch?.zona_waktu || "";
  const tz = timeZoneMap[zone] || (zone.includes("/") ? zone : undefined);
  return formatDateSystem(new Date(), "yyyy-MM-dd", tz);
};

/* ------------------------------------------------------------------ */
/* Inventory kamar                                                     */
/* ------------------------------------------------------------------ */

const OOO_HK_STATUSES = ["maintenance", "out_of_service"];
const DIRTY_HK_STATUSES = ["dirty", "inspection", "in_progress"];

/**
 * Snapshot inventory kamar fisik cabang.
 * Rooms Available = total kamar aktif - kamar Out Of Order (blocked / maintenance).
 */
export const getRoomInventory = async (kodeCabang) => {
  const rooms = await DB("mst_kamar")
    .where("kode_cabang", kodeCabang)
    .where("is_active", 1)
    .whereNull("deleted_at")
    .select("kode_kamar", "nomor_kamar", "occupancy_status", "housekeeping_status");

  const isOoo = (r) => r.occupancy_status === "blocked" || OOO_HK_STATUSES.includes(r.housekeeping_status);

  const total = rooms.length;
  const ooo = rooms.filter(isOoo).length;
  const occupied = rooms.filter((r) => !isOoo(r) && r.occupancy_status === "occupied").length;
  const vacantClean = rooms.filter(
    (r) => !isOoo(r) && r.occupancy_status === "vacant" && r.housekeeping_status === "clean"
  ).length;
  const vacantDirty = rooms.filter(
    (r) => !isOoo(r) && r.occupancy_status === "vacant" && DIRTY_HK_STATUSES.includes(r.housekeeping_status)
  ).length;

  return {
    total,
    ooo,
    available: Math.max(0, total - ooo),
    occupied,
    vacant_clean: vacantClean,
    vacant_dirty: vacantDirty,
  };
};

/* ------------------------------------------------------------------ */
/* Room nights & room revenue (Opsi A: berbasis data menginap)          */
/* ------------------------------------------------------------------ */

/**
 * Mengambil seluruh room-night terjual dalam rentang [from, toExclusive) dengan SATU query,
 * lalu mengekspansi per malam di JS (menghindari N+1 query per tanggal).
 *
 * Aturan:
 * - Hanya kamar yang benar-benar menginap: status kamar `checked_in` / `checked_out`.
 * - Malam terhitung bila check_in_date <= malam < effective_end.
 * - effective_end = check_out_date, kecuali kamar sudah checkout lebih awal (tanggal checkout aktual).
 * - Room revenue = rate_per_night (nett, tanpa pajak & service).
 *
 * @returns {Promise<Map<string, {sold: number, revenue: number}>>}
 */
export const getStayNights = async (kodeCabang, from, toExclusive) => {
  const nightsMap = new Map();
  enumerateDates(from, toExclusive).forEach((d) => nightsMap.set(d, { sold: 0, revenue: 0 }));
  if (nightsMap.size === 0) return nightsMap;

  const rows = await DB("trx_reservation_room as rr")
    .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
    .leftJoin("trx_checkout as co", function () {
      this.on("co.kode_reservation_room", "=", "rr.kode_reservasi_room").andOnNull("co.deleted_at");
    })
    .where("r.kode_cabang", kodeCabang)
    .whereIn("rr.status", ["checked_in", "checked_out"])
    .whereIn("r.status", ["checked_in", "checked_out"])
    .where("rr.is_active", 1)
    .whereNull("rr.deleted_at")
    .whereNull("r.deleted_at")
    .where("r.check_in_date", "<", toExclusive)
    .where("r.check_out_date", ">", from)
    .select(
      "rr.kode_reservasi_room",
      "rr.status as room_status",
      "rr.rate_per_night",
      DB.raw("DATE_FORMAT(r.check_in_date, '%Y-%m-%d') as check_in_date"),
      DB.raw("DATE_FORMAT(r.check_out_date, '%Y-%m-%d') as check_out_date"),
      DB.raw("DATE_FORMAT(MIN(co.checkout_at), '%Y-%m-%d') as actual_checkout_date")
    )
    .groupBy(
      "rr.kode_reservasi_room",
      "rr.status",
      "rr.rate_per_night",
      "r.check_in_date",
      "r.check_out_date"
    );

  rows.forEach((row) => {
    let end = row.check_out_date;
    if (
      row.room_status === "checked_out" &&
      row.actual_checkout_date &&
      row.actual_checkout_date < end
    ) {
      end = row.actual_checkout_date > row.check_in_date ? row.actual_checkout_date : row.check_in_date;
    }
    const start = row.check_in_date > from ? row.check_in_date : from;
    const stop = end < toExclusive ? end : toExclusive;
    const rate = toNumber(row.rate_per_night);

    for (let d = start; d < stop; d = addDays(d, 1)) {
      const bucket = nightsMap.get(d);
      if (bucket) {
        bucket.sold += 1;
        bucket.revenue += rate;
      }
    }
  });

  return nightsMap;
};

/** Menjumlahkan Map hasil getStayNights menjadi total sold & revenue. */
export const sumStayNights = (nightsMap) => {
  let sold = 0;
  let revenue = 0;
  nightsMap.forEach((v) => {
    sold += v.sold;
    revenue += v.revenue;
  });
  return { sold, revenue };
};

/* ------------------------------------------------------------------ */
/* Revenue terposting & pembayaran                                     */
/* ------------------------------------------------------------------ */

/**
 * Total revenue terposting di folio (semua charge kecuali deposit) pada rentang [from, toInclusive].
 * Tanggal posting memakai business_date (hasil night audit) dengan fallback ke DATE(posted_at).
 */
export const getPostedRevenue = async (kodeCabang, from, toInclusive) => {
  const row = await DB("trx_folio_charge as fc")
    .join("trx_folio as f", "fc.kode_folio", "f.kode_folio")
    .where("f.kode_cabang", kodeCabang)
    .whereNot("f.status", "void")
    .where("fc.is_active", 1)
    .whereNot("fc.charge_type", "deposit")
    .whereRaw("COALESCE(fc.business_date, DATE(fc.posted_at)) BETWEEN ? AND ?", [from, toInclusive])
    .select(DB.raw("COALESCE(SUM(fc.amount), 0) as total"))
    .first();
  return round(row?.total, 2);
};

/** Total pembayaran yang diterima pada rentang [from, toInclusive] berdasarkan tanggal paid_at. */
export const getPaymentsCollected = async (kodeCabang, from, toInclusive) => {
  const row = await DB("trx_payment as p")
    .join("trx_folio as f", "p.kode_folio", "f.kode_folio")
    .where("f.kode_cabang", kodeCabang)
    .where("p.is_active", 1)
    .whereRaw("DATE(p.paid_at) BETWEEN ? AND ?", [from, toInclusive])
    .select(DB.raw("COALESCE(SUM(p.amount), 0) as total"))
    .first();
  return round(row?.total, 2);
};

/* ------------------------------------------------------------------ */
/* Logging error standar endpoint dashboard                            */
/* ------------------------------------------------------------------ */

/** Mencatat error ke tabel log tanpa menutupi error asli bila logging gagal. */
export const logDashboardError = async (error, req, file) => {
  try {
    await Logging(error, {
      file,
      func: req?.originalUrl || "",
      request: JSON.stringify(req?.body || {}),
      user: req?.auth?.username || "",
    });
  } catch (logErr) {
    console.error("Gagal mencatat log dashboard:", logErr?.message);
  }
};
