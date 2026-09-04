/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file cashier_counter_create.js
 * @description Endpoint create master cashier counter
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
import { generateSequence } from "../../components/tools/generateCode.js";

const router = express.Router();

router.post("/", async (req, res) => {
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
        kode_cabang: Joi.string().required().label("Kode Cabang"),
        name: Joi.string().min(2).max(50).required().label("Nama Counter"),
        is_active: Joi.number().valid(0, 1).optional().default(1).label("Status Aktif"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.required": "{#label} wajib diisi",
        "any.only": "{#label} nilai tidak valid",
        "number.base": "{#label} harus berupa angka",
      },
      oPayload,
      { table: "mst_cashier_counter", allowUnknown: true }
    );

    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-COUNTER", trx);
      const oData = {
        kode_cabang: oPayload.kode_cabang,
        kode_counter: cUniqueCode,
        name: oPayload.name,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1,
        created_at: formatDateSystem(),
        created_by: user_id,
        updated_at: formatDateSystem(),
        updated_by: user_id,
      };

      await trx("mst_cashier_counter").insert(oData);

      await ChangesLog({
        tableName: "mst_cashier_counter",
        type: "CREATE",
        dataSebelum: {},
        dataSesudah: oData,
        pkField: "kode_counter",
        pkValue: cUniqueCode,
        username: username,
        trx: trx,
      });
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data Master Cashier Counter berhasil ditambahkan",
      datetime: formatDateSystem(),
      data: { kode_counter: cUniqueCode },
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "INSERT DATA",
      TableName: "mst_cashier_counter",
      file: "cashier_counter_create.js",
      username: username,
    });
    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
