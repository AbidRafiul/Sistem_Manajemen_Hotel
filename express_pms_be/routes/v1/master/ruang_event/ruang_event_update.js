/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file ruang_event_update.js
 * @description Endpoint update ruang event
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
      { kode: Joi.string().required().label("Kode"), kode_cabang: Joi.string().required().label("Kode Cabang"), kode_tipe_ruang_event: Joi.string().required().label("Tipe Ruang Event"), nama_ruang: Joi.string().required().label("Nama Ruang"), kapasitas_orang: Joi.number().optional().allow("", null).label("Kapasitas Orang"), luas_sqm: Joi.number().optional().allow("", null).label("Luas m2"), layout_support: Joi.string().optional().allow("", null).label("Layout Support"), is_active: Joi.number().valid(0,1).optional().label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi" },
      oPayload, { table: "mst_ruang_event", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_ruang_event").where("kode", oPayload.kode).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ status: status.NOT_FOUND, message: "Data tidak ditemukan", datetime: formatDateSystem() });
    
    const oData = { kode_cabang: oPayload.kode_cabang, kode_tipe_ruang_event: oPayload.kode_tipe_ruang_event, nama_ruang: oPayload.nama_ruang, kapasitas_orang: oPayload.kapasitas_orang ?? existing.kapasitas_orang, luas_sqm: oPayload.luas_sqm ?? existing.luas_sqm, layout_support: oPayload.layout_support ?? existing.layout_support, is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active, updated_by: req.auth?.user_id || 1, updated_at: formatDateSystem() };
    await DB.transaction(async (trx) => {
      await trx("mst_ruang_event").where("kode", oPayload.kode).update(oData);
      await ChangesLog({ description: "Update Master Ruang Event", tableName: "mst_ruang_event", referenceCode: oPayload.kode, action: "UPDATE", dataBefore: existing, dataAfter: { ...existing, ...oData }, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data berhasil diperbarui", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/ruang_event/ruang_event_update.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
