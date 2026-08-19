import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  const dDatetimeIso = formatDateSystem();
  
  // Clean up existing data to avoid unique constraint errors
  // Order matters due to foreign key relationships (even though we don't enforce them via foreign keys in knex, the logical dependencies matter for cleanup)
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

  const hotelCode = "HTL-001";
  
  // 1. Hotel
  await knex("mst_cabang").insert({
    kode: hotelCode,
    nama_hotel: "Hotel Grand Marstech",
    waktu_checkin: "14:00:00",
    waktu_checkout: "12:00:00",
    mata_uang: "IDR",
    zona_waktu: "Asia/Jakarta",
    is_pkp: 1,
    is_active: 1,
    created_at: dDatetimeIso,
    updated_at: dDatetimeIso
  });

  // 2. Gedung
  const gedungA = "GDG-001";
  const gedungB = "GDG-002";
  await knex("mst_gedung").insert([
    {
      kode: gedungA,
      kode_cabang: hotelCode,
      nama_gedung: "Tower A",
      is_active: 1,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso
    },
    {
      kode: gedungB,
      kode_cabang: hotelCode,
      nama_gedung: "Tower B",
      is_active: 1,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso
    }
  ]);

  // 3. Lantai
  const lantai1A = "LNT-001";
  const lantai2A = "LNT-002";
  const lantai1B = "LNT-003";
  await knex("mst_lantai").insert([
    { kode: lantai1A, kode_gedung: gedungA, nama_lantai: "Lantai 1 Tower A", nomor_lantai: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: lantai2A, kode_gedung: gedungA, nama_lantai: "Lantai 2 Tower A", nomor_lantai: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: lantai1B, kode_gedung: gedungB, nama_lantai: "Lantai 1 Tower B", nomor_lantai: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 4. Tipe Kamar
  const tipeStd = "TYP-001";
  const tipeDlx = "TYP-002";
  const tipeSut = "TYP-003";
  await knex("mst_tipe_kamar").insert([
    { kode: tipeStd, kode_cabang: hotelCode, nama_tipe: "Standard Room", kapasitas_dasar: 2, kapasitas_maksimal: 3, luas_sqm: 24, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: tipeDlx, kode_cabang: hotelCode, nama_tipe: "Deluxe Room", kapasitas_dasar: 2, kapasitas_maksimal: 4, luas_sqm: 32, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: tipeSut, kode_cabang: hotelCode, nama_tipe: "Suite Room", kapasitas_dasar: 2, kapasitas_maksimal: 4, luas_sqm: 64, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 5. Bed Type
  const bedSgl = "BTY-001";
  const bedDbl = "BTY-002";
  const bedKng = "BTY-003";
  await knex("mst_bed_type").insert([
    { kode: bedSgl, name: "Single Bed", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: bedDbl, name: "Double Bed", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: bedKng, name: "King Bed", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 6. Amenity
  await knex("mst_amenity").insert([
    { kode: "AMN-001", name: "Free WiFi", icon: "pi pi-wifi", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "AMN-002", name: "Air Conditioning", icon: "pi pi-box", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "AMN-003", name: "Minibar", icon: "pi pi-wallet", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 7. Fasilitas
  await knex("mst_fasilitas").insert([
    { kode: "FAS-001", kode_cabang: hotelCode, name: "Kolam Renang", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "FAS-002", kode_cabang: hotelCode, name: "Gym", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "FAS-003", kode_cabang: hotelCode, name: "Spa", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 8. Kamar (10 Rooms spread out)
  const roomsToInsert = [
    { kode: "KMR-101", kode_cabang: hotelCode, kode_lantai: lantai1A, kode_tipe_kamar: tipeStd, kode_bed_type: bedSgl, nomor_kamar: "101", tipe_pemandangan: "city", status_kamar: "vacant_clean", is_active: 1 },
    { kode: "KMR-102", kode_cabang: hotelCode, kode_lantai: lantai1A, kode_tipe_kamar: tipeStd, kode_bed_type: bedDbl, nomor_kamar: "102", tipe_pemandangan: "garden", status_kamar: "vacant_clean", is_active: 1 },
    { kode: "KMR-103", kode_cabang: hotelCode, kode_lantai: lantai1A, kode_tipe_kamar: tipeDlx, kode_bed_type: bedKng, nomor_kamar: "103", tipe_pemandangan: "pool", status_kamar: "vacant_clean", is_active: 1 },
    { kode: "KMR-201", kode_cabang: hotelCode, kode_lantai: lantai2A, kode_tipe_kamar: tipeDlx, kode_bed_type: bedDbl, nomor_kamar: "201", tipe_pemandangan: "city", status_kamar: "vacant_clean", is_active: 1 },
    { kode: "KMR-202", kode_cabang: hotelCode, kode_lantai: lantai2A, kode_tipe_kamar: tipeSut, kode_bed_type: bedKng, nomor_kamar: "202", tipe_pemandangan: "pool", status_kamar: "vacant_dirty", is_active: 1 },
    { kode: "KMR-301", kode_cabang: hotelCode, kode_lantai: lantai1B, kode_tipe_kamar: tipeStd, kode_bed_type: bedSgl, nomor_kamar: "B-301", tipe_pemandangan: "city", status_kamar: "vacant_clean", is_active: 1 },
    { kode: "KMR-302", kode_cabang: hotelCode, kode_lantai: lantai1B, kode_tipe_kamar: tipeDlx, kode_bed_type: bedDbl, nomor_kamar: "B-302", tipe_pemandangan: "garden", status_kamar: "vacant_clean", is_active: 1 },
    { kode: "KMR-303", kode_cabang: hotelCode, kode_lantai: lantai1B, kode_tipe_kamar: tipeSut, kode_bed_type: bedKng, nomor_kamar: "B-303", tipe_pemandangan: "pool", status_kamar: "cleaning", is_active: 1 },
  ].map(r => ({ ...r, created_at: dDatetimeIso, updated_at: dDatetimeIso }));
  
  await knex("mst_kamar").insert(roomsToInsert);

  // 9. Paket Harga (Rate Plan)
  await knex("mst_paket_harga").insert([
    { kode: "RP-001", kode_cabang: hotelCode, nama_paket: "Room Only (RO)", tipe_paket: "bar", dapat_di_refund: 1, termasuk_sarapan: 0, minimal_malam: 1, maksimal_malam: null, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "RP-002", kode_cabang: hotelCode, nama_paket: "Bed & Breakfast (BB)", tipe_paket: "bar", dapat_di_refund: 1, termasuk_sarapan: 1, minimal_malam: 1, maksimal_malam: null, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "RP-003", kode_cabang: hotelCode, nama_paket: "Corporate Package", tipe_paket: "corporate", dapat_di_refund: 0, termasuk_sarapan: 1, minimal_malam: 2, maksimal_malam: null, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
  ]);

  // 10. Config
  await knex("config").insert([
    { kode: "msNamaPerusahaan", keterangan: "Hotel Grand Marstech", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msSubNamaPerusahaan", keterangan: "Marstech Group", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msAlamatPerusahaan", keterangan: "Jl. Teknologi No. 1, Jakarta", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msKotaPerusahaan", keterangan: "Jakarta", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msTeleponPerusahaan", keterangan: "021-1234567", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msNamaPimpinan", keterangan: "Direktur Utama", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msLogoPerusahaan", keterangan: "", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msCatatanKasir", keterangan: "Terima kasih atas kunjungan Anda", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msPPN", keterangan: "11", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "nominalPoint", keterangan: "10000", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode: "msVideoDisplay", keterangan: "", tz: "Asia/Jakarta", created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);
};
