/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file task_create.js
 * @description Endpoint Pembuatan Tugas Housekeeping Baru (Stayover Cleaning / Make Up Room / Departure)
 * @author Antigravity
 * @created 2026-10-06
 * @version 1.0.0
 */
import express from "express";
import Joi from "joi";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { validatePayload, ChangesLog } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { findIdleHousekeeper } from "../components/tools/housekeeping_helper.js";
import { generateSequence } from "../components/tools/generateCode.js";
import { assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router();

const handleCreate = async (req, res) => {
  const oPayload = req.body || {};
  const user_id = req?.auth?.user_id || 1;
  const username = req?.auth?.username || "system";

  try {
    const cValidation = await validatePayload(
      {
        kode_kamar: Joi.string().required().label("Kode Kamar"),
        kode_cabang: Joi.string().optional().allow(null, "").label("Kode Cabang"),
        task_type: Joi.string().valid("cleaning", "inspection", "maintenance_check").default("cleaning").label("Tipe Tugas"),
        priority: Joi.string().valid("normal", "urgent").default("normal").label("Prioritas"),
        notes: Joi.string().optional().allow(null, "").label("Catatan Khusus"),
        assigned_to: Joi.number().optional().allow(null, "").label("Ditugaskan Kepada"),
        auto_assign: Joi.boolean().optional().default(false).label("Auto Assign"),
        kode_reservasi_room: Joi.string().optional().allow(null, "").label("Kode Reservasi Room"),
        request_source: Joi.string().valid("front_office", "guest_request", "housekeeping", "checkout").default("guest_request").label("Sumber Permintaan"),
        checklist: Joi.array().optional().allow(null).label("Checklist Instruksi"),
      },
      {
        "any.required": "{#label} wajib diisi",
        "string.base": "{#label} harus berupa teks",
        "number.base": "{#label} harus berupa angka",
      },
      oPayload,
      { allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });
    }

    // 1. Cari kamar di mst_kamar
    const kamar = await DB("mst_kamar")
      .where("kode_kamar", oPayload.kode_kamar)
      .where("is_active", 1)
      .whereNull("deleted_at")
      .first();

    if (!kamar) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: `Kamar dengan kode ${oPayload.kode_kamar} tidak ditemukan.`,
        datetime: formatDateSystem(),
      });
    }

    const targetCabang = oPayload.kode_cabang || kamar.kode_cabang;

    // Validasi isolasi cabang jika user memiliki branch scope
    assertBranchScope(req, targetCabang);

    // 2. Proteksi Idempotensi: Cek apakah kamar sudah memiliki task aktif
    const activeTask = await DB("trx_housekeeping_task")
      .where("kode_kamar", oPayload.kode_kamar)
      .whereIn("status", ["assigned", "in_progress"])
      .where("is_active", 1)
      .whereNull("deleted_at")
      .first();

    if (activeTask) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: `Kamar ${kamar.nomor_kamar} sudah memiliki tugas pembersihan aktif (${activeTask.kode_housekeeping_task}) dengan status '${activeTask.status}'. Tidak dapat membuat tugas baru sebelum tugas sebelumnya selesai atau dibatalkan.`,
        datetime: formatDateSystem(),
        data: {
          existing_task: activeTask,
        },
      });
    }

    // 3. Resolusi Petugas PIC (Auto-assign atau Manual)
    let targetUserId = oPayload.assigned_to ? Number(oPayload.assigned_to) : null;
    let targetUserName = "";

    if (oPayload.auto_assign || !targetUserId) {
      const idleStaff = await findIdleHousekeeper(targetCabang, DB);
      if (idleStaff) {
        targetUserId = idleStaff.id;
        targetUserName = idleStaff.fullname;
      }
    } else if (targetUserId) {
      const staffUser = await DB("mst_user")
        .where("id", targetUserId)
        .where("status", "1")
        .first();
      targetUserName = staffUser?.fullname || `ID ${targetUserId}`;
    }

    const tNow = formatDateSystem();
    let createdTask = null;

    // 4. Eksekusi Transaksi Database
    await DB.transaction(async (trx) => {
      // A. Generate Kode Task Unik
      const taskCode = await generateSequence("FMT-TASK", trx);

      // B. Insert ke trx_housekeeping_task
      const insertData = {
        kode_housekeeping_task: taskCode,
        kode_cabang: targetCabang,
        kode_kamar: oPayload.kode_kamar,
        task_type: oPayload.task_type || "cleaning",
        assigned_to: targetUserId || null,
        priority: oPayload.priority || "normal",
        status: "assigned",
        notes: oPayload.notes || null,
        checklist: oPayload.checklist ? JSON.stringify(oPayload.checklist) : null,
        kode_reservasi_room: oPayload.kode_reservasi_room || null,
        request_source: oPayload.request_source || "guest_request",
        is_active: 1,
        created_by: user_id,
        created_at: tNow,
      };

      await trx("trx_housekeeping_task").insert(insertData);

      // C. Update status kamar di mst_kamar
      // PENTING: occupancy_status TIDAK DIUBAH (tetap 'occupied' untuk tamu menginap, atau 'vacant')
      const oldHkStatus = kamar.housekeeping_status;
      await trx("mst_kamar")
        .where("kode_kamar", kamar.kode_kamar)
        .update({
          housekeeping_status: "dirty",
          updated_at: tNow,
          updated_by: user_id,
        });

      // D. Catat ke trx_room_status_log
      const logCode = await generateSequence("FMT-RSL", trx);
      await trx("trx_room_status_log").insert({
        kode_room_status_log: logCode,
        kode_kamar: kamar.kode_kamar,
        status_from: kamar.occupancy_status,
        status_to: kamar.occupancy_status,
        changed_by: user_id,
        changed_at: tNow,
      });

      // E. Audit Trail ChangesLog
      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "CREATE",
          referenceCode: taskCode,
          description: `Permintaan pembersihan kamar ${kamar.nomor_kamar} (${oPayload.task_type || "cleaning"})${targetUserName ? ` ditugaskan ke ${targetUserName}` : ""}${oPayload.notes ? ` - Catatan: ${oPayload.notes}` : ""}`,
          dataBefore: null,
          dataAfter: insertData,
          user: username || String(user_id),
        },
        trx
      );

      await ChangesLog(
        {
          tableName: "mst_kamar",
          action: "UPDATE",
          referenceCode: kamar.kode_kamar,
          description: `Status housekeeping kamar ${kamar.nomor_kamar} berubah dari ${oldHkStatus} menjadi dirty (Pembersihan Diminta)`,
          dataBefore: kamar,
          dataAfter: { ...kamar, housekeeping_status: "dirty" },
          user: username || String(user_id),
        },
        trx
      );

      createdTask = {
        ...insertData,
        nomor_kamar: kamar.nomor_kamar,
        occupancy_status: kamar.occupancy_status,
        assigned_to_name: targetUserName || null,
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Tugas pembersihan kamar ${kamar.nomor_kamar} berhasil dibuat.${targetUserName ? ` Ditugaskan kepada: ${targetUserName}.` : ""}`,
      datetime: formatDateSystem(),
      data: createdTask,
    });
  } catch (error) {
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal saat membuat tugas housekeeping",
      datetime: formatDateSystem(),
    });
  }
};

router.post("/", handleCreate);
router.post("/create", handleCreate);

export default router;
