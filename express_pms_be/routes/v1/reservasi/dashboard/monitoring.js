/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file monitoring.js
 * @description Endpoint matriks monitoring alokasi kamar per tanggal untuk visual timeline dashboard
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
    const startDate = oPayload.start_date ? new Date(oPayload.start_date) : today;
    const daysCount = Math.min(Math.max(parseInt(oPayload.days || 7, 10), 3), 14); // batasi 3 - 14 hari

    // Bentuk array tanggal
    const dates = [];
    const dateStrings = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const str = formatDateSystem(d, "yyyy-MM-dd");
      dateStrings.push(str);
      dates.push({
        date: str,
        day_name: d.toLocaleDateString("id-ID", { weekday: "short" }),
        formatted: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        is_today: str === formatDateSystem(today, "yyyy-MM-dd")
      });
    }

    const windowStart = dateStrings[0];
    const windowEnd = dateStrings[dateStrings.length - 1];
    // Tanggal batas eksklusif untuk query overlap: windowEnd + 1 hari
    const windowEndExclusive = new Date(windowEnd);
    windowEndExclusive.setDate(windowEndExclusive.getDate() + 1);
    const windowEndExclusiveStr = formatDateSystem(windowEndExclusive, "yyyy-MM-dd");

    // 1. Ambil Semua Tipe Kamar
    let tipeQuery = DB("mst_tipe_kamar")
      .where("is_active", 1)
      .whereNull("deleted_at")
      .orderBy("nama_tipe", "asc");
    if (kode_cabang) tipeQuery.where("kode_cabang", kode_cabang);
    if (oPayload.kode_tipe_kamar) tipeQuery.where("kode_tipe_kamar", oPayload.kode_tipe_kamar);
    const tipeKamars = await tipeQuery;

    // 2. Ambil Semua Kamar Fisik
    let kamarQuery = DB("mst_kamar")
      .where("is_active", 1)
      .whereNull("deleted_at")
      .orderBy("nomor_kamar", "asc");
    if (kode_cabang) kamarQuery.where("kode_cabang", kode_cabang);
    if (oPayload.kode_tipe_kamar) kamarQuery.where("kode_tipe_kamar", oPayload.kode_tipe_kamar);
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

    // 4. Susun Matriks Berdasarkan Tipe Kamar
    const todayStr = formatDateSystem(today, "yyyy-MM-dd");

    const result = tipeKamars.map((tk) => {
      const roomsOfThisType = allRooms.filter((rm) => rm.kode_tipe_kamar === tk.kode_tipe_kamar);

      const mappedRooms = roomsOfThisType.map((kamar) => {
        const reservations = resByRoom.get(kamar.kode_kamar) || [];
        const isMaintenance =
          kamar.occupancy_status === "blocked" ||
          kamar.housekeeping_status === "out_of_service" ||
          kamar.housekeeping_status === "maintenance";

        const dailyTimeline = dateStrings.map((curDate) => {
          if (isMaintenance) {
            return {
              date: curDate,
              status: "maintenance",
              label: "Perawatan",
              reservation: null
            };
          }

          // Cari apakah ada reservasi pada tanggal ini: [check_in, check_out)
          const matchedRes = reservations.find((res) => {
            const cin = formatDateSystem(new Date(res.check_in_date), "yyyy-MM-dd");
            const cout = formatDateSystem(new Date(res.check_out_date), "yyyy-MM-dd");
            return cin <= curDate && curDate < cout;
          });

          if (matchedRes) {
            const isCheckedIn = matchedRes.room_stay_status === "checked_in" || matchedRes.res_status === "checked_in";
            const cin = formatDateSystem(new Date(matchedRes.check_in_date), "yyyy-MM-dd");
            const cout = formatDateSystem(new Date(matchedRes.check_out_date), "yyyy-MM-dd");

            return {
              date: curDate,
              status: isCheckedIn ? "occupied" : "reserved",
              label: isCheckedIn ? "Terisi" : "Dipesan",
              reservation: {
                kode_reservasi: matchedRes.kode_reservation,
                kode_reservasi_room: matchedRes.kode_reservasi_room,
                guest_name: matchedRes.guest_name || "Tamu",
                check_in_date: cin,
                check_out_date: cout,
                booking_type: matchedRes.booking_type,
                is_start_day: curDate === cin,
                is_end_day: curDate === cout
              }
            };
          }

          // Jika kamar kosong (Available)
          // Khusus hari ini: pertimbangkan apakah fisik kamar bersih (clean) atau kotor (dirty)
          let roomStatus = "available";
          let label = "Tersedia";

          if (curDate === todayStr) {
            if (kamar.housekeeping_status === "dirty" || kamar.housekeeping_status === "in_progress") {
              roomStatus = "dirty";
              label = "Perlu Dibersihkan";
            }
          }

          return {
            date: curDate,
            status: roomStatus,
            label: label,
            reservation: null
          };
        });

        return {
          kode_kamar: kamar.kode_kamar,
          nomor_kamar: kamar.nomor_kamar,
          tipe_pemandangan: kamar.tipe_pemandangan,
          occupancy_status: kamar.occupancy_status,
          housekeeping_status: kamar.housekeeping_status,
          daily_timeline: dailyTimeline
        };
      });

      return {
        kode_tipe_kamar: tk.kode_tipe_kamar,
        nama_tipe: tk.nama_tipe,
        kapasitas_dasar: tk.kapasitas_dasar,
        total_rooms: mappedRooms.length,
        rooms: mappedRooms
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data matriks monitoring berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        dates: dates,
        room_types: result
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
