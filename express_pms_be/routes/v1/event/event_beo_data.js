/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_beo_data.js
 * @description POST /api/v1/event/beo-data - Format data lengkap dokumen Banquet Event Order (BEO) untuk cetak/PDF
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { kode_reservasi_event } = req.body || {};

    if (!kode_reservasi_event) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_reservasi_event wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const event = await DB("trx_reservasi_event")
      .where("kode_reservasi_event", kode_reservasi_event)
      .where("is_active", 1)
      .first();

    if (!event) {
      return res.status(404).json({
        status: status.GAGAL,
        message: "Data pemesanan ruang event tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Load related entities
    const [ruang, guest, corp, cabang, items, hotelConfig] = await Promise.all([
      DB("mst_ruang_event")
        .where("kode_ruang_event", event.kode_ruang_event)
        .first()
        .catch(() => null),
      DB("mst_guest")
        .where("kode_tamu", event.kode_tamu)
        .first()
        .catch(() => null),
      event.kode_corporate
        ? DB("mst_corporate_account")
            .where("kode_corporate", event.kode_corporate)
            .first()
            .catch(() => null)
        : Promise.resolve(null),
      DB("mst_cabang")
        .where("kode_cabang", event.kode_cabang)
        .first()
        .catch(() => null),
      DB("trx_reservasi_event_item")
        .where("kode_reservasi_event", event.kode_reservasi_event)
        .where("is_active", 1)
        .orderBy("id", "asc")
        .catch(() => []),
      DB("config").select("kode", "nilai").catch(() => []),
    ]);

    const configMap = new Map((hotelConfig || []).map((c) => [c.kode, c.nilai]));

    const hotelProfile = {
      nama_hotel: cabang?.nama_hotel || configMap.get("COMPANY_NAME") || "Grand Marstech Hotel & Resort",
      alamat: cabang?.alamat || configMap.get("COMPANY_ADDRESS") || "Jl. Hospitality No. 1",
      telepon: cabang?.telepon || configMap.get("COMPANY_PHONE") || "(021) 1234567",
      email: cabang?.email || configMap.get("COMPANY_EMAIL") || "info@marstech.co.id",
      website: configMap.get("COMPANY_WEBSITE") || "https://marstech.co.id",
    };

    const fnbItems = (items || []).filter((it) => it.item_type === "fnb");
    const equipmentItems = (items || []).filter((it) => ["equipment", "facility", "other"].includes(it.item_type));

    const beoData = {
      header: {
        beo_number: event.kode_reservasi_event,
        issue_date: formatDateSystem(),
        status_event: (event.status_event || "tentative").toUpperCase(),
        nama_event: event.nama_event || "Banquet Event",
        organizer_name: corp?.name || guest?.full_name || "Penyelenggara Event",
        organizer_type: corp ? "Corporate / Instansi" : "Individu",
        pic_name: event.contact_person || guest?.full_name || "-",
        pic_phone: event.contact_phone || guest?.phone || "-",
        pic_email: event.contact_email || guest?.email || "-",
      },
      schedule_and_room: {
        kode_ruang_event: event.kode_ruang_event,
        nama_ruang: ruang?.nama_ruang || event.kode_ruang_event,
        kapasitas: ruang?.kapasitas_orang || "-",
        luas_sqm: ruang?.luas_sqm || "-",
        tgl_mulai: String(event.tgl_mulai).slice(0, 10),
        tgl_selesai: String(event.tgl_selesai).slice(0, 10),
        jam_mulai: String(event.jam_mulai).slice(0, 5),
        jam_selesai: String(event.jam_selesai).slice(0, 5),
        durasi_jam: parseFloat(event.durasi_jam) || 4,
        jumlah_tamu: parseInt(event.jumlah_tamu, 10) || 0,
        layout_setup: (event.layout_setup || "theater").toUpperCase(),
        setup_buffer_minutes: event.setup_buffer_minutes || 30,
        teardown_buffer_minutes: event.teardown_buffer_minutes || 30,
      },
      requirements_and_notes: {
        catatan_khusus: event.catatan_khusus || "Tidak ada instruksi khusus.",
      },
      fnb_orders: fnbItems.map((it) => ({
        item_name: it.item_name,
        qty: parseInt(it.qty, 10),
        unit: it.unit,
        harga_satuan: parseFloat(it.harga_satuan),
        subtotal: parseFloat(it.subtotal),
        catatan: it.catatan || "-",
      })),
      equipment_orders: equipmentItems.map((it) => ({
        item_name: it.item_name,
        qty: parseInt(it.qty, 10),
        unit: it.unit,
        harga_satuan: parseFloat(it.harga_satuan),
        subtotal: parseFloat(it.subtotal),
        catatan: it.catatan || "-",
      })),
      financial_summary: {
        tipe_sewa: event.tipe_sewa,
        tarif_sewa: parseFloat(event.tarif_sewa) || 0,
        biaya_tambahan: parseFloat(event.biaya_tambahan) || 0,
        diskon: parseFloat(event.diskon) || 0,
        service_charge_persen: parseFloat(event.service_charge_persen) || 0,
        nominal_service_charge: parseFloat(event.nominal_service_charge) || 0,
        pajak_persen: parseFloat(event.pajak_persen) || 10,
        nominal_pajak: parseFloat(event.nominal_pajak) || 0,
        total_biaya: parseFloat(event.total_biaya) || 0,
        deposit_paid: parseFloat(event.deposit_paid) || 0,
        sisa_tagihan: parseFloat(event.sisa_tagihan) || 0,
        status_pembayaran: (event.status_pembayaran || "unpaid").toUpperCase(),
      },
      hotel_profile: hotelProfile,
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data Banquet Event Order (BEO) berhasil disiapkan",
      datetime: formatDateSystem(),
      data: beoData,
    });
  } catch (error) {
    console.error("Error in event_beo_data.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memuat data lembar kerja BEO",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
