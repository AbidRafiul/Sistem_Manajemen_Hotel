/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file night_audit_service.js
 * @description Core engine untuk proses Night Audit: Pre-audit check, DB Lock, Atomic Room Posting,
 *              Idempotency, Rollover Business Date, Retry Failed, Reopen, dan No-Show processing.
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "./date_tools.js";
import { generateSequence } from "./generateCode.js";
import { hitungHargaKamar } from "./pricing_helper.js";
import {
  getCurrentBusinessDate,
  lockBusinessDate,
  unlockBusinessDate,
  advanceBusinessDate,
  rollbackBusinessDate,
  formatYmd
} from "./business_date_helper.js";
import { generateNightAuditReports } from "./night_audit_report_helper.js";

/**
 * Mendapatkan status Night Audit terkini untuk cabang tertentu.
 */
export const getNightAuditStatus = async (kodeCabang) => {
  const bDateInfo = await getCurrentBusinessDate(kodeCabang);
  const currentYmd = bDateInfo.current_business_date;

  // Cek apakah ada run yang sedang berjalan
  const activeRun = await DB("trx_night_audit")
    .where("kode_cabang", kodeCabang)
    .where("status", "running")
    .first();

  // Ambil data audit terakhir untuk business date aktif atau sebelumnya
  const lastAudit = await DB("trx_night_audit")
    .where("kode_cabang", kodeCabang)
    .orderBy("id", "desc")
    .first();

  return {
    kode_cabang: kodeCabang,
    current_business_date: currentYmd,
    is_locked: bDateInfo.is_locked,
    is_running: Boolean(activeRun),
    active_run: activeRun || null,
    last_audit: lastAudit || null
  };
};

/**
 * Pre-audit check (Blockers vs Warnings).
 * Mengembalikan daftar rinci beserta entitas yang terdampak.
 */
