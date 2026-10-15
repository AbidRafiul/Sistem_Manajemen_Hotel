/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file upcoming_events.js
 * @description POST /api/v1/dashboard/upcoming-events - Jadwal acara dan penggunaan ruang pertemuan / event
 *              untuk 7 hari ke depan (Meeting Room, Ballroom, Banquet).
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";
import {
  addDays,
  getBusinessDate,
  logDashboardError,
} from "../components/tools/dashboard_metrics.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { kodeCabang, namaHotel } = resolveEffectiveBranch(req, req.body?.kode_cabang);
    if (!kodeCabang) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Kode cabang tidak valid atau belum ditentukan.",
        datetime: formatDateSystem(),
      });
    }

    const businessDate = await getBusinessDate(kodeCabang);
    const daysAhead = Math.min(30, Math.max(3, parseInt(req.body?.days || 7, 10)));
    const maxDate = addDays(businessDate, daysAhead);

    const eventRows = await DB("trx_reservasi_event as re")
      .leftJoin("mst_ruang_event as mre", "re.kode_ruang_event", "mre.kode_ruang_event")
      .leftJoin("mst_guest as g", "re.kode_tamu", "g.kode_tamu")
      .leftJoin("mst_corporate_account as ca", "re.kode_corporate", "ca.kode_corporate")
      .where("re.kode_cabang", kodeCabang)
      .where("re.is_active", 1)
      .whereRaw("re.tgl_selesai >= ?", [businessDate])
      .whereRaw("re.tgl_mulai <= ?", [maxDate])
      .select(
        "re.kode_reservasi_event",
        "re.kode_ruang_event",
        DB.raw("COALESCE(mre.nama_ruang, re.kode_ruang_event) as nama_ruang"),
        DB.raw("DATE_FORMAT(re.tgl_mulai, '%Y-%m-%d') as tgl_mulai"),
        DB.raw("DATE_FORMAT(re.tgl_selesai, '%Y-%m-%d') as tgl_selesai"),
        "re.jam_mulai",
        "re.jam_selesai",
        "re.jumlah_tamu",
        "re.status_event",
        "ca.name as corporate_name",
        "g.full_name as guest_name"
      )
      .orderBy("re.tgl_mulai", "asc")
      .orderBy("re.jam_mulai", "asc");

    const events = eventRows.map((e) => ({
      kode_reservasi_event: e.kode_reservasi_event,
      kode_ruang_event: e.kode_ruang_event,
      nama_ruang: e.nama_ruang,
      tgl_mulai: e.tgl_mulai,
      tgl_selesai: e.tgl_selesai,
      jam_mulai: e.jam_mulai ? e.jam_mulai.slice(0, 5) : "-",
      jam_selesai: e.jam_selesai ? e.jam_selesai.slice(0, 5) : "-",
      jumlah_tamu: parseInt(e.jumlah_tamu, 10) || 0,
      status_event: e.status_event || "confirmed",
      organizer: e.corporate_name || e.guest_name || "Penyelenggara Event",
    }));

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data agenda event mendatang berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        date_from: businessDate,
        date_to: maxDate,
        total_events: events.length,
        events,
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/upcoming_events.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat agenda event mendatang." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
