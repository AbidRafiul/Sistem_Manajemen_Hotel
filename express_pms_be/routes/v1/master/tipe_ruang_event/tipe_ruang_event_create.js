/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_ruang_event_create.js
 * @description Endpoint create tipe ruang event
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
import { generateSequence } from "../../components/tools/generateCode.js";
const router = express.Router();
router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
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
        nama_tipe: Joi.string().required().label("Nama Tipe"),
        is_active: Joi.number().valid(0, 1).optional().default(1).label("Status Aktif"),
      },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi" },
      oPayload,
      { table: "mst_tipe_ruang_event", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-TIPERUANGEVENT", trx);
      const oData = {
        kode_tipe_ruang_event: cUniqueCode,
        nama_tipe: oPayload.nama_tipe,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1,
        created_by: req.auth?.user_id || 1,
        created_at: formatDateSystem(),
        updated_at: formatDateSystem(),
      };

      const existingData = await trx("mst_tipe_ruang_event")
        .where("kode_tipe_ruang_event", cUniqueCode)
        .first();
      if (existingData) throw new Error("DUPLICATE_CODE");

      await trx("mst_tipe_ruang_event").insert(oData);
      await ChangesLog(
        {
          description: "Tambah Master Tipe Ruang Event",
          tableName: "mst_tipe_ruang_event",
          referenceCode: cUniqueCode,
          action: "CREATE",
          dataBefore: null,
          dataAfter: oData,
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
        message: "Data Master Tipe Ruang Event berhasil dibuat",
        datetime: formatDateSystem(),
        data: { kode_tipe_ruang_event: cUniqueCode },
      });
  } catch (error) {
    if (error.message === "DUPLICATE_CODE")
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Kode sudah digunakan, silakan coba lagi.",
          datetime: formatDateSystem(),
        });
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/tipe_ruang_event/tipe_ruang_event_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
