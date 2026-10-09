/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file task_checklist.js
 * @description Endpoint untuk mencentang / memperbarui status checklist instruksi FO oleh Housekeeping
 * @author Antigravity
 * @created 2026-10-06
 * @version 1.0.0
 */

import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { ChangesLog, Logging } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

router.post("/:id/checklist", async (req, res) => {
  const { id } = req.params;
  const oPayload = req.body || {};
  const username = req?.auth?.username || "system";
  const user_id = req?.auth?.user_id || null;

  try {
    if (!Array.isArray(oPayload.checklist)) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Format checklist tidak valid. Harus berupa array item checklist.",
        datetime: formatDateSystem()
      });
    }

    const task = await DB("trx_housekeeping_task")
      .where("kode_housekeeping_task", id)
      .where("is_active", 1)
      .whereNull("deleted_at")
      .first();

    if (!task) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Tugas housekeeping tidak ditemukan.",
        datetime: formatDateSystem()
      });
    }

    const tNow = formatDateSystem();
    const updatedChecklist = oPayload.checklist.map((item) => ({
      id: item.id,
      task: item.task,
      checked: !!item.checked,
      checked_at: item.checked ? (item.checked_at || tNow) : null,
      checked_by: item.checked ? (item.checked_by || username) : null
    }));

    await DB.transaction(async (trx) => {
      await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", id)
        .update({
          checklist: JSON.stringify(updatedChecklist),
          updated_at: tNow,
          updated_by: user_id
        });

      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "UPDATE",
          referenceCode: id,
          description: `Pembaruan checklist catatan FO pada task ${id} oleh ${username}`,
          dataBefore: { checklist: task.checklist },
          dataAfter: { checklist: updatedChecklist },
          user: username
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Checklist instruksi berhasil diperbarui.",
      datetime: tNow,
      data: {
        kode_housekeeping_task: id,
        checklist: updatedChecklist
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "UPDATE TASK CHECKLIST",
      TableName: "trx_housekeeping_task",
      file: "task_checklist.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan sistem saat memperbarui checklist tugas.",
      datetime: formatDateSystem(),
      data: null
    });
  }
});

export default router;
