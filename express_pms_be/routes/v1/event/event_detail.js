/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_detail.js
 * @description POST /api/v1/event/detail - Mengambil detail lengkap reservasi event dan item tambahan (BEO)
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
    const { kode_reservasi_event, id } = req.body || {};

    if (!kode_reservasi_event && !id) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_reservasi_event atau id wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    let query = DB("trx_reservasi_event").where("is_active", 1);
    if (kode_reservasi_event) {
      query = query.where("kode_reservasi_event", kode_reservasi_event);
    } else if (id) {
      query = query.where("id", id);
    }

    const event = await query.first();
    if (!event) {
      return res.status(404).json({
        status: status.GAGAL,
        message: "Data pemesanan ruang event tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Load related Ruang, Guest, Corporate
    const [ruang, guest, corp, items] = await Promise.all([
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
      DB("trx_reservasi_event_item")
        .where("kode_reservasi_event", event.kode_reservasi_event)
        .where("is_active", 1)
        .orderBy("id", "asc")
        .catch(() => []),
    ]);

    const formattedItems = (items || []).map((it) => ({
      id: it.id,
      item_type: it.item_type || "fnb",
      item_name: it.item_name,
      qty: parseInt(it.qty, 10) || 1,
      unit: it.unit || "pax",
      harga_satuan: parseFloat(it.harga_satuan) || 0,
      subtotal: parseFloat(it.subtotal) || 0,
      catatan: it.catatan || "",
    }));

    const responseData = {
      id: event.id,
      kode_reservasi_event: event.kode_reservasi_event,
      nama_event: event.nama_event || "Agenda Acara Hotel",
      kode_ruang_event: event.kode_ruang_event,
      nama_ruang: ruang?.nama_ruang || event.kode_ruang_event,
      kapasitas_ruang: ruang?.kapasitas_orang || null,
      luas_sqm: ruang?.luas_sqm || null,
      layout_support: ruang?.layout_support || null,
      kode_cabang: event.kode_cabang,
      kode_tamu: event.kode_tamu,
      guest_name: guest?.full_name || "Tamu Umum",
      guest_phone: guest?.phone || "",
      guest_email: guest?.email || "",
      kode_corporate: event.kode_corporate || null,
      corporate_name: corp?.name || "",
      penyelenggara: corp?.name || guest?.full_name || "Penyelenggara Event",
      tgl_mulai: event.tgl_mulai ? String(event.tgl_mulai).slice(0, 10) : "",
      tgl_selesai: event.tgl_selesai ? String(event.tgl_selesai).slice(0, 10) : "",
      jam_mulai: event.jam_mulai ? String(event.jam_mulai).slice(0, 5) : "",
      jam_selesai: event.jam_selesai ? String(event.jam_selesai).slice(0, 5) : "",
      jumlah_tamu: parseInt(event.jumlah_tamu, 10) || 0,
      layout_setup: event.layout_setup || "theater",
      tipe_sewa: event.tipe_sewa || "half_day",
      durasi_jam: parseFloat(event.durasi_jam) || 4,
      tarif_sewa: parseFloat(event.tarif_sewa) || 0,
      biaya_tambahan: parseFloat(event.biaya_tambahan) || 0,
      diskon: parseFloat(event.diskon) || 0,
      pajak_persen: parseFloat(event.pajak_persen) || 10,
      nominal_pajak: parseFloat(event.nominal_pajak) || 0,
      service_charge_persen: parseFloat(event.service_charge_persen) || 0,
      nominal_service_charge: parseFloat(event.nominal_service_charge) || 0,
      total_biaya: parseFloat(event.total_biaya) || 0,
      deposit_paid: parseFloat(event.deposit_paid) || 0,
      sisa_tagihan: parseFloat(event.sisa_tagihan) || 0,
      status_pembayaran: event.status_pembayaran || "unpaid",
      status_event: event.status_event || "tentative",
      contact_person: event.contact_person || guest?.full_name || "",
      contact_phone: event.contact_phone || guest?.phone || "",
      contact_email: event.contact_email || guest?.email || "",
      setup_buffer_minutes: parseInt(event.setup_buffer_minutes, 10) || 30,
      teardown_buffer_minutes: parseInt(event.teardown_buffer_minutes, 10) || 30,
      catatan_khusus: event.catatan_khusus || "",
      catatan_batal: event.catatan_batal || "",
      items: formattedItems,
      created_at: event.created_at,
      updated_at: event.updated_at,
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: "Detail pemesanan ruang event berhasil dimuat",
      datetime: formatDateSystem(),
      data: responseData,
    });
  } catch (error) {
    console.error("Error in event_detail.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memuat detail pemesanan ruang event",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
