/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file task_assign.js
 * @description Endpoint Assign Housekeeping Task
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-08
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-08)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../components/tools/general.js";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { validatePayload, ChangesLog } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { findIdleHousekeeper } from "../components/tools/housekeeping_helper.js";

const router = express.Router();

const handleAssign = async (req, res) => {
  const { id } = req.params;
  const oPayload = req.body;
  const user_id = req?.auth?.user_id || 1;

  try {
    const cValidation = await validatePayload(
      {
        assigned_to: Joi.number().optional().allow(null, "").label("Ditugaskan Kepada"),
        auto_assign: Joi.boolean().optional().label("Auto Assign"),
      },
      {
        "number.base": "{#label} harus berupa angka",
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    const existing = await DB("trx_housekeeping_task")
      .where("kode_housekeeping_task", id)
      .where("is_active", 1)
      .whereNull("deleted_at")
      .first();

    if (!existing) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Task tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    if (existing.status !== 'finished' && existing.status !== 'canceled') {
        // Cek apakah ada task aktif lain untuk kamar ini (mungkin insert bersamaan)
        const activeTask = await DB("trx_housekeeping_task")
            .where("kode_kamar", existing.kode_kamar)
            .whereIn("status", ['assigned', 'in_progress'])
            .where("id", "!=", existing.id)
            .whereNull("deleted_at")
            .first();

        if (activeTask) {
             return res.status(400).json({
                status: status.BAD_REQUEST,
                message: `Kamar ini sudah memiliki task aktif lainnya (${activeTask.kode_housekeeping_task}).`,
                datetime: formatDateSystem(),
            });
        }
    }

    if (!['assigned', 'in_progress'].includes(existing.status)) {
        return res.status(400).json({
            status: status.BAD_REQUEST,
            message: `Tidak dapat meng-assign task yang sudah ${existing.status}`,
            datetime: formatDateSystem(),
        });
    }

    let targetUserId = oPayload.assigned_to;
    let targetUserName = "";

    if (oPayload.auto_assign || !targetUserId) {
        const idle = await findIdleHousekeeper(existing.kode_cabang, DB);
        if (!idle) {
            return res.status(400).json({
                status: status.BAD_REQUEST,
                message: "Tidak ada petugas housekeeping yang tersedia untuk ditugaskan otomatis.",
                datetime: formatDateSystem(),
            });
        }
        targetUserId = idle.id;
        targetUserName = idle.fullname;
    } else {
        const staff = await DB("mst_user").where("id", targetUserId).first();
        targetUserName = staff?.fullname || `ID ${targetUserId}`;
    }

    await DB.transaction(async (trx) => {
      await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", id)
        .update({
          assigned_to: targetUserId,
          updated_at: formatDateSystem(),
          updated_by: user_id,
        });

      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "UPDATE",
          referenceCode: existing.kode_housekeeping_task,
          description: `Penugasan petugas housekeeping kepada ${targetUserName}`,
          dataBefore: existing,
          dataAfter: { ...existing, assigned_to: targetUserId },
          user: user_id ? String(user_id) : "system",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Task berhasil ditugaskan kepada ${targetUserName}`,
      datetime: formatDateSystem(),
      data: {
        kode_housekeeping_task: id,
        assigned_to: targetUserId,
        assigned_to_name: targetUserName
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal",
      datetime: formatDateSystem(),
    });
  }
};

router.post("/:id/assign", handleAssign);
router.patch("/:id/assign", handleAssign);

export default router;
