/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file night_audit_scheduler.js
 * @description Background scheduler otomatis untuk menjalankan proses Night Audit & Rollover
 *              pada jam malam yang dikonfigurasi (default: 02:00 WIB), dengan pengamanan pre-check,
 *              pencegahan double execution per hari, dan logging notifikasi terintegrasi.
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "./date_tools.js";
import {
  runPreAuditCheck,
  startNightAudit
} from "./night_audit_service.js";
import { getCurrentBusinessDate } from "./business_date_helper.js";

let schedulerTimer = null;
const executedDateBranchMap = new Map(); // Key: `${kode_cabang}-${calendarYmd}`, Value: timestamp

/**
 * Mendapatkan konfigurasi scheduler saat ini dari environment atau default.
 */
export const getSchedulerConfig = () => {
  const isEnabled = process.env.NIGHT_AUDIT_AUTO_ENABLED !== "false";
  const scheduledTime = process.env.NIGHT_AUDIT_AUTO_TIME || "02:00"; // format HH:mm
  return {
    is_enabled: isEnabled,
    scheduled_time: scheduledTime,
    default_timezone: "Asia/Jakarta"
  };
};

/**
 * Mendapatkan waktu saat ini (HH:mm dan YYYY-MM-DD) dalam zona waktu tertentu.
 */
const getNowInTimezone = (timeZone = "Asia/Jakarta") => {
  try {
    const now = new Date();
    const formatterTime = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const formatterDate = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    return {
      timeStr: formatterTime.format(now), // "02:00"
      dateStr: formatterDate.format(now)  // "2026-10-09"
    };
  } catch {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const ymd = now.toISOString().split("T")[0];
    return { timeStr: `${h}:${m}`, dateStr: ymd };
  }
};

/**
 * Menjalankan Night Audit terjadwal untuk 1 cabang tertentu secara aman.
 * @param {string} kodeCabang - Kode cabang yang akan diaudit
 * @param {boolean} force - Abaikan pengecekan waktu / eksekusi ganda hari ini
 */
export const runScheduledAuditForBranch = async (kodeCabang, force = false) => {
  console.log(`[NIGHT_AUDIT_SCHEDULER] Memulai pemeriksaan audit otomatis untuk cabang: ${kodeCabang}`);

  // 1. Ambil status business date terkini
  const bDateInfo = await getCurrentBusinessDate(kodeCabang);
  if (!bDateInfo || !bDateInfo.current_business_date) {
    console.warn(`[NIGHT_AUDIT_SCHEDULER] Cabang ${kodeCabang} belum memiliki Business Date aktif.`);
    return {
      success: false,
      kode_cabang: kodeCabang,
      reason: "NO_ACTIVE_BUSINESS_DATE"
    };
  }

  // 2. Pre-Audit System Check
  const preCheck = await runPreAuditCheck(kodeCabang);
  if (!preCheck.can_proceed || (preCheck.blockers && preCheck.blockers.length > 0)) {
    const blockerSummaries = (preCheck.blockers || []).map((b) => `${b.type}: ${b.title}`).join(", ");
    console.warn(
      `[NIGHT_AUDIT_SCHEDULER] ⚠️ Audit otomatis untuk cabang ${kodeCabang} DIBATALKAN karena terdapat ${preCheck.blockers.length} Blocker: [${blockerSummaries}]`
    );

    // Logging ke trx_notification_log
    try {
      await DB("trx_notification_log").insert({
        kode_notification_log: `NL-${Date.now().toString(36).toUpperCase()}`,
        kode_cabang: kodeCabang,
        event_code: "NIGHT_AUDIT_AUTO_BLOCKED",
        channel: "push",
        recipient: "system_admin",
        ref_type: "trx_night_audit",
        kode_ref: bDateInfo.current_business_date,
        status: "failed",
        sent_at: formatDateSystem(),
        created_at: formatDateSystem()
      });
    } catch (logErr) {
      console.warn("[NIGHT_AUDIT_SCHEDULER] Gagal insert notifikasi blocker:", logErr.message);
    }

    return {
      success: false,
      kode_cabang: kodeCabang,
      reason: "PRE_CHECK_BLOCKERS_EXIST",
      blockers: preCheck.blockers,
      warnings: preCheck.warnings
    };
  }

  // 3. Jalankan Night Audit (dengan otomatis acknowledge warnings pada mode cron)
  try {
    const idempotencyKey = `AUTO-NA-${kodeCabang}-${bDateInfo.current_business_date}`;
    const result = await startNightAudit({
      kodeCabang,
      businessDate: bDateInfo.current_business_date,
      userId: 1, // System Automated Bot / Superadmin ID
      warningsAcknowledged: true,
      idempotencyKey
    });

    console.log(
      `[NIGHT_AUDIT_SCHEDULER] ✅ Audit otomatis SUKSES untuk cabang ${kodeCabang}. Kode Audit: ${result.kode_night_audit}. Rollover ke tanggal: ${result.next_business_date}. Total diposting: ${result.summary.total_posted} kamar.`
    );

    return {
      success: true,
      kode_cabang: kodeCabang,
      audit_result: result
    };
  } catch (auditErr) {
    console.error(
      `[NIGHT_AUDIT_SCHEDULER] ❌ Gagal mengeksekusi audit otomatis cabang ${kodeCabang}:`,
      auditErr.message
    );
    return {
      success: false,
      kode_cabang: kodeCabang,
      reason: "EXECUTION_ERROR",
      error: auditErr.message
    };
  }
};

