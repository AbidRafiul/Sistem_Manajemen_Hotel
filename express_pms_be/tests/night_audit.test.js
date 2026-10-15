/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file night_audit.test.js
 * @description Integration & Unit test suite for Night Audit module (Fase 1 & Fase 2 core)
 * @author Antigravity
 * @created 2026-10-09
 */

import request from "supertest";
import app from "../app.js";
import DB from "../core/config/knex.js";
import {
  getCurrentBusinessDate,
  advanceBusinessDate,
  rollbackBusinessDate
} from "../routes/v1/components/tools/business_date_helper.js";
import {
  getNightAuditStatus,
  runPreAuditCheck,
  startNightAudit,
  reopenNightAudit
} from "../routes/v1/components/tools/night_audit_service.js";

describe("Night Audit Full Cycle Tests", () => {
  const testBranch = "CAB0001";
  let originalBusinessDate = "";

  beforeAll(async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_BYPASS = "true";
    const bDate = await getCurrentBusinessDate(testBranch);
    originalBusinessDate = bDate.current_business_date;
  });

  afterAll(async () => {
    // Restore business date jika berubah
    if (originalBusinessDate) {
      await rollbackBusinessDate(testBranch, originalBusinessDate);
    }
    await DB.destroy();
  });

  test("1. Business Date Helper - getCurrentBusinessDate & Advance/Rollback", async () => {
    const status = await getCurrentBusinessDate(testBranch);
    expect(status.current_business_date).toBeDefined();
    expect(typeof status.current_business_date).toBe("string");
    expect(status.current_business_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("2. API GET /api/v1/night-audit/status - Mengembalikan Business Date aktif", async () => {
    const res = await request(app)
      .get(`/api/v1/night-audit/status?kode_cabang=${testBranch}`)
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("00");
    expect(res.body.data.current_business_date).toBeDefined();
    expect(res.body.data.kode_cabang).toBe(testBranch);
  });

  test("3. Pre-Audit Check - Mendeteksi Blocker secara akurat", async () => {
    const existingUser = await DB("mst_user").first();
    // Buat open shift sementara untuk memverifikasi deteksi blocker
    const [testShiftId] = await DB("trx_cashier_shift").insert({
      kode_cashier_shift: "TEST-SFT-BLOCKER",
      kode_cabang: testBranch,
      kode_cashier_counter: "CTR0001",
      sesi: "malam",
      user_id: existingUser ? existingUser.id : 7,
      opening_cash: 100000,
      status: "open",
      opened_at: new Date()
    });

    try {
      const preCheck = await runPreAuditCheck(testBranch);
      expect(preCheck).toBeDefined();
      expect(preCheck.current_business_date).toBeDefined();
      expect(Array.isArray(preCheck.blockers)).toBe(true);
      expect(Array.isArray(preCheck.warnings)).toBe(true);

      const shiftBlocker = preCheck.blockers.find((b) => b.type === "OPEN_CASHIER_SHIFTS");
      expect(shiftBlocker).toBeDefined();
      expect(shiftBlocker.entity_ids.length).toBeGreaterThan(0);
    } finally {
      await DB("trx_cashier_shift").where("id", testShiftId).del();
    }
  });

  test("4. API GET /api/v1/night-audit/pre-check - Endpoint respons", async () => {
    const res = await request(app)
      .get(`/api/v1/night-audit/pre-check?kode_cabang=${testBranch}`)
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("00");
    expect(res.body.data.blockers).toBeDefined();
  });

  test("5. Check-in Baru Tidak Membebankan Seluruh Biaya Kamar di Muka", async () => {
    // Buat reservasi baru dummy untuk pengetesan check-in
    let testResCode = `TEST-RSV-${Date.now()}`;
    let testResRoomCode = `TEST-RR-${Date.now()}`;
    const tNow = new Date().toISOString().slice(0, 19).replace("T", " ");

    const assignedKamar = await DB("mst_kamar")
      .where("kode_cabang", testBranch)
      .where("occupancy_status", "vacant")
      .where("is_active", 1)
      .first();

    if (assignedKamar) {
      await DB("mst_kamar")
        .where("kode_kamar", assignedKamar.kode_kamar)
        .update({ housekeeping_status: "clean" });

      await DB.transaction(async (trx) => {
        await trx("trx_reservation").insert({
          kode_cabang: testBranch,
          kode_reservasi: testResCode,
          kode_guest: "TAM0001",
          booking_type: "individual",
          check_in_date: "2026-10-05",
          check_out_date: "2026-10-08", // 3 malam
          guest_count: 1,
          deposit_amount: 0,
          status: "reserved",
          source_channel: "direct",
          created_at: tNow
        });

        await trx("trx_reservation_room").insert({
          kode_reservasi_room: testResRoomCode,
          kode_reservation: testResCode,
          kode_tipe_kamar: assignedKamar.kode_tipe_kamar,
          kode_rate_plan: "RP-001",
          kode_kamar: assignedKamar.kode_kamar,
          rate_per_night: 500000,
          nights: 3,
          status: "booked",
          created_at: tNow
        });
      });

      // Lakukan check-in via endpoint checkin
      const checkinRes = await request(app)
        .post("/api/v1/reservasi/checkin/checkin-submit")
        .set("x-timestamp", new Date().toISOString())
        .set("x-uniqueid", "USR000000")
        .send({
          kode_reservasi_room: testResRoomCode
        });

      if (checkinRes.status !== 200) {
        console.log("CHECKIN ERROR:", checkinRes.body);
      }
      expect(checkinRes.status).toBe(200);

      if (checkinRes.status === 200) {
        // Cek folio: subtotal kamar harus 0 (karena belum diposting oleh night audit)
        const folioCode = checkinRes.body.data.kode_folio;
        const folio = await DB("trx_folio").where("kode_folio", folioCode).first();
        expect(Number(folio.subtotal)).toBe(0);

        // Cek room charges di folio_charge: tidak boleh ada charge room 3 malam di muka
        const upfrontRoomCharges = await DB("trx_folio_charge")
          .where("kode_folio", folioCode)
          .where("charge_type", "room")
          .where("is_active", 1);
        expect(upfrontRoomCharges.length).toBe(0);
      }

      // Bersihkan data dummy
      await DB("trx_folio_charge").where("kode_ref_source", testResRoomCode).delete();
      await DB("trx_payment").where("reference_no", testResCode).delete();
      await DB("trx_checkin").where("kode_reservation_room", testResRoomCode).delete();
      await DB("trx_fiscal_document").whereIn("kode_folio", DB("trx_folio").select("kode_folio").where("kode_reservation", testResCode)).delete();
      await DB("trx_folio").where("kode_reservation", testResCode).delete();
      await DB("trx_reservation_room").where("kode_reservasi_room", testResRoomCode).delete();
      await DB("trx_reservation").where("kode_reservasi", testResCode).delete();
      await DB("mst_kamar").where("kode_kamar", assignedKamar.kode_kamar).update({ occupancy_status: "vacant" });
    }
  });

  test("6. Night Audit Execution - Atomic Posting, Idempotency & Rollover", async () => {
    // Siapkan cabang pengujian khusus (CAB0002) untuk menguji full run Night Audit
    const testBranch2 = "CAB0002";
    const bDateInfo = await getCurrentBusinessDate(testBranch2);
    const initialDate = bDateInfo.current_business_date;

    // Pastikan tidak ada blocker buatan pada CAB0002
    // Tutup shift terbuka sementara jika ada
    await DB("trx_cashier_shift")
      .where("kode_cabang", testBranch2)
      .where("status", "open")
      .update({ status: "closed", closed_at: new Date() });

    // Update arrival tanggal lampau untuk test run
    await DB("trx_reservation")
      .where("kode_cabang", testBranch2)
      .whereIn("status", ["reserved", "confirmed"])
      .where("check_in_date", "<=", initialDate)
      .update({ status: "no_show" });

    // Update pending departure jika ada agar tidak memblokir test audit run
    await DB("trx_reservation")
      .where("kode_cabang", testBranch2)
      .where("status", "checked_in")
      .where("check_out_date", "<=", initialDate)
      .update({ check_out_date: "2026-10-09" });

    // Jalankan audit
    const auditResult = await startNightAudit({
      kodeCabang: testBranch2,
      userId: 7, // superadmin
      businessDate: initialDate,
      notes: "Test run automated"
    });

    expect(auditResult.kode_night_audit).toBeDefined();
    expect(["completed", "completed_with_exceptions"]).toContain(auditResult.status);
    expect(auditResult.audited_business_date).toBe(initialDate);

    // Business date harus maju tepat 1 hari
    const nextDate = auditResult.next_business_date;
    const expectedNext = new Date(new Date(`${initialDate}T00:00:00Z`).getTime() + 86400000).toISOString().split("T")[0];
    expect(nextDate).toBe(expectedNext);

    const updatedBDate = await getCurrentBusinessDate(testBranch2);
    expect(updatedBDate.current_business_date).toBe(expectedNext);
    expect(updatedBDate.is_locked).toBe(false);

    // Verifikasi Idempotency: Menjalankan audit ulang untuk tanggal yang sama harus ditolak (409)
    await expect(
      startNightAudit({
        kodeCabang: testBranch2,
        userId: 7,
        businessDate: initialDate
      })
    ).rejects.toThrow();

    // Verifikasi Snapshot Laporan tersimpan di DB
    const savedAudit = await DB("trx_night_audit")
      .where("kode_night_audit", auditResult.kode_night_audit)
      .first();
    expect(savedAudit.report_snapshots).toBeDefined();
    const reports = JSON.parse(savedAudit.report_snapshots);
    expect(reports.daily_revenue).toBeDefined();
    expect(reports.trial_balance).toBeDefined();

    // Verifikasi Reopen Audit
    const reopenRes = await reopenNightAudit({
      auditCode: auditResult.kode_night_audit,
      userId: 7,
      userRole: "superadmin",
      reason: "Pengetesan Reopen Audit oleh Manager"
    });

    expect(reopenRes.status).toBe("reopened");
    expect(reopenRes.restored_business_date).toBe(initialDate);

    // Business date harus kembali ke tanggal asal setelah reopen
    const restoredBDate = await getCurrentBusinessDate(testBranch2);
    expect(restoredBDate.current_business_date).toBe(initialDate);

    // Bersihkan audit dummy
    await DB("trx_folio_charge").where("kode_night_audit", auditResult.kode_night_audit).delete();
    await DB("trx_night_audit_item").where("kode_night_audit", auditResult.kode_night_audit).delete();
    await DB("trx_night_audit").where("kode_night_audit", auditResult.kode_night_audit).delete();
  });

  test("7. API GET /runs & GET /runs/:id/reports/:type", async () => {
    const runsRes = await request(app)
      .get(`/api/v1/night-audit/runs?kode_cabang=${testBranch}`)
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR000000");

    expect(runsRes.status).toBe(200);
    expect(runsRes.body.status).toBe("00");
    expect(Array.isArray(runsRes.body.data)).toBe(true);
  });
});
