/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file generateCode.js
 * @description Helper untuk menggenerate kode berurutan (sequence) otomatis anti-collision dengan prefix
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.2
 */

import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "./date_tools.js";

const TABLE_MAP = {
  "FMT-RSL": "trx_room_status_log",
  "FMT-ROOMSTATUSLOG": "trx_room_status_log",
  "FMT-CO": "trx_checkout",
  "FMT-CHECKOUT": "trx_checkout",
  "FMT-HKT": "trx_housekeeping_task",
  "FMT-TASK": "trx_housekeeping_task",
  "FMT-CHECKIN": "trx_checkin",
  "FMT-FOLIO": "trx_folio",
  "FMT-FOLIOCHARGE": "trx_folio_charge",
  "FMT-PAYMENT": "trx_payment",
  "FMT-PAY": "trx_payment",
  "FMT-RESERVASI": "trx_reservation",
  "FMT-RESROOM": "trx_reservation_room",
  "FMT-INVOICE": "mst_invoice",
  "FMT-TAMU": "mst_guest",
  "FMT-KAMAR": "mst_kamar",
  "FMT-TIPEKAMAR": "mst_tipe_kamar",
  "FMT-LANTAI": "mst_lantai",
  "FMT-GEDUNG": "mst_gedung",
  "FMT-CABANG": "mst_cabang",
  "FMT-PAJAK": "mst_tax",
  "FMT-RATEPLAN": "mst_paket_harga",
  "FMT-HARGAKAMAR": "mst_rate_plan_price",
  "FMT-SHIFT": "trx_cashier_shift",
  "FMT-COUNTER": "mst_cashier_counter",
  "FMT-AMENITY": "mst_amenity",
  "FMT-BEDTYPE": "mst_bed_type",
  "FMT-CORPORATE": "mst_corporate_account",
  "FMT-FASILITAS": "mst_fasilitas",
  "FMT-RTA": "mst_room_type_amenity",
  "FMT-RUANGEVENT": "mst_ruang_event",
  "FMT-SEASON": "mst_musim",
  "FMT-TIPERUANGEVENT": "mst_tipe_ruang_event",
  "FMT-HRGRUANGEVENT": "mst_harga_ruang_event",
  "FMT-USR": "mst_user"
};

const COL_MAP = {
  mst_guest: "kode_tamu",
  trx_reservation_room: "kode_reservasi_room",
  trx_reservation: "kode_reservasi",
  trx_room_status_log: "kode_room_status_log",
  trx_housekeeping_task: "kode_housekeeping_task",
  trx_checkout: "kode_checkout",
  trx_checkin: "kode_checkin",
  trx_folio: "kode_folio",
  trx_folio_charge: "kode_folio_charge",
  trx_payment: "kode_payment",
  mst_invoice: "kode_invoice",
  trx_cashier_shift: "kode_shift",
  mst_kamar: "kode_kamar",
  mst_tipe_kamar: "kode_tipe_kamar",
  mst_lantai: "kode_lantai",
  mst_gedung: "kode_gedung",
  mst_cabang: "kode_cabang",
  mst_tax: "kode_pajak",
  mst_paket_harga: "kode_rate_plan",
  mst_rate_plan_price: "kode_harga_kamar",
  mst_cashier_counter: "kode_counter",
  mst_amenity: "kode_amenity",
  mst_bed_type: "kode_bed_type",
  mst_corporate_account: "kode_corporate",
  mst_fasilitas: "kode_fasilitas",
  mst_room_type_amenity: "kode_rta",
  mst_ruang_event: "kode_ruang_event",
  mst_musim: "kode_season",
  mst_tipe_ruang_event: "kode_tipe_ruang_event",
  mst_harga_ruang_event: "kode_harga_ruang_event",
  mst_user: "kode_user"
};

const PREFIX_MAP = {
  "FMT-RSL": "RSL",
  "FMT-ROOMSTATUSLOG": "RSL",
  "FMT-CO": "CO",
  "FMT-CHECKOUT": "CO",
  "FMT-HKT": "TSK",
  "FMT-TASK": "TSK",
  "FMT-PAY": "PAY",
  "FMT-PAYMENT": "PAY"
};

