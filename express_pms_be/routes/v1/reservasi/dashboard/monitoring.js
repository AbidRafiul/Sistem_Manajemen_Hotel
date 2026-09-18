/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file monitoring.js
 * @description Endpoint matriks monitoring alokasi kamar per tanggal untuk visual timeline dashboard
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.1
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
  let kode_cabang = oPayload.kode_cabang || req?.auth?.kode_cabang || "";

  try {
    // 1. Tentukan cabang default jika belum dipilih
    if (!kode_cabang) {
      const firstCabang = await DB("mst_cabang")
        .where("is_active", 1)
        .whereNull("deleted_at")
        .first();
      if (firstCabang) {
        kode_cabang = firstCabang.kode_cabang;
      }
    }

    const today = new Date();
    const todayStr = formatDateSystem(today, "yyyy-MM-dd");
    const startDate = oPayload.start_date ? new Date(oPayload.start_date) : today;
    const daysCount = Math.min(Math.max(parseInt(oPayload.days || 7, 10), 3), 14); // batasi 3 - 14 hari

    // Bentuk array tanggal & header strings
    const dates = [];
    const dateHeaders = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const str = formatDateSystem(d, "yyyy-MM-dd");
      dateHeaders.push(str);
      dates.push({
        date: str,
        day_name: d.toLocaleDateString("id-ID", { weekday: "short" }),
        formatted: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        is_today: str === todayStr
      });
    }

    const windowStart = dateHeaders[0];
    const windowEnd = dateHeaders[dateHeaders.length - 1];
    const windowEndExclusive = new Date(windowEnd);
    windowEndExclusive.setDate(windowEndExclusive.getDate() + 1);
    const windowEndExclusiveStr = formatDateSystem(windowEndExclusive, "yyyy-MM-dd");

    // 2. Ambil Semua Kamar Fisik dengan Tipe Kamar & Lantai
    let kamarQuery = DB("mst_kamar as k")
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

    if (kode_cabang) kamarQuery.where("k.kode_cabang", kode_cabang);
    if (oPayload.kode_tipe_kamar) kamarQuery.where("k.kode_tipe_kamar", oPayload.kode_tipe_kamar);
    const allRooms = await kamarQuery;

    // 3. Ambil Reservasi yang Overlap di Seluruh Window
    let resQuery = DB("trx_reservation_room as rr")
      .select(
        "rr.kode_reservasi_room",
        "rr.kode_reservation",
        "rr.kode_kamar",
        "rr.kode_tipe_kamar",
        "rr.status as room_stay_status",
        "r.status as res_status",
        "r.check_in_date",
        "r.check_out_date",
        "r.booking_type",
        "g.full_name as guest_name",
        "g.phone as guest_phone"
      )
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .whereNotNull("rr.kode_kamar")
      .whereIn("rr.status", ["booked", "assigned", "checked_in"])
      .whereIn("r.status", ["reserved", "confirmed", "checked_in"])
      .where("r.check_in_date", "<", windowEndExclusiveStr)
      .andWhere("r.check_out_date", ">", windowStart)
      .whereNull("rr.deleted_at")
      .where("rr.is_active", 1);

    if (kode_cabang) resQuery.where("r.kode_cabang", kode_cabang);

    const activeReservations = await resQuery;

    // Map reservasi per kamar
    const resByRoom = new Map();
    activeReservations.forEach((r) => {
      if (!resByRoom.has(r.kode_kamar)) {
        resByRoom.set(r.kode_kamar, []);
      }
      resByRoom.get(r.kode_kamar).push(r);
    });

    // 4. Susun Format Matriks Sesuai Kebutuhan Frontend (rooms: [...] & date_headers: [...])
    const flatRoomsMatrix = allRooms.map((rm) => {
      const reservations = resByRoom.get(rm.kode_kamar) || [];
      const isMaintenance =
        rm.occupancy_status === "blocked" ||
        rm.housekeeping_status === "out_of_service" ||
        rm.housekeeping_status === "maintenance";

      const datesMap = {};
      dateHeaders.forEach((curDate) => {
        if (isMaintenance) {
          datesMap[curDate] = {
            is_occupied: true,
            status: "dirty",
            label: "Perawatan",
            reservation: null
          };
          return;
        }

        // Cari reservasi aktif pada tanggal ini
        const matchedRes = reservations.find((res) => {
          const cin = formatDateSystem(new Date(res.check_in_date), "yyyy-MM-dd");
          const cout = formatDateSystem(new Date(res.check_out_date), "yyyy-MM-dd");
          return cin <= curDate && curDate < cout;
        });

        if (matchedRes) {
          const isCheckedIn = matchedRes.room_stay_status === "checked_in" || matchedRes.res_status === "checked_in";
          const statusType = isCheckedIn ? "inhouse" : "booked";
          datesMap[curDate] = {
            is_occupied: true,
            status: statusType,
            label: isCheckedIn ? "In-House" : "Booked",
            reservation: {
              guest_name: matchedRes.guest_name || "Tamu Hotel",
              status_reservasi: matchedRes.room_stay_status || (isCheckedIn ? "inhouse" : "booked"),
              kode_reservasi: matchedRes.kode_reservation
            }
          };
          return;
        }

        // Jika kamar kosong (Available)
        if (curDate === todayStr && (rm.housekeeping_status === "dirty" || rm.housekeeping_status === "in_progress")) {
          datesMap[curDate] = {
            is_occupied: false,
            status: "dirty",
            label: "Cleaning",
            reservation: null
          };
        } else {
          datesMap[curDate] = {
            is_occupied: false,
            status: "ready",
            label: "Ready",
            reservation: null
          };
        }
      });

      return {
        kode_kamar: rm.kode_kamar,
        nomor_kamar: rm.nomor_kamar,
        nama_tipe: rm.nama_tipe,
        lantai: rm.lantai || 1,
        status_kondisi: rm.housekeeping_status || "clean",
        occupancy_status: rm.occupancy_status || "vacant",
        dates: datesMap
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data matriks monitoring berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        date_headers: dateHeaders,
        dates: dates,
        rooms: flatRoomsMatrix
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET ROOM MONITORING",
      TableName: "trx_reservation_room",
      file: "dashboard/monitoring.js",
      username: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal saat memuat matriks monitoring.",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
