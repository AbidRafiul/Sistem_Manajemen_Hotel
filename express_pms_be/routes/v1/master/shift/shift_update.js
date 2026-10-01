/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_update.js
 * @description Endpoint update master shift
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

const router = express.Router();

const handleUpdate = async (req, res) => {
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
        id: Joi.number().required().label("ID"),
        nama_shift: Joi.string().min(2).max(100).required().label("Nama Shift"),
        waktu_mulai: Joi.string().required().label("Jam Mulai"),
        waktu_selesai: Joi.string().required().label("Jam Selesai"),
        default_opening_cash: Joi.number().min(0).optional().label("Modal Awal Standar"),
        is_night_audit: Joi.number().valid(0, 1).optional().label("Flag Night Audit"),
        urutan: Joi.number().optional().label("Urutan Shift"),
        is_active: Joi.number().valid(0, 1).optional().label("Status Aktif"),
      },
      {
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
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

    await DB.transaction(async (trx) => {
      const existingData = await trx("mst_shift").where("id", oPayload.id).first();

      if (!existingData) {
        throw new Error("Data Shift tidak ditemukan");
      }

      const oData = {
        nama_shift: oPayload.nama_shift,
        waktu_mulai: oPayload.waktu_mulai,
        waktu_selesai: oPayload.waktu_selesai,
        default_opening_cash: oPayload.default_opening_cash !== undefined ? oPayload.default_opening_cash : existingData.default_opening_cash,
        is_night_audit: oPayload.is_night_audit !== undefined ? oPayload.is_night_audit : existingData.is_night_audit,
        urutan: oPayload.urutan !== undefined ? oPayload.urutan : existingData.urutan,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : existingData.is_active,
        updated_at: formatDateSystem(),
        updated_by: user_id,
      };

      await trx("mst_shift").where("id", oPayload.id).update(oData);

      await ChangesLog({
        tableName: "mst_shift",
        type: "UPDATE",
        dataSebelum: existingData,
        dataSesudah: oData,
        pkField: "id",
        pkValue: oPayload.id,
        user: username,
      }, trx);
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data Master Shift berhasil diubah",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SHIFT_UPDATE",
      TableName: "mst_shift",
      User: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal mengubah data Master Shift",
      datetime: formatDateSystem(),
    });
  }
};
router.put("/", handleUpdate);
router.post("/", handleUpdate);

export default router;