/**
 * Helper untuk menggenerate kode berurutan (sequence) otomatis
 * dengan prefix. Menggunakan sys_format_penomoran dan perlindungan anti-collision.
 * 
 * @param {string} kode_penomoran - Contoh: FMT-RSL, FMT-TASK, FMT-CO, FMT-SHIFT
 * @param {object} trx - Instance transaksi Knex
 * @returns {Promise<string>} Kode unik yang sudah digenerate (contoh: RSL0026, CO0026)
 */
export const generateSequence = async (kode_penomoran, trx = DB) => {
  // Lock row untuk mencegah race condition
  let record = await trx("sys_format_penomoran")
    .where("kode_format", kode_penomoran)
    .forUpdate()
    .first();

  let targetTable = TABLE_MAP[kode_penomoran] || (record ? record.nama_tabel : null);
  if (!targetTable) {
    targetTable = kode_penomoran.replace("FMT-", "mst_").toLowerCase();
  }

  let checkCol = COL_MAP[targetTable];
  if (!checkCol) {
    checkCol = `kode_${targetTable.replace(/^(mst_|trx_)/, "")}`;
  }

  let prefix = PREFIX_MAP[kode_penomoran];
  if (!prefix && record?.prefix) {
    prefix = record.prefix;
  }
  if (!prefix) {
    prefix = kode_penomoran.replace("FMT-", "");
    prefix = prefix.length > 3 ? prefix.substring(0, 3) : prefix;
  }

  if (!record) {
    // Cari nomor terakhir yang sudah ada di tabel target jika tabel sudah memiliki data awal
    let existingMax = 0;
    try {
      const hasTable = await trx.schema.hasTable(targetTable).catch(() => false);
      if (hasTable) {
        const hasCol = await trx.schema.hasColumn(targetTable, checkCol).catch(() => false);
        if (hasCol) {
          const latestRow = await trx(targetTable)
            .where(checkCol, "like", `${prefix}%`)
            .orderBy(checkCol, "desc")
            .first();
          if (latestRow && latestRow[checkCol]) {
            const numPart = latestRow[checkCol].replace(prefix, "");
            const parsed = parseInt(numPart, 10);
            if (!isNaN(parsed) && parsed > 0) {
              existingMax = parsed;
            }
          }
        }
      }
    } catch {
      // fallback
    }

    record = {
      kode_format: kode_penomoran,
      nama_tabel: targetTable,
      prefix: prefix,
      panjang_digit: 4,
      nomor_terakhir: existingMax,
      is_active: 1,
      created_at: formatDateSystem()
    };

    await trx("sys_format_penomoran").insert(record);
  } else if (record.nama_tabel !== targetTable && TABLE_MAP[kode_penomoran]) {
    // Sinkronkan nama tabel yang valid jika record sebelumnya belum tepat
    await trx("sys_format_penomoran")
      .where("kode_format", kode_penomoran)
      .update({
        nama_tabel: targetTable,
        prefix: prefix
      });
    record.nama_tabel = targetTable;
    record.prefix = prefix;
  }

  let nextNumber = parseInt(record.nomor_terakhir || 0, 10) + 1;

  // Proteksi tabrakan data (anti-collision): pastikan candidateCode belum digunakan di database
  try {
    const hasTable = await trx.schema.hasTable(targetTable).catch(() => false);
    if (hasTable) {
      const hasCol = await trx.schema.hasColumn(targetTable, checkCol).catch(() => false);
      if (hasCol) {
        while (true) {
          const candidateCode = `${prefix}${String(nextNumber).padStart(record.panjang_digit, "0")}`;
          const exists = await trx(targetTable).where(checkCol, candidateCode).first();
          if (!exists) break;
          nextNumber++;
        }
      }
    }
  } catch {
    // fallback
  }

  // Update nomor terakhir ke database sys_format_penomoran
  await trx("sys_format_penomoran")
    .where("kode_format", kode_penomoran)
    .update({
      nomor_terakhir: nextNumber,
      updated_at: formatDateSystem()
    });

  const paddedNumber = String(nextNumber).padStart(record.panjang_digit, "0");
  return `${prefix}${paddedNumber}`;
};
