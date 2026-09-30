/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_create.js
 * @description Endpoint create master shift
 * @author Antigravity
 * @created 2026-09-30
 * @version 1.0.0
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
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Invalid request body",
        datetime: formatDateSystem(),
      });

    const cValidation = await validatePayload(
      {
        kode_cabang: Joi.string().required().label("Kode Cabang"),
        nama_shift: Joi.string().min(2).max(100).required().label("Nama Shift"),
        waktu_mulai: Joi.string().required().label("Jam Mulai"),
        waktu_selesai: Joi.string().required().label("Jam Selesai"),
        default_opening_cash: Joi.number().min(0).optional().default(1000000).label("Modal Awal Standar"),
        is_night_audit: Joi.number().valid(0, 1).optional().default(0).label("Flag Night Audit"),
        urutan: Joi.number().optional().default(1).label("Urutan Shift"),
        is_active: Joi.number().valid(0, 1).optional().default(1).label("Status Aktif"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
      },
      oPayload,
      { table: "mst_shift", allowUnknown: true }
    );

    if (cValidation)
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });

    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-MSTSHIFT", trx);
      const oData = {
        kode_cabang: oPayload.kode_cabang,
        kode_shift: cUniqueCode,
        nama_shift: oPayload.nama_shift,
        waktu_mulai: oPayload.waktu_mulai,
        waktu_selesai: oPayload.waktu_selesai,
        default_opening_cash: oPayload.default_opening_cash !== undefined ? oPayload.default_opening_cash : 1000000.0,
        is_night_audit: oPayload.is_night_audit !== undefined ? oPayload.is_night_audit : 0,
        urutan: oPayload.urutan !== undefined ? oPayload.urutan : 1,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1,
        created_at: formatDateSystem(),
        created_by: user_id,
        updated_at: formatDateSystem(),
        updated_by: user_id,
      };

      await trx("mst_shift").insert(oData);

      await ChangesLog({
        tableName: "mst_shift",
        type: "CREATE",
        dataSebelum: {},
        dataSesudah: oData,
        pkField: "kode_shift",
        pkValue: cUniqueCode,
        user: username,
      }, trx);
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data Master Shift berhasil disimpan",
      datetime: formatDateSystem(),
      data: { kode_shift: cUniqueCode },
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SHIFT_CREATE",
      TableName: "mst_shift",
      User: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal menyimpan data Master Shift",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
