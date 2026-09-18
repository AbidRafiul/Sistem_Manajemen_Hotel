/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file summary.js
 * @description Endpoint ringkasan metrik dashboard reservasi: ketersediaan periode & operasional hari ini
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.0
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const kode_cabang = oPayload.kode_cabang || req?.auth?.kode_cabang || "";

  try {
    const today = new Date();
    const todayStr = formatDateSystem(today, "yyyy-MM-dd");

    // Tanggal periode yang diminta
    const cinDate = oPayload.check_in_date ? new Date(oPayload.check_in_date) : today;
    let coutDate = oPayload.check_out_date ? new Date(oPayload.check_out_date) : new Date(today);
    if (!oPayload.check_out_date) {
      coutDate.setDate(coutDate.getDate() + 1);
    }

    const checkinStr = formatDateSystem(cinDate, "yyyy-MM-dd");
    const checkoutStr = formatDateSystem(coutDate, "yyyy-MM-dd");

    // 1. Ambil Semua Kamar Fisik
    let roomQuery = DB("mst_kamar")
      .where("is_active", 1)
      .whereNull("deleted_at");

    if (kode_cabang) {
      roomQuery.where("kode_cabang", kode_cabang);
    }
    if (oPayload.kode_tipe_kamar) {
      roomQuery.where("kode_tipe_kamar", oPayload.kode_tipe_kamar);
    }

    const allRooms = await roomQuery.select(
      "kode_kamar",
      "nomor_kamar",
      "kode_tipe_kamar",
      "occupancy_status",
      "housekeeping_status"
    );

    const totalRooms = allRooms.length;

    // Hitung kamar maintenance / out of service
    const maintenanceRooms = allRooms.filter(
      (r) =>
        r.occupancy_status === "blocked" ||
        r.housekeeping_status === "out_of_service" ||
        r.housekeeping_status === "maintenance"
    );
    const maintenanceUnits = maintenanceRooms.length;
    const maintenanceCodes = new Set(maintenanceRooms.map((r) => r.kode_kamar));

    // 2. Cek Reservasi yang Overlap pada Periode [checkin, checkout)
    let overlapQuery = DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .whereIn("rr.status", ["booked", "assigned", "checked_in"])
      .whereIn("r.status", ["reserved", "confirmed", "checked_in"])
      .where("r.check_in_date", "<", checkoutStr)
      .andWhere("r.check_out_date", ">", checkinStr)
      .whereNull("rr.deleted_at")
      .where("rr.is_active", 1);

    if (kode_cabang) {
      overlapQuery.where("r.kode_cabang", kode_cabang);
    }
    if (oPayload.kode_tipe_kamar) {
      overlapQuery.where("rr.kode_tipe_kamar", oPayload.kode_tipe_kamar);
    }

    const overlappingRes = await overlapQuery.select(
      "rr.kode_reservasi_room",
      "rr.kode_kamar",
      "rr.kode_tipe_kamar"
    );

    const allocatedPhysicalCodes = new Set();
    let unassignedAllocatedCount = 0;

    overlappingRes.forEach((row) => {
      if (row.kode_kamar && !maintenanceCodes.has(row.kode_kamar)) {
        allocatedPhysicalCodes.add(row.kode_kamar);
      } else {
        unassignedAllocatedCount++;
      }
    });

    const allocatedUnits = allocatedPhysicalCodes.size + unassignedAllocatedCount;
    const sellableUnits = Math.max(0, totalRooms - maintenanceUnits);
    const availableUnits = Math.max(0, sellableUnits - allocatedUnits);
    const occupancyPct = sellableUnits > 0 ? parseFloat(((allocatedUnits / sellableUnits) * 100).toFixed(1)) : 0;

    // 3. Metrik Operasional Hari Ini (Real-Time Snapshot)
    const occupiedToday = allRooms.filter((r) => r.occupancy_status === "occupied").length;
    const readyCleanToday = allRooms.filter(
      (r) => r.occupancy_status === "vacant" && r.housekeeping_status === "clean"
    ).length;
    const dirtyToday = allRooms.filter(
      (r) =>
        r.housekeeping_status === "dirty" ||
        r.housekeeping_status === "inspection" ||
        r.housekeeping_status === "in_progress"
    ).length;

    // Arrivals Today (Reservasi masuk hari ini)
    let arrivalsQuery = DB("trx_reservation")
      .where("check_in_date", todayStr)
      .whereIn("status", ["reserved", "confirmed"])
      .whereNull("deleted_at")
      .where("is_active", 1);
    if (kode_cabang) arrivalsQuery.where("kode_cabang", kode_cabang);
    const arrivalsCount = await arrivalsQuery.count("id as total").first();

    // Departures Today (Tamu in-house yang dijadwalkan checkout hari ini)
    let departuresQuery = DB("trx_reservation")
      .where("check_out_date", todayStr)
      .where("status", "checked_in")
      .whereNull("deleted_at")
      .where("is_active", 1);
    if (kode_cabang) departuresQuery.where("kode_cabang", kode_cabang);
    const departuresCount = await departuresQuery.count("id as total").first();

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data ringkasan dashboard berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        period_metrics: {
          check_in_date: checkinStr,
          check_out_date: checkoutStr,
          total_units: totalRooms,
          sellable_units: sellableUnits,
          available_units: availableUnits,
          allocated_units: allocatedUnits,
          maintenance_units: maintenanceUnits,
          occupancy_percentage: occupancyPct
        },
        today_operations: {
          date: todayStr,
          occupied: occupiedToday,
          ready_clean: readyCleanToday,
          dirty_cleaning: dirtyToday,
          maintenance: maintenanceUnits,
          arrivals_today: parseInt(arrivalsCount?.total || 0, 10),
          departures_today: parseInt(departuresCount?.total || 0, 10)
        }
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET DASHBOARD SUMMARY",
      TableName: "trx_reservation",
      file: "dashboard/summary.js",
      username: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal saat memuat summary dashboard.",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
