/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_list.js
 * @description POST /api/v1/event/list - Mengambil daftar pemesanan ruang event (BEO)
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { kodeCabang } = resolveEffectiveBranch(req, req.body?.kode_cabang);
    const {
      status_event,
      start_date,
      end_date,
      search,
      kode_ruang_event,
      page = 1,
      limit = 50,
    } = req.body || {};

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));

    // Base query filter
    let query = DB("trx_reservasi_event as re")
      .where("re.is_active", 1);

    if (kodeCabang) {
      query = query.where("re.kode_cabang", kodeCabang);
    }

    if (status_event && status_event !== "all") {
      query = query.where("re.status_event", status_event);
    }

    if (kode_ruang_event && kode_ruang_event !== "all") {
      query = query.where("re.kode_ruang_event", kode_ruang_event);
    }

    if (start_date) {
      query = query.where("re.tgl_mulai", ">=", start_date);
    }

    if (end_date) {
      query = query.where("re.tgl_selesai", "<=", end_date);
    }

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      query = query.where((qb) => {
        qb.where("re.kode_reservasi_event", "like", searchPattern)
          .orWhere("re.nama_event", "like", searchPattern)
          .orWhere("re.contact_person", "like", searchPattern);
      });
    }

    // Count total rows
    const countRow = await query.clone().count("re.id as total").first();
    const totalRecords = countRow ? parseInt(countRow.total, 10) : 0;

    // Fetch records sorted by tgl_mulai desc, jam_mulai desc
    const rows = await query
      .clone()
      .select("re.*")
      .orderBy("re.tgl_mulai", "desc")
      .orderBy("re.jam_mulai", "desc")
      .limit(parseInt(limit, 10))
      .offset(offset);

    // Enriching parent master data with safe Maps to avoid any cross-table collation mismatch
    const ruangCodes = [...new Set(rows.map((r) => r.kode_ruang_event).filter(Boolean))];
    const guestCodes = [...new Set(rows.map((r) => r.kode_tamu).filter(Boolean))];
    const corpCodes = [...new Set(rows.map((r) => r.kode_corporate).filter(Boolean))];

    const [ruangMap, guestMap, corpMap] = await Promise.all([
      ruangCodes.length > 0
        ? DB("mst_ruang_event")
            .whereIn("kode_ruang_event", ruangCodes)
            .select("kode_ruang_event", "nama_ruang", "kapasitas_orang", "luas_sqm")
            .then((list) => new Map(list.map((item) => [item.kode_ruang_event, item])))
            .catch(() => new Map())
        : Promise.resolve(new Map()),
      guestCodes.length > 0
        ? DB("mst_guest")
            .whereIn("kode_tamu", guestCodes)
            .select("kode_tamu", "full_name", "phone", "email")
            .then((list) => new Map(list.map((item) => [item.kode_tamu, item])))
            .catch(() => new Map())
        : Promise.resolve(new Map()),
      corpCodes.length > 0
        ? DB("mst_corporate_account")
            .whereIn("kode_corporate", corpCodes)
            .select("kode_corporate", "name")
            .then((list) => new Map(list.map((item) => [item.kode_corporate, item])))
            .catch(() => new Map())
        : Promise.resolve(new Map()),
    ]);

    const formattedData = rows.map((r) => {
      const ruang = ruangMap.get(r.kode_ruang_event) || {};
      const guest = guestMap.get(r.kode_tamu) || {};
      const corp = corpMap.get(r.kode_corporate) || {};

      return {
        id: r.id,
        kode_reservasi_event: r.kode_reservasi_event,
        nama_event: r.nama_event || "Agenda Acara Hotel",
        kode_ruang_event: r.kode_ruang_event,
        nama_ruang: ruang.nama_ruang || r.kode_ruang_event,
        kapasitas_ruang: ruang.kapasitas_orang || null,
        kode_cabang: r.kode_cabang,
        kode_tamu: r.kode_tamu,
        guest_name: guest.full_name || "Tamu Umum",
        guest_phone: guest.phone || "",
        kode_corporate: r.kode_corporate || null,
        corporate_name: corp.name || "",
        penyelenggara: corp.name || guest.full_name || "Penyelenggara Event",
        tgl_mulai: r.tgl_mulai ? String(r.tgl_mulai).slice(0, 10) : "",
        tgl_selesai: r.tgl_selesai ? String(r.tgl_selesai).slice(0, 10) : "",
        jam_mulai: r.jam_mulai ? String(r.jam_mulai).slice(0, 5) : "",
        jam_selesai: r.jam_selesai ? String(r.jam_selesai).slice(0, 5) : "",
        jumlah_tamu: parseInt(r.jumlah_tamu, 10) || 0,
        layout_setup: r.layout_setup || "theater",
        tipe_sewa: r.tipe_sewa || "half_day",
        durasi_jam: parseFloat(r.durasi_jam) || 4,
        tarif_sewa: parseFloat(r.tarif_sewa) || 0,
        biaya_tambahan: parseFloat(r.biaya_tambahan) || 0,
        diskon: parseFloat(r.diskon) || 0,
        pajak_persen: parseFloat(r.pajak_persen) || 10,
        nominal_pajak: parseFloat(r.nominal_pajak) || 0,
        service_charge_persen: parseFloat(r.service_charge_persen) || 0,
        nominal_service_charge: parseFloat(r.nominal_service_charge) || 0,
        total_biaya: parseFloat(r.total_biaya) || 0,
        deposit_paid: parseFloat(r.deposit_paid) || 0,
        sisa_tagihan: parseFloat(r.sisa_tagihan) || 0,
        status_pembayaran: r.status_pembayaran || "unpaid",
        status_event: r.status_event || "tentative",
        contact_person: r.contact_person || guest.full_name || "",
        contact_phone: r.contact_phone || guest.phone || "",
        contact_email: r.contact_email || guest.email || "",
        setup_buffer_minutes: parseInt(r.setup_buffer_minutes, 10) || 30,
        teardown_buffer_minutes: parseInt(r.teardown_buffer_minutes, 10) || 30,
        catatan_khusus: r.catatan_khusus || "",
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Daftar pemesanan ruang event berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        total_records: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        events: formattedData,
      },
    });
  } catch (error) {
    console.error("Error in event_list.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memuat daftar pemesanan ruang event",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
