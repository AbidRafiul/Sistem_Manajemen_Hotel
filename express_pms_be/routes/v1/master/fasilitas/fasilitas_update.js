/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file fasilitas_update.js
 * @description Endpoint update master fasilitas
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-26
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-26)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, ChangesLog, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
const router = express.Router();
router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  try {
    const cValidation = await validatePayload(
      {
        kode_fasilitas: Joi.string().required().label("Kode Fasilitas"),
        name: Joi.string().min(2).max(100).required().label("Nama Fasilitas"),
        is_active: Joi.number().valid(0, 1).optional().label("Status Aktif"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "string.min": "{#label} minimal {#limit} karakter",
        "string.max": "{#label} maksimal {#limit} karakter",
        "any.required": "{#label} wajib diisi",
      },
      oPayload,
      { table: "mst_fasilitas", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_fasilitas")
      .where("kode_fasilitas", oPayload.kode_fasilitas)
      .whereNull("deleted_at")
      .first();
    if (!existing)
      return res
        .status(404)
        .json({
          status: status.NOT_FOUND,
          message: "Data Fasilitas tidak ditemukan",
          datetime: formatDateSystem(),
        });
    const oData = {
      name: oPayload.name,
      is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active,
      updated_by: req.auth?.user_id || 1,
      updated_at: formatDateSystem(),
    };
    await DB.transaction(async (trx) => {
      await trx("mst_fasilitas").where("kode_fasilitas", oPayload.kode_fasilitas).update(oData);
      await ChangesLog(
        {
          description: "Update Master Fasilitas",
          tableName: "mst_fasilitas",
          referenceCode: oPayload.kode_fasilitas,
          action: "UPDATE",
          dataBefore: existing,
          dataAfter: { ...existing, ...oData },
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });
    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data Master Fasilitas berhasil diperbarui",
        datetime: formatDateSystem(),
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/fasilitas/fasilitas_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
