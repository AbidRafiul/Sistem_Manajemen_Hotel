/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file today.js
 * @description POST /api/v1/dashboard/today - Ringkasan operasional hari ini (Business Date aktif):
 *              Arrivals, Departures, In-House Guests/Rooms, dan Room Readiness Status.
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
  getRoomInventory,
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

    // 1. Snapshot Inventory Kamar
    const inventory = await getRoomInventory(kodeCabang);

    // 2. Arrivals Operasional
    // Pending Arrivals: reservasi yang check-in hari ini dan belum check-in
    const pendingArrivals = await DB("trx_reservation as r")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .where("r.kode_cabang", kodeCabang)
      .whereRaw("DATE(r.check_in_date) = ?", [businessDate])
      .whereIn("r.status", ["reserved", "confirmed"])
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .select(
        DB.raw("COUNT(r.id) as total_reservasi"),
        DB.raw("COALESCE(SUM(r.guest_count), 0) as total_guests")
      )
      .first();

    // Already Arrived: reservasi yang check-in hari ini dan statusnya sudah checked_in
    const checkedInToday = await DB("trx_reservation as r")
      .where("r.kode_cabang", kodeCabang)
      .whereRaw("DATE(r.check_in_date) = ?", [businessDate])
      .whereIn("r.status", ["checked_in", "checked_out"])
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .select(
        DB.raw("COUNT(r.id) as total_reservasi"),
        DB.raw("COALESCE(SUM(r.guest_count), 0) as total_guests")
      )
      .first();

    const pendingArrivalCount = parseInt(pendingArrivals?.total_reservasi || 0, 10);
    const checkedInCount = parseInt(checkedInToday?.total_reservasi || 0, 10);
    const totalExpectedArrivals = pendingArrivalCount + checkedInCount;

    // 3. Departures Operasional
    // Pending Departures: reservasi yang dijadwalkan check-out hari ini dan masih checked_in
    const pendingDepartures = await DB("trx_reservation as r")
      .where("r.kode_cabang", kodeCabang)
      .whereRaw("DATE(r.check_out_date) = ?", [businessDate])
      .where("r.status", "checked_in")
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .select(
        DB.raw("COUNT(r.id) as total_reservasi"),
        DB.raw("COALESCE(SUM(r.guest_count), 0) as total_guests")
      )
      .first();

    // Already Departed: reservasi yang checkout hari ini
    const departedToday = await DB("trx_reservation as r")
      .where("r.kode_cabang", kodeCabang)
      .whereRaw("DATE(r.check_out_date) = ?", [businessDate])
      .where("r.status", "checked_out")
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .select(
        DB.raw("COUNT(r.id) as total_reservasi"),
        DB.raw("COALESCE(SUM(r.guest_count), 0) as total_guests")
      )
      .first();

    const pendingDepartureCount = parseInt(pendingDepartures?.total_reservasi || 0, 10);
    const departedCount = parseInt(departedToday?.total_reservasi || 0, 10);
    const totalExpectedDepartures = pendingDepartureCount + departedCount;

    // 4. In-House Tamu & Kamar Saat Ini
    const inHouseStats = await DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .where("r.kode_cabang", kodeCabang)
      .where("rr.status", "checked_in")
      .where("r.status", "checked_in")
      .where("rr.is_active", 1)
      .whereNull("rr.deleted_at")
      .whereNull("r.deleted_at")
      .select(
        DB.raw("COUNT(DISTINCT rr.id) as total_rooms"),
        DB.raw("COALESCE(SUM(r.guest_count), 0) as total_guests")
      )
      .first();

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data ringkasan operasional hari ini berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        arrivals: {
          expected: totalExpectedArrivals,
          arrived: checkedInCount,
          pending: pendingArrivalCount,
          guests_pending: parseInt(pendingArrivals?.total_guests || 0, 10),
        },
        departures: {
          expected: totalExpectedDepartures,
          departed: departedCount,
          pending: pendingDepartureCount,
          guests_pending: parseInt(pendingDepartures?.total_guests || 0, 10),
        },
        in_house: {
          rooms: parseInt(inHouseStats?.total_rooms || 0, 10),
          guests: parseInt(inHouseStats?.total_guests || 0, 10),
        },
        rooms: {
          total: inventory.total,
          available: inventory.available,
          occupied: inventory.occupied,
          vacant_clean: inventory.vacant_clean,
          vacant_dirty: inventory.vacant_dirty,
          ooo: inventory.ooo,
        },
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/today.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat ringkasan hari ini." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
