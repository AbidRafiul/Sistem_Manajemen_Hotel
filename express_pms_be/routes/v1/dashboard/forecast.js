/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file forecast.js
 * @description POST /api/v1/dashboard/forecast - Proyeksi On-The-Books 14 hari ke depan:
 *              Perkiraan okupansi, perkiraan kedatangan/keberangkatan, dan proyeksi pendapatan kamar.
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
    const availableCapacity = inventory.available;

    const forecastDays = Math.min(60, Math.max(7, parseInt(req.body?.days || 14, 10)));
    const startDate = businessDate;
    const endDateExclusive = addDays(startDate, forecastDays);

    // Ambil seluruh reservasi on-the-books yang overlap dengan jendela forecast
    const rows = await DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .where("r.kode_cabang", kodeCabang)
      .whereIn("rr.status", ["booked", "assigned", "checked_in"])
      .whereIn("r.status", ["reserved", "confirmed", "checked_in"])
      .where("rr.is_active", 1)
      .whereNull("rr.deleted_at")
      .whereNull("r.deleted_at")
      .where("r.check_in_date", "<", endDateExclusive)
      .where("r.check_out_date", ">", startDate)
      .select(
        "rr.kode_reservasi_room",
        "rr.rate_per_night",
        DB.raw("DATE_FORMAT(r.check_in_date, '%Y-%m-%d') as check_in_date"),
        DB.raw("DATE_FORMAT(r.check_out_date, '%Y-%m-%d') as check_out_date")
      );

    const datesList = enumerateDates(startDate, endDateExclusive);

    const dateMap = new Map();
    datesList.forEach((d) => {
      dateMap.set(d, {
        date: d,
        booked_rooms: 0,
        expected_arrivals: 0,
        expected_departures: 0,
        projected_revenue: 0,
      });
    });

    rows.forEach((row) => {
      const cin = row.check_in_date;
      const cout = row.check_out_date;
      const rate = toNumber(row.rate_per_night);

      if (dateMap.has(cin)) {
        dateMap.get(cin).expected_arrivals += 1;
      }
      if (dateMap.has(cout)) {
        dateMap.get(cout).expected_departures += 1;
      }

      const s = cin > startDate ? cin : startDate;
      const e = cout < endDateExclusive ? cout : endDateExclusive;

      for (let dt = s; dt < e; dt = addDays(dt, 1)) {
        const item = dateMap.get(dt);
        if (item) {
          item.booked_rooms += 1;
          item.projected_revenue += rate;
        }
      }
    });

    let totalProjectedRev = 0;
    let totalBookedRoomNights = 0;

    const dailyForecast = datesList.map((dt) => {
      const item = dateMap.get(dt);
      const booked = item.booked_rooms;
      const rev = round(item.projected_revenue, 2);

      totalProjectedRev += rev;
      totalBookedRoomNights += booked;

      const occPct = availableCapacity > 0 ? round((booked / availableCapacity) * 100, 1) : 0;
      const adrProjected = booked > 0 ? round(rev / booked, 0) : 0;

      return {
        date: dt,
        booked_rooms: booked,
        available_rooms: availableCapacity,
        occupancy_pct: occPct,
        projected_revenue: rev,
        projected_adr: adrProjected,
        expected_arrivals: item.expected_arrivals,
        expected_departures: item.expected_departures,
      };
    });

    const avgProjectedOcc = forecastDays > 0 && availableCapacity > 0
      ? round((totalBookedRoomNights / (availableCapacity * forecastDays)) * 100, 1)
      : 0;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data proyeksi on-the-books berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        forecast_days: forecastDays,
        start_date: startDate,
        end_date: addDays(endDateExclusive, -1),
        summary: {
          total_booked_room_nights: totalBookedRoomNights,
          total_projected_revenue: round(totalProjectedRev, 2),
          avg_projected_occupancy_pct: avgProjectedOcc,
        },
        daily_forecast: dailyForecast,
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/forecast.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat forecast dashboard." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
