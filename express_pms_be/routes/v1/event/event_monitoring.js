/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_monitoring.js
 * @description POST /api/v1/event/monitoring - Data monitoring real-time, timeline utilisasi jam, dan kalender ruang event
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";
import { getBusinessDate } from "../components/tools/dashboard_metrics.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { kodeCabang, namaHotel } = resolveEffectiveBranch(req, req.body?.kode_cabang);
    if (!kodeCabang) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Kode cabang tidak valid atau belum ditentukan",
        datetime: formatDateSystem(),
      });
    }

    const businessDate = await getBusinessDate(kodeCabang);
    const targetDate = req.body?.target_date || businessDate;

    // Default range for monthly calendar (15 days before, 45 days after targetDate)
    const dateFrom = req.body?.date_from || targetDate;
    const dateTo = req.body?.date_to || (() => {
      const d = new Date(targetDate);
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();

    // 1. Fetch all active event rooms in this branch
    const rooms = await DB("mst_ruang_event as re")
      .where("re.kode_cabang", kodeCabang)
      .where("re.is_active", 1)
      .select("re.id", "re.kode_ruang_event", "re.nama_ruang", "re.kapasitas_orang", "re.luas_sqm", "re.layout_support")
      .orderBy("re.nama_ruang", "asc");

    const roomCodes = rooms.map((r) => r.kode_ruang_event);

    // 2. Fetch events for targetDate (for timeline & today summary)
    const todayEventsRows = roomCodes.length > 0
      ? await DB("trx_reservasi_event as e")
          .where("e.kode_cabang", kodeCabang)
          .where("e.is_active", 1)
          .whereIn("e.status_event", ["tentative", "confirmed", "in_progress", "completed"])
          .whereRaw("e.tgl_mulai <= ?", [targetDate])
          .whereRaw("e.tgl_selesai >= ?", [targetDate])
          .select("e.*")
          .orderBy("e.jam_mulai", "asc")
      : [];

    // 3. Fetch calendar events for range (dateFrom to dateTo)
    const calendarEventsRows = roomCodes.length > 0
      ? await DB("trx_reservasi_event as e")
          .where("e.kode_cabang", kodeCabang)
          .where("e.is_active", 1)
          .whereIn("e.status_event", ["tentative", "confirmed", "in_progress", "completed", "cancelled"])
          .whereRaw("e.tgl_mulai <= ?", [dateTo])
          .whereRaw("e.tgl_selesai >= ?", [dateFrom])
          .select("e.*")
          .orderBy("e.tgl_mulai", "asc")
          .orderBy("e.jam_mulai", "asc")
      : [];

    // Safe lookups for guest and corporate names
    const allEvents = [...todayEventsRows, ...calendarEventsRows];
    const guestCodes = [...new Set(allEvents.map((e) => e.kode_tamu).filter(Boolean))];
    const corpCodes = [...new Set(allEvents.map((e) => e.kode_corporate).filter(Boolean))];

    const [guestMap, corpMap] = await Promise.all([
      guestCodes.length > 0
        ? DB("mst_guest")
            .whereIn("kode_tamu", guestCodes)
            .select("kode_tamu", "full_name")
            .then((list) => new Map(list.map((g) => [g.kode_tamu, g.full_name])))
            .catch(() => new Map())
        : Promise.resolve(new Map()),
      corpCodes.length > 0
        ? DB("mst_corporate_account")
            .whereIn("kode_corporate", corpCodes)
            .select("kode_corporate", "name")
            .then((list) => new Map(list.map((c) => [c.kode_corporate, c.name])))
            .catch(() => new Map())
        : Promise.resolve(new Map()),
    ]);

    const roomMap = new Map(rooms.map((r) => [r.kode_ruang_event, r]));

    // Format Current Time (HH:mm) for today status
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Compute Today's Metrics
    let inUseCount = 0;
    let expectedGuestsToday = 0;
    const occupiedRoomCodesNow = new Set();

    const formattedTodayEvents = todayEventsRows.map((e) => {
      const r = roomMap.get(e.kode_ruang_event) || {};
      const organizer = corpMap.get(e.kode_corporate) || guestMap.get(e.kode_tamu) || e.contact_person || "Penyelenggara";
      const jamMulai = e.jam_mulai ? String(e.jam_mulai).slice(0, 5) : "00:00";
      const jamSelesai = e.jam_selesai ? String(e.jam_selesai).slice(0, 5) : "23:59";
      const pax = parseInt(e.jumlah_tamu, 10) || 0;

      expectedGuestsToday += pax;

      const isCurrentTimeWithin = currentHourMin >= jamMulai && currentHourMin <= jamSelesai;
      const isOngoing = (e.status_event === "in_progress") || (e.status_event === "confirmed" && isCurrentTimeWithin);

      if (isOngoing) {
        inUseCount++;
        occupiedRoomCodesNow.add(e.kode_ruang_event);
      }

      return {
        id: e.id,
        kode_reservasi_event: e.kode_reservasi_event,
        nama_event: e.nama_event || "Agenda Acara",
        kode_ruang_event: e.kode_ruang_event,
        nama_ruang: r.nama_ruang || e.kode_ruang_event,
        organizer,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
        jumlah_tamu: pax,
        layout_setup: e.layout_setup || "theater",
        status_event: e.status_event,
        status_pembayaran: e.status_pembayaran || "unpaid",
        is_ongoing_now: isOngoing,
      };
    });

    const availableRoomsCount = Math.max(0, rooms.length - occupiedRoomCodesNow.size);

    // Build Hourly Matrix for each room (07:00 to 22:00)
    const hours = Array.from({ length: 16 }, (_, i) => 7 + i); // 7, 8, ..., 22
    const timelineMatrix = rooms.map((room) => {
      const roomEvents = formattedTodayEvents.filter((ev) => ev.kode_ruang_event === room.kode_ruang_event);
      const isCurrentlyInUse = occupiedRoomCodesNow.has(room.kode_ruang_event);

      const slots = hours.map((hour) => {
        const slotHourStr = `${String(hour).padStart(2, "0")}:00`;
        const nextHourStr = `${String(hour + 1).padStart(2, "0")}:00`;

        // Check if any event falls in this hour slot
        const matched = roomEvents.find((ev) => {
          return ev.jam_mulai < nextHourStr && ev.jam_selesai > slotHourStr;
        });

        if (matched) {
          return {
            hour,
            status: "occupied",
            event_code: matched.kode_reservasi_event,
            event_name: matched.nama_event,
            status_event: matched.status_event,
            organizer: matched.organizer,
          };
        }

        return {
          hour,
          status: "available",
          event_code: null,
          event_name: null,
          status_event: null,
          organizer: null,
        };
      });

      return {
        kode_ruang_event: room.kode_ruang_event,
        nama_ruang: room.nama_ruang,
        kapasitas: room.kapasitas_orang || 0,
        status_sekarang: isCurrentlyInUse ? "in_use" : "available",
        total_events_today: roomEvents.length,
        slots,
      };
    });

    // Format Calendar Events
    const calendarEvents = calendarEventsRows.map((e) => {
      const r = roomMap.get(e.kode_ruang_event) || {};
      const organizer = corpMap.get(e.kode_corporate) || guestMap.get(e.kode_tamu) || e.contact_person || "Penyelenggara";
      const startDateStr = String(e.tgl_mulai).slice(0, 10);
      const endDateStr = String(e.tgl_selesai).slice(0, 10);
      const startTimeStr = e.jam_mulai ? String(e.jam_mulai).slice(0, 5) : "08:00";
      const endTimeStr = e.jam_selesai ? String(e.jam_selesai).slice(0, 5) : "12:00";

      return {
        id: e.kode_reservasi_event,
        title: `${e.nama_event || 'Event'} - ${r.nama_ruang || e.kode_ruang_event}`,
        nama_event: e.nama_event || "Agenda Acara",
        kode_ruang_event: e.kode_ruang_event,
        nama_ruang: r.nama_ruang || e.kode_ruang_event,
        organizer,
        start: `${startDateStr}T${startTimeStr}:00`,
        end: `${endDateStr}T${endTimeStr}:00`,
        date_start: startDateStr,
        date_end: endDateStr,
        time_start: startTimeStr,
        time_end: endTimeStr,
        jumlah_tamu: parseInt(e.jumlah_tamu, 10) || 0,
        layout_setup: e.layout_setup || "theater",
        status_event: e.status_event,
        status_pembayaran: e.status_pembayaran || "unpaid",
        total_biaya: parseFloat(e.total_biaya) || 0,
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data monitoring dan jadwal ruang event berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        target_date: targetDate,
        summary_cards: {
          total_rooms: rooms.length,
          in_use_now: inUseCount,
          available_now: availableRoomsCount,
          today_events_count: formattedTodayEvents.length,
          expected_guests_today: expectedGuestsToday,
        },
        today_events: formattedTodayEvents,
        timeline_matrix: timelineMatrix,
        calendar_events: calendarEvents,
        rooms: rooms.map((r) => ({
          kode_ruang_event: r.kode_ruang_event,
          nama_ruang: r.nama_ruang,
          kapasitas_orang: r.kapasitas_orang,
          is_in_use: occupiedRoomCodesNow.has(r.kode_ruang_event),
        })),
      },
    });
  } catch (error) {
    console.error("Error in event_monitoring.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memuat monitoring ruang event",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
