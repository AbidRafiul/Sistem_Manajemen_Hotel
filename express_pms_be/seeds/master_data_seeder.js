/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file master_data_seeder.js
 * @description Seeder untuk data master hotel — berisi data aktual dari database.
 *              Hanya menyimpan data yang aktif (is_active = 1 / deleted_at IS NULL).
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.2
 */

import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  const dDatetimeIso = formatDateSystem();

  // ─── Hapus data lama (urutan FK: child dulu, baru parent) ───────────────────
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0;");
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
  await knex("config").del();
  await knex("sys_format_penomoran").del();
  await knex.raw("SET FOREIGN_KEY_CHECKS = 1;");

  // ─── 1. Cabang ───────────────────────────────────────────────────────────────
  await knex("mst_cabang").insert([
    {
      kode_cabang: "CAB0001",
      nama_hotel: "Cabang Magetan",
      logo_url: null,
      alamat: "Ds. Tulung Rt. 01/05 Kawedanan Magetan",
      telepon: "082338909501",
      waktu_checkin: "13:00:00",
      waktu_checkout: "12:00:00",
      zona_waktu: "Asia/Jakarta",
      is_pkp: 0,
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 2. Gedung ───────────────────────────────────────────────────────────────
  await knex("mst_gedung").insert([
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0001",
      nama_gedung: "Gedung Utama",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: "GED0002",
      nama_gedung: "Gedung Pertemuan",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 3. Lantai ───────────────────────────────────────────────────────────────
  await knex("mst_lantai").insert([
    {
      kode_gedung: "GED0001",
      kode_lantai: "LAN0001",
      nama_lantai: "Lantai Dasar",
      nomor_lantai: 1,
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_gedung: "GED0001",
      kode_lantai: "LAN0002",
      nama_lantai: "Lantai Suite",
      nomor_lantai: 1,
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_gedung: "GED0002",
      kode_lantai: "LAN0003",
      nama_lantai: "Lantai Ballroom",
      nomor_lantai: 1,
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 4. Bed Type ─────────────────────────────────────────────────────────────
  await knex("mst_bed_type").insert([
    {
      kode_bed_type: "BTY-001",
      name: "Single Bed",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_bed_type: "BTY-002",
      name: "Double Bed",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_bed_type: "BTY-003",
      name: "King Bed",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 5. Amenity ──────────────────────────────────────────────────────────────
  await knex("mst_amenity").insert([
    {
      kode_amenity: "AMN-001",
      name: "Free WiFi",
      icon: "pi pi-wifi",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-002",
      name: "Air Conditioning",
      icon: "pi pi-box",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_amenity: "AMN-003",
      name: "Minibar",
      icon: "pi pi-wallet",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 6. Fasilitas ────────────────────────────────────────────────────────────
  await knex("mst_fasilitas").insert([
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-001",
      name: "Kolam Renang",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-002",
      name: "Gym",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_fasilitas: "FAS-003",
      name: "Spa",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 7. Tipe Kamar ───────────────────────────────────────────────────────────
  await knex("mst_tipe_kamar").insert([
    {
      kode_cabang: "CAB0001",
      kode_tipe_kamar: "TIP0001",
      nama_tipe: "Regular Room",
      kapasitas_dasar: 2,
      kapasitas_maksimal: 2,
      kapasitas_ekstra: 0,
      harga_default: 850000.0,
      luas_sqm: 42.0,
      deskripsi: "",
      kode_bed_type: "BTY-001",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tipe_kamar: "TIP0002",
      nama_tipe: "Deluxe Room",
      kapasitas_dasar: 2,
      kapasitas_maksimal: 3,
      kapasitas_ekstra: 0,
      harga_default: 1350000.0,
      luas_sqm: 65.0,
      deskripsi: "",
      kode_bed_type: "BTY-003",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_tipe_kamar: "TIP0003",
      nama_tipe: "Deluxe Room - View Ocean",
      kapasitas_dasar: 2,
      kapasitas_maksimal: 3,
      kapasitas_ekstra: 0,
      harga_default: 1400000.0,
      luas_sqm: 65.0,
      deskripsi: "",
      kode_bed_type: "BTY-003",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 8. Room Type Amenity (relasi tipe kamar ↔ amenity) ─────────────────────
  await knex("mst_room_type_amenity").insert([
    { kode_rta: "RTA0001", kode_tipe_kamar: "TIP0001", kode_amenity: "AMN-001" },
    { kode_rta: "RTA0002", kode_tipe_kamar: "TIP0002", kode_amenity: "AMN-001" },
    { kode_rta: "RTA0003", kode_tipe_kamar: "TIP0003", kode_amenity: "AMN-001" },
  ]);

  // ─── 9. Room Type Fasilitas (relasi tipe kamar ↔ fasilitas) ─────────────────
  await knex("mst_room_type_fasilitas").insert([
    { kode_tipe_kamar: "TIP0002", kode_fasilitas: "FAS-001", created_at: dDatetimeIso, created_by: null },
    { kode_tipe_kamar: "TIP0002", kode_fasilitas: "FAS-003", created_at: dDatetimeIso, created_by: null },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-001", created_at: dDatetimeIso, created_by: null },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-002", created_at: dDatetimeIso, created_by: null },
    { kode_tipe_kamar: "TIP0003", kode_fasilitas: "FAS-003", created_at: dDatetimeIso, created_by: null },
  ]);

  // ─── 10. Kamar ───────────────────────────────────────────────────────────────
  await knex("mst_kamar").insert([
    {
      kode_cabang: "CAB0001",
      kode_gedung: null,
      kode_lantai: "LAN0002",
      kode_tipe_kamar: "TIP0002",
      kode_kamar: "KAM0001",
      nomor_kamar: "301",
      tipe_pemandangan: "City View",
      catatan: null,
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_gedung: null,
      kode_lantai: "LAN0002",
      kode_tipe_kamar: "TIP0003",
      kode_kamar: "KAM0002",
      nomor_kamar: "305",
      tipe_pemandangan: "Ocean View",
      catatan: null,
      boleh_merokok: 0,
      occupancy_status: "vacant",
      housekeeping_status: "clean",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 11. Paket Harga (Rate Plan) ─────────────────────────────────────────────
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
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_cabang: "CAB0001",
      kode_template: null,
      kode_paket_harga: "RP-002",
      nama_paket: "Bed & Breakfast (BB)",
      tipe_paket: "BB",
      tipe_markup: "nominal",
      nilai_markup: 150000.0,
      dapat_di_refund: 1,
      termasuk_sarapan: 1,
      minimal_malam: 1,
      maksimal_malam: null,
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
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
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 12. Rate Plan Price ─────────────────────────────────────────────────────
  await knex("mst_rate_plan_price").insert([
    {
      kode_harga_price: "HAR0001",
      kode_tipe_kamar: "TIP0002",
      kode_rate_plan: "RP-001",
      kode_season: null,
      price: 1350000.0,
      extra_bed_price: 150000.0,
      valid_from: "2026-09-01",
      valid_to: "2026-09-30",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0002",
      kode_tipe_kamar: "TIP0003",
      kode_rate_plan: "RP-002",
      kode_season: null,
      price: 1550000.0,
      extra_bed_price: 150000.0,
      valid_from: "2026-09-01",
      valid_to: "2026-09-30",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
    {
      kode_harga_price: "HAR0004",
      kode_tipe_kamar: "TIP0003",
      kode_rate_plan: "RP-001",
      kode_season: null,
      price: 1400000.0,
      extra_bed_price: 150000.0,
      valid_from: "2026-09-01",
      valid_to: "2026-09-30",
      created_by: null,
      created_at: dDatetimeIso,
      updated_by: null,
      updated_at: dDatetimeIso,
      deleted_by: null,
      deleted_at: null,
      is_active: 1,
    },
  ]);

  // ─── 13. Config ──────────────────────────────────────────────────────────────
  await knex("config").insert([
    { kode: "msNamaPerusahaan",    keterangan: "Hotel Grand Marstech",            tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msSubNamaPerusahaan", keterangan: "Marstech Group",                  tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msAlamatPerusahaan",  keterangan: "Jl. Teknologi No. 1, Jakarta",    tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msKotaPerusahaan",    keterangan: "Jakarta",                         tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msTeleponPerusahaan", keterangan: "021-1234567",                     tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msNamaPimpinan",      keterangan: "Direktur Utama",                  tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msLogoPerusahaan",    keterangan: "",                                tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msCatatanKasir",      keterangan: "Terima kasih atas kunjungan Anda", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msPPN",               keterangan: "11",                              tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "nominalPoint",        keterangan: "10000",                           tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msVideoDisplay",      keterangan: "",                                tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
  ]);

  // ─── 14. Format Penomoran ────────────────────────────────────────────────────
  // nomor_terakhir mencerminkan kondisi aktual di database
  await knex("sys_format_penomoran").insert([
    { kode_format: "FMT-AMENITY",       nama_tabel: "mst_amenity",       prefix: "AME", panjang_digit: 4, nomor_terakhir: 0, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-BEDTYPE",       nama_tabel: "mst_bedtype",       prefix: "BED", panjang_digit: 4, nomor_terakhir: 0, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-CABANG",        nama_tabel: "mst_cabang",        prefix: "CAB", panjang_digit: 4, nomor_terakhir: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-CORPORATE",     nama_tabel: "mst_corporate",     prefix: "COR", panjang_digit: 4, nomor_terakhir: 0, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-GEDUNG",        nama_tabel: "mst_gedung",        prefix: "GED", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-HARGAKAMAR",    nama_tabel: "mst_hargakamar",    prefix: "HAR", panjang_digit: 4, nomor_terakhir: 4, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-HRGRUANGEVENT", nama_tabel: "mst_hrgruangevent", prefix: "HRG", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-KAMAR",         nama_tabel: "mst_kamar",         prefix: "KAM", panjang_digit: 4, nomor_terakhir: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-LANTAI",        nama_tabel: "mst_lantai",        prefix: "LAN", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-PAJAK",         nama_tabel: "mst_pajak",         prefix: "PAJ", panjang_digit: 4, nomor_terakhir: 0, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RATEPLAN",      nama_tabel: "mst_rateplan",      prefix: "RAT", panjang_digit: 4, nomor_terakhir: 0, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RTA",           nama_tabel: "mst_rta",           prefix: "RTA", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-RUANGEVENT",    nama_tabel: "mst_ruangevent",    prefix: "RUA", panjang_digit: 4, nomor_terakhir: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-SEASON",        nama_tabel: "mst_season",        prefix: "SEA", panjang_digit: 4, nomor_terakhir: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-TIPEKAMAR",     nama_tabel: "mst_tipekamar",     prefix: "TIP", panjang_digit: 4, nomor_terakhir: 3, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-TIPERUANGEVENT",nama_tabel: "mst_tiperuangevent",prefix: "TIP", panjang_digit: 4, nomor_terakhir: 0, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_format: "FMT-USR",           nama_tabel: "mst_usr",           prefix: "USR", panjang_digit: 4, nomor_terakhir: 0, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
  ]);
}
