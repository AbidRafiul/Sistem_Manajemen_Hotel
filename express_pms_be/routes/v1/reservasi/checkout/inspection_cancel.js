/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file inspection_cancel.js
 * @description Pembatalan / bypass permintaan inspeksi checkout oleh Front Office (Express Override)
 * @author Antigravity
 * @created 2026-10-06
 * @version 1.0.0
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { ChangesLog, Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "system";
  const user_id = req?.auth?.user_id || null;

  try {
    const taskQuery = DB("trx_housekeeping_task")
      .where("is_active", 1)
      .whereNull("deleted_at");

    if (oPayload.kode_housekeeping_task) {
      taskQuery.where("kode_housekeeping_task", oPayload.kode_housekeeping_task);
    } else if (oPayload.kode_kamar) {
      taskQuery
        .where("kode_kamar", oPayload.kode_kamar)
        .whereIn("status", ["assigned", "in_progress"])
        .where("task_type", "inspection");
    } else {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Harap sertakan kode_housekeeping_task atau kode_kamar.",
        datetime: formatDateSystem()
      });
    }

    const task = await taskQuery.first();

    if (!task) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Tugas inspeksi aktif tidak ditemukan.",
        datetime: formatDateSystem()
      });
    }

    const tNow = formatDateSystem();
    const reason = oPayload.cancel_reason || "Dibatalkan oleh Front Office (Express Checkout Override)";

    await DB.transaction(async (trx) => {
      // 1. Batalkan task
      await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", task.kode_housekeeping_task)
        .update({
          status: "canceled",
          cancel_reason: reason,
          updated_at: tNow,
          updated_by: user_id
        });

      // 2. Kembalikan status housekeeping kamar ke dirty jika saat ini inspection
      const kamar = await trx("mst_kamar")
        .where("kode_kamar", task.kode_kamar)
        .first();

      if (kamar && kamar.housekeeping_status === "inspection") {
        await trx("mst_kamar")
          .where("kode_kamar", task.kode_kamar)
          .update({
            housekeeping_status: "dirty",
            updated_at: tNow,
            updated_by: user_id
          });
      }

      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "UPDATE",
          referenceCode: task.kode_housekeeping_task,
          description: `Pembatalan inspeksi checkout: ${reason}`,
          dataBefore: task,
          dataAfter: { ...task, status: "canceled", cancel_reason: reason },
          user: username
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Permintaan inspeksi kamar berhasil dibatalkan. Siap melanjutkan checkout langsung.",
      datetime: tNow,
      data: {
        kode_housekeeping_task: task.kode_housekeeping_task,
        kode_kamar: task.kode_kamar,
        status: "canceled"
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "CANCEL CHECKOUT INSPECTION",
      TableName: "trx_housekeeping_task",
      file: "inspection_cancel.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan sistem saat membatalkan inspeksi kamar.",
      datetime: formatDateSystem(),
      data: null
    });
  }
});

export default router;
