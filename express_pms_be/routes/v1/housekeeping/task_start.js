/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file task_start.js
 * @description Endpoint Start Housekeeping Task
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

const handleStart = async (req, res) => {
  const { id } = req.params;
  const user_id = req?.auth?.user_id || 1;

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

    if (existing.status !== 'assigned') {
        return res.status(400).json({
            status: status.BAD_REQUEST,
            message: `Hanya task dengan status assigned yang dapat dimulai. Status saat ini: ${existing.status}`,
            datetime: formatDateSystem(),
        });
    }

    await DB.transaction(async (trx) => {
      const tNow = formatDateSystem();
      // 1. Update status task dan catat jam mulai pembersihan
      await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", id)
        .update({
          status: 'in_progress',
          started_at: tNow,
          updated_at: tNow,
          updated_by: user_id,
        });

      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "UPDATE",
          referenceCode: existing.kode_housekeeping_task,
          description: `Mulai pengerjaan task housekeeping oleh petugas pada ${tNow}`,
          dataBefore: existing,
          dataAfter: { ...existing, status: 'in_progress', started_at: tNow },
          user: user_id ? String(user_id) : "system",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Task berhasil dimulai",
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

router.post("/:id/start", handleStart);
router.patch("/:id/start", handleStart);

export default router;
