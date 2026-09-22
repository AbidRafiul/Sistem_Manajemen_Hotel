/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file summary.js
 * @description Endpoint ringkasan metrik dashboard reservasi: ketersediaan periode, operasional hari ini, dan katalog tipe kamar
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.1
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../../components/tools/scope_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  try {
    // 1. Tentukan cabang efektif berdasarkan scope kewenangan user
    const effective = resolveEffectiveBranch(req, oPayload.kode_cabang);
    const kode_cabang = effective.kodeCabang;

    const today = new Date();
    const todayStr = formatDateSystem(today, "yyyy-MM-dd");

    // Tanggal periode yang diminta
    const cinDate = oPayload.check_in_date ? new Date(oPayload.check_in_date) : today;
    let coutDate = oPayload.check_out_date ? new Date(oPayload.check_out_date) : new Date(today);
    if (!oPayload.check_out_date) {
      coutDate.setDate(coutDate.getDate() + 1);
    }
    if (coutDate <= cinDate) {
      coutDate = new Date(cinDate);
      coutDate.setDate(coutDate.getDate() + 1);
    }

    const checkinStr = formatDateSystem(cinDate, "yyyy-MM-dd");
    const checkoutStr = formatDateSystem(coutDate, "yyyy-MM-dd");
    const nights = Math.max(1, Math.round((coutDate.getTime() - cinDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalKamarReq = parseInt(oPayload.total_kamar || 1, 10);
    const totalTamuReq = parseInt(oPayload.total_tamu || 1, 10);

    // 2. Ambil Semua Kamar Fisik
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

    // 3. Cek Reservasi yang Overlap pada Periode [checkin, checkout)
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
      "rr.kode_tipe_kamar",
      "rr.status as room_stay_status",
      "r.kode_reservasi"
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

    // 4. Metrik Operasional Hari Ini (Real-Time Snapshot)
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

    // 5. Query Pajak untuk Simulasi Tarif
    const activeTaxes = await DB("mst_tax")
      .where("is_active", 1)
      .whereNull("deleted_at")
      .modify((qb) => {
        if (kode_cabang) {
          qb.where(function () {
            this.where("kode_cabang", kode_cabang).orWhereNull("kode_cabang");
          });
        }
      });
    const totalTaxPct = activeTaxes.reduce((sum, t) => sum + parseFloat(t.percentage || 0), 0);

    // 6. Ambil Tipe Kamar dan Bangun Katalog
    let tipeQuery = DB("mst_tipe_kamar")
      .where("is_active", 1)
      .whereNull("deleted_at")
      .orderBy("harga_default", "asc");

    if (kode_cabang) tipeQuery.where("kode_cabang", kode_cabang);
    if (oPayload.kode_tipe_kamar) tipeQuery.where("kode_tipe_kamar", oPayload.kode_tipe_kamar);
    const tipeList = await tipeQuery;

    // Ambil foto cover
    const photos = await DB("mst_tipe_kamar_foto")
      .where("is_active", 1)
      .whereNull("deleted_at")
      .orderBy("is_cover", "desc")
      .orderBy("urutan", "asc");

    // Ambil fasilitas
    let roomFacilities = [];
    try {
      roomFacilities = await DB("mst_room_type_fasilitas as rtf")
        .join("mst_fasilitas as f", "rtf.kode_fasilitas", "f.kode_fasilitas")
        .whereNull("f.deleted_at")
        .select("rtf.kode_tipe_kamar", "f.name as nama_fasilitas");
    } catch {
      roomFacilities = [];
    }

    const catalog = tipeList.map((tk) => {
      const typeRooms = allRooms.filter((r) => r.kode_tipe_kamar === tk.kode_tipe_kamar);
      const typeTotalUnits = typeRooms.length;
      const typeMaintenanceUnits = typeRooms.filter((r) => maintenanceCodes.has(r.kode_kamar)).length;

      // Alokasi overlap pada tipe kamar ini
      const typeOverlaps = overlappingRes.filter((r) => r.kode_tipe_kamar === tk.kode_tipe_kamar);
      const typePhysicalAllocated = new Set();
      let typeUnassignedCount = 0;

      typeOverlaps.forEach((o) => {
        if (o.kode_kamar && !maintenanceCodes.has(o.kode_kamar)) {
          typePhysicalAllocated.add(o.kode_kamar);
        } else {
          typeUnassignedCount++;
        }
      });

      const typeAllocated = typePhysicalAllocated.size + typeUnassignedCount;
      const typeSellable = Math.max(0, typeTotalUnits - typeMaintenanceUnits);
      const typeAvailable = Math.max(0, typeSellable - typeAllocated);

      // Hitung finansial
      const baseRate = parseFloat(tk.harga_default || 0);
      const subtotalNights = baseRate * nights * totalKamarReq;
      const taxEstimated = Math.round(subtotalNights * (totalTaxPct / 100));
      const grandTotalEstimated = subtotalNights + taxEstimated;

      // Foto
      const photoObj = photos.find((p) => p.kode_tipe_kamar === tk.kode_tipe_kamar);
      let fotoUrl = null;
      if (photoObj && photoObj.foto_url) {
        if (photoObj.foto_url.startsWith("http")) {
          fotoUrl = photoObj.foto_url;
        } else if (photoObj.foto_url.startsWith("/api/assets/")) {
          fotoUrl = photoObj.foto_url;
        } else if (photoObj.foto_url.startsWith("uploads/")) {
          fotoUrl = `/api/assets/${photoObj.foto_url}`;
        } else {
          fotoUrl = `/api/assets/uploads/tipe_kamar/${photoObj.foto_url}`;
        }
      } else {
        fotoUrl = `/api/assets/uploads/tipe_kamar/foto_TIP0001_interior.jpg`;
      }

      // Fasilitas
      const tfList = roomFacilities
        .filter((rf) => rf.kode_tipe_kamar === tk.kode_tipe_kamar)
        .map((rf) => rf.nama_fasilitas);
      const finalFasilitas = tfList.length > 0 ? tfList : ["Free Wi-Fi", "AC", "Smart TV", "Hot Shower"];

      return {
        kode_tipe_kamar: tk.kode_tipe_kamar,
        nama_tipe: tk.nama_tipe,
        kapasitas_dewasa: tk.kapasitas_dasar || 2,
        kapasitas_anak: Math.max(0, (tk.kapasitas_maksimal || 2) - (tk.kapasitas_dasar || 2)),
        deskripsi: tk.deskripsi || "Kamar hotel nyaman dengan standar pelayanan kebersihan prima.",
        luas_m2: tk.luas_sqm || 24,
        foto_url: fotoUrl,
        total_units: typeTotalUnits,
        available_units: typeAvailable,
        is_available: typeAvailable >= totalKamarReq,
        rate_per_night: baseRate,
        tax_estimated: taxEstimated,
        grand_total_estimated: grandTotalEstimated,
        fasilitas: finalFasilitas
      };
    });

    const filterInfo = {
      kode_cabang: kode_cabang,
      check_in_date: checkinStr,
      check_out_date: checkoutStr,
      nights: nights,
      total_kamar: totalKamarReq,
      total_tamu: totalTamuReq
    };

    const kpiPeriodData = {
      total_rooms: totalRooms,
      available_rooms: availableUnits,
      allocated_rooms: allocatedUnits,
      maintenance_rooms: maintenanceUnits,
      occupancy_rate_period: occupancyPct,
      total_reservations_period: overlappingRes.length
    };

    const kpiTodayData = {
      occupied_rooms: occupiedToday,
      ready_rooms: readyCleanToday,
      dirty_rooms: dirtyToday,
      maintenance_rooms: maintenanceUnits,
      arrivals_today: parseInt(arrivalsCount?.total || 0, 10),
      departures_today: parseInt(departuresCount?.total || 0, 10)
    };

    // 7. Ambil Daftar Kamar Fisik (Front Office Room Rack) dengan info tamu in-house
    let rackQuery = DB("mst_kamar as k")
      .join("mst_tipe_kamar as tk", "k.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("mst_lantai as l", "k.kode_lantai", "l.kode_lantai")
      .where("k.is_active", 1)
      .whereNull("k.deleted_at")
      .select(
        "k.kode_kamar",
        "k.nomor_kamar",
        "k.kode_tipe_kamar",
        "tk.nama_tipe",
        "k.occupancy_status",
        "k.housekeeping_status",
        "k.tipe_pemandangan",
        "l.nama_lantai as lantai"
      )
      .orderBy("k.nomor_kamar", "asc");

    if (kode_cabang) rackQuery.where("k.kode_cabang", kode_cabang);
    const physicalRooms = await rackQuery;

    // Ambil data tamu yang sedang in-house di setiap kamar
    let inHouseQuery = DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .leftJoin("trx_folio as f", "r.kode_reservasi", "f.kode_reservation")
      .where("rr.status", "checked_in")
      .where("r.status", "checked_in")
      .whereNull("rr.deleted_at")
      .where("rr.is_active", 1)
      .select(
        "rr.kode_kamar",
        "r.kode_reservasi",
        "r.check_in_date",
        "r.check_out_date",
        "g.full_name as guest_name",
        "g.phone as guest_phone",
        "f.kode_folio"
      );

    if (kode_cabang) inHouseQuery.where("r.kode_cabang", kode_cabang);
    const inHouseList = await inHouseQuery;

    const inHouseMap = new Map();
    inHouseList.forEach((ih) => {
      if (ih.kode_kamar) inHouseMap.set(ih.kode_kamar, ih);
    });

    const roomRack = physicalRooms.map((rm) => {
      const activeStay = inHouseMap.get(rm.kode_kamar);
      let displayStatus = "ready";
      let statusLabel = "Siap Check-In";

      if (rm.occupancy_status === "occupied" || activeStay) {
        displayStatus = "occupied";
        statusLabel = "Terisi (In-House)";
      } else if (
        rm.occupancy_status === "blocked" ||
        rm.housekeeping_status === "out_of_service" ||
        rm.housekeeping_status === "maintenance"
      ) {
        displayStatus = "maintenance";
        statusLabel = "Perawatan";
      } else if (
        rm.housekeeping_status === "dirty" ||
        rm.housekeeping_status === "in_progress" ||
        rm.housekeeping_status === "inspection"
      ) {
        displayStatus = "dirty";
        statusLabel = "Pembersihan (Dirty)";
      }

      return {
        kode_kamar: rm.kode_kamar,
        nomor_kamar: rm.nomor_kamar,
        nama_tipe: rm.nama_tipe,
        kode_tipe_kamar: rm.kode_tipe_kamar,
        lantai: rm.lantai || "Lantai 1",
        occupancy_status: rm.occupancy_status,
        housekeeping_status: rm.housekeeping_status,
        display_status: displayStatus,
        status_label: statusLabel,
        active_stay: activeStay
          ? {
              guest_name: activeStay.guest_name || "Tamu Hotel",
              phone: activeStay.guest_phone || "-",
              check_in_date: formatDateSystem(new Date(activeStay.check_in_date), "dd/MM/yyyy"),
              check_out_date: formatDateSystem(new Date(activeStay.check_out_date), "dd/MM/yyyy"),
              kode_reservasi: activeStay.kode_reservasi,
              kode_folio: activeStay.kode_folio
            }
          : null
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data ringkasan dashboard berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        filter: filterInfo,
        kpi_period: kpiPeriodData,
        kpi_today: kpiTodayData,
        room_rack: roomRack,
        // Kompatibilitas backwards:
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
        },
        catalog: catalog
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

    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal saat memuat summary dashboard.",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
