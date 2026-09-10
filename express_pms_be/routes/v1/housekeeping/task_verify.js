/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file task_verify.js
 * @description Endpoint Verify Housekeeping Task
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

const handleVerify = async (req, res) => {
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

    if (existing.status !== 'finished') {
        return res.status(400).json({
            status: status.BAD_REQUEST,
            message: `Hanya task dengan status finished yang dapat diverifikasi. Status saat ini: ${existing.status}`,
            datetime: formatDateSystem(),
        });
    }

    const kamar = await DB("mst_kamar")
      .where("kode_kamar", existing.kode_kamar)
      .whereNull("deleted_at")
      .first();

    await DB.transaction(async (trx) => {
      // 1. Update status task menjadi supervisor_approved
      await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", id)
        .update({
          status: 'supervisor_approved',
          supervisor_id: user_id,
          approved_at: formatDateSystem(),
          updated_at: formatDateSystem(),
          updated_by: user_id,
        });

      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "UPDATE",
          referenceCode: existing.kode_housekeeping_task,
          description: "Verifikasi tugas housekeeping oleh supervisor",
          dataBefore: existing,
          dataAfter: { ...existing, status: 'supervisor_approved', supervisor_id: user_id },
          user: user_id ? String(user_id) : "system",
        },
        trx
      );

      // 2. Update status kamar menjadi clean jika kamar ditemukan
      if (kamar) {
          await trx("mst_kamar")
            .where("kode_kamar", kamar.kode_kamar)
            .update({
              housekeeping_status: 'clean',
              updated_at: formatDateSystem(),
              updated_by: user_id,
            });

          await ChangesLog(
            {
              tableName: "mst_kamar",
              action: "UPDATE",
              referenceCode: kamar.kode_kamar,
              description: "Update status kamar menjadi clean",
              dataBefore: kamar,
              dataAfter: { ...kamar, housekeeping_status: 'clean' },
              user: user_id ? String(user_id) : "system",
            },
            trx
          );
      }
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Task berhasil diverifikasi, status kamar kini clean",
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

router.post("/:id/verify", handleVerify);
router.patch("/:id/verify", handleVerify);

export default router;
