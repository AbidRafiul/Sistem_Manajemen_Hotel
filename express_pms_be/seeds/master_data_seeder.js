/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file master_data_seeder.js
 * @description Seeder komprehensif untuk seluruh master data & demo transaksi hotel PMS.
 *              Menyediakan data untuk SETIAP MENU / HALAMAN pada sistem (Master Cabang, Gedung,
 *              Lantai, Bed Type, Amenity, Fasilitas, Corporate, Pajak, Cashier Counter, Tipe Kamar,
 *              Kamar, Ruang Event, Season, Paket Harga, Shift Kasir, Tamu Menginap, Arrivals,
 *              Booking, Checkout, dan Housekeeping Room Status Board).
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-17)
 * @version 2.0.0
 */

import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";
import { format, addDays, subDays } from "date-fns";

export async function seed(knex) {
  const dDatetimeIso = formatDateSystem();
  const now = new Date();

  // Tanggal dinamis agar relevan saat didemokan di production / presentasi
  const dToday = format(now, "yyyy-MM-dd");
  const dTomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const dYesterday = format(subDays(now, 1), "yyyy-MM-dd");
  const dIn3Days = format(addDays(now, 3), "yyyy-MM-dd");
  const dIn5Days = format(addDays(now, 5), "yyyy-MM-dd");
  const dIn7Days = format(addDays(now, 7), "yyyy-MM-dd");

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Seeding Master Data & Demo Transaksi Hotel PMS          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // ─── 0. Skema Defensive Check (Idempotent ALTER / CREATE TABLE) ─────────────
  // Memastikan kolom `harga` dan tabel `mst_tipe_kamar_foto` sudah ada sebelum insert
  const amenityCol = await knex.raw(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga'"
  );
  if (amenityCol[0].length === 0) {
    await knex.raw("ALTER TABLE `mst_amenity` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `icon`");
  }

  const fasilitasCol = await knex.raw(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_fasilitas' AND COLUMN_NAME = 'harga'"
  );
  if (fasilitasCol[0].length === 0) {
    await knex.raw("ALTER TABLE `mst_fasilitas` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `name`");
  }

  const tkFotoTable = await knex.raw(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_tipe_kamar_foto'"
  );
  if (tkFotoTable[0].length === 0) {
    await knex.raw(`
      CREATE TABLE mst_tipe_kamar_foto (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        kode_tipe_kamar VARCHAR(50) NOT NULL,
        foto_url VARCHAR(255) NOT NULL,
        urutan INT NOT NULL DEFAULT 0,
        is_cover TINYINT(1) NOT NULL DEFAULT 0,
        created_by BIGINT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_by BIGINT DEFAULT NULL,
        deleted_at DATETIME DEFAULT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        CONSTRAINT fk_tkf_tipe_kamar FOREIGN KEY (kode_tipe_kamar) 
          REFERENCES mst_tipe_kamar(kode_tipe_kamar) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  // ─── Reset Data Lama (Urutan FK aman dengan SET FOREIGN_KEY_CHECKS = 0) ──────
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0;");

  // Transaksi
  await knex("trx_payment").del();
  await knex("trx_folio_charge").del();
  await knex("trx_folio").del();
  await knex("trx_checkin").del();
  await knex("trx_reservation_room").del();
  await knex("trx_reservation").del();
  await knex("trx_housekeeping_task").del();
  await knex("trx_cashier_shift").del();

  // Master & Relasi
  await knex("mst_tipe_kamar_foto").del();
  await knex("mst_room_type_amenity").del();
  await knex("mst_room_type_fasilitas").del();
  await knex("mst_rate_plan_price").del();
  await knex("mst_kamar").del();
  await knex("mst_paket_harga").del();
  await knex("mst_tipe_kamar").del();
  await knex("mst_lantai").del();
  await knex("mst_gedung").del();
  await knex("mst_fasilitas").del();
  await knex("mst_cabang").del();
  await knex("mst_bed_type").del();
  await knex("mst_amenity").del();
  await knex("mst_tax").del();
  await knex("mst_corporate_account").del();
  await knex("mst_cashier_counter").del();
  await knex("mst_harga_ruang_event").del();
  await knex("mst_ruang_event").del();
  await knex("mst_tipe_ruang_event").del();
  await knex("mst_musim").del();
  await knex("mst_guest").del();
  await knex("config").del();
  await knex("sys_format_penomoran").del();

  await knex.raw("SET FOREIGN_KEY_CHECKS = 1;");

  console.log("  🧹 Membersihkan database lama selesai");

  // ─── 1. Cabang (/master_cabang) ─────────────────────────────────────────────
  console.log("  🏢 Seeding Master Cabang...");
  await knex("mst_cabang").insert([
    {
      kode_cabang: "CAB0001",
      nama_hotel: "Grand Marstech Hotel & Resort Magetan",
      logo_url: null,
      alamat: "Jl. Diponegoro No. 88, Magetan, Jawa Timur",
      telepon: "0351-890123",
      waktu_checkin: "14:00:00",
      waktu_checkout: "12:00:00",
      zona_waktu: "Asia/Jakarta",
      is_pkp: 1,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0002",
      nama_hotel: "Grand Marstech Resort & Spa Batu",
      logo_url: null,
      alamat: "Jl. Oro-Oro Ombo No. 12, Kota Batu, Jawa Timur",
      telepon: "0341-591234",
      waktu_checkin: "14:00:00",
      waktu_checkout: "12:00:00",
      zona_waktu: "Asia/Jakarta",
      is_pkp: 1,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 2. Gedung (/master_gedung) ─────────────────────────────────────────────
  console.log("  🏢 Seeding Master Gedung...");
  await knex("mst_gedung").insert([
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      nama_gedung: "Gedung Utama (Main Wing)",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0002",
      nama_gedung: "Gedung Convention & Ballroom",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0003",
      nama_gedung: "Gedung Executive Suites",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 3. Lantai (/master_lantai) ─────────────────────────────────────────────
  console.log("  🏢 Seeding Master Lantai...");
  await knex("mst_lantai").insert([
    {
      kode_gedung: "GED0001",
      kode_lantai: "LAN0001",
      nama_lantai: "Lantai 1 (Lobby & Facilities)",
      nomor_lantai: 1,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_gedung: "GED0001",
      kode_lantai: "LAN0002",
      nama_lantai: "Lantai 2 (Deluxe Rooms)",
      nomor_lantai: 2,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_gedung: "GED0003",
      kode_lantai: "LAN0003",
      nama_lantai: "Lantai 3 (Executive & Suite Rooms)",
      nomor_lantai: 3,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_gedung: "GED0002",
      kode_lantai: "LAN0004",
      nama_lantai: "Lantai Ballroom & Meeting Rooms",
      nomor_lantai: 1,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 4. Bed Type (/master_bed_type) ─────────────────────────────────────────
  console.log("  🛏️  Seeding Master Bed Type...");
  await knex("mst_bed_type").insert([
    {
      kode_bed_type: "BTY-001",
      name: "Single Bed (100 x 200)",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_bed_type: "BTY-002",
      name: "Double / Queen Bed (160 x 200)",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_bed_type: "BTY-003",
      name: "King Bed (180 x 200)",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_bed_type: "BTY-004",
      name: "Twin Bed (2x 100 x 200)",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 5. Fasilitas & Amenity (/master_amenity) ───────────────────────────────
  console.log("  ✨ Seeding Master Amenity...");
  await knex("mst_amenity").insert([
    {
      kode_amenity: "AMN-001",
      name: "Free High-Speed WiFi",
      icon: "pi pi-wifi",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-002",
      name: "Air Conditioning (AC)",
      icon: "pi pi-box",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-003",
      name: "Smart LED TV 43 Inch",
      icon: "pi pi-desktop",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-004",
      name: "Coffee & Tea Maker",
      icon: "pi pi-coffee",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-005",
      name: "Safe Deposit Box",
      icon: "pi pi-lock",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-006",
      name: "Minibar Stocked",
      icon: "pi pi-wallet",
      harga: 50000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-007",
      name: "Bathrobe & Slippers Premium",
      icon: "pi pi-heart",
      harga: 25000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-008",
      name: "Hair Dryer",
      icon: "pi pi-bolt",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 6. Master Fasilitas (/master_fasilitas) ─────────────────────────────────
  console.log("  🏊 Seeding Master Fasilitas...");
  await knex("mst_fasilitas").insert([
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-001",
      name: "Kolam Renang Infinity (Pool)",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-002",
      name: "Fitness Center & Gym",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-003",
      name: "Spa & Traditional Massage",
      harga: 175000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-004",
      name: "Restoran Kayu Manis & Coffee Bar",
      harga: 0.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-005",
      name: "Antar-Jemput Bandara / Stasiun",
      harga: 150000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-006",
      name: "Express Laundry & Dry Clean",
      harga: 45000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 7. Corporate & Travel Agent (/master_corporate) ────────────────────────
  console.log("  💼 Seeding Master Corporate / Travel Agent...");
  await knex("mst_corporate_account").insert([
    {
      kode_cabang: "CAB0001",
      kode_corporate: "COR0001",
      name: "PT Pertamina (Persero)",
      account_type: "corporate",
      npwp: "01.000.123.4-051.000",
      billing_address: "Jl. Medan Merdeka Timur No. 1A, Jakarta Pusat",
      payment_term_days: 30,
      commission_pct: null,
      contact_person: "Bpk. Bambang Sutrisno",
      contact_phone: "021-3815111",
      contact_email: "procurement@pertamina.com",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_corporate: "COR0002",
      name: "Traveloka Indonesia (PT Trinusa Travelindo)",
      account_type: "ota",
      npwp: "03.123.456.7-012.000",
      billing_address: "Wisma Barito Pacific Tower B, Lt. 2, Jakarta Barat",
      payment_term_days: 14,
      commission_pct: 15.0,
      contact_person: "Market Manager Jatim",
      contact_phone: "021-29777000",
      contact_email: "hotel-ops@traveloka.com",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_corporate: "COR0003",
      name: "Tiket.com (PT Global Tiket Network)",
      account_type: "ota",
      npwp: "03.234.567.8-034.000",
      billing_address: "Gedung Graha Niaga Thamrin Lt. 5, Jakarta",
      payment_term_days: 14,
      commission_pct: 15.0,
      contact_person: "Supply Operations Team",
      contact_phone: "021-39710123",
      contact_email: "supply@tiket.com",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_corporate: "COR0004",
      name: "Panorama Tours & Travel",
      account_type: "travel_agent",
      npwp: "01.345.678.9-078.000",
      billing_address: "Panorama Building, Jl. Tomang Raya No. 63, Jakarta",
      payment_term_days: 30,
      commission_pct: 10.0,
      contact_person: "Ibu Ratna Dewi",
      contact_phone: "021-25565100",
      contact_email: "inbound@panorama-destination.com",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 8. Pajak & Service Charge (/master_pajak) ──────────────────────────────
  console.log("  🏷️  Seeding Master Pajak...");
  await knex("mst_tax").insert([
    {
      kode_cabang: "CAB0001",
      kode_pajak: "PAJ0001",
      name: "Pajak Daerah (PB1 Hotel)",
      tax_type: "tax",
      percentage: 10.0,
      is_compounding: 0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_pajak: "PAJ0002",
      name: "Service Charge",
      tax_type: "service_charge",
      percentage: 5.0,
      is_compounding: 0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 9. Master Cashier Counter (/master_cashier_counter) ────────────────────
  console.log("  🖥️  Seeding Master Cashier Counter...");
  await knex("mst_cashier_counter").insert([
    {
      kode_cabang: "CAB0001",
      kode_counter: "CTR0001",
      name: "Front Desk Counter 01",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_counter: "CTR0002",
      name: "Front Desk Counter 02",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_counter: "CTR0003",
      name: "Restaurant & Lounge Cashier",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 10. Tipe Kamar (/master_tipe_kamar) ─────────────────────────────────────
  console.log("  🚪 Seeding Master Tipe Kamar...");
  await knex("mst_tipe_kamar").insert([
    {
      kode_cabang: "CAB0001",
      kode_tipe_kamar: "TIP0001",
      nama_tipe: "Superior Room",
      kapasitas_dasar: 2,
      kapasitas_maksimal: 2,
      kapasitas_ekstra: 1,
      harga_default: 550000.0,
      luas_sqm: 28.0,
      deskripsi: "Kamar modern minimalis dengan fasilitas lengkap, cocok untuk perjalanan bisnis maupun liburan singkat.",
      kode_bed_type: "BTY-004",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tipe_kamar: "TIP0002",
      nama_tipe: "Deluxe Room",
      kapasitas_dasar: 2,
      kapasitas_maksimal: 3,
      kapasitas_ekstra: 1,
      harga_default: 850000.0,
      luas_sqm: 36.0,
      deskripsi: "Kamar luas dengan balkon pribadi dan pemandangan taman tropis atau lanskap kota.",
      kode_bed_type: "BTY-002",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tipe_kamar: "TIP0003",
      nama_tipe: "Executive Suite",
      kapasitas_dasar: 2,
      kapasitas_maksimal: 4,
      kapasitas_ekstra: 2,
      harga_default: 1450000.0,
      luas_sqm: 54.0,
      deskripsi: "Suite mewah dengan ruang tamu terpisah, bathtub pribadi, dan akses executive lounge.",
      kode_bed_type: "BTY-003",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tipe_kamar: "TIP0004",
      nama_tipe: "Presidential Suite",
      kapasitas_dasar: 4,
      kapasitas_maksimal: 6,
      kapasitas_ekstra: 2,
      harga_default: 2750000.0,
      luas_sqm: 92.0,
      deskripsi: "Suite termewah dengan pemandangan spektakuler, ruang makan, pantry pribadi, dan jacuzzi.",
      kode_bed_type: "BTY-003",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 11. Tipe Kamar Foto (Galeri & Cover) ───────────────────────────────────
  console.log("  📸 Seeding Tipe Kamar Foto...");
  await knex("mst_tipe_kamar_foto").insert([
    {
      kode_tipe_kamar: "TIP0001",
      foto_url: "foto_TIP0001_interior.jpg",
      urutan: 1,
      is_cover: 1,
      created_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_tipe_kamar: "TIP0001",
      foto_url: "foto_TIP0001_bathroom.jpg",
      urutan: 2,
      is_cover: 0,
      created_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_tipe_kamar: "TIP0001",
      foto_url: "foto_TIP0001_balcony.jpg",
      urutan: 3,
      is_cover: 0,
      created_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_tipe_kamar: "TIP0002",
      foto_url: "foto_TIP0001_interior.jpg",
      urutan: 1,
      is_cover: 1,
      created_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_tipe_kamar: "TIP0003",
      foto_url: "foto_TIP0001_balcony.jpg",
      urutan: 1,
      is_cover: 1,
      created_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_tipe_kamar: "TIP0004",
      foto_url: "foto_TIP0001_interior.jpg",
      urutan: 1,
      is_cover: 1,
      created_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 12. Room Type Amenity & Fasilitas Relations ───────────────────────────
  console.log("  🔗 Seeding Relasi Tipe Kamar ↔ Amenity & Fasilitas...");
  await knex("mst_room_type_amenity").insert([
    { kode_rta: "RTA0001", kode_tipe_kamar: "TIP0001", kode_amenity: "AMN-001" },
    { kode_rta: "RTA0002", kode_tipe_kamar: "TIP0001", kode_amenity: "AMN-002" },
    { kode_rta: "RTA0003", kode_tipe_kamar: "TIP0001", kode_amenity: "AMN-003" },
    { kode_rta: "RTA0004", kode_tipe_kamar: "TIP0001", kode_amenity: "AMN-004" },
    { kode_rta: "RTA0005", kode_tipe_kamar: "TIP0002", kode_amenity: "AMN-001" },
    { kode_rta: "RTA0006", kode_tipe_kamar: "TIP0002", kode_amenity: "AMN-002" },
    { kode_rta: "RTA0007", kode_tipe_kamar: "TIP0002", kode_amenity: "AMN-003" },
    { kode_rta: "RTA0008", kode_tipe_kamar: "TIP0002", kode_amenity: "AMN-004" },
    { kode_rta: "RTA0009", kode_tipe_kamar: "TIP0002", kode_amenity: "AMN-005" },
    { kode_rta: "RTA0010", kode_tipe_kamar: "TIP0002", kode_amenity: "AMN-006" },
    { kode_rta: "RTA0011", kode_tipe_kamar: "TIP0003", kode_amenity: "AMN-001" },
    { kode_rta: "RTA0012", kode_tipe_kamar: "TIP0003", kode_amenity: "AMN-002" },
    { kode_rta: "RTA0013", kode_tipe_kamar: "TIP0003", kode_amenity: "AMN-005" },
    { kode_rta: "RTA0014", kode_tipe_kamar: "TIP0003", kode_amenity: "AMN-006" },
    { kode_rta: "RTA0015", kode_tipe_kamar: "TIP0003", kode_amenity: "AMN-007" },
  ]);

  await knex("mst_room_type_fasilitas").insert([
    { kode_tipe_kamar: "TIP0001", kode_fasilitas: "FAS-001", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0001", kode_fasilitas: "FAS-002", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0002", kode_fasilitas: "FAS-001", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0002", kode_fasilitas: "FAS-002", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0002", kode_fasilitas: "FAS-004", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-001", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-002", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-003", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-004", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-005", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0004", kode_fasilitas: "FAS-001", created_at: dDatetimeIso },
    { kode_tipe_kamar: "TIP0004", kode_fasilitas: "FAS-003", created_at: dDatetimeIso },
  ]);

  // ─── 13. Master Kamar (/master_kamar & Housekeeping Status Board) ───────────
  console.log("  🛌 Seeding Master Kamar...");
  await knex("mst_kamar").insert([
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      kode_lantai: "LAN0001",
      kode_tipe_kamar: "TIP0001",
      kode_kamar: "KAM0001",
      nomor_kamar: "101",
      tipe_pemandangan: "Garden View",
      catatan: "Kamar dekat lobby",
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      kode_lantai: "LAN0001",
      kode_tipe_kamar: "TIP0001",
      kode_kamar: "KAM0002",
      nomor_kamar: "102",
      tipe_pemandangan: "Garden View",
      catatan: null,
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      kode_lantai: "LAN0001",
      kode_tipe_kamar: "TIP0001",
      kode_kamar: "KAM0003",
      nomor_kamar: "103",
      tipe_pemandangan: "Pool View",
      catatan: "Perlu pembersihan rutin",
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "dirty",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      kode_lantai: "LAN0002",
      kode_tipe_kamar: "TIP0002",
      kode_kamar: "KAM0004",
      nomor_kamar: "201",
      tipe_pemandangan: "City View",
      catatan: "Tamu in-house aktif",
      boleh_merokok: 0,
      occupancy_status: "occupied",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      kode_lantai: "LAN0002",
      kode_tipe_kamar: "TIP0002",
      kode_kamar: "KAM0005",
      nomor_kamar: "202",
      tipe_pemandangan: "City View",
      catatan: "Dialokasikan untuk tamu kedatangan hari ini",
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      kode_lantai: "LAN0002",
      kode_tipe_kamar: "TIP0002",
      kode_kamar: "KAM0006",
      nomor_kamar: "203",
      tipe_pemandangan: "Pool View",
      catatan: null,
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0003",
      kode_lantai: "LAN0003",
      kode_tipe_kamar: "TIP0003",
      kode_kamar: "KAM0007",
      nomor_kamar: "301",
      tipe_pemandangan: "Mountain View",
      catatan: "Tamu VIP in-house",
      boleh_merokok: 0,
      occupancy_status: "occupied",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0003",
      kode_lantai: "LAN0003",
      kode_tipe_kamar: "TIP0003",
      kode_kamar: "KAM0008",
      nomor_kamar: "302",
      tipe_pemandangan: "Mountain View",
      catatan: null,
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0003",
      kode_lantai: "LAN0003",
      kode_tipe_kamar: "TIP0004",
      kode_kamar: "KAM0009",
      nomor_kamar: "305",
      tipe_pemandangan: "Panoramic Mountain & City",
      catatan: "Presidential Suite siap pakai",
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 14. Ruang Event (/master_tipe_ruang_event, /master_ruang_event, /master_harga_ruang_event)
  console.log("  🎤 Seeding Master Ruang Event & Harga...");
  await knex("mst_tipe_ruang_event").insert([
    {
      kode_tipe_ruang_event: "TRE0001",
      nama_tipe: "Meeting & Boardroom",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_tipe_ruang_event: "TRE0002",
      nama_tipe: "Convention & Grand Ballroom",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_tipe_ruang_event: "TRE0003",
      nama_tipe: "Rooftop & Function Space",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  await knex("mst_ruang_event").insert([
    {
      kode_ruang_event: "RUA0001",
      kode_cabang: "CAB0001",
      kode_gedung: "GED0002",
      kode_lantai: "LAN0004",
      kode_tipe_ruang_event: "TRE0001",
      nama_ruang: "Ruang Melati (Meeting Room)",
      kapasitas_orang: 30,
      luas_sqm: 45,
      layout_support: "Classroom, U-Shape, Theater",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_ruang_event: "RUA0002",
      kode_cabang: "CAB0001",
      kode_gedung: "GED0002",
      kode_lantai: "LAN0004",
      kode_tipe_ruang_event: "TRE0001",
      nama_ruang: "Ruang Mawar (VIP Boardroom)",
      kapasitas_orang: 15,
      luas_sqm: 30,
      layout_support: "Boardroom, Hollow Square",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_ruang_event: "RUA0003",
      kode_cabang: "CAB0001",
      kode_gedung: "GED0002",
      kode_lantai: "LAN0004",
      kode_tipe_ruang_event: "TRE0002",
      nama_ruang: "Grand Garuda Ballroom",
      kapasitas_orang: 500,
      luas_sqm: 450,
      layout_support: "Round Table, Theater, Standing Party",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  await knex("mst_harga_ruang_event").insert([
    {
      kode_harga_ruang_event: "HRG0001",
      kode_ruang_event: "RUA0001",
      tipe_sewa: "per_jam",
      kode_musim: null,
      harga: 350000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_ruang_event: "HRG0002",
      kode_ruang_event: "RUA0001",
      tipe_sewa: "half_day",
      kode_musim: null,
      harga: 1250000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_ruang_event: "HRG0003",
      kode_ruang_event: "RUA0001",
      tipe_sewa: "full_day",
      kode_musim: null,
      harga: 2200000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_ruang_event: "HRG0004",
      kode_ruang_event: "RUA0003",
      tipe_sewa: "half_day",
      kode_musim: null,
      harga: 15000000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_ruang_event: "HRG0005",
      kode_ruang_event: "RUA0003",
      tipe_sewa: "full_day",
      kode_musim: null,
      harga: 25000000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 15. Season & Pricing (/master_season) ──────────────────────────────────
  console.log("  📅 Seeding Master Season...");
  await knex("mst_musim").insert([
    {
      kode_cabang: "CAB0001",
      kode_musim: "SEA0001",
      nama_musim: "Regular Low Season",
      tanggal_mulai: "2026-01-01",
      tanggal_selesai: "2026-12-31",
      hari_berlaku: "senin,selasa,rabu,kamis,jumat,sabtu,minggu",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_musim: "SEA0002",
      nama_musim: "High Season Libur Sekolah",
      tanggal_mulai: "2026-06-15",
      tanggal_selesai: "2026-07-20",
      hari_berlaku: "senin,selasa,rabu,kamis,jumat,sabtu,minggu",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_musim: "SEA0003",
      nama_musim: "Peak Season Akhir Tahun",
      tanggal_mulai: "2026-12-20",
      tanggal_selesai: "2027-01-05",
      hari_berlaku: "senin,selasa,rabu,kamis,jumat,sabtu,minggu",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 16. Rate Plan (/master_rate_plan) ──────────────────────────────────────
  console.log("  💵 Seeding Master Paket Harga (Rate Plan)...");
  await knex("mst_paket_harga").insert([
    {
      kode_cabang: "CAB0001",
      kode_template: null,
      kode_paket_harga: "RP-001",
      nama_paket: "Room Only (RO)",
      tipe_paket: "RO",
      tipe_markup: "nominal",
      nilai_markup: 0.0,
      dapat_di_refund: 1,
      termasuk_sarapan: 0,
      minimal_malam: 1,
      maksimal_malam: null,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_template: null,
      kode_paket_harga: "RP-002",
      nama_paket: "Bed & Breakfast (BB)",
      tipe_paket: "BB",
      tipe_markup: "nominal",
      nilai_markup: 120000.0,
      dapat_di_refund: 1,
      termasuk_sarapan: 1,
      minimal_malam: 1,
      maksimal_malam: null,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_template: null,
      kode_paket_harga: "RP-003",
      nama_paket: "Corporate Package",
      tipe_paket: "BB",
      tipe_markup: "persen",
      nilai_markup: 10.0,
      dapat_di_refund: 0,
      termasuk_sarapan: 1,
      minimal_malam: 2,
      maksimal_malam: null,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_template: null,
      kode_paket_harga: "RP-004",
      nama_paket: "Weekend Staycation Promo",
      tipe_paket: "BB",
      tipe_markup: "persen",
      nilai_markup: 15.0,
      dapat_di_refund: 1,
      termasuk_sarapan: 1,
      minimal_malam: 1,
      maksimal_malam: null,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 17. Rate Plan Price (/master_rate_plan_price) ──────────────────────────
  console.log("  💰 Seeding Master Harga Kamar...");
  await knex("mst_rate_plan_price").insert([
    {
      kode_harga_price: "HAR0001",
      kode_tipe_kamar: "TIP0001",
      kode_rate_plan: "RP-001",
      kode_season: null,
      price: 550000.0,
      extra_bed_price: 150000.0,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0002",
      kode_tipe_kamar: "TIP0001",
      kode_rate_plan: "RP-002",
      kode_season: null,
      price: 670000.0,
      extra_bed_price: 150000.0,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0003",
      kode_tipe_kamar: "TIP0002",
      kode_rate_plan: "RP-001",
      kode_season: null,
      price: 850000.0,
      extra_bed_price: 175000.0,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0004",
      kode_tipe_kamar: "TIP0002",
      kode_rate_plan: "RP-002",
      kode_season: null,
      price: 970000.0,
      extra_bed_price: 175000.0,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0005",
      kode_tipe_kamar: "TIP0003",
      kode_rate_plan: "RP-001",
      kode_season: null,
      price: 1450000.0,
      extra_bed_price: 200000.0,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0006",
      kode_tipe_kamar: "TIP0003",
      kode_rate_plan: "RP-002",
      kode_season: null,
      price: 1570000.0,
      extra_bed_price: 200000.0,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0007",
      kode_tipe_kamar: "TIP0004",
      kode_rate_plan: "RP-002",
      kode_season: null,
      price: 2750000.0,
      extra_bed_price: 250000.0,
      valid_from: "2026-01-01",
      valid_to: "2026-12-31",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 18. Konfigurasi Perusahaan (/setup/config) ──────────────────────────────
  console.log("  ⚙️  Seeding Konfigurasi Perusahaan...");
  await knex("config").insert([
    { kode: "msNamaPerusahaan", keterangan: "Grand Marstech Hotel & Resort", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msSubNamaPerusahaan", keterangan: "PT Marstech Global Hospitality", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msAlamatPerusahaan", keterangan: "Jl. Diponegoro No. 88, Magetan, Jawa Timur", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msKotaPerusahaan", keterangan: "Magetan", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msTeleponPerusahaan", keterangan: "0351-890123", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msNamaPimpinan", keterangan: "Direktur Utama", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msLogoPerusahaan", keterangan: "", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msCatatanKasir", keterangan: "Terima kasih atas kunjungan Anda di Grand Marstech Hotel.", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msPPN", keterangan: "10", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "nominalPoint", keterangan: "10000", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msVideoDisplay", keterangan: "", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
  ]);

  // ─── 19. Data Tamu (/reservasi/guest & Walk-in & Booking) ────────────────────
  console.log("  👤 Seeding Data Tamu...");
  await knex("mst_guest").insert([
    {
      kode_cabang: "CAB0001",
      kode_tamu: "TAM0001",
      full_name: "Budi Santoso",
      id_type: "ktp",
      id_number: "3520011508850001",
      nationality: "Indonesia",
      email: "budi.santoso@gmail.com",
      phone: "081234567890",
      is_vip: 1,
      is_blacklisted: 0,
      total_stay: 5,
      total_spending: 4250000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tamu: "TAM0002",
      full_name: "Siti Rahmawati",
      id_type: "ktp",
      id_number: "3520016405920002",
      nationality: "Indonesia",
      email: "siti.rahmawati@yahoo.com",
      phone: "082198765432",
      is_vip: 0,
      is_blacklisted: 0,
      total_stay: 2,
      total_spending: 1700000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tamu: "TAM0003",
      full_name: "Johnathan Miller",
      id_type: "passport",
      id_number: "A98765432",
      nationality: "Australia",
      email: "j.miller@sydneycorp.au",
      phone: "+61412345678",
      is_vip: 1,
      is_blacklisted: 0,
      total_stay: 3,
      total_spending: 6500000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tamu: "TAM0004",
      full_name: "Hendra Wijaya",
      id_type: "ktp",
      id_number: "3171021403900004",
      nationality: "Indonesia",
      email: "hendra.wijaya@outlook.com",
      phone: "085712348899",
      is_vip: 0,
      is_blacklisted: 0,
      total_stay: 1,
      total_spending: 850000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tamu: "TAM0005",
      full_name: "PT Pertamina Delegasi",
      id_type: "other",
      id_number: "CORP-PERT-2026",
      nationality: "Indonesia",
      email: "events@pertamina.com",
      phone: "021-3815111",
      is_vip: 1,
      is_blacklisted: 0,
      total_stay: 10,
      total_spending: 25000000.0,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // Ambil ID user pertama untuk relasi kasir dan task
  const firstUser = await knex("mst_user").orderBy("id", "asc").first();
  const activeUserId = firstUser ? firstUser.id : 1;

  // ─── 20. Shift Kasir Aktif (/kasir_shift) ───────────────────────────────────
  console.log("  💳 Seeding Shift Kasir Aktif...");
  await knex("trx_cashier_shift").insert([
    {
      kode_cashier_shift: "SFT0001",
      kode_cabang: "CAB0001",
      kode_cashier_counter: "CTR0001",
      user_id: activeUserId,
      opening_cash: 1000000.0,
      status: "open",
      opened_at: dDatetimeIso,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 21. Housekeeping Task (/housekeeping/room_status_board) ────────────────
  console.log("  🧹 Seeding Housekeeping Task...");
  await knex("trx_housekeeping_task").insert([
    {
      kode_housekeeping_task: "TSK0001",
      kode_cabang: "CAB0001",
      kode_kamar: "KAM0003",
      task_type: "cleaning",
      assigned_to: activeUserId,
      priority: "normal",
      status: "assigned",
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  // ─── 22. Transaksi Reservasi & Checkin (Demo Data Relevan) ───────────────────
  console.log("  🛎️  Seeding Transaksi Reservasi, Check-in & Folio...");

  // Reservasi 1: TAMU MENGINAP (In-House) #1 — Budi Santoso di Kamar 201
  await knex("trx_reservation").insert({
    kode_cabang: "CAB0001",
    kode_reservasi: "RSV0001",
    booking_type: "walk_in",
    kode_guest: "TAM0001",
    check_in_date: dToday,
    check_out_date: dTomorrow,
    guest_count: 2,
    deposit_amount: 500000.0,
    special_request: "Kamar bebas rokok, dekat lift",
    status: "checked_in",
    source_channel: "walk_in",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_reservation_room").insert({
    kode_reservasi_room: "RRO0001",
    kode_reservation: "RSV0001",
    kode_tipe_kamar: "TIP0002",
    kode_rate_plan: "RP-002",
    kode_kamar: "KAM0004", // Kamar 201
    room_preference: "High Floor",
    rate_per_night: 970000.0,
    nights: 1,
    status: "checked_in",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
    version: 1,
  });

  await knex("trx_checkin").insert({
    kode_checkin: "CHK0001",
    kode_reservation_room: "RRO0001",
    vehicle_plate: "AE 1234 BZ",
    checkin_by: activeUserId,
    checkin_at: dDatetimeIso,
    early_checkin: 0,
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_folio").insert({
    kode_cabang: "CAB0001",
    kode_folio: "FOL0001",
    kode_reservation: "RSV0001",
    folio_owner_type: "guest",
    status: "open",
    subtotal: 1015000.0,
    tax_amount: 101500.0,
    service_charge_amount: 50750.0,
    grand_total: 1167250.0,
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_folio_charge").insert([
    {
      kode_folio_charge: "FCH0001",
      kode_folio: "FOL0001",
      charge_type: "room",
      description: "Room Charge - Deluxe Room (Bed & Breakfast)",
      qty: 1.0,
      unit_price: 970000.0,
      amount: 970000.0,
      posted_by: activeUserId,
      posted_at: dDatetimeIso,
      created_at: dDatetimeIso,
      is_active: 1,
    },
    {
      kode_folio_charge: "FCH0002",
      kode_folio: "FOL0001",
      charge_type: "laundry",
      description: "Express Laundry Service",
      qty: 1.0,
      unit_price: 45000.0,
      amount: 45000.0,
      posted_by: activeUserId,
      posted_at: dDatetimeIso,
      created_at: dDatetimeIso,
      is_active: 1,
    },
  ]);

  await knex("trx_payment").insert({
    kode_payment: "PAY0001",
    kode_folio: "FOL0001",
    payment_method: "cash",
    amount: 500000.0,
    reference_no: "DEPOSIT-CASH-01",
    kode_cashier_shift: "SFT0001",
    received_by: activeUserId,
    paid_at: dDatetimeIso,
    created_at: dDatetimeIso,
    is_active: 1,
  });

  // Reservasi 2: TAMU MENGINAP (In-House) #2 — Johnathan Miller di Kamar 301 (Executive Suite)
  await knex("trx_reservation").insert({
    kode_cabang: "CAB0001",
    kode_reservasi: "RSV0002",
    booking_type: "individual",
    kode_guest: "TAM0003",
    check_in_date: dYesterday,
    check_out_date: dTomorrow,
    guest_count: 2,
    deposit_amount: 2000000.0,
    special_request: "Extra towels, fresh fruit basket",
    status: "checked_in",
    source_channel: "direct",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_reservation_room").insert({
    kode_reservasi_room: "RRO0002",
    kode_reservation: "RSV0002",
    kode_tipe_kamar: "TIP0003",
    kode_rate_plan: "RP-002",
    kode_kamar: "KAM0007", // Kamar 301
    room_preference: "Mountain View",
    rate_per_night: 1570000.0,
    nights: 2,
    status: "checked_in",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
    version: 1,
  });

  await knex("trx_checkin").insert({
    kode_checkin: "CHK0002",
    kode_reservation_room: "RRO0002",
    vehicle_plate: "B 8888 JHM",
    checkin_by: activeUserId,
    checkin_at: dYesterday + " 15:30:00",
    early_checkin: 0,
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_folio").insert({
    kode_cabang: "CAB0001",
    kode_folio: "FOL0002",
    kode_reservation: "RSV0002",
    folio_owner_type: "guest",
    status: "open",
    subtotal: 3140000.0,
    tax_amount: 314000.0,
    service_charge_amount: 157000.0,
    grand_total: 3611000.0,
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_folio_charge").insert({
    kode_folio_charge: "FCH0003",
    kode_folio: "FOL0002",
    charge_type: "room",
    description: "Room Charge (2 Nights) - Executive Suite",
    qty: 2.0,
    unit_price: 1570000.0,
    amount: 3140000.0,
    posted_by: activeUserId,
    posted_at: dDatetimeIso,
    created_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_payment").insert({
    kode_payment: "PAY0002",
    kode_folio: "FOL0002",
    payment_method: "card",
    amount: 2000000.0,
    reference_no: "EDC-BCA-994821",
    kode_cashier_shift: "SFT0001",
    received_by: activeUserId,
    paid_at: dYesterday + " 15:35:00",
    created_at: dDatetimeIso,
    is_active: 1,
  });

  // Reservasi 3: KEDATANGAN HARI INI (/reservasi_checkin - Arrivals) — Siti Rahmawati
  await knex("trx_reservation").insert({
    kode_cabang: "CAB0001",
    kode_reservasi: "RSV0003",
    booking_type: "individual",
    kode_guest: "TAM0002",
    check_in_date: dToday,
    check_out_date: dTomorrow,
    guest_count: 1,
    deposit_amount: 300000.0,
    special_request: "Late check-in sekitar jam 17:00",
    status: "confirmed",
    source_channel: "traveloka",
    ref_channel_booking_id: "TVLK-2026-99182",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_reservation_room").insert({
    kode_reservasi_room: "RRO0003",
    kode_reservation: "RSV0003",
    kode_tipe_kamar: "TIP0002",
    kode_rate_plan: "RP-001",
    kode_kamar: "KAM0005", // Kamar 202
    room_preference: "City View",
    rate_per_night: 850000.0,
    nights: 1,
    status: "assigned",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
    version: 1,
  });

  // Reservasi 4: BOOKING RESERVASI MASA DEPAN (/reservasi_booking) — Hendra Wijaya
  await knex("trx_reservation").insert({
    kode_cabang: "CAB0001",
    kode_reservasi: "RSV0004",
    booking_type: "individual",
    kode_guest: "TAM0004",
    check_in_date: dIn3Days,
    check_out_date: dIn5Days,
    guest_count: 2,
    deposit_amount: 0.0,
    special_request: "Twin bed",
    status: "reserved",
    source_channel: "direct",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_reservation_room").insert({
    kode_reservasi_room: "RRO0004",
    kode_reservation: "RSV0004",
    kode_tipe_kamar: "TIP0001",
    kode_rate_plan: "RP-001",
    kode_kamar: null,
    room_preference: "Quiet Room",
    rate_per_night: 550000.0,
    nights: 2,
    status: "booked",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
    version: 1,
  });

  // Reservasi 5: GROUP CORPORATE BOOKING (/reservasi_booking) — PT Pertamina
  await knex("trx_reservation").insert({
    kode_cabang: "CAB0001",
    kode_reservasi: "RSV0005",
    booking_type: "corporate",
    kode_guest: "TAM0005",
    kode_corporate_account: "COR0001",
    group_code: "GRP-PERTAMINA-01",
    check_in_date: dIn5Days,
    check_out_date: dIn7Days,
    guest_count: 10,
    deposit_amount: 5000000.0,
    special_request: "Termasuk sewa Ruang Melati untuk meeting tanggal " + dIn5Days,
    status: "confirmed",
    source_channel: "direct",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
  });

  await knex("trx_reservation_room").insert({
    kode_reservasi_room: "RRO0005",
    kode_reservation: "RSV0005",
    kode_tipe_kamar: "TIP0002",
    kode_rate_plan: "RP-003",
    kode_kamar: null,
    room_preference: "Corporate Floor",
    rate_per_night: 935000.0,
    nights: 2,
    status: "booked",
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso,
    is_active: 1,
    version: 1,
  });

  // ─── 23. Format Penomoran (sys_format_penomoran) ─────────────────────────────
  console.log("  🔢 Seeding Format Penomoran Sistem...");
  await knex("sys_format_penomoran").insert([
    { kode_format: "FMT-AMENITY",       nama_tabel: "mst_amenity",            prefix: "AME", panjang_digit: 4, nomor_terakhir: 8, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-BEDTYPE",       nama_tabel: "mst_bed_type",           prefix: "BED", panjang_digit: 4, nomor_terakhir: 4, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-CABANG",        nama_tabel: "mst_cabang",             prefix: "CAB", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-CORPORATE",     nama_tabel: "mst_corporate_account",  prefix: "COR", panjang_digit: 4, nomor_terakhir: 4, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-FASILITAS",     nama_tabel: "mst_fasilitas",          prefix: "FAS", panjang_digit: 4, nomor_terakhir: 6, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-GEDUNG",        nama_tabel: "mst_gedung",             prefix: "GED", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-HARGAKAMAR",    nama_tabel: "mst_rate_plan_price",    prefix: "HAR", panjang_digit: 4, nomor_terakhir: 7, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-HRGRUANGEVENT", nama_tabel: "mst_harga_ruang_event",  prefix: "HRG", panjang_digit: 4, nomor_terakhir: 5, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-KAMAR",         nama_tabel: "mst_kamar",              prefix: "KAM", panjang_digit: 4, nomor_terakhir: 9, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-LANTAI",        nama_tabel: "mst_lantai",             prefix: "LAN", panjang_digit: 4, nomor_terakhir: 4, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-PAJAK",         nama_tabel: "mst_tax",                prefix: "PAJ", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RATEPLAN",      nama_tabel: "mst_paket_harga",        prefix: "RP",  panjang_digit: 3, nomor_terakhir: 4, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RTA",           nama_tabel: "mst_room_type_amenity",  prefix: "RTA", panjang_digit: 4, nomor_terakhir: 15, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RUANGEVENT",    nama_tabel: "mst_ruang_event",        prefix: "RUA", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-SEASON",        nama_tabel: "mst_musim",              prefix: "SEA", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-TIPEKAMAR",     nama_tabel: "mst_tipe_kamar",         prefix: "TIP", panjang_digit: 4, nomor_terakhir: 4, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-TIPERUANGEVENT",nama_tabel: "mst_tipe_ruang_event",   prefix: "TRE", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-USR",           nama_tabel: "mst_user",               prefix: "USR", panjang_digit: 4, nomor_terakhir: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-TAMU",          nama_tabel: "mst_guest",              prefix: "TAM", panjang_digit: 4, nomor_terakhir: 5, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RESERVASI",     nama_tabel: "trx_reservation",        prefix: "RSV", panjang_digit: 4, nomor_terakhir: 5, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RESROOM",       nama_tabel: "trx_reservation_room",   prefix: "RRO", panjang_digit: 4, nomor_terakhir: 5, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-CHECKIN",       nama_tabel: "trx_checkin",            prefix: "CHK", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-FOLIO",         nama_tabel: "trx_folio",              prefix: "FOL", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-FOLIOCHARGE",   nama_tabel: "trx_folio_charge",       prefix: "FCH", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-PAYMENT",       nama_tabel: "trx_payment",            prefix: "PAY", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-COUNTER",       nama_tabel: "mst_cashier_counter",    prefix: "CTR", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-SHIFT",         nama_tabel: "trx_cashier_shift",      prefix: "SFT", panjang_digit: 4, nomor_terakhir: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-TASK",          nama_tabel: "trx_housekeeping_task",  prefix: "TSK", panjang_digit: 4, nomor_terakhir: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
  ]);

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Seeding selesai! Seluruh menu siap didemokan.       ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
}
