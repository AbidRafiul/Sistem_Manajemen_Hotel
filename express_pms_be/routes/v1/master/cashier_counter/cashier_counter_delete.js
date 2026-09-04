/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file cashier_counter_delete.js
 * @description Endpoint delete master cashier counter
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.1
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
      const existingData = await trx("mst_cashier_counter").where("id", oPayload.id).first();
      
      if (!existingData) {
        throw new Error("Data tidak ditemukan");
      }

      const oData = {
        deleted_at: formatDateSystem(),
        deleted_by: user_id,
        is_active: 0
      };

      await trx("mst_cashier_counter").where("id", oPayload.id).update(oData);

      await ChangesLog({
        tableName: "mst_cashier_counter",
        type: "DELETE",
        dataSebelum: existingData,
        dataSesudah: oData,
        pkField: "kode_counter",
        pkValue: existingData.kode_counter,
        username: username,
        trx: trx,
      });
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data Master Cashier Counter berhasil dihapus",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "DELETE DATA",
      TableName: "mst_cashier_counter",
      file: "cashier_counter_delete.js",
      username: username,
    });
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message === "Data tidak ditemukan" ? error.message : "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
