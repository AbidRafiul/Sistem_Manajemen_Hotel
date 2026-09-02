/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file harga_ruang_event_update.js
 * @description Endpoint update harga ruang event
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
        kode_harga_ruang_event: Joi.string().required().label("Kode"),
        kode_ruang_event: Joi.string().required().label("Ruang Event"),
        tipe_sewa: Joi.string()
          .valid("per_jam", "half_day", "full_day")
          .required()
          .label("Tipe Sewa"),
        kode_musim: Joi.string().optional().allow("", null).label("Musim"),
        harga: Joi.number().required().label("Harga"),
        is_active: Joi.number().valid(0, 1).optional().label("Status Aktif"),
      },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi" },
      oPayload,
      { table: "mst_harga_ruang_event", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_harga_ruang_event")
      .where("kode_harga_ruang_event", oPayload.kode_harga_ruang_event)
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
      kode_ruang_event: oPayload.kode_ruang_event,
      tipe_sewa: oPayload.tipe_sewa,
      kode_musim: oPayload.kode_musim ?? existing.kode_musim,
      harga: oPayload.harga ?? existing.harga,
      is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active,
      updated_by: req.auth?.user_id || 1,
      updated_at: formatDateSystem(),
    };
    await DB.transaction(async (trx) => {
      await trx("mst_harga_ruang_event")
        .where("kode_harga_ruang_event", oPayload.kode_harga_ruang_event)
        .update(oData);
      await ChangesLog(
        {
          description: "Update Master Harga Ruang Event",
          tableName: "mst_harga_ruang_event",
          referenceCode: oPayload.kode_harga_ruang_event,
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
      file: "master/harga_ruang_event/harga_ruang_event_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
