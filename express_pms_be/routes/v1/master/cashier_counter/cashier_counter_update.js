/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file cashier_counter_update.js
 * @description Endpoint update master cashier counter
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, ChangesLog, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.put("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const user_id = req?.auth?.user_id || 0;

  try {
    if (!oPayload || Object.keys(oPayload).length < 1)
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Invalid request body",
          datetime: formatDateSystem(),
        });

    const cValidation = await validatePayload(
      {
        id: Joi.number().required().label("ID"),
        name: Joi.string().min(2).max(50).required().label("Nama Counter"),
        is_active: Joi.number().valid(0, 1).optional().label("Status Aktif"),
      },
      {
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
      },
      oPayload,
      { table: "mst_cashier_counter", allowUnknown: true }
    );

    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    await DB.transaction(async (trx) => {
      const existingData = await trx("mst_cashier_counter").where("id", oPayload.id).first();
      
      if (!existingData) {
        throw new Error("Data tidak ditemukan");
      }

      const oData = {
        name: oPayload.name,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : existingData.is_active,
        updated_at: formatDateSystem(),
        updated_by: user_id,
      };

      await trx("mst_cashier_counter").where("id", oPayload.id).update(oData);

      await ChangesLog({
        tableName: "mst_cashier_counter",
        type: "UPDATE",
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
      message: "Data Master Cashier Counter berhasil diupdate",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "UPDATE DATA",
      TableName: "mst_cashier_counter",
      file: "cashier_counter_update.js",
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
