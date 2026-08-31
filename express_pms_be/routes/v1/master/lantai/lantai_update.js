/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file lantai_update.js
 * @description Endpoint update master lantai
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-13
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-13)
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
        kode_lantai: Joi.string().required().label("Kode"),
        kode_gedung: Joi.string().required().label("Gedung"),
        name: Joi.string().min(2).max(50).required().label("Nama Lantai"),
        nomor_lantai: Joi.number().integer().required().label("Nomor Lantai"),
        is_active: Joi.number().valid(0, 1).optional().label("Status Aktif"),
      },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi" },
      oPayload,
      { table: "mst_lantai", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_lantai")
      .where("kode_lantai", oPayload.kode_lantai)
      .whereNull("deleted_at")
      .first();
    if (!existing)
      return res
        .status(404)
        .json({
          status: status.NOT_FOUND,
          message: "Data tidak ditemukan",
          datetime: formatDateSystem(),
        });
    const oData = {
      kode_gedung: oPayload.kode_gedung,
      nama_lantai: oPayload.name,
      nomor_lantai: oPayload.nomor_lantai,
      is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active,
      updated_by: req.auth?.user_id || 1,
      updated_at: formatDateSystem(),
    };
    await DB.transaction(async (trx) => {
      await trx("mst_lantai").where("kode_lantai", oPayload.kode_lantai).update(oData);
      await ChangesLog(
        {
          description: "Update Master Lantai",
          tableName: "mst_lantai",
          referenceCode: oPayload.kode_lantai,
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
        message: "Data berhasil diperbarui",
        datetime: formatDateSystem(),
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/lantai/lantai_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
