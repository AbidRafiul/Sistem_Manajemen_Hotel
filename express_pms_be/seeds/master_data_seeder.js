import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  const dDatetimeIso = formatDateSystem();
  
  // Clean up existing data to avoid unique constraint errors
  // Order matters due to foreign key relationships
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0;');
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
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1;');

  const hotelCode = "HTL-001";
  
  // 1. Hotel
  await knex("mst_cabang").insert({
    kode_cabang: hotelCode,
    nama_hotel: "Hotel Grand Marstech",
    waktu_checkin: "14:00:00",
    waktu_checkout: "12:00:00",
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
      kode_gedung: gedungA,
      kode_cabang: hotelCode,
      nama_gedung: "Tower A",
      is_active: 1,
      created_at: dDatetimeIso,
      updated_at: dDatetimeIso
    },
    {
      kode_gedung: gedungB,
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
    { kode_lantai: lantai1A, kode_gedung: gedungA, nama_lantai: "Lantai 1 Tower A", nomor_lantai: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_lantai: lantai2A, kode_gedung: gedungA, nama_lantai: "Lantai 2 Tower A", nomor_lantai: 2, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_lantai: lantai1B, kode_gedung: gedungB, nama_lantai: "Lantai 1 Tower B", nomor_lantai: 1, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 4. Tipe Kamar
  const tipeStd = "TYP-001";
  const tipeDlx = "TYP-002";
  const tipeSut = "TYP-003";
  await knex("mst_tipe_kamar").insert([
    { kode_tipe_kamar: tipeStd, kode_cabang: hotelCode, nama_tipe: "Standard Room", kapasitas_dasar: 2, kapasitas_maksimal: 3, luas_sqm: 24, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_tipe_kamar: tipeDlx, kode_cabang: hotelCode, nama_tipe: "Deluxe Room", kapasitas_dasar: 2, kapasitas_maksimal: 4, luas_sqm: 32, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_tipe_kamar: tipeSut, kode_cabang: hotelCode, nama_tipe: "Suite Room", kapasitas_dasar: 2, kapasitas_maksimal: 4, luas_sqm: 64, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 5. Bed Type
  const bedSgl = "BTY-001";
  const bedDbl = "BTY-002";
  const bedKng = "BTY-003";
  await knex("mst_bed_type").insert([
    { kode_bed_type: bedSgl, name: "Single Bed", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_bed_type: bedDbl, name: "Double Bed", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_bed_type: bedKng, name: "King Bed", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  await knex("mst_amenity").insert([
    { kode_amenity: "AMN-001", name: "Free WiFi", icon: "pi pi-wifi", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_amenity: "AMN-002", name: "Air Conditioning", icon: "pi pi-box", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_amenity: "AMN-003", name: "Minibar", icon: "pi pi-wallet", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  await knex("mst_fasilitas").insert([
    { kode_fasilitas: "FAS-001", kode_cabang: hotelCode, name: "Kolam Renang", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_fasilitas: "FAS-002", kode_cabang: hotelCode, name: "Gym", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_fasilitas: "FAS-003", kode_cabang: hotelCode, name: "Spa", is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso }
  ]);

  // 8. Kamar (10 Rooms spread out)
  const roomsToInsert = [
    { kode_kamar: "KMR-101", kode_cabang: hotelCode, kode_gedung: gedungA, kode_lantai: lantai1A, kode_tipe_kamar: tipeStd, nomor_kamar: "101", tipe_pemandangan: "city", occupancy_status: "vacant", housekeeping_status: "clean", is_active: 1 },
    { kode_kamar: "KMR-102", kode_cabang: hotelCode, kode_gedung: gedungA, kode_lantai: lantai1A, kode_tipe_kamar: tipeStd, nomor_kamar: "102", tipe_pemandangan: "garden", occupancy_status: "vacant", housekeeping_status: "clean", is_active: 1 },
    { kode_kamar: "KMR-103", kode_cabang: hotelCode, kode_gedung: gedungA, kode_lantai: lantai1A, kode_tipe_kamar: tipeDlx, nomor_kamar: "103", tipe_pemandangan: "pool", occupancy_status: "vacant", housekeeping_status: "clean", is_active: 1 },
    { kode_kamar: "KMR-201", kode_cabang: hotelCode, kode_gedung: gedungA, kode_lantai: lantai2A, kode_tipe_kamar: tipeDlx, nomor_kamar: "201", tipe_pemandangan: "city", occupancy_status: "vacant", housekeeping_status: "clean", is_active: 1 },
    { kode_kamar: "KMR-202", kode_cabang: hotelCode, kode_gedung: gedungA, kode_lantai: lantai2A, kode_tipe_kamar: tipeSut, nomor_kamar: "202", tipe_pemandangan: "pool", occupancy_status: "vacant", housekeeping_status: "dirty", is_active: 1 },
    { kode_kamar: "KMR-301", kode_cabang: hotelCode, kode_gedung: gedungB, kode_lantai: lantai1B, kode_tipe_kamar: tipeStd, nomor_kamar: "B-301", tipe_pemandangan: "city", occupancy_status: "vacant", housekeeping_status: "clean", is_active: 1 },
    { kode_kamar: "KMR-302", kode_cabang: hotelCode, kode_gedung: gedungB, kode_lantai: lantai1B, kode_tipe_kamar: tipeDlx, nomor_kamar: "B-302", tipe_pemandangan: "garden", occupancy_status: "vacant", housekeeping_status: "clean", is_active: 1 },
    { kode_kamar: "KMR-303", kode_cabang: hotelCode, kode_gedung: gedungB, kode_lantai: lantai1B, kode_tipe_kamar: tipeSut, nomor_kamar: "B-303", tipe_pemandangan: "pool", occupancy_status: "vacant", housekeeping_status: "maintenance", is_active: 1 },
  ].map(r => ({ ...r, created_at: dDatetimeIso, updated_at: dDatetimeIso }));
  
  await knex("mst_kamar").insert(roomsToInsert);

  // 9. Paket Harga (Rate Plan)
  await knex("mst_paket_harga").insert([
    { kode_paket_harga: "RP-001", kode_cabang: hotelCode, nama_paket: "Room Only (RO)", tipe_paket: "RO", tipe_markup: "nominal", nilai_markup: 0, dapat_di_refund: 1, termasuk_sarapan: 0, minimal_malam: 1, maksimal_malam: null, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_paket_harga: "RP-002", kode_cabang: hotelCode, nama_paket: "Bed & Breakfast (BB)", tipe_paket: "BB", tipe_markup: "nominal", nilai_markup: 150000, dapat_di_refund: 1, termasuk_sarapan: 1, minimal_malam: 1, maksimal_malam: null, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
    { kode_paket_harga: "RP-003", kode_cabang: hotelCode, nama_paket: "Corporate Package", tipe_paket: "BB", tipe_markup: "persen", nilai_markup: 10, dapat_di_refund: 0, termasuk_sarapan: 1, minimal_malam: 2, maksimal_malam: null, is_active: 1, created_at: dDatetimeIso, updated_at: dDatetimeIso },
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

  // 11. Format Penomoran
  await knex("sys_format_penomoran").del();
  await knex("sys_format_penomoran").insert([
    {"kode_format":"FMT-AMENITY","nama_tabel":"mst_amenity","prefix":"AME","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-BEDTYPE","nama_tabel":"mst_bedtype","prefix":"BED","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-CABANG","nama_tabel":"mst_cabang","prefix":"CAB","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-CORPORATE","nama_tabel":"mst_corporate","prefix":"COR","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-GEDUNG","nama_tabel":"mst_gedung","prefix":"GED","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-HARGAKAMAR","nama_tabel":"mst_hargakamar","prefix":"HAR","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-HRGRUANGEVENT","nama_tabel":"mst_hrgruangevent","prefix":"HRG","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-KAMAR","nama_tabel":"mst_kamar","prefix":"KAM","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-LANTAI","nama_tabel":"mst_lantai","prefix":"LAN","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-PAJAK","nama_tabel":"mst_pajak","prefix":"PAJ","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-RATEPLAN","nama_tabel":"mst_rateplan","prefix":"RAT","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-RTA","nama_tabel":"mst_rta","prefix":"RTA","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-RUANGEVENT","nama_tabel":"mst_ruangevent","prefix":"RUA","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-SEASON","nama_tabel":"mst_season","prefix":"SEA","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-TIPEKAMAR","nama_tabel":"mst_tipekamar","prefix":"TIP","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-TIPERUANGEVENT","nama_tabel":"mst_tiperuangevent","prefix":"TIP","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso},
    {"kode_format":"FMT-USR","nama_tabel":"mst_usr","prefix":"USR","panjang_digit":4,"nomor_terakhir":0,"is_active":1,"created_at":dDatetimeIso,"updated_at":dDatetimeIso}
  ]);
};
