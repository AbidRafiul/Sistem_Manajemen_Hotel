/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file segment.js
 * @description POST /api/v1/dashboard/segment - Segmentasi profil tamu dan reservasi:
 *              Source Channel (OTA vs Direct), Tipe Booking, dan Top Tipe Kamar paling diminati.
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
  getBusinessDate,
  logDashboardError,
  round,
  startOfMonth,
  toNumber,
} from "../components/tools/dashboard_metrics.js";

const router = express.Router();

const CHANNEL_LABELS = {
  direct: "Direct (Telepon/Website Hotel)",
  walk_in: "Walk-In Resepsionis",
  booking_com: "Booking.com",
  agoda: "Agoda",
  traveloka: "Traveloka",
  expedia: "Expedia",
  airbnb: "Airbnb",
  other: "OTA Lainnya",
};

const BOOKING_TYPE_LABELS = {
  individual: "Individu / FIT",
  group: "Grup / Rombongan",
  corporate: "Korporat / Bisnis",
  walk_in: "Walk-In Langsung",
};

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
    const fromDate = req.body?.date_from || startOfMonth(businessDate);
    const toDate = req.body?.date_to || businessDate;

    // 1. Distribusi Source Channel
    const channelRows = await DB("trx_reservation as r")
      .where("r.kode_cabang", kodeCabang)
      .whereIn("r.status", ["reserved", "confirmed", "checked_in", "checked_out"])
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .whereRaw("r.check_in_date <= ? AND r.check_out_date >= ?", [toDate, fromDate])
      .select(
        "r.source_channel",
        DB.raw("COUNT(DISTINCT r.id) as reservation_count"),
        DB.raw("COALESCE(SUM(r.guest_count), 0) as total_guests")
      )
      .groupBy("r.source_channel")
      .orderBy("reservation_count", "desc");

    const totalChannelRes = channelRows.reduce((sum, c) => sum + parseInt(c.reservation_count, 10), 0);

    const channelBreakdown = channelRows.map((c) => {
      const cnt = parseInt(c.reservation_count, 10);
      return {
        channel: c.source_channel,
        label: CHANNEL_LABELS[c.source_channel] || c.source_channel,
        count: cnt,
        total_guests: parseInt(c.total_guests, 10),
        percentage: totalChannelRes > 0 ? round((cnt / totalChannelRes) * 100, 1) : 0,
      };
    });

    // 2. Distribusi Tipe Booking
    const typeRows = await DB("trx_reservation as r")
      .where("r.kode_cabang", kodeCabang)
      .whereIn("r.status", ["reserved", "confirmed", "checked_in", "checked_out"])
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .whereRaw("r.check_in_date <= ? AND r.check_out_date >= ?", [toDate, fromDate])
      .select(
        "r.booking_type",
        DB.raw("COUNT(DISTINCT r.id) as reservation_count"),
        DB.raw("COALESCE(SUM(r.guest_count), 0) as total_guests")
      )
      .groupBy("r.booking_type")
      .orderBy("reservation_count", "desc");

    const totalTypeRes = typeRows.reduce((sum, t) => sum + parseInt(t.reservation_count, 10), 0);

    const typeBreakdown = typeRows.map((t) => {
      const cnt = parseInt(t.reservation_count, 10);
      return {
        booking_type: t.booking_type,
        label: BOOKING_TYPE_LABELS[t.booking_type] || t.booking_type,
        count: cnt,
        total_guests: parseInt(t.total_guests, 10),
        percentage: totalTypeRes > 0 ? round((cnt / totalTypeRes) * 100, 1) : 0,
      };
    });

    // 3. Top 5 Tipe Kamar Paling Laku
    const roomTypeRows = await DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .where("r.kode_cabang", kodeCabang)
      .whereIn("rr.status", ["booked", "assigned", "checked_in", "checked_out"])
      .whereIn("r.status", ["reserved", "confirmed", "checked_in", "checked_out"])
      .where("rr.is_active", 1)
      .whereNull("rr.deleted_at")
      .whereRaw("r.check_in_date <= ? AND r.check_out_date >= ?", [toDate, fromDate])
      .select(
        "rr.kode_tipe_kamar",
        DB.raw("COALESCE(tk.nama_tipe, rr.kode_tipe_kamar) as nama_tipe"),
        DB.raw("COUNT(rr.id) as total_bookings"),
        DB.raw("COALESCE(SUM(rr.nights), 0) as total_nights"),
        DB.raw("COALESCE(SUM(rr.rate_per_night * rr.nights), 0) as total_revenue")
      )
      .groupBy("rr.kode_tipe_kamar", "tk.nama_tipe")
      .orderBy("total_revenue", "desc")
      .limit(5);

    const topRoomTypes = roomTypeRows.map((rt) => ({
      kode_tipe_kamar: rt.kode_tipe_kamar,
      nama_tipe: rt.nama_tipe,
      total_bookings: parseInt(rt.total_bookings, 10),
      total_nights: parseInt(rt.total_nights, 10),
      total_revenue: round(toNumber(rt.total_revenue), 2),
    }));

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data segmen tamu & channel berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        date_from: fromDate,
        date_to: toDate,
        by_source_channel: channelBreakdown,
        by_booking_type: typeBreakdown,
        top_room_types: topRoomTypes,
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/segment.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat segmen dashboard." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
