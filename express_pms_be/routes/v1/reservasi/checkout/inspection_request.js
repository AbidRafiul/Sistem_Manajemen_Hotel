/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file inspection_request.js
 * @description Permintaan inspeksi kamar checkout (Room Check) oleh Front Office dengan checklist terstruktur
 * @author Antigravity
 * @created 2026-10-06
 * @version 1.0.0
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { ChangesLog, Logging, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { findIdleHousekeeper } from "../../components/tools/housekeeping_helper.js";
import { resolveEffectiveBranch } from "../../components/tools/scope_helper.js";

const router = express.Router();

const DEFAULT_INSPECTION_CHECKLIST = [
  { id: 1, task: "Cek kulkas minibar (minuman & snack)", checked: false, checked_at: null, checked_by: null },
  { id: 2, task: "Cek kondisi & kelengkapan linen / handuk mandi", checked: false, checked_at: null, checked_by: null },
  { id: 3, task: "Cek fasilitas kamar & perlengkapan (remote, gelas, teko)", checked: false, checked_at: null, checked_by: null },
  { id: 4, task: "Cek brankas, lemari, & laci (barang tamu tertinggal / L&F)", checked: false, checked_at: null, checked_by: null }
];

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "system";
  const user_id = req?.auth?.user_id || null;
  const effective = resolveEffectiveBranch(req, oPayload.kode_cabang);
  const kode_cabang = effective.kodeCabang;

  try {
    const cValidation = await validatePayload(
      {
        kode_kamar: Joi.string().required().label("Kode Kamar"),
        kode_reservasi_room: Joi.string().optional().allow(null, "").label("Kode Reservasi Room"),
        kode_cabang: Joi.string().optional().allow(null, "").label("Kode Cabang"),
        priority: Joi.string().valid("normal", "urgent").default("urgent").label("Prioritas"),
        assigned_to: Joi.number().optional().allow(null).label("Petugas Ditugaskan"),
        notes: Joi.string().optional().allow(null, "").label("Catatan"),
        checklist: Joi.array()
          .items(
            Joi.object({
              id: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
              task: Joi.string().required(),
              checked: Joi.boolean().default(false),
              checked_at: Joi.string().optional().allow(null, ""),
              checked_by: Joi.string().optional().allow(null, "")
            })
          )
          .optional()
          .label("Checklist Inspeksi")
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.required": "{#label} wajib diisi"
      },
      oPayload,
      { table: "trx_housekeeping_task", allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem()
      });
    }

    // 1. Ambil data kamar
    const kamar = await DB("mst_kamar")
      .where("kode_kamar", oPayload.kode_kamar)
      .whereNull("deleted_at")
      .first();

    if (!kamar) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data kamar tidak ditemukan.",
        datetime: formatDateSystem()
      });
    }

    const tNow = formatDateSystem();
    const effectiveBranch = kode_cabang || kamar.kode_cabang;

    // 2. Cek apakah sudah ada task inspeksi aktif untuk kamar ini (Idempotency)
    const activeTask = await DB("trx_housekeeping_task")
      .where("kode_kamar", oPayload.kode_kamar)
      .whereIn("status", ["assigned", "in_progress"])
      .whereNull("deleted_at")
      .where("is_active", 1)
      .first();

    if (activeTask) {
      return res.status(200).json({
        status: status.SUKSES,
        message: "Pemeriksaan kamar untuk kamar ini sedang berjalan.",
        datetime: tNow,
        data: {
          task: activeTask,
          is_existing: true
        }
      });
    }

    // 3. Tentukan checklist
    let finalChecklist = DEFAULT_INSPECTION_CHECKLIST;
    if (Array.isArray(oPayload.checklist) && oPayload.checklist.length > 0) {
      finalChecklist = oPayload.checklist.map((c, idx) => ({
        id: c.id || idx + 1,
        task: c.task,
        checked: !!c.checked,
        checked_at: c.checked_at || null,
        checked_by: c.checked_by || null
      }));
    }

    // 4. Resolusi petugas HK
    let assignedStaffId = oPayload.assigned_to || null;
    let staffName = null;

    if (!assignedStaffId && effectiveBranch) {
      const idleStaff = await findIdleHousekeeper(effectiveBranch, DB);
      if (idleStaff) {
        assignedStaffId = idleStaff.id;
        staffName = idleStaff.nama_user || idleStaff.username;
      }
    } else if (assignedStaffId) {
      const user = await DB("mst_user").where("id", assignedStaffId).first();
      if (user) staffName = user.nama_user || user.username;
    }

    // 5. Eksekusi Transaksi Pembuatan Task Inspeksi & Pembaruan Kamar
    let createdTask = null;

    await DB.transaction(async (trx) => {
      const taskCode = await generateSequence("FMT-TASK", trx);

      const insertData = {
        kode_housekeeping_task: taskCode,
        kode_cabang: effectiveBranch,
        kode_kamar: oPayload.kode_kamar,
        kode_reservasi_room: oPayload.kode_reservasi_room || null,
        task_type: "inspection",
        assigned_to: assignedStaffId,
        priority: oPayload.priority || "urgent",
        status: "assigned",
        request_source: "checkout",
        notes: oPayload.notes ? oPayload.notes.trim() : "Pemeriksaan kamar sebelum checkout (Room Check)",
        checklist: JSON.stringify(finalChecklist),
        inspection_result: "pending",
        is_active: 1,
        created_by: user_id,
        created_at: tNow
      };

      await trx("trx_housekeeping_task").insert(insertData);

      // Ubah status housekeeping kamar menjadi 'inspection'
      const oldHkStatus = kamar.housekeeping_status;
      await trx("mst_kamar")
        .where("kode_kamar", oPayload.kode_kamar)
        .update({
          housekeeping_status: "inspection",
          updated_at: tNow,
          updated_by: user_id
        });

      // Catat log perubahan status kamar
      const rslCode = await generateSequence("FMT-RSL", trx);
      await trx("trx_room_status_log").insert({
        kode_room_status_log: rslCode,
        kode_kamar: oPayload.kode_kamar,
        status_from: oldHkStatus,
        status_to: "inspection",
        changed_by: user_id || 1,
        changed_at: tNow
      });

      // Audit trail
      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "CREATE",
          referenceCode: taskCode,
          description: `Permintaan inspeksi kamar checkout (Room Check) untuk kamar ${kamar.nomor_kamar || oPayload.kode_kamar}`,
          dataBefore: null,
          dataAfter: insertData,
          user: username
        },
        trx
      );

      createdTask = {
        ...insertData,
        checklist: finalChecklist,
        staff_name: staffName,
        nomor_kamar: kamar.nomor_kamar
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Pemeriksaan kamar checkout untuk Kamar ${kamar.nomor_kamar || oPayload.kode_kamar} berhasil dikirim ke Housekeeping.`,
      datetime: tNow,
      data: {
        task: createdTask,
        is_existing: false
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "REQUEST CHECKOUT INSPECTION",
      TableName: "trx_housekeeping_task",
      file: "inspection_request.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan sistem saat meminta pemeriksaan kamar checkout.",
      datetime: formatDateSystem(),
      data: null
    });
  }
});

export default router;