export const runPreAuditCheck = async (kodeCabang) => {
  const bDateInfo = await getCurrentBusinessDate(kodeCabang);
  const currentYmd = bDateInfo.current_business_date;

  const blockers = [];
  const warnings = [];

  // 1. Blocker: Ada audit run lain yang sedang berjalan untuk cabang yang sama
  const runningAudit = await DB("trx_night_audit")
    .where("kode_cabang", kodeCabang)
    .where("status", "running")
    .first();

  if (runningAudit) {
    blockers.push({
      type: "RUNNING_AUDIT_EXISTS",
      title: "Audit Sedang Berjalan",
      message: `Terdapat proses Night Audit (${runningAudit.kode_night_audit}) yang sedang berjalan sejak ${runningAudit.started_at}.`,
      entity_ids: [runningAudit.kode_night_audit]
    });
  }

  // 2. Blocker: Reservasi arrival hari ini yang belum check-in atau belum ditandai no-show
  const pendingArrivals = await DB("trx_reservation as r")
    .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
    .where("r.kode_cabang", kodeCabang)
    .where("r.check_in_date", "<=", currentYmd)
    .whereIn("r.status", ["reserved", "confirmed"])
    .select(
      "r.kode_reservasi",
      "r.check_in_date",
      "r.check_out_date",
      "r.status",
      "g.full_name as guest_name"
    );

  if (pendingArrivals.length > 0) {
    blockers.push({
      type: "PENDING_ARRIVALS",
      title: "Arrival Belum Diproses",
      message: `Terdapat ${pendingArrivals.length} reservasi arrival yang belum check-in atau belum diputuskan no-show.`,
      entity_ids: pendingArrivals.map((a) => a.kode_reservasi),
      items: pendingArrivals
    });
  }

  // 3. Blocker: Reservasi departure hari ini yang belum check-out atau belum stay-over/extend
  const pendingDepartures = await DB("trx_reservation as r")
    .join("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
    .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
    .where("r.kode_cabang", kodeCabang)
    .where("r.check_out_date", "<=", currentYmd)
    .where("r.status", "checked_in")
    .where("rr.status", "checked_in")
    .select(
      "r.kode_reservasi",
      "rr.kode_reservasi_room",
      "rr.kode_kamar",
      "r.check_out_date",
      "g.full_name as guest_name"
    );

  if (pendingDepartures.length > 0) {
    blockers.push({
      type: "PENDING_DEPARTURES",
      title: "Departure Belum Checkout",
      message: `Terdapat ${pendingDepartures.length} kamar in-house yang tanggal checkout-nya telah tiba atau terlewati namun belum check-out.`,
      entity_ids: pendingDepartures.map((d) => d.kode_reservasi_room),
      items: pendingDepartures
    });
  }

  // 4. Blocker: Shift kasir yang masih terbuka
  const openShifts = await DB("trx_cashier_shift as cs")
    .leftJoin("mst_user as u", "cs.user_id", "u.id")
    .where("cs.kode_cabang", kodeCabang)
    .where("cs.status", "open")
    .select(
      "cs.kode_cashier_shift",
      "cs.kode_cashier_counter",
      "cs.opened_at",
      "u.username as cashier_name"
    );

  if (openShifts.length > 0) {
    blockers.push({
      type: "OPEN_CASHIER_SHIFTS",
      title: "Shift Kasir Masih Terbuka",
      message: `Terdapat ${openShifts.length} shift kasir yang masih aktif/terbuka. Seluruh kasir wajib menutup shift sebelum Night Audit.`,
      entity_ids: openShifts.map((s) => s.kode_cashier_shift),
      items: openShifts
    });
  }

  // 5. Blocker: Folio checkout dengan saldo belum lunas (kecuali tagihan corporate/city ledger)
  const unsettledFolios = await DB("trx_folio as f")
    .join("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
    .where("f.kode_cabang", kodeCabang)
    .where("r.status", "checked_out")
    .where("f.status", "open")
    .where("f.folio_owner_type", "!=", "corporate")
    .select("f.kode_folio", "f.kode_reservation", "f.grand_total");

  if (unsettledFolios.length > 0) {
    blockers.push({
      type: "UNSETTLED_FOLIOS",
      title: "Folio Checkout Belum Lunas",
      message: `Terdapat ${unsettledFolios.length} folio tamu yang sudah checkout namun status saldo belum tertutup/lunas.`,
      entity_ids: unsettledFolios.map((f) => f.kode_folio),
      items: unsettledFolios
    });
  }

  // 6. Warnings: Status kamar fisik tidak konsisten (kamar occupied tanpa in-house reservation)
  const occupiedRoomsWithoutInhouse = await DB("mst_kamar as k")
    .leftJoin("trx_reservation_room as rr", function () {
      this.on("k.kode_kamar", "=", "rr.kode_kamar")
        .andOn("rr.status", "=", DB.raw("'checked_in'"));
    })
    .where("k.kode_cabang", kodeCabang)
    .where("k.occupancy_status", "occupied")
    .whereNull("rr.id")
    .select("k.kode_kamar", "k.nomor_kamar");

  if (occupiedRoomsWithoutInhouse.length > 0) {
    warnings.push({
      type: "ROOM_STATUS_DISCREPANCY",
      title: "Status Kamar Tidak Sinkron",
      message: `Kamar ${occupiedRoomsWithoutInhouse.map((k) => k.nomor_kamar || k.kode_kamar).join(", ")} tercatat occupied tetapi tidak memiliki reservasi in-house aktif.`,
      entity_ids: occupiedRoomsWithoutInhouse.map((k) => k.kode_kamar)
    });
  }

  return {
    can_proceed: blockers.length === 0,
    current_business_date: currentYmd,
    kode_cabang: kodeCabang,
    blockers,
    warnings,
    summary: {
      total_blockers: blockers.length,
      total_warnings: warnings.length
    }
  };
};

/**
 * Memulai dan mengeksekusi proses Night Audit secara penuh.
 * Alur: Pre-check -> Mutex Lock -> Room Posting (Atomic per Room) -> Idempotency -> Rollover -> Snapshot Reports.
 */
export const startNightAudit = async ({
  kodeCabang,
  userId,
  businessDate = null,
  acknowledgedWarnings = [],
  idempotencyKey = null,
  notes = ""
}) => {
  const bDateInfo = await getCurrentBusinessDate(kodeCabang);
  const activeBusinessDate = bDateInfo.current_business_date;

  // 1. Validasi Business Date
  if (businessDate && businessDate !== activeBusinessDate) {
    const err = new Error(
      `Business date yang dikirim (${businessDate}) tidak sesuai dengan business date aktif (${activeBusinessDate}). Audit tidak boleh melompati hari.`
    );
    err.status = 409;
    err.statusCode = 409;
    throw err;
  }

  // 2. Jalankan Pre-Audit Check
  const preCheck = await runPreAuditCheck(kodeCabang);
  if (!preCheck.can_proceed) {
    const err = new Error("Night Audit tidak dapat dimulai karena terdapat blocker yang belum terselesaikan.");
    err.status = 422;
    err.statusCode = 422;
    err.data = { blockers: preCheck.blockers, warnings: preCheck.warnings };
    throw err;
  }

  // 3. Cek Idempotency Key jika dikirim
  if (idempotencyKey) {
    const existingRun = await DB("trx_night_audit")
      .where("idempotency_key", idempotencyKey)
      .first();
    if (existingRun) {
      return {
        is_idempotent_duplicate: true,
        audit_run: existingRun,
        message: "Audit run dengan idempotency_key ini sudah pernah diproses sebelumnya."
      };
    }
  }

  // 4. Mutex Lock di Level Database
  // Lock row business date dan buat record trx_night_audit berstatus 'running'
  let auditCode = "";
  let auditId = null;

  await DB.transaction(async (trx) => {
    // Row-level lock pada sys_business_date
    const lockedBd = await trx("sys_business_date")
      .where("kode_cabang", kodeCabang)
      .forUpdate()
      .first();

    if (lockedBd && lockedBd.is_locked) {
      const err = new Error("Audit run lain sedang berjalan untuk cabang ini.");
      err.status = 409;
      err.statusCode = 409;
      throw err;
    }

    // Cek apakah tanggal ini sudah pernah COMPLETED
    const completedRun = await trx("trx_night_audit")
      .where("kode_cabang", kodeCabang)
      .where("business_date", activeBusinessDate)
      .whereIn("status", ["completed", "completed_with_exceptions"])
      .first();

    if (completedRun) {
      const err = new Error(`Night audit untuk business date ${activeBusinessDate} sudah pernah diselesaikan sebelumnya.`);
      err.status = 409;
      err.statusCode = 409;
      throw err;
    }

    auditCode = await generateSequence("FMT-NIGHTAUDIT", trx);
    if (!auditCode) throw new Error("Gagal membuat kode transaksi Night Audit");

    const tNow = formatDateSystem();
    const [insertedId] = await trx("trx_night_audit").insert({
      kode_night_audit: auditCode,
      kode_cabang: kodeCabang,
      business_date: activeBusinessDate,
      status: "running",
      room_charge_posted: 0,
      business_date_updated: 0,
      daily_report_generated: 0,
      transaction_locked: 1,
      started_at: tNow,
      run_by: userId,
      triggered_by: "manual",
      warnings_acknowledged: JSON.stringify(acknowledgedWarnings || []),
      idempotency_key: idempotencyKey,
      note: notes || null
    });

    auditId = insertedId;
    await lockBusinessDate(kodeCabang, auditCode, trx);
  });

  // 5. Eksekusi Posting Kamar & Pajak/Service (Resumable & Atomic per Kamar)
  const postingResult = await postRoomChargesForAudit({
    auditCode,
    kodeCabang,
    businessDate: activeBusinessDate,
    userId
  });

  // 6. Generate Snapshot Laporan
  const reportSnapshots = await generateNightAuditReports({
    auditCode,
    kodeCabang,
    businessDate: activeBusinessDate
  });

  // 7. Rollover Business Date (+1 hari) & Finalisasi
  let nextBusinessDate = "";
  const finalStatus = postingResult.total_failed > 0 ? "completed_with_exceptions" : "completed";

  await DB.transaction(async (trx) => {
    nextBusinessDate = await advanceBusinessDate(kodeCabang, activeBusinessDate, auditCode, trx);

    await trx("trx_night_audit")
      .where("kode_night_audit", auditCode)
      .update({
        status: finalStatus,
        room_charge_posted: 1,
        business_date_updated: 1,
        daily_report_generated: 1,
        transaction_locked: 0,
        completed_at: formatDateSystem(),
        total_in_house: postingResult.total_in_house,
        total_posted: postingResult.total_posted,
        total_failed: postingResult.total_failed,
        total_room_revenue: postingResult.total_room_revenue,
        total_tax: postingResult.total_tax,
        total_service: postingResult.total_service,
        report_snapshots: JSON.stringify(reportSnapshots)
      });
  });

  // 8. Post-Audit Housekeeping & Notification Triggers
  try {
    // Refresh status kamar in-house / stayover menjadi dirty agar housekeeping menjadwalkan stayover service
    await DB("mst_kamar")
      .where("kode_cabang", kodeCabang)
      .where("occupancy_status", "occupied")
      .where("housekeeping_status", "clean")
      .where("is_active", 1)
      .update({
        housekeeping_status: "dirty",
        updated_at: formatDateSystem()
      });

    // Logging event notifikasi ke trx_notification_log
    await DB("trx_notification_log").insert({
      kode_notification_log: `NL-${Date.now().toString(36).toUpperCase()}`,
      kode_cabang: kodeCabang,
      event_code: "NIGHT_AUDIT_COMPLETED",
      channel: "push",
      recipient: "front_office",
      ref_type: "trx_night_audit",
      kode_ref: auditCode,
      status: "sent",
      sent_at: formatDateSystem(),
      created_at: formatDateSystem()
    });
  } catch (postTrigErr) {
    console.warn("[NIGHT_AUDIT] Post-audit triggers warning:", postTrigErr.message);
  }

  return {
    kode_night_audit: auditCode,
    kode_cabang: kodeCabang,
    audited_business_date: activeBusinessDate,
    next_business_date: nextBusinessDate,
    status: finalStatus,
    summary: {
      total_in_house: postingResult.total_in_house,
      total_posted: postingResult.total_posted,
      total_failed: postingResult.total_failed,
      total_skipped: postingResult.total_skipped,
      total_room_revenue: postingResult.total_room_revenue,
      total_tax: postingResult.total_tax,
      total_service: postingResult.total_service
    },
    items: postingResult.items
  };
};

/**
 * Memproses posting kamar, pajak, dan service charge untuk seluruh kamar in-house.
 * Sifat: Atomik per kamar (kegagalan 1 kamar tidak menggagalkan kamar lain), Idempoten, dan Resumable.
 */
export const postRoomChargesForAudit = async ({
  auditCode,
  kodeCabang,
  businessDate,
  userId
}) => {
  // Ambil seluruh kamar in-house
  const inhouseRooms = await DB("trx_reservation_room as rr")
    .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
    .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
    .where("r.kode_cabang", kodeCabang)
    .where("r.status", "checked_in")
    .where("rr.status", "checked_in")
    .select(
      "rr.kode_reservasi_room",
      "rr.kode_reservation",
      "rr.kode_tipe_kamar",
      "rr.kode_rate_plan",
      "rr.kode_kamar",
      "rr.rate_per_night",
      "rr.nights",
      "rr.is_charged_upfront as rr_upfront",
      "r.is_charged_upfront as r_upfront",
      "r.check_in_date",
      "r.check_out_date",
      "mk.nomor_kamar"
    );

  // Ambil daftar pajak aktif cabang
  const activeTaxes = await DB("mst_tax")
    .where("kode_cabang", kodeCabang)
    .where("is_active", 1)
    .whereNull("deleted_at")
    .orderBy("id", "asc");

  let totalInHouse = inhouseRooms.length;
  let totalPosted = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalRoomRevenue = 0;
  let totalTax = 0;
  let totalService = 0;
  const processedItems = [];

  for (const resRoom of inhouseRooms) {
    const checkOutYmd = formatYmd(resRoom.check_out_date);

    // Rule 7: Malam terakhir - Tamu dengan departure date = business date tidak diposting untuk malam berikutnya
    if (checkOutYmd <= businessDate) {
      totalSkipped++;
      processedItems.push({
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_kamar: resRoom.kode_kamar,
        status: "SKIPPED",
        reason: `Departure date (${checkOutYmd}) sama dengan atau sebelum business date (${businessDate})`
      });
      continue;
    }

    // Rule 3: Idempotency Check
    // Periksa apakah kamar ini sudah pernah diposting untuk business date ini
    const alreadyPostedCharge = await DB("trx_folio_charge")
      .where("ref_source_type", "trx_reservation_room")
      .where("kode_ref_source", resRoom.kode_reservasi_room)
      .where("business_date", businessDate)
      .where("source", "NIGHT_AUDIT")
      .where("is_active", 1)
      .first();

    if (alreadyPostedCharge) {
      totalSkipped++;
      processedItems.push({
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_kamar: resRoom.kode_kamar,
        status: "SKIPPED",
        reason: "Sudah diposting sebelumnya pada business date ini (Idempotent Safe)",
        kode_folio_charge: alreadyPostedCharge.kode_folio_charge
      });
      continue;
    }

    // Rule 14: Legacy Upfront Charge Protection
    // Jika reservasi ini sudah dibebankan penuh di muka saat sebelum fitur dirilis, lewati posting biaya
    const isUpfront = Boolean(resRoom.rr_upfront || resRoom.r_upfront);
    if (isUpfront) {
      totalSkipped++;
      // Catat di trx_night_audit_item sebagai SKIPPED
      await DB("trx_night_audit_item").insert({
        kode_night_audit: auditCode,
        kode_cabang: kodeCabang,
        business_date: businessDate,
        kode_reservation: resRoom.kode_reservation,
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_kamar: resRoom.kode_kamar || null,
        rate_applied: 0.00,
        tax_amount: 0.00,
        service_charge_amount: 0.00,
        status: "SKIPPED",
        error_message: "Legacy upfront charge protected (Tidak dicharge dobel)",
        created_at: formatDateSystem()
      });

      processedItems.push({
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_kamar: resRoom.kode_kamar,
        status: "SKIPPED",
        reason: "Legacy Upfront Reservation (Biaya sudah dibayar di muka)"
      });
      continue;
    }

    // Transaksi Atomik per Reservasi Kamar
    try {
      await DB.transaction(async (roomTrx) => {
        const tNow = formatDateSystem();

        // 1. Hitung tarif malam ini berdasarkan rate plan, season, dan tanggal aktif
        let rateTonight = parseFloat(resRoom.rate_per_night || 0);
        try {
          const rateInfo = await hitungHargaKamar(
            {
              kode_tipe_kamar: resRoom.kode_tipe_kamar,
              kode_rate_plan: resRoom.kode_rate_plan,
              tanggal: businessDate
            },
            roomTrx
          );
          if (rateInfo && rateInfo.price > 0) {
            rateTonight = parseFloat(rateInfo.price);
          }
        } catch {
          // Fallback ke tarif tersimpan di reservasi room jika helper hitung gagal
          rateTonight = parseFloat(resRoom.rate_per_night || 0);
        }

        // 2. Hitung Pajak dan Service Charge malam ini
        let roomTaxAmount = 0;
        let roomServiceAmount = 0;
        activeTaxes.forEach((t) => {
          const pct = parseFloat(t.percentage) || 0;
          const nom = Math.round(rateTonight * (pct / 100));
          if (t.tax_type === "service_charge") roomServiceAmount += nom;
          else roomTaxAmount += nom;
        });

        // 3. Ambil / Validasi Folio Terbuka
        const folio = await roomTrx("trx_folio")
          .where("kode_reservation", resRoom.kode_reservation)
          .where("status", "open")
          .first();

        if (!folio) {
          throw new Error(`Folio terbuka tidak ditemukan untuk reservasi ${resRoom.kode_reservation}`);
        }

        // 4. Generate Kode Transaksi & Insert Folio Charge
        const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", roomTrx);
        if (!noFolioCharge) throw new Error("Gagal membuat nomor transaksi charge folio");

        const roomLabel = resRoom.nomor_kamar ? `Kamar ${resRoom.nomor_kamar}` : (resRoom.kode_kamar || "");
        await roomTrx("trx_folio_charge").insert({
          kode_folio_charge: noFolioCharge,
          kode_folio: folio.kode_folio,
          charge_type: "room",
          description: `Room Charge (${businessDate}) - ${roomLabel}`,
          qty: 1.00,
          unit_price: rateTonight,
          amount: rateTonight,
          business_date: businessDate,
          source: "NIGHT_AUDIT",
          kode_night_audit: auditCode,
          ref_source_type: "trx_reservation_room",
          kode_ref_source: resRoom.kode_reservasi_room,
          posted_by: userId,
          posted_at: tNow,
          created_by: userId,
          created_at: tNow,
          is_active: 1
        });

        // 5. Update Akumulasi Tagihan Folio
        const newSubtotal = parseFloat(folio.subtotal || 0) + rateTonight;
        const newTax = parseFloat(folio.tax_amount || 0) + roomTaxAmount;
        const newService = parseFloat(folio.service_charge_amount || 0) + roomServiceAmount;
        const newGrandTotal = newSubtotal + newTax + newService;

        await roomTrx("trx_folio")
          .where("kode_folio", folio.kode_folio)
          .update({
            subtotal: newSubtotal,
            tax_amount: newTax,
            service_charge_amount: newService,
            grand_total: newGrandTotal,
            updated_by: userId,
            updated_at: tNow
          });

        // 6. Catat di trx_night_audit_item
        await roomTrx("trx_night_audit_item").insert({
          kode_night_audit: auditCode,
          kode_cabang: kodeCabang,
          business_date: businessDate,
          kode_reservation: resRoom.kode_reservation,
          kode_reservasi_room: resRoom.kode_reservasi_room,
          kode_kamar: resRoom.kode_kamar || null,
          rate_applied: rateTonight,
          tax_amount: roomTaxAmount,
          service_charge_amount: roomServiceAmount,
          status: "POSTED",
          kode_folio_charge: noFolioCharge,
          created_at: tNow
        });

        totalPosted++;
        totalRoomRevenue += rateTonight;
        totalTax += roomTaxAmount;
        totalService += roomServiceAmount;

        processedItems.push({
          kode_reservasi_room: resRoom.kode_reservasi_room,
          kode_kamar: resRoom.kode_kamar,
          status: "POSTED",
          rate_applied: rateTonight,
          tax_amount: roomTaxAmount,
          service_charge_amount: roomServiceAmount,
          kode_folio_charge: noFolioCharge
        });
      });
    } catch (roomErr) {
      totalFailed++;
      // Catat kegagalan di trx_night_audit_item
      await DB("trx_night_audit_item").insert({
        kode_night_audit: auditCode,
        kode_cabang: kodeCabang,
        business_date: businessDate,
        kode_reservation: resRoom.kode_reservation,
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_kamar: resRoom.kode_kamar || null,
        rate_applied: 0.00,
        tax_amount: 0.00,
        service_charge_amount: 0.00,
        status: "FAILED",
        error_message: roomErr.message,
        created_at: formatDateSystem()
      });

      processedItems.push({
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_kamar: resRoom.kode_kamar,
        status: "FAILED",
        error: roomErr.message
      });
    }
  }

  return {
    total_in_house: totalInHouse,
    total_posted: totalPosted,
    total_failed: totalFailed,
    total_skipped: totalSkipped,
    total_room_revenue: totalRoomRevenue,
    total_tax: totalTax,
    total_service: totalService,
    items: processedItems
  };
};

/**
 * Ulangi posting hanya untuk item yang berstatus FAILED pada audit run tertentu.
 */
export const retryFailedAuditItems = async ({ auditCode, userId }) => {
  const auditRun = await DB("trx_night_audit")
    .where("kode_night_audit", auditCode)
    .first();

  if (!auditRun) {
    const err = new Error(`Audit run ${auditCode} tidak ditemukan`);
    err.status = 404;
    throw err;
  }

  const failedItems = await DB("trx_night_audit_item")
    .where("kode_night_audit", auditCode)
    .where("status", "FAILED");

  if (failedItems.length === 0) {
    return {
      message: "Tidak ada item berstatus FAILED pada audit run ini.",
      retried_count: 0
    };
  }

  let retriedSuccess = 0;
  let stillFailed = 0;

  for (const item of failedItems) {
    try {
      await DB.transaction(async (trx) => {
        const resRoom = await trx("trx_reservation_room")
          .where("kode_reservasi_room", item.kode_reservasi_room)
          .first();

        const folio = await trx("trx_folio")
          .where("kode_reservation", item.kode_reservation)
          .where("status", "open")
          .first();

        if (!folio) throw new Error("Folio aktif tidak ditemukan");

        const rateTonight = parseFloat(resRoom.rate_per_night || 0);
        const activeTaxes = await trx("mst_tax")
          .where("kode_cabang", item.kode_cabang)
          .where("is_active", 1)
          .whereNull("deleted_at");

        let taxAmount = 0;
        let serviceAmount = 0;
        activeTaxes.forEach((t) => {
          const pct = parseFloat(t.percentage) || 0;
          const nom = Math.round(rateTonight * (pct / 100));
          if (t.tax_type === "service_charge") serviceAmount += nom;
          else taxAmount += nom;
        });

        const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
        const tNow = formatDateSystem();

        await trx("trx_folio_charge").insert({
          kode_folio_charge: noFolioCharge,
          kode_folio: folio.kode_folio,
          charge_type: "room",
          description: `Room Charge (${item.business_date}) [Retry]`,
          qty: 1.00,
          unit_price: rateTonight,
          amount: rateTonight,
          business_date: item.business_date,
          source: "NIGHT_AUDIT",
          kode_night_audit: auditCode,
          ref_source_type: "trx_reservation_room",
          kode_ref_source: item.kode_reservasi_room,
          posted_by: userId,
          posted_at: tNow,
          created_by: userId,
          created_at: tNow,
          is_active: 1
        });

        await trx("trx_folio")
          .where("kode_folio", folio.kode_folio)
          .update({
            subtotal: trx.raw("subtotal + ?", [rateTonight]),
            tax_amount: trx.raw("tax_amount + ?", [taxAmount]),
            service_charge_amount: trx.raw("service_charge_amount + ?", [serviceAmount]),
            grand_total: trx.raw("grand_total + ?", [rateTonight + taxAmount + serviceAmount]),
            updated_by: userId,
            updated_at: tNow
          });

        await trx("trx_night_audit_item")
          .where("id", item.id)
          .update({
            status: "POSTED",
            rate_applied: rateTonight,
            tax_amount: taxAmount,
            service_charge_amount: serviceAmount,
            error_message: null,
            kode_folio_charge: noFolioCharge,
            updated_at: tNow
          });

        retriedSuccess++;
      });
    } catch (err) {
      stillFailed++;
      await DB("trx_night_audit_item")
        .where("id", item.id)
        .update({
          error_message: `Retry error: ${err.message}`,
          updated_at: formatDateSystem()
        });
    }
  }

  // Update counter audit run
  await DB("trx_night_audit")
    .where("kode_night_audit", auditCode)
    .update({
      total_posted: DB.raw("total_posted + ?", [retriedSuccess]),
      total_failed: stillFailed,
      status: stillFailed === 0 ? "completed" : "completed_with_exceptions"
    });

  return {
    kode_night_audit: auditCode,
    retried_success: retriedSuccess,
    still_failed: stillFailed
  };
};

/**
 * Reopen audit terakhir (khusus peran Manager / Superadmin dengan alasan wajib).
 * Melakukan reversal posting yang tercatat penuh di log tanpa menghapus baris asli.
 */
export const reopenNightAudit = async ({ auditCode, userId, userRole, reason }) => {
  const allowedRoles = ["manager", "branch_manager", "corporate_manager", "superadmin", "admin"];
  const roleLower = String(userRole || "").toLowerCase();

  if (!allowedRoles.includes(roleLower)) {
    const err = new Error("Hanya peran Manager atau Superadmin yang berwenang membuka kembali Night Audit.");
    err.status = 403;
    err.statusCode = 403;
    throw err;
  }

  if (!reason || reason.trim().length < 5) {
    const err = new Error("Alasan pembukaan kembali audit wajib diisi secara rinci.");
    err.status = 422;
    err.statusCode = 422;
    throw err;
  }

  const targetAudit = await DB("trx_night_audit")
    .where("kode_night_audit", auditCode)
    .first();

  if (!targetAudit) {
    const err = new Error(`Audit run ${auditCode} tidak ditemukan`);
    err.status = 404;
    throw err;
  }

  // Hanya boleh membuka kembali audit paling terbaru
  const latestAudit = await DB("trx_night_audit")
    .where("kode_cabang", targetAudit.kode_cabang)
    .orderBy("id", "desc")
    .first();

  if (latestAudit.kode_night_audit !== auditCode) {
    const err = new Error("Hanya audit run paling terbaru yang dapat dibuka kembali.");
    err.status = 409;
    err.statusCode = 409;
    throw err;
  }

  // Buat reversal transaction untuk seluruh baris posting yang pernah dibuat
  const postedItems = await DB("trx_night_audit_item")
    .where("kode_night_audit", auditCode)
    .where("status", "POSTED");

  await DB.transaction(async (trx) => {
    const tNow = formatDateSystem();

    for (const item of postedItems) {
      if (!item.kode_folio_charge) continue;

      const origCharge = await trx("trx_folio_charge")
        .where("kode_folio_charge", item.kode_folio_charge)
        .first();

      if (origCharge) {
        const noReversalCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
        const rateAmt = parseFloat(item.rate_applied || 0);
        const taxAmt = parseFloat(item.tax_amount || 0);
        const srvAmt = parseFloat(item.service_charge_amount || 0);

        // Insert Adjustment Reversal (Immutable accounting: nilai negatif dengan referensi)
        await trx("trx_folio_charge").insert({
          kode_folio_charge: noReversalCharge,
          kode_folio: origCharge.kode_folio,
          charge_type: "room",
          description: `Reversal: ${origCharge.description} (Reopen Audit: ${reason})`,
          qty: 1.00,
          unit_price: -rateAmt,
          amount: -rateAmt,
          business_date: item.business_date,
          source: "ADJUSTMENT",
          kode_night_audit: auditCode,
          reversal_of_id: origCharge.id,
          reversal_reason: reason,
          ref_source_type: origCharge.ref_source_type,
          kode_ref_source: origCharge.kode_ref_source,
          posted_by: userId,
          posted_at: tNow,
          created_by: userId,
          created_at: tNow,
          is_active: 1
        });

        // Kurangi saldo folio
        await trx("trx_folio")
          .where("kode_folio", origCharge.kode_folio)
          .update({
            subtotal: trx.raw("subtotal - ?", [rateAmt]),
            tax_amount: trx.raw("tax_amount - ?", [taxAmt]),
            service_charge_amount: trx.raw("service_charge_amount - ?", [srvAmt]),
            grand_total: trx.raw("grand_total - ?", [rateAmt + taxAmt + srvAmt]),
            updated_by: userId,
            updated_at: tNow
          });
      }
    }

    // Kembalikan business date ke tanggal audit yang dibuka kembali
    const targetYmd = formatYmd(targetAudit.business_date);
    await rollbackBusinessDate(targetAudit.kode_cabang, targetYmd, trx);

    // Update status audit menjadi 'reopened'
    await trx("trx_night_audit")
      .where("kode_night_audit", auditCode)
      .update({
        status: "reopened",
        note: `REOPENED by user ${userId}. Reason: ${reason}`
      });
  });

  return {
    kode_night_audit: auditCode,
    status: "reopened",
    restored_business_date: formatYmd(targetAudit.business_date),
    reversals_created: postedItems.length
  };
};

/**
 * Menandai reservasi sebagai No-Show sebelum audit dimulai.
 */
export const markReservationNoShow = async ({
  kodeReservasi,
  userId,
  reason = "Tamu tidak hadir pada tanggal check-in"
}) => {
  const res = await DB("trx_reservation")
    .where("kode_reservasi", kodeReservasi)
    .first();

  if (!res) {
    const err = new Error(`Reservasi ${kodeReservasi} tidak ditemukan`);
    err.status = 404;
    throw err;
  }

  if (res.status === "checked_in" || res.status === "checked_out") {
    const err = new Error(`Reservasi ${kodeReservasi} sudah dalam status ${res.status}, tidak dapat ditandai No-Show`);
    err.status = 409;
    throw err;
  }

  const tNow = formatDateSystem();
  await DB.transaction(async (trx) => {
    await trx("trx_reservation")
      .where("kode_reservasi", kodeReservasi)
      .update({
        status: "no_show",
        cancellation_reason: reason,
        updated_by: userId,
        updated_at: tNow
      });

    await trx("trx_reservation_room")
      .where("kode_reservation", kodeReservasi)
      .update({
        status: "booked",
        updated_by: userId,
        updated_at: tNow
      });

    // Catat status log jika ada
    try {
      const logCode = (await generateSequence("FMT-RSL", trx)) || `RSL-${Date.now()}`;
      await trx("trx_reservation_status_log").insert({
        kode_reservasi_log: logCode,
        kode_reservation: kodeReservasi,
        status_from: res.status,
        status_to: "no_show",
        note: reason,
        changed_by: userId,
        changed_at: tNow
      });
    } catch (logErr) {
      console.warn("[NO_SHOW] Warning writing status log:", logErr.message);
    }
  });

  return {
    kode_reservasi: kodeReservasi,
    status: "no_show",
    reason
  };
};
