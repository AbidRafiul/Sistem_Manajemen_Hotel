/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file task_cancel.js
 * @description Endpoint Cancel Housekeeping Task
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-08
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-08)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { ChangesLog } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

const handleCancel = async (req, res) => {
  const { id } = req.params;
  const { cancel_reason } = req.body;
  const user_id = req?.auth?.user_id || 1;

  if (!cancel_reason || cancel_reason.trim() === '') {
      return res.status(400).json({
          status: status.BAD_REQUEST,
          message: "Alasan pembatalan (cancel_reason) wajib diisi",
          datetime: formatDateSystem(),
      });
  }

  try {
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

    if (existing.status === 'supervisor_approved') {
        return res.status(400).json({
            status: status.BAD_REQUEST,
            message: `Task yang sudah diverifikasi tidak dapat dibatalkan.`,
            datetime: formatDateSystem(),
        });
    }

    await DB.transaction(async (trx) => {
      // Update status task menjadi canceled, isi reason, dan set deleted_at
      await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", id)
        .update({
          status: 'canceled',
          cancel_reason: cancel_reason,
          deleted_at: formatDateSystem(),
          deleted_by: user_id,
          updated_at: formatDateSystem(),
          updated_by: user_id,
        });

      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "UPDATE",
          referenceCode: existing.kode_housekeeping_task,
          description: `Pembatalan task housekeeping: ${cancel_reason}`,
          dataBefore: existing,
          dataAfter: { ...existing, status: 'canceled', cancel_reason: cancel_reason, deleted_at: formatDateSystem() },
          user: user_id ? String(user_id) : "system",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Task berhasil dibatalkan",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal",
      datetime: formatDateSystem(),
    });
  }
};

router.post("/:id/cancel", handleCancel);
router.patch("/:id/cancel", handleCancel);

export default router;
