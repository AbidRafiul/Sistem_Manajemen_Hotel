/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file harga_ruang_event_delete.js
 * @description Endpoint delete harga ruang event
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
      { kode_harga_ruang_event: Joi.array().items(Joi.string()).min(1).required().label("Kode") },
      {
        "array.base": "{#label} harus berupa array",
        "array.min": "Minimal pilih satu data",
        "any.required": "{#label} wajib dikirim",
      },
      oPayload,
      { table: "mst_harga_ruang_event", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    await DB.transaction(async (trx) => {
      const records = await trx("mst_harga_ruang_event")
        .whereIn("kode_harga_ruang_event", oPayload.kode_harga_ruang_event)
        .whereNull("deleted_at")
        .forUpdate();
      if (!records || records.length < 1) {
        const e = new Error("Data tidak ditemukan");
        e.statusCode = 404;
        throw e;
      }
      await trx("mst_harga_ruang_event")
        .whereIn("kode_harga_ruang_event", oPayload.kode_harga_ruang_event)
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
            description: "Soft Delete Master Harga Ruang Event",
            tableName: "mst_harga_ruang_event",
            referenceCode: r.kode_harga_ruang_event,
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
        message: "Data berhasil dihapus",
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
      file: "master/harga_ruang_event/harga_ruang_event_delete.js",
      func: "delete",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