/**
 * Menjalankan audit otomatis untuk seluruh cabang aktif yang memenuhi syarat waktu.
 */
export const runScheduledAuditForAllBranches = async (force = false) => {
  const config = getSchedulerConfig();
  if (!config.is_enabled && !force) {
    return { is_enabled: false, processed: 0, results: [] };
  }

  try {
    const activeBranches = await DB("mst_cabang")
      .where("is_active", 1)
      .select("kode_cabang", "nama_hotel", "zona_waktu");

    const results = [];

    for (const branch of activeBranches) {
      const tz = branch.zona_waktu || config.default_timezone;
      const { timeStr, dateStr } = getNowInTimezone(tz);

      const runKey = `${branch.kode_cabang}-${dateStr}`;

      // Periksa apakah waktu sekarang sesuai dengan jadwal atau force
      const isTimeMatch = timeStr === config.scheduled_time;
      const alreadyRunToday = executedDateBranchMap.has(runKey);

      if (force || (isTimeMatch && !alreadyRunToday)) {
        console.log(
          `[NIGHT_AUDIT_SCHEDULER] Memicu eksekusi untuk ${branch.nama_hotel} (${branch.kode_cabang}) [Waktu Lokal: ${timeStr}, Jadwal: ${config.scheduled_time}]`
        );
        const res = await runScheduledAuditForBranch(branch.kode_cabang, force);
        executedDateBranchMap.set(runKey, new Date().toISOString());
        results.push(res);
      }
    }

    return {
      is_enabled: config.is_enabled,
      processed: results.length,
      results
    };
  } catch (err) {
    console.error("[NIGHT_AUDIT_SCHEDULER] Error running batch audit:", err.message);
    return { error: err.message, results: [] };
  }
};

/**
 * Memulai Background Timer Scheduler.
 * Memeriksa kecocokan waktu setiap 30 detik.
 */
export const startNightAuditScheduler = () => {
  const config = getSchedulerConfig();

  if (!config.is_enabled) {
    console.log("[NIGHT_AUDIT_SCHEDULER] Scheduler otomatis dinonaktifkan via konfigurasi environment (NIGHT_AUDIT_AUTO_ENABLED=false).");
    return;
  }

  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log(
    `[NIGHT_AUDIT_SCHEDULER] ⏰ Background Scheduler aktif. Jadwal harian: pukul ${config.scheduled_time} (Zona waktu masing-masing cabang).`
  );

  // Periksa setiap 30 detik
  schedulerTimer = setInterval(async () => {
    try {
      await runScheduledAuditForAllBranches(false);
    } catch (tickErr) {
      console.error("[NIGHT_AUDIT_SCHEDULER] Error tick:", tickErr.message);
    }
  }, 30000);

  // Jalankan non-blocking initial check
  setTimeout(() => {
    runScheduledAuditForAllBranches(false).catch(() => {});
  }, 3000);
};

/**
 * Menghentikan Background Timer Scheduler.
 */
export const stopNightAuditScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log("[NIGHT_AUDIT_SCHEDULER] Background Scheduler dihentikan.");
  }
};

/**
 * Mendapatkan status operasional scheduler saat ini.
 */
export const getSchedulerStatus = async () => {
  const config = getSchedulerConfig();
  const branches = await DB("mst_cabang")
    .where("is_active", 1)
    .select("kode_cabang", "nama_hotel", "zona_waktu");

  const branchStatuses = branches.map((b) => {
    const tz = b.zona_waktu || config.default_timezone;
    const { timeStr, dateStr } = getNowInTimezone(tz);
    const runKey = `${b.kode_cabang}-${dateStr}`;

    return {
      kode_cabang: b.kode_cabang,
      nama_hotel: b.nama_hotel,
      zona_waktu: tz,
      local_time: timeStr,
      local_date: dateStr,
      scheduled_time: config.scheduled_time,
      is_executed_today: executedDateBranchMap.has(runKey),
      last_executed_at: executedDateBranchMap.get(runKey) || null
    };
  });

  return {
    is_running: Boolean(schedulerTimer),
    is_enabled: config.is_enabled,
    scheduled_time: config.scheduled_time,
    total_active_branches: branches.length,
    branches: branchStatuses
  };
};
