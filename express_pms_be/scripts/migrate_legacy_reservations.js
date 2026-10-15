/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file migrate_legacy_reservations.js
 * @description Skrip migrasi data legacy untuk menandai reservasi in-house lama dengan is_charged_upfront = 1
 *              agar tidak terkena double-charge saat Night Audit pertama kali dijalankan.
 *              Mendukung mode --dry-run dan --execute.
 * @author Antigravity
 * @created 2026-10-09
 */

import DB from "../core/config/knex.js";

async function run() {
  const isExecute = process.argv.includes("--execute");
  const mode = isExecute ? "EXECUTE (PRODUCTION)" : "DRY-RUN (SIMULASI)";

  console.log("====================================================================");
  console.log(` MIGRATION: LEGACY IN-HOUSE RESERVATION PROTECTION [${mode}]`);
  console.log("====================================================================\n");

  // 1. Cari semua reservasi in-house yang sudah memiliki room charge di muka
  const inhouseRes = await DB("trx_reservation as r")
    .join("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
    .join("trx_folio as f", "r.kode_reservasi", "f.kode_reservation")
    .leftJoin("trx_folio_charge as fc", function () {
      this.on("f.kode_folio", "=", "fc.kode_folio")
        .andOn("fc.charge_type", "=", DB.raw("'room'"))
        .andOn("fc.is_active", "=", DB.raw("1"));
    })
    .where("r.status", "checked_in")
    .where("rr.status", "checked_in")
    .select(
      "r.kode_cabang",
      "r.kode_reservasi",
      "r.check_in_date",
      "r.check_out_date",
      "r.is_charged_upfront",
      "rr.kode_reservasi_room",
      "rr.kode_kamar",
      "rr.rate_per_night",
      "rr.nights",
      "f.kode_folio",
      DB.raw("COUNT(fc.id) as total_room_charges"),
      DB.raw("COALESCE(SUM(fc.amount), 0) as total_room_amount")
    )
    .groupBy(
      "r.kode_cabang",
      "r.kode_reservasi",
      "r.check_in_date",
      "r.check_out_date",
      "r.is_charged_upfront",
      "rr.kode_reservasi_room",
      "rr.kode_kamar",
      "rr.rate_per_night",
      "rr.nights",
      "f.kode_folio"
    );

  console.log(`Ditemukan ${inhouseRes.length} kamar reservasi in-house aktif:\n`);

  const toMigrate = [];
  for (const item of inhouseRes) {
    const hasCharges = Number(item.total_room_charges) > 0;
    console.log(`- Reservasi: ${item.kode_reservasi} [${item.kode_cabang}] | Kamar: ${item.kode_kamar || 'N/A'} (${item.kode_reservasi_room})`);
    console.log(`  Check-in: ${new Date(item.check_in_date).toISOString().split('T')[0]} s.d. ${new Date(item.check_out_date).toISOString().split('T')[0]} (${item.nights} malam)`);
    console.log(`  Status charged_upfront saat ini: ${item.is_charged_upfront ? 'YA' : 'TIDAK'}`);
    console.log(`  Total Room Charges di Folio (${item.kode_folio}): ${item.total_room_charges} baris (Rp ${Number(item.total_room_amount).toLocaleString('id-ID')})`);

    if (hasCharges && !item.is_charged_upfront) {
      console.log(`  -> AKAN DITANDAI: is_charged_upfront = 1 & source = CHECKIN_LEGACY`);
      toMigrate.push(item);
    } else if (item.is_charged_upfront) {
      console.log(`  -> SUDAH TERPROTEKSI sebelumnya.`);
    } else {
      console.log(`  -> Belum ada charge kamar di folio (Akan diposting normal oleh Night Audit).`);
    }
    console.log("");
  }

  console.log(`--------------------------------------------------------------------`);
  console.log(`Total entitas yang perlu dimigrasi: ${toMigrate.length}`);

  if (!isExecute) {
    console.log(`\n[DRY-RUN SELESAI] Tidak ada perubahan database yang disimpan.`);
    console.log(`Jalankan dengan 'node scripts/migrate_legacy_reservations.js --execute' untuk menerapkan perubahan.`);
    process.exit(0);
  }

  // 2. Eksekusi jika mode --execute
  await DB.transaction(async (trx) => {
    for (const item of toMigrate) {
      // Update trx_reservation
      await trx("trx_reservation")
        .where("kode_reservasi", item.kode_reservasi)
        .update({ is_charged_upfront: 1 });

      // Update trx_reservation_room
      await trx("trx_reservation_room")
        .where("kode_reservasi_room", item.kode_reservasi_room)
        .update({ is_charged_upfront: 1 });

      // Update charges di folio terkait
      const checkinDateStr = new Date(item.check_in_date).toISOString().split('T')[0];
      await trx("trx_folio_charge")
        .where("kode_folio", item.kode_folio)
        .where("charge_type", "room")
        .where("is_active", 1)
        .update({
          source: "CHECKIN_LEGACY",
          business_date: trx.raw("COALESCE(business_date, ?)", [checkinDateStr])
        });
    }
  });

  console.log(`\n[BERHASIL] Migrasi legacy selesai dieksekusi secara aman.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("FATAL ERROR during legacy migration:", err);
  process.exit(1);
});
