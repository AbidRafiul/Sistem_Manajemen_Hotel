/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_delete.js
 * @description Endpoint soft delete master shift
 * @author Antigravity
 * @created 2026-09-30
 * @version 1.0.0
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging, ChangesLog } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.delete("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const user_id = req?.auth?.user_id || 0;

  try {
    if (!oPayload.id) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "ID wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    await DB.transaction(async (trx) => {
      const existingData = await trx("mst_shift").where("id", oPayload.id).first();

      if (!existingData) {
        throw new Error("Data Shift tidak ditemukan");
      }

      const oData = {
        deleted_at: formatDateSystem(),
        deleted_by: user_id,
        is_active: 0,
      };

      await trx("mst_shift").where("id", oPayload.id).update(oData);

      await ChangesLog({
        tableName: "mst_shift",
        type: "DELETE",
        dataSebelum: existingData,
        dataSesudah: oData,
        pkField: "kode_shift",
        pkValue: existingData.kode_shift,
        user: username,
      }, trx);
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data Master Shift berhasil dihapus",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SHIFT_DELETE",
      TableName: "mst_shift",
      User: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal menghapus data Master Shift",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
