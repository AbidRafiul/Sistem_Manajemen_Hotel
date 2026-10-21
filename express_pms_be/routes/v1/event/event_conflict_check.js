/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_conflict_check.js
 * @description POST /api/v1/event/conflict-check - Memeriksa ketersediaan ruang dan bentrok jadwal (Conflict Detection)
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      kode_ruang_event,
      tgl_mulai,
      tgl_selesai,
      jam_mulai,
      jam_selesai,
      setup_buffer_minutes = 30,
      teardown_buffer_minutes = 30,
      exclude_kode_reservasi_event = null,
    } = req.body || {};

    if (!kode_ruang_event || !tgl_mulai || !jam_mulai || !jam_selesai) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_ruang_event, tgl_mulai, jam_mulai, dan jam_selesai wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const effectiveTglSelesai = tgl_selesai || tgl_mulai;

    // Helper untuk mengubah string tanggal + jam ke Date object
    const startDateTime = new Date(`${tgl_mulai}T${jam_mulai.slice(0, 5)}:00`);
    const endDateTime = new Date(`${effectiveTglSelesai}T${jam_selesai.slice(0, 5)}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Format tanggal atau jam tidak valid",
        datetime: formatDateSystem(),
      });
    }

    if (endDateTime <= startDateTime) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Waktu selesai harus lebih besar daripada waktu mulai",
        datetime: formatDateSystem(),
      });
    }

    // Perhitungkan buffer waktu operasional (setup sebelum acara, teardown setelah acara)
    const bufferStart = new Date(startDateTime.getTime() - (parseInt(setup_buffer_minutes, 10) || 0) * 60000);
    const bufferEnd = new Date(endDateTime.getTime() + (parseInt(teardown_buffer_minutes, 10) || 0) * 60000);

    // Ambil semua event aktif di ruangan yang sama pada rentang tanggal tersebut
    let query = DB("trx_reservasi_event as re")
      .where("re.kode_ruang_event", kode_ruang_event)
      .where("re.is_active", 1)
      .whereIn("re.status_event", ["tentative", "confirmed", "in_progress"])
      .whereRaw("re.tgl_mulai <= ?", [effectiveTglSelesai])
      .whereRaw("re.tgl_selesai >= ?", [tgl_mulai]);

    if (exclude_kode_reservasi_event) {
      query = query.whereNot("re.kode_reservasi_event", exclude_kode_reservasi_event);
    }

    const existingEvents = await query.select(
      "re.id",
      "re.kode_reservasi_event",
      "re.nama_event",
      "re.status_event",
      "re.tgl_mulai",
      "re.tgl_selesai",
      "re.jam_mulai",
      "re.jam_selesai",
      "re.setup_buffer_minutes",
      "re.teardown_buffer_minutes",
      "re.contact_person"
    );

    const conflictingEvents = [];

    for (const ev of existingEvents) {
      const evStartDateStr = String(ev.tgl_mulai).slice(0, 10);
      const evEndDateStr = String(ev.tgl_selesai).slice(0, 10);
      const evStartTimeStr = String(ev.jam_mulai).slice(0, 5);
      const evEndTimeStr = String(ev.jam_selesai).slice(0, 5);

      const evStart = new Date(`${evStartDateStr}T${evStartTimeStr}:00`);
      const evEnd = new Date(`${evEndDateStr}T${evEndTimeStr}:00`);

      const evSetupBuffer = parseInt(ev.setup_buffer_minutes, 10) || 30;
      const evTeardownBuffer = parseInt(ev.teardown_buffer_minutes, 10) || 30;

      const evBufferStart = new Date(evStart.getTime() - evSetupBuffer * 60000);
      const evBufferEnd = new Date(evEnd.getTime() + evTeardownBuffer * 60000);

      // Rumus bentrok rentang waktu dengan buffer:
      // (BufferStartBaru < BufferEndLama) AND (BufferEndBaru > BufferStartLama)
      if (bufferStart < evBufferEnd && bufferEnd > evBufferStart) {
        conflictingEvents.push({
          kode_reservasi_event: ev.kode_reservasi_event,
          nama_event: ev.nama_event || "Agenda Acara Hotel",
          status_event: ev.status_event,
          tgl_mulai: evStartDateStr,
          tgl_selesai: evEndDateStr,
          jam_mulai: evStartTimeStr,
          jam_selesai: evEndTimeStr,
          contact_person: ev.contact_person || "-",
          alasan: `Tumpang tindih dengan ${ev.nama_event} (${evStartTimeStr} - ${evEndTimeStr})`,
        });
      }
    }

    const hasConflict = conflictingEvents.length > 0;

    return res.status(200).json({
      status: status.SUKSES,
      message: hasConflict
        ? "Ditemukan bentrok jadwal dengan reservasi lain pada ruang dan waktu yang dipilih"
        : "Ruangan tersedia dan siap dipesan",
      datetime: formatDateSystem(),
      data: {
        is_available: !hasConflict,
        has_conflict: hasConflict,
        total_conflicts: conflictingEvents.length,
        conflicting_events: conflictingEvents,
        checked_time: {
          tgl_mulai,
          tgl_selesai: effectiveTglSelesai,
          jam_mulai,
          jam_selesai,
          setup_buffer_minutes,
          teardown_buffer_minutes,
        },
      },
    });
  } catch (error) {
    console.error("Error in event_conflict_check.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memeriksa bentrok jadwal ruang event",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
