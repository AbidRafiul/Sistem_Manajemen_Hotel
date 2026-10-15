/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file trend.js
 * @description POST /api/v1/dashboard/trend - Tren harian historis (default 30 hari terakhir):
 *              Occupancy %, ADR, RevPAR, Room Revenue, dan Total Revenue untuk grafik analitik.
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
  enumerateDates,
  getBusinessDate,
  getRoomInventory,
  getStayNights,
  logDashboardError,
  round,
  toNumber,
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
    const inventory = await getRoomInventory(kodeCabang);

    const daysReq = Math.min(90, Math.max(7, parseInt(req.body?.days || 30, 10)));
    const toDate = req.body?.date_to || businessDate;
    const fromDate = req.body?.date_from || addDays(toDate, -(daysReq - 1));

    // 1. Ambil room nights terjual per hari
    const nightsMap = await getStayNights(kodeCabang, fromDate, addDays(toDate, 1));

    // 2. Ambil total revenue terposting per hari
    const revenueRows = await DB("trx_folio_charge as fc")
      .join("trx_folio as f", "fc.kode_folio", "f.kode_folio")
      .where("f.kode_cabang", kodeCabang)
      .whereNot("f.status", "void")
      .where("fc.is_active", 1)
      .whereNot("fc.charge_type", "deposit")
      .whereRaw("COALESCE(fc.business_date, DATE(fc.posted_at)) BETWEEN ? AND ?", [fromDate, toDate])
      .select(
        DB.raw("DATE_FORMAT(COALESCE(fc.business_date, DATE(fc.posted_at)), '%Y-%m-%d') as post_date"),
        DB.raw("COALESCE(SUM(fc.amount), 0) as total_revenue")
      )
      .groupBy("post_date");

    const revMap = new Map();
    revenueRows.forEach((r) => {
      revMap.set(r.post_date, toNumber(r.total_revenue));
    });

    const datesList = enumerateDates(fromDate, addDays(toDate, 1));
    const availableCapacity = inventory.available;

    let totalSold = 0;
    let totalRoomRev = 0;
    let totalRevenue = 0;

    const dailyPoints = datesList.map((dt) => {
      const stay = nightsMap.get(dt) || { sold: 0, revenue: 0 };
      const sold = stay.sold;
      const roomRev = round(stay.revenue, 2);
      const dayTotalRev = round(revMap.get(dt) ?? roomRev, 2);

      totalSold += sold;
      totalRoomRev += roomRev;
      totalRevenue += dayTotalRev;

      const occPct = availableCapacity > 0 ? round((sold / availableCapacity) * 100, 1) : 0;
      const adr = sold > 0 ? round(roomRev / sold, 0) : 0;
      const revpar = availableCapacity > 0 ? round(roomRev / availableCapacity, 0) : 0;

      return {
        date: dt,
        rooms_sold: sold,
        rooms_available: availableCapacity,
        occupancy_pct: occPct,
        adr,
        revpar,
        room_revenue: roomRev,
        total_revenue: dayTotalRev,
      };
    });

    const totalDays = datesList.length;
    const avgOcc = totalDays > 0 && availableCapacity > 0
      ? round((totalSold / (availableCapacity * totalDays)) * 100, 1)
      : 0;
    const avgAdr = totalSold > 0 ? round(totalRoomRev / totalSold, 0) : 0;
    const avgRevpar = totalDays > 0 && availableCapacity > 0
      ? round(totalRoomRev / (availableCapacity * totalDays), 0)
      : 0;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data tren performa berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        date_from: fromDate,
        date_to: toDate,
        days: totalDays,
        summary: {
          total_rooms_sold: totalSold,
          total_room_revenue: round(totalRoomRev, 2),
          total_revenue: round(totalRevenue, 2),
          avg_occupancy_pct: avgOcc,
          avg_adr: avgAdr,
          avg_revpar: avgRevpar,
        },
        daily_trend: dailyPoints,
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/trend.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat tren dashboard." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
