import request from "supertest";
import app from "../app.js";
import DB from "../core/config/knex.js";

describe("Checkout Room Inspection & Interactive Checklist Integration Tests", () => {
  let testRoomCode = "";
  let testResRoomCode = "";
  let testFolioCode = "";
  let testTaskCode = "";

  beforeAll(async () => {
    process.env.APP_DEBUG = "true";
    // Cari kamar checked_in aktif untuk pengetesan
    const activeResRoom = await DB("trx_reservation_room as rr")
      .join("trx_folio as f", "rr.kode_reservation", "f.kode_reservation")
      .where("rr.status", "checked_in")
      .where("f.status", "open")
      .select("rr.kode_reservasi_room", "rr.kode_kamar", "f.kode_folio")
      .first();

    if (activeResRoom) {
      testRoomCode = activeResRoom.kode_kamar;
      testResRoomCode = activeResRoom.kode_reservasi_room;
      testFolioCode = activeResRoom.kode_folio;
    } else {
      // Fallback: gunakan kamar pertama yang ada
      const k = await DB("mst_kamar").where("is_active", 1).first();
      testRoomCode = k ? k.kode_kamar : "KMR-TEST";
    }
  });

  afterAll(async () => {
    // Bersihkan task test jika ada
    if (testTaskCode) {
      await DB("trx_housekeeping_task")
        .where("kode_housekeeping_task", testTaskCode)
        .delete();
    }
    await DB.destroy();
  });

  test("1. POST /api/v1/reservasi/checkout/request-inspection - Request Room Check", async () => {
    const res = await request(app)
      .post("/api/v1/reservasi/checkout/request-inspection")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR-SUPERADMIN")
      .send({
        kode_kamar: testRoomCode,
        kode_reservasi_room: testResRoomCode,
        priority: "urgent",
        notes: "Tamu di lobby, cek kulkas dan sprei",
        checklist: [
          { id: 1, task: "Ganti sprei & cek noda", checked: false },
          { id: 2, task: "Cek kulkas minibar", checked: false }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("00");
    expect(res.body.data.task).toBeDefined();

    testTaskCode = res.body.data.task.kode_housekeeping_task;
    expect(testTaskCode).toMatch(/^TSK/);
  });

  test("2. POST /api/v1/housekeeping/tasks/:id/checklist - Interactive Checklist Toggle", async () => {
    if (!testTaskCode) return;

    const res = await request(app)
      .post(`/api/v1/housekeeping/tasks/${testTaskCode}/checklist`)
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR-SUPERADMIN")
      .send({
        checklist: [
          { id: 1, task: "Ganti sprei & cek noda", checked: true, checked_at: "2026-10-06 11:30:00", checked_by: "Tester" },
          { id: 2, task: "Cek kulkas minibar", checked: true, checked_at: "2026-10-06 11:31:00", checked_by: "Tester" }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("00");
    expect(res.body.data.checklist).toHaveLength(2);
    expect(res.body.data.checklist[0].checked).toBe(true);
  });

  test("3. POST /api/v1/housekeeping/tasks/:id/submit-inspection - Submit Inspection with Findings", async () => {
    if (!testTaskCode) return;

    const res = await request(app)
      .post(`/api/v1/housekeeping/tasks/${testTaskCode}/submit-inspection`)
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR-SUPERADMIN")
      .send({
        result: "with_charges",
        notes: "Minibar diminum 1 kaleng, ditemukan charger tertinggal",
        minibar_items: [
          { item_name: "Coca-Cola Can", qty: 1, unit_price: 25000 }
        ],
        damaged_items: [],
        lost_and_found: {
          item_description: "Charger HP Samsung hitam di meja",
          location: "Meja kerja"
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("00");
    expect(res.body.data.inspection_result).toBe("with_charges");
    expect(res.body.data.total_additional_charges).toBe(25000);
    expect(res.body.data.lost_and_found).toBeDefined();
  });

  test("4. POST /api/v1/reservasi/checkout/cancel-inspection - Cancel Inspection", async () => {
    // Create another inspection task to test cancel
    const reqRes = await request(app)
      .post("/api/v1/reservasi/checkout/request-inspection")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR-SUPERADMIN")
      .send({
        kode_kamar: testRoomCode,
        kode_reservasi_room: testResRoomCode,
        priority: "normal",
        notes: "Inspection to be cancelled"
      });

    const cancelTaskCode = reqRes.body.data?.task?.kode_housekeeping_task;
    expect(cancelTaskCode).toBeDefined();

    const cancelRes = await request(app)
      .post("/api/v1/reservasi/checkout/cancel-inspection")
      .set("x-timestamp", new Date().toISOString())
      .set("x-uniqueid", "USR-SUPERADMIN")
      .send({
        kode_housekeeping_task: cancelTaskCode,
        cancel_reason: "Tamu buru-buru, direct checkout saja"
      });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe("00");
    expect(cancelRes.body.message).toContain("dibatalkan");
  });
});

