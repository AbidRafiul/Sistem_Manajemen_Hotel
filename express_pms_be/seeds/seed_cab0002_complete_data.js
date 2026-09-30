/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file seed_cab0002_complete_data.js
 * @description Seeder komprehensif untuk data master dan operasional cabang CAB0002 (Grand Marstech Resort & Spa Batu)
 */

import DB from "../core/config/knex.js";
import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  console.log("=====================================================================");
  console.log(" STARTING SEEDING FOR CAB0002 (Grand Marstech Resort & Spa Batu)");
  console.log("=====================================================================");

  const tNow = formatDateSystem();
  const today = new Date();
  const todayStr = formatDateSystem(today, "yyyy-MM-dd");

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateSystem(yesterday, "yyyy-MM-dd");

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = formatDateSystem(twoDaysAgo, "yyyy-MM-dd");

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateSystem(tomorrow, "yyyy-MM-dd");

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysLaterStr = formatDateSystem(threeDaysLater, "yyyy-MM-dd");

  await DB.transaction(async (trx) => {
    // -------------------------------------------------------------
    // 1. MASTER GEDUNG (3 Gedung)
    // -------------------------------------------------------------
    console.log("▶ [1/14] Seeding mst_gedung...");
    const gedungs = [
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        nama_gedung: "Resort Wing Panderman",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B02",
        nama_gedung: "Villa Complex Arjuna",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B03",
        nama_gedung: "Wellness & Spa Pavillion",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const g of gedungs) {
      const exist = await trx("mst_gedung").where("kode_gedung", g.kode_gedung).first();
      if (!exist) {
        await trx("mst_gedung").insert(g);
      }
    }

    // -------------------------------------------------------------
    // 2. MASTER LANTAI (4 Lantai)
    // -------------------------------------------------------------
    console.log("▶ [2/14] Seeding mst_lantai...");
    const lantais = [
      {
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B01",
        nama_lantai: "Lantai 1 (Lobby & Garden Suite)",
        nomor_lantai: 1,
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B02",
        nama_lantai: "Lantai 2 (Mountain View Wing)",
        nomor_lantai: 2,
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B03",
        nama_lantai: "Lantai 3 (Penthouse Level)",
        nomor_lantai: 3,
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_gedung: "GED-B02",
        kode_lantai: "LAN-B04",
        nama_lantai: "Villa Enclave (Private Pool)",
        nomor_lantai: 1,
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const l of lantais) {
      const exist = await trx("mst_lantai").where("kode_lantai", l.kode_lantai).first();
      if (!exist) {
        await trx("mst_lantai").insert(l);
      }
    }

    // -------------------------------------------------------------
    // 3. MASTER TIPE KAMAR (4 Tipe Kamar)
    // -------------------------------------------------------------
    console.log("▶ [3/14] Seeding mst_tipe_kamar...");
    const tipeKamars = [
      {
        kode_cabang: "CAB0002",
        kode_tipe_kamar: "TIP-B01",
        nama_tipe: "Deluxe Mountain View",
        kapasitas_dasar: 2,
        kapasitas_maksimal: 3,
        kapasitas_ekstra: 1,
        harga_default: "750000.00",
        luas_sqm: "38.00",
        deskripsi: "Kamar luas dengan panorama langsung menghadap Gunung Panderman, dilengkapi balkon pribadi dan udara sejuk Kota Batu.",
        kode_bed_type: "BTY-002",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_tipe_kamar: "TIP-B02",
        nama_tipe: "Grand Resort Suite",
        kapasitas_dasar: 2,
        kapasitas_maksimal: 4,
        kapasitas_ekstra: 2,
        harga_default: "1250000.00",
        luas_sqm: "55.00",
        deskripsi: "Suite mewah dengan ruang tamu terpisah, bathtub pemandangan bukit, minibar lengkap, dan fasilitas premium resort.",
        kode_bed_type: "BTY-003",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_tipe_kamar: "TIP-B03",
        nama_tipe: "Executive Mountain Villa",
        kapasitas_dasar: 4,
        kapasitas_maksimal: 6,
        kapasitas_ekstra: 2,
        harga_default: "2200000.00",
        luas_sqm: "110.00",
        deskripsi: "Villa eksklusif dua kamar tidur dengan private heated dip pool, dapur pribadi, dan taman santai keluarga.",
        kode_bed_type: "BTY-003",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_tipe_kamar: "TIP-B04",
        nama_tipe: "Presidential Batu Penthouse",
        kapasitas_dasar: 4,
        kapasitas_maksimal: 6,
        kapasitas_ekstra: 2,
        harga_default: "3800000.00",
        luas_sqm: "160.00",
        deskripsi: "Lantai puncak eksklusif dengan pemandangan 360 derajat Kota Batu dan Gunung Arjuna, jacuzzi rooftop pribadi, dan layanan butler 24 jam.",
        kode_bed_type: "BTY-003",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const tk of tipeKamars) {
      const exist = await trx("mst_tipe_kamar").where("kode_tipe_kamar", tk.kode_tipe_kamar).first();
      if (!exist) {
        await trx("mst_tipe_kamar").insert(tk);
      }
    }

    // -------------------------------------------------------------
    // 4. MASTER TIPE KAMAR FOTO
    // -------------------------------------------------------------
    console.log("▶ [4/14] Seeding mst_tipe_kamar_foto...");
    const fotos = [
      {
        kode_tipe_kamar: "TIP-B01",
        foto_url: "foto_deluxe_mountain_interior.jpg",
        urutan: 1,
        is_cover: 1,
        is_active: 1,
        created_at: tNow,
      },
      {
        kode_tipe_kamar: "TIP-B01",
        foto_url: "foto_deluxe_mountain_balcony.jpg",
        urutan: 2,
        is_cover: 0,
        is_active: 1,
        created_at: tNow,
      },
      {
        kode_tipe_kamar: "TIP-B02",
        foto_url: "foto_grand_resort_suite_living.jpg",
        urutan: 1,
        is_cover: 1,
        is_active: 1,
        created_at: tNow,
      },
      {
        kode_tipe_kamar: "TIP-B03",
        foto_url: "foto_executive_villa_pool.jpg",
        urutan: 1,
        is_cover: 1,
        is_active: 1,
        created_at: tNow,
      },
      {
        kode_tipe_kamar: "TIP-B04",
        foto_url: "foto_presidential_penthouse_sky.jpg",
        urutan: 1,
        is_cover: 1,
        is_active: 1,
        created_at: tNow,
      },
    ];

    for (const f of fotos) {
      const exist = await trx("mst_tipe_kamar_foto")
        .where("kode_tipe_kamar", f.kode_tipe_kamar)
        .andWhere("foto_url", f.foto_url)
        .first();
      if (!exist) {
        await trx("mst_tipe_kamar_foto").insert(f);
      }
    }

    // -------------------------------------------------------------
    // 5. MASTER KAMAR FISIK (12 Kamar)
    // -------------------------------------------------------------
    console.log("▶ [5/14] Seeding mst_kamar (12 physical rooms)...");
    const kamars = [
      // Lantai 1: Deluxe Mountain View (101, 102, 103, 104)
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B01",
        kode_tipe_kamar: "TIP-B01",
        kode_kamar: "KAM-B101",
        nomor_kamar: "101",
        tipe_pemandangan: "Garden & Pool View",
        catatan: "Dekat akses lobby utama",
        boleh_merokok: 0,
        occupancy_status: "vacant",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B01",
        kode_tipe_kamar: "TIP-B01",
        kode_kamar: "KAM-B102",
        nomor_kamar: "102",
        tipe_pemandangan: "Garden View",
        catatan: "Perlu pembersihan berkala",
        boleh_merokok: 0,
        occupancy_status: "vacant",
        housekeeping_status: "dirty",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B01",
        kode_tipe_kamar: "TIP-B01",
        kode_kamar: "KAM-B103",
        nomor_kamar: "103",
        tipe_pemandangan: "Pool View",
        catatan: "Kamar tenang",
        boleh_merokok: 0,
        occupancy_status: "vacant",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B01",
        kode_tipe_kamar: "TIP-B01",
        kode_kamar: "KAM-B104",
        nomor_kamar: "104",
        tipe_pemandangan: "Garden View",
        catatan: "Sedang diinspeksi supervisor",
        boleh_merokok: 0,
        occupancy_status: "vacant",
        housekeeping_status: "inspection",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },

      // Lantai 2: Deluxe Mountain View & Grand Suite (201, 202, 203, 204)
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B02",
        kode_tipe_kamar: "TIP-B01",
        kode_kamar: "KAM-B201",
        nomor_kamar: "201",
        tipe_pemandangan: "Panderman Mountain View",
        catatan: "Occupied by Irwan Setiawan (PT Petrokimia)",
        boleh_merokok: 0,
        occupancy_status: "occupied",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B02",
        kode_tipe_kamar: "TIP-B02",
        kode_kamar: "KAM-B202",
        nomor_kamar: "202",
        tipe_pemandangan: "Panderman Mountain View",
        catatan: "Reserved untuk kedatangan hari ini (Ibu Maya Anggraini)",
        boleh_merokok: 0,
        occupancy_status: "vacant",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B02",
        kode_tipe_kamar: "TIP-B02",
        kode_kamar: "KAM-B203",
        nomor_kamar: "203",
        tipe_pemandangan: "Resort Valley View",
        catatan: "Sedang dibersihkan tim HK",
        boleh_merokok: 0,
        occupancy_status: "vacant",
        housekeeping_status: "dirty",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B02",
        kode_tipe_kamar: "TIP-B02",
        kode_kamar: "KAM-B204",
        nomor_kamar: "204",
        tipe_pemandangan: "Valley & Sunset View",
        catatan: "Kondisi siap huni",
        boleh_merokok: 0,
        occupancy_status: "vacant",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },

      // Lantai Villa Complex: Executive Mountain Villa (VILLA-01, VILLA-02, VILLA-03)
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B02",
        kode_lantai: "LAN-B04",
        kode_tipe_kamar: "TIP-B03",
        kode_kamar: "KAM-BV01",
        nomor_kamar: "VILLA-01",
        tipe_pemandangan: "Private Heated Pool & Hills",
        catatan: "Occupied by Hendra Pratama (Jadwal Checkout Hari Ini)",
        boleh_merokok: 1,
        occupancy_status: "occupied",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B02",
        kode_lantai: "LAN-B04",
        kode_tipe_kamar: "TIP-B03",
        kode_kamar: "KAM-BV02",
        nomor_kamar: "VILLA-02",
        tipe_pemandangan: "Private Heated Pool & Hills",
        catatan: "Tersedia untuk reservasi baru",
        boleh_merokok: 1,
        occupancy_status: "vacant",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B02",
        kode_lantai: "LAN-B04",
        kode_tipe_kamar: "TIP-B03",
        kode_kamar: "KAM-BV03",
        nomor_kamar: "VILLA-03",
        tipe_pemandangan: "Pine Forest View",
        catatan: "Perawatan rutin water filter pool",
        boleh_merokok: 1,
        occupancy_status: "vacant",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },

      // Lantai 3: Penthouse (PENTHOUSE-01)
      {
        kode_cabang: "CAB0002",
        kode_gedung: "GED-B01",
        kode_lantai: "LAN-B03",
        kode_tipe_kamar: "TIP-B04",
        kode_kamar: "KAM-BPH01",
        nomor_kamar: "PENTHOUSE-01",
        tipe_pemandangan: "360 Panoramic Mountain View",
        catatan: "Occupied by VIP Bpk. Hartono Kusuma",
        boleh_merokok: 0,
        occupancy_status: "occupied",
        housekeeping_status: "clean",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const k of kamars) {
      const exist = await trx("mst_kamar").where("kode_kamar", k.kode_kamar).first();
      if (!exist) {
        await trx("mst_kamar").insert(k);
      } else {
        await trx("mst_kamar").where("kode_kamar", k.kode_kamar).update(k);
      }
    }

    // -------------------------------------------------------------
    // 6. MASTER PAJAK (PB1 & Service Charge untuk CAB0002)
    // -------------------------------------------------------------
    console.log("▶ [6/14] Seeding mst_tax...");
    const taxes = [
      {
        kode_cabang: "CAB0002",
        kode_pajak: "PAJ-B01",
        name: "Pajak Hotel Kota Batu (PB1)",
        tax_type: "tax",
        percentage: "10.00",
        is_compounding: 0,
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_pajak: "PAJ-B02",
        name: "Resort Service Charge",
        tax_type: "service_charge",
        percentage: "5.00",
        is_compounding: 0,
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const tx of taxes) {
      const exist = await trx("mst_tax").where("kode_pajak", tx.kode_pajak).first();
      if (!exist) {
        await trx("mst_tax").insert(tx);
      }
    }

    // -------------------------------------------------------------
    // 7. MASTER MUSIM (Regular & Batu Peak Holiday)
    // -------------------------------------------------------------
    console.log("▶ [7/14] Seeding mst_musim...");
    const musims = [
      {
        kode_cabang: "CAB0002",
        kode_musim: "SEA-B01",
        nama_musim: "Regular Season Batu",
        tanggal_mulai: "2026-01-01",
        tanggal_selesai: "2026-12-31",
        hari_berlaku: "senin,selasa,rabu,kamis,jumat,sabtu,minggu",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_musim: "SEA-B02",
        nama_musim: "Batu Weekend & Peak Holiday",
        tanggal_mulai: "2026-06-01",
        tanggal_selesai: "2026-07-31",
        hari_berlaku: "jumat,sabtu,minggu",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const m of musims) {
      const exist = await trx("mst_musim").where("kode_musim", m.kode_musim).first();
      if (!exist) {
        await trx("mst_musim").insert(m);
      }
    }

    // -------------------------------------------------------------
    // 8. MASTER RATE PLAN & RATE PLAN PRICE (Paket Harga)
    // -------------------------------------------------------------
    console.log("▶ [8/14] Seeding mst_paket_harga & mst_rate_plan_price...");
    const ratePlans = [
      {
        kode_cabang: "CAB0002",
        kode_paket_harga: "RP-B01",
        nama_paket: "Room Only (RO)",
        tipe_paket: "RO",
        dapat_di_refund: 1,
        termasuk_sarapan: 0,
        minimal_malam: 1,
        maksimal_malam: null,
        tipe_markup: "nominal",
        nilai_markup: "0.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_paket_harga: "RP-B02",
        nama_paket: "Bed & Breakfast Resort Buffet",
        tipe_paket: "BB",
        dapat_di_refund: 1,
        termasuk_sarapan: 1,
        minimal_malam: 1,
        maksimal_malam: null,
        tipe_markup: "nominal",
        nilai_markup: "150000.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_paket_harga: "RP-B03",
        nama_paket: "Batu Wellness & Spa Experience",
        tipe_paket: "SP",
        dapat_di_refund: 0,
        termasuk_sarapan: 1,
        minimal_malam: 2,
        maksimal_malam: null,
        tipe_markup: "nominal",
        nilai_markup: "450000.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const rp of ratePlans) {
      const exist = await trx("mst_paket_harga").where("kode_paket_harga", rp.kode_paket_harga).first();
      if (!exist) {
        await trx("mst_paket_harga").insert(rp);
      }
    }

    // Rate plan prices
    const ratePrices = [
      // Deluxe Mountain View (TIP-B01)
      { kode_harga_price: "HAR-B01", kode_tipe_kamar: "TIP-B01", kode_rate_plan: "RP-B01", price: "750000.00", extra_bed_price: "200000.00" },
      { kode_harga_price: "HAR-B02", kode_tipe_kamar: "TIP-B01", kode_rate_plan: "RP-B02", price: "900000.00", extra_bed_price: "200000.00" },
      // Grand Resort Suite (TIP-B02)
      { kode_harga_price: "HAR-B03", kode_tipe_kamar: "TIP-B02", kode_rate_plan: "RP-B01", price: "1250000.00", extra_bed_price: "250000.00" },
      { kode_harga_price: "HAR-B04", kode_tipe_kamar: "TIP-B02", kode_rate_plan: "RP-B02", price: "1400000.00", extra_bed_price: "250000.00" },
      // Executive Mountain Villa (TIP-B03)
      { kode_harga_price: "HAR-B05", kode_tipe_kamar: "TIP-B03", kode_rate_plan: "RP-B01", price: "2200000.00", extra_bed_price: "350000.00" },
      { kode_harga_price: "HAR-B06", kode_tipe_kamar: "TIP-B03", kode_rate_plan: "RP-B02", price: "2450000.00", extra_bed_price: "350000.00" },
      { kode_harga_price: "HAR-B07", kode_tipe_kamar: "TIP-B03", kode_rate_plan: "RP-B03", price: "2850000.00", extra_bed_price: "350000.00" },
      // Presidential Penthouse (TIP-B04)
      { kode_harga_price: "HAR-B08", kode_tipe_kamar: "TIP-B04", kode_rate_plan: "RP-B01", price: "3800000.00", extra_bed_price: "500000.00" },
      { kode_harga_price: "HAR-B09", kode_tipe_kamar: "TIP-B04", kode_rate_plan: "RP-B02", price: "4100000.00", extra_bed_price: "500000.00" },
    ];

    for (const rpp of ratePrices) {
      const exist = await trx("mst_rate_plan_price").where("kode_harga_price", rpp.kode_harga_price).first();
      if (!exist) {
        await trx("mst_rate_plan_price").insert({
          ...rpp,
          valid_from: "2026-01-01",
          valid_to: "2026-12-31",
          is_active: 1,
          created_at: tNow,
          updated_at: tNow,
        });
      }
    }

    // -------------------------------------------------------------
    // 9. MASTER FASILITAS KHUSUS BATU
    // -------------------------------------------------------------
    console.log("▶ [9/14] Seeding mst_fasilitas...");
    const fasilitas = [
      {
        kode_cabang: "CAB0002",
        kode_fasilitas: "FAS-B01",
        name: "Natural Hot Spring & Onsen Spa",
        harga: "175000.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_fasilitas: "FAS-B02",
        name: "Bromo Midnight Sunrise Tour Package",
        harga: "650000.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_fasilitas: "FAS-B03",
        name: "Batu Organic Apple Picking Experience",
        harga: "85000.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_fasilitas: "FAS-B04",
        name: "Full Body Aromatherapy Massage (90 min)",
        harga: "250000.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_fasilitas: "FAS-B05",
        name: "Antar-Jemput Bandara Abdulrachman Saleh Malang",
        harga: "300000.00",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const f of fasilitas) {
      const exist = await trx("mst_fasilitas").where("kode_fasilitas", f.kode_fasilitas).first();
      if (!exist) {
        await trx("mst_fasilitas").insert(f);
      }
    }

    // -------------------------------------------------------------
    // 10. MASTER CORPORATE ACCOUNT
    // -------------------------------------------------------------
    console.log("▶ [10/14] Seeding mst_corporate_account...");
    const corporates = [
      {
        kode_cabang: "CAB0002",
        kode_corporate: "COR-B01",
        name: "PT Petrokimia Gresik (Persero)",
        account_type: "corporate",
        npwp: "01.234.567.8-052.000",
        billing_address: "Jl. Jenderal Ahmad Yani, Gresik, Jawa Timur",
        payment_term_days: 30,
        contact_person: "Bpk. Irwan Setiawan",
        contact_phone: "031-3981811",
        contact_email: "corporate.booking@petrokimia-gresik.com",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_corporate: "COR-B02",
        name: "Agoda Company Pte Ltd (OTA)",
        account_type: "ota",
        npwp: "02.345.678.9-011.000",
        billing_address: "30 Cecil Street, Prudential Tower, Singapore",
        payment_term_days: 14,
        commission_pct: "15.00",
        contact_person: "Agoda Partner Support ID",
        contact_phone: "021-29279000",
        contact_email: "partners@agoda.com",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const c of corporates) {
      const exist = await trx("mst_corporate_account").where("kode_corporate", c.kode_corporate).first();
      if (!exist) {
        await trx("mst_corporate_account").insert(c);
      }
    }

    // -------------------------------------------------------------
    // 11. MASTER CASHIER COUNTER & OPEN CASHIER SHIFT
    // -------------------------------------------------------------
    console.log("▶ [11/14] Seeding mst_cashier_counter & trx_cashier_shift...");
    const counters = [
      {
        kode_cabang: "CAB0002",
        kode_counter: "CTR-B01",
        name: "Front Desk Cashier Batu 1",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_counter: "CTR-B02",
        name: "Front Desk Cashier Batu 2",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_counter: "CTR-B03",
        name: "Wellness & Spa Cashier",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const ctr of counters) {
      const exist = await trx("mst_cashier_counter").where("kode_counter", ctr.kode_counter).first();
      if (!exist) {
        await trx("mst_cashier_counter").insert(ctr);
      }
    }

    // Buka 1 shift kasir aktif di Front Desk Cashier Batu 1 (user superadmin = 7)
    const existingShift = await trx("trx_cashier_shift")
      .where("kode_cabang", "CAB0002")
      .andWhere("status", "open")
      .first();

    if (!existingShift) {
      await trx("trx_cashier_shift").insert({
        kode_cashier_shift: "SFT-B001",
        kode_cabang: "CAB0002",
        kode_cashier_counter: "CTR-B01",
        user_id: 7,
        opening_cash: "1000000.00",
        status: "open",
        opened_at: tNow,
        is_active: 1,
        created_at: tNow,
      });
      console.log("  ✔ Opened active cashier shift SFT-B001 for CAB0002");
    }

    // -------------------------------------------------------------
    // 12. MASTER PROFIL TAMU (mst_guest)
    // -------------------------------------------------------------
    console.log("▶ [12/14] Seeding mst_guest for CAB0002...");
    const guests = [
      {
        kode_cabang: "CAB0002",
        kode_tamu: "TAM-B001",
        full_name: "Hendra Pratama",
        first_name: "Hendra",
        last_name: "Pratama",
        id_type: "ktp",
        id_number: "3579012304820001",
        nationality: "Indonesia",
        email: "hendra.pratama@gmail.com",
        phone: "081234998877",
        is_vip: 1,
        vip_level: "vip",
        guest_type: "individual",
        total_stay: 4,
        total_spending: "8800000.00",
        source: "front_office",
        completeness_score: 95,
        is_active: 1,
        is_blacklisted: 0,
        is_merged: 0,
        total_night: 8,
        avg_adr: "1100000.00",
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_tamu: "TAM-B002",
        full_name: "Irwan Setiawan",
        first_name: "Irwan",
        last_name: "Setiawan",
        id_type: "ktp",
        id_number: "3525011905860002",
        nationality: "Indonesia",
        email: "irwan.setiawan@petrokimia.com",
        phone: "081133224455",
        is_vip: 0,
        vip_level: "none",
        guest_type: "corporate",
        company_id: "COR-B01",
        total_stay: 6,
        total_spending: "6200000.00",
        source: "front_office",
        completeness_score: 90,
        is_active: 1,
        is_blacklisted: 0,
        is_merged: 0,
        total_night: 10,
        avg_adr: "620000.00",
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_tamu: "TAM-B003",
        full_name: "Hartono Kusuma",
        first_name: "Hartono",
        last_name: "Kusuma",
        id_type: "ktp",
        id_number: "3171011001700005",
        nationality: "Indonesia",
        email: "hartono.kusuma@capital.co.id",
        phone: "081888999000",
        is_vip: 1,
        vip_level: "vvip",
        guest_type: "individual",
        total_stay: 8,
        total_spending: "28500000.00",
        source: "front_office",
        completeness_score: 100,
        is_active: 1,
        is_blacklisted: 0,
        is_merged: 0,
        total_night: 14,
        avg_adr: "2035000.00",
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_tamu: "TAM-B004",
        full_name: "Maya Anggraini",
        first_name: "Maya",
        last_name: "Anggraini",
        id_type: "ktp",
        id_number: "3578015509930003",
        nationality: "Indonesia",
        email: "maya.anggraini@yahoo.com",
        phone: "085711223344",
        is_vip: 0,
        vip_level: "none",
        guest_type: "individual",
        total_stay: 2,
        total_spending: "2800000.00",
        source: "ota_import",
        completeness_score: 85,
        is_active: 1,
        is_blacklisted: 0,
        is_merged: 0,
        total_night: 3,
        avg_adr: "933000.00",
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_tamu: "TAM-B005",
        full_name: "David Tanaka",
        first_name: "David",
        last_name: "Tanaka",
        id_type: "passport",
        id_number: "TK9988221",
        passport_no: "TK9988221",
        passport_issuing_country: "Japan",
        nationality: "Japan",
        email: "david.tanaka@tokyo-design.jp",
        phone: "+818012345678",
        is_vip: 0,
        vip_level: "none",
        guest_type: "individual",
        total_stay: 1,
        total_spending: "1900000.00",
        source: "ota_import",
        completeness_score: 80,
        is_active: 1,
        is_blacklisted: 0,
        is_merged: 0,
        total_night: 2,
        avg_adr: "950000.00",
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const g of guests) {
      const exist = await trx("mst_guest").where("kode_tamu", g.kode_tamu).first();
      if (!exist) {
        await trx("mst_guest").insert(g);
      } else {
        await trx("mst_guest").where("kode_tamu", g.kode_tamu).update(g);
      }
    }

    // -------------------------------------------------------------
    // 13. TRANSAKSI OPERASIONAL FRONT OFFICE
    //     (In-House Guests, Check-in, Folios, Charges, Payments)
    // -------------------------------------------------------------
    console.log("▶ [13/14] Seeding active operational reservations, rooms, checkin, folios & payments...");

    // TRANSAKSI 1: Tamu Menginap Hendra Pratama di VILLA-01 (Check-in 2 hari lalu, Checkout HARI INI -> Siap untuk Checkout!)
    const rsv1 = {
      kode_cabang: "CAB0002",
      kode_reservasi: "RSV-B001",
      booking_type: "individual",
      kode_guest: "TAM-B001",
      check_in_date: twoDaysAgoStr,
      check_out_date: todayStr,
      guest_count: 4,
      deposit_amount: "2000000.00",
      special_request: "Pemanas kolam renang aktif sejak pagi",
      status: "checked_in",
      source_channel: "direct",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation").where("kode_reservasi", rsv1.kode_reservasi).first())) {
      await trx("trx_reservation").insert(rsv1);
    }

    const rro1 = {
      kode_reservasi_room: "RRO-B001",
      kode_reservation: "RSV-B001",
      kode_tipe_kamar: "TIP-B03",
      kode_rate_plan: "RP-B02",
      kode_kamar: "KAM-BV01",
      room_preference: "Private Heated Pool",
      rate_per_night: "2450000.00",
      nights: 2,
      status: "checked_in",
      is_active: 1,
      version: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation_room").where("kode_reservasi_room", rro1.kode_reservasi_room).first())) {
      await trx("trx_reservation_room").insert(rro1);
    }

    const chk1 = {
      kode_checkin: "CHK-B001",
      kode_reservation_room: "RRO-B001",
      vehicle_plate: "N 1988 AB",
      checkin_by: 7,
      checkin_at: twoDaysAgoStr + " 14:15:00",
      early_checkin: 0,
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_checkin").where("kode_checkin", chk1.kode_checkin).first())) {
      await trx("trx_checkin").insert(chk1);
    }

    // Folio Tagihan 1: Room (2 x 2.450.000 = 4.900.000) + Spa (250.000) = Subtotal 5.150.000
    // Tax 10% (515.000) + Service 5% (257.500) = Grand Total 5.922.500
    // Deposit bayar: 2.000.000 -> Sisa saldo (balance): 3.922.500
    const fol1 = {
      kode_cabang: "CAB0002",
      kode_folio: "FOL-B001",
      kode_reservation: "RSV-B001",
      folio_owner_type: "guest",
      status: "open",
      subtotal: "5150000.00",
      tax_amount: "515000.00",
      service_charge_amount: "257500.00",
      grand_total: "5922500.00",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_folio").where("kode_folio", fol1.kode_folio).first())) {
      await trx("trx_folio").insert(fol1);
    }

    const fch1 = [
      {
        kode_folio_charge: "FCH-B001",
        kode_folio: "FOL-B001",
        charge_type: "room",
        description: "Room Charge - Executive Mountain Villa (2 Malam @ Rp 2.450.000)",
        qty: "2.00",
        unit_price: "2450000.00",
        amount: "4900000.00",
        posted_by: 7,
        posted_at: tNow,
        is_active: 1,
        created_at: tNow,
      },
      {
        kode_folio_charge: "FCH-B002",
        kode_folio: "FOL-B001",
        charge_type: "spa",
        description: "Aromatherapy Full Body Spa Session",
        qty: "1.00",
        unit_price: "250000.00",
        amount: "250000.00",
        posted_by: 7,
        posted_at: tNow,
        is_active: 1,
        created_at: tNow,
      },
    ];
    for (const fc of fch1) {
      if (!(await trx("trx_folio_charge").where("kode_folio_charge", fc.kode_folio_charge).first())) {
        await trx("trx_folio_charge").insert(fc);
      }
    }

    const pay1 = {
      kode_payment: "PAY-B001",
      kode_folio: "FOL-B001",
      payment_method: "card",
      amount: "2000000.00",
      reference_no: "EDC-BCA-RESORT-001",
      kode_cashier_shift: "SFT-B001",
      received_by: 7,
      paid_at: twoDaysAgoStr + " 14:20:00",
      is_active: 1,
      created_at: tNow,
    };
    if (!(await trx("trx_payment").where("kode_payment", pay1.kode_payment).first())) {
      await trx("trx_payment").insert(pay1);
    }

    // TRANSAKSI 2: Tamu Menginap Irwan Setiawan (Corporate PT Petrokimia) di Kamar 201 (Deluxe Mountain View)
    const rsv2 = {
      kode_cabang: "CAB0002",
      kode_reservasi: "RSV-B002",
      booking_type: "corporate",
      kode_guest: "TAM-B002",
      kode_corporate_account: "COR-B01",
      check_in_date: yesterdayStr,
      check_out_date: tomorrowStr,
      guest_count: 1,
      deposit_amount: "1000000.00",
      special_request: "Kamar lantai 2 pemandangan gunung, wifi stabil",
      status: "checked_in",
      source_channel: "direct",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation").where("kode_reservasi", rsv2.kode_reservasi).first())) {
      await trx("trx_reservation").insert(rsv2);
    }

    const rro2 = {
      kode_reservasi_room: "RRO-B002",
      kode_reservation: "RSV-B002",
      kode_tipe_kamar: "TIP-B01",
      kode_rate_plan: "RP-B02",
      kode_kamar: "KAM-B201",
      room_preference: "High Floor Mountain View",
      rate_per_night: "900000.00",
      nights: 2,
      status: "checked_in",
      is_active: 1,
      version: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation_room").where("kode_reservasi_room", rro2.kode_reservasi_room).first())) {
      await trx("trx_reservation_room").insert(rro2);
    }

    const chk2 = {
      kode_checkin: "CHK-B002",
      kode_reservation_room: "RRO-B002",
      vehicle_plate: "W 1122 PK",
      checkin_by: 7,
      checkin_at: yesterdayStr + " 15:10:00",
      early_checkin: 0,
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_checkin").where("kode_checkin", chk2.kode_checkin).first())) {
      await trx("trx_checkin").insert(chk2);
    }

    const fol2 = {
      kode_cabang: "CAB0002",
      kode_folio: "FOL-B002",
      kode_reservation: "RSV-B002",
      folio_owner_type: "corporate",
      kode_corporate_account: "COR-B01",
      status: "open",
      subtotal: "1800000.00",
      tax_amount: "180000.00",
      service_charge_amount: "90000.00",
      grand_total: "2070000.00",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_folio").where("kode_folio", fol2.kode_folio).first())) {
      await trx("trx_folio").insert(fol2);
    }

    const fch2 = {
      kode_folio_charge: "FCH-B003",
      kode_folio: "FOL-B002",
      charge_type: "room",
      description: "Room Charge - Deluxe Mountain View (2 Malam @ Rp 900.000)",
      qty: "2.00",
      unit_price: "900000.00",
      amount: "1800000.00",
      posted_by: 7,
      posted_at: tNow,
      is_active: 1,
      created_at: tNow,
    };
    if (!(await trx("trx_folio_charge").where("kode_folio_charge", fch2.kode_folio_charge).first())) {
      await trx("trx_folio_charge").insert(fch2);
    }

    const pay2 = {
      kode_payment: "PAY-B002",
      kode_folio: "FOL-B002",
      payment_method: "transfer",
      amount: "1000000.00",
      reference_no: "TRF-MANDIRI-CORP-9912",
      kode_cashier_shift: "SFT-B001",
      received_by: 7,
      paid_at: yesterdayStr + " 15:15:00",
      is_active: 1,
      created_at: tNow,
    };
    if (!(await trx("trx_payment").where("kode_payment", pay2.kode_payment).first())) {
      await trx("trx_payment").insert(pay2);
    }

    // TRANSAKSI 3: Tamu VVIP Bpk. Hartono Kusuma di Presidential Batu Penthouse (PENTHOUSE-01)
    const rsv3 = {
      kode_cabang: "CAB0002",
      kode_reservasi: "RSV-B003",
      booking_type: "individual",
      kode_guest: "TAM-B003",
      check_in_date: yesterdayStr,
      check_out_date: threeDaysLaterStr,
      guest_count: 4,
      deposit_amount: "5000000.00",
      special_request: "Welcome champagne, private butler on stand-by",
      status: "checked_in",
      source_channel: "direct",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation").where("kode_reservasi", rsv3.kode_reservasi).first())) {
      await trx("trx_reservation").insert(rsv3);
    }

    const rro3 = {
      kode_reservasi_room: "RRO-B003",
      kode_reservation: "RSV-B003",
      kode_tipe_kamar: "TIP-B04",
      kode_rate_plan: "RP-B02",
      kode_kamar: "KAM-BPH01",
      room_preference: "Rooftop 360 Jacuzzi",
      rate_per_night: "4100000.00",
      nights: 4,
      status: "checked_in",
      is_active: 1,
      version: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation_room").where("kode_reservasi_room", rro3.kode_reservasi_room).first())) {
      await trx("trx_reservation_room").insert(rro3);
    }

    const chk3 = {
      kode_checkin: "CHK-B003",
      kode_reservation_room: "RRO-B003",
      vehicle_plate: "B 1 HK",
      checkin_by: 7,
      checkin_at: yesterdayStr + " 16:45:00",
      early_checkin: 0,
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_checkin").where("kode_checkin", chk3.kode_checkin).first())) {
      await trx("trx_checkin").insert(chk3);
    }

    const fol3 = {
      kode_cabang: "CAB0002",
      kode_folio: "FOL-B003",
      kode_reservation: "RSV-B003",
      folio_owner_type: "guest",
      status: "open",
      subtotal: "16400000.00",
      tax_amount: "1640000.00",
      service_charge_amount: "820000.00",
      grand_total: "18860000.00",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_folio").where("kode_folio", fol3.kode_folio).first())) {
      await trx("trx_folio").insert(fol3);
    }

    const fch3 = {
      kode_folio_charge: "FCH-B004",
      kode_folio: "FOL-B003",
      charge_type: "room",
      description: "Room Charge - Presidential Penthouse (4 Malam @ Rp 4.100.000)",
      qty: "4.00",
      unit_price: "4100000.00",
      amount: "16400000.00",
      posted_by: 7,
      posted_at: tNow,
      is_active: 1,
      created_at: tNow,
    };
    if (!(await trx("trx_folio_charge").where("kode_folio_charge", fch3.kode_folio_charge).first())) {
      await trx("trx_folio_charge").insert(fch3);
    }

    const pay3 = {
      kode_payment: "PAY-B003",
      kode_folio: "FOL-B003",
      payment_method: "card",
      amount: "5000000.00",
      reference_no: "EDC-BCA-PLATINUM-HK",
      kode_cashier_shift: "SFT-B001",
      received_by: 7,
      paid_at: yesterdayStr + " 16:50:00",
      is_active: 1,
      created_at: tNow,
    };
    if (!(await trx("trx_payment").where("kode_payment", pay3.kode_payment).first())) {
      await trx("trx_payment").insert(pay3);
    }

    // TRANSAKSI 4: Kedatangan Hari Ini (Expected Arrival Today) - Ibu Maya Anggraini di Kamar 202 (Grand Resort Suite)
    const rsv4 = {
      kode_cabang: "CAB0002",
      kode_reservasi: "RSV-B004",
      booking_type: "individual",
      kode_guest: "TAM-B004",
      check_in_date: todayStr,
      check_out_date: tomorrowStr,
      guest_count: 2,
      deposit_amount: "500000.00",
      special_request: "Kamar bebas asap rokok, tiba sekitar pukul 15.00",
      status: "confirmed",
      source_channel: "agoda",
      ref_channel_booking_id: "AGD-BATU-99410",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation").where("kode_reservasi", rsv4.kode_reservasi).first())) {
      await trx("trx_reservation").insert(rsv4);
    }

    const rro4 = {
      kode_reservasi_room: "RRO-B004",
      kode_reservation: "RSV-B004",
      kode_tipe_kamar: "TIP-B02",
      kode_rate_plan: "RP-B02",
      kode_kamar: "KAM-B202",
      room_preference: "Mountain View",
      rate_per_night: "1400000.00",
      nights: 1,
      status: "assigned",
      is_active: 1,
      version: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation_room").where("kode_reservasi_room", rro4.kode_reservasi_room).first())) {
      await trx("trx_reservation_room").insert(rro4);
    }

    // TRANSAKSI 5: Kedatangan Besok (Expected Arrival Tomorrow) - David Tanaka di Kamar 103 (Deluxe Mountain View)
    const rsv5 = {
      kode_cabang: "CAB0002",
      kode_reservasi: "RSV-B005",
      booking_type: "individual",
      kode_guest: "TAM-B005",
      check_in_date: tomorrowStr,
      check_out_date: threeDaysLaterStr,
      guest_count: 1,
      deposit_amount: "0.00",
      special_request: "Late check-in at 19:00",
      status: "confirmed",
      source_channel: "booking_com",
      ref_channel_booking_id: "BKG-7788991",
      is_active: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation").where("kode_reservasi", rsv5.kode_reservasi).first())) {
      await trx("trx_reservation").insert(rsv5);
    }

    const rro5 = {
      kode_reservasi_room: "RRO-B005",
      kode_reservation: "RSV-B005",
      kode_tipe_kamar: "TIP-B01",
      kode_rate_plan: "RP-B01",
      kode_kamar: "KAM-B103",
      room_preference: "Quiet Room",
      rate_per_night: "750000.00",
      nights: 2,
      status: "assigned",
      is_active: 1,
      version: 1,
      created_at: tNow,
      updated_at: tNow,
    };
    if (!(await trx("trx_reservation_room").where("kode_reservasi_room", rro5.kode_reservasi_room).first())) {
      await trx("trx_reservation_room").insert(rro5);
    }

    // -------------------------------------------------------------
    // 14. OPERASIONAL HOUSEKEEPING TASKS (Pembersihan & Inspeksi)
    // -------------------------------------------------------------
    console.log("▶ [14/14] Seeding trx_housekeeping_task...");
    const hkTasks = [
      {
        kode_cabang: "CAB0002",
        kode_housekeeping_task: "TSK-B001",
        kode_kamar: "KAM-B102",
        task_type: "cleaning",
        assigned_to: 1000, // Syifa (housekeeping)
        priority: "normal",
        status: "assigned",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_housekeeping_task: "TSK-B002",
        kode_kamar: "KAM-B203",
        task_type: "cleaning",
        assigned_to: 1002, // SyifaNW (housekeeping)
        priority: "urgent",
        status: "in_progress",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
      {
        kode_cabang: "CAB0002",
        kode_housekeeping_task: "TSK-B003",
        kode_kamar: "KAM-B104",
        task_type: "inspection",
        assigned_to: 7, // Supervisor / Superadmin
        priority: "normal",
        status: "in_progress",
        is_active: 1,
        created_at: tNow,
        updated_at: tNow,
      },
    ];

    for (const hkt of hkTasks) {
      const exist = await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", hkt.kode_housekeeping_task)
        .first();
      if (!exist) {
        await trx("trx_housekeeping_task").insert(hkt);
      }
    }
  });

  console.log("=====================================================================");
  console.log("🎉 SUCCESS: ALL MASTER & OPERATIONAL DATA FOR CAB0002 FULLY SEEDED!");
  console.log("=====================================================================");
}

if (process.argv[1]?.includes("seed_cab0002_complete_data")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ SEEDING FAILED:", err);
      process.exit(1);
    });
}
