/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file bed_type_delete.js
 * @description Endpoint delete master bed type
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
    if (!oPayload || Object.keys(oPayload).length < 1)
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Invalid request body",
          datetime: formatDateSystem(),
        });
    const cValidation = await validatePayload(
      { kode_bed_type: Joi.array().items(Joi.string()).min(1).required().label("Kode Bed Type") },
      {
        "array.base": "{#label} harus berupa array",
        "array.min": "Minimal pilih satu data untuk dihapus",
        "any.required": "{#label} wajib dikirim",
      },
      oPayload,
      { table: "mst_bed_type", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    await DB.transaction(async (trx) => {
      const records = await trx("mst_bed_type")
        .whereIn("kode_bed_type", oPayload.kode_bed_type)
        .whereNull("deleted_at")
        .forUpdate();
      if (!records || records.length < 1) {
        const e = new Error("Data tidak ditemukan");
        e.statusCode = 404;
        throw e;
      }
      await trx("mst_bed_type")
        .whereIn("kode_bed_type", oPayload.kode_bed_type)
        .update({
          is_active: 0,
          deleted_at: formatDateSystem(),
          deleted_by: req.auth?.user_id || 1,
          updated_at: formatDateSystem(),
          updated_by: req.auth?.user_id || 1,
        });
      for (const r of records)
        await ChangesLog(
          {
            description: "Soft Delete Master Bed Type",
            tableName: "mst_bed_type",
            referenceCode: r.kode_bed_type,
            action: "DELETE",
            dataBefore: r,
            dataAfter: { ...r, is_active: 0, deleted_at: formatDateSystem() },
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
        message: "Data Master Bed Type berhasil dihapus",
        datetime: formatDateSystem(),
      });
  } catch (error) {
    if (error.statusCode === 404)
      return res
        .status(404)
        .json({
          status: status.NOT_FOUND,
          message: "Data tidak ditemukan atau sudah terhapus",
          datetime: formatDateSystem(),
        });
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/bed_type/bed_type_delete.js",
      func: "delete",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
