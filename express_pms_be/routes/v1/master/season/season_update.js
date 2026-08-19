/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file season_update.js
 * @description Endpoint update master season
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
      { kode_cabang: Joi.string().required().label("Kode Cabang"),  kode_musim: Joi.string().required().label("Kode"), nama_musim: Joi.string().required().label("Nama Musim"), tanggal_mulai: Joi.string().required().label("Tanggal Mulai"), tanggal_selesai: Joi.string().required().label("Tanggal Selesai"), hari_berlaku: Joi.string().optional().allow("", null).label("Hari Berlaku"), is_active: Joi.number().valid(0,1).optional().default(1).label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi" },
      oPayload, { table: "mst_musim", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_musim").where("kode_musim", oPayload.kode_musim).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ status: status.NOT_FOUND, message: "Data tidak ditemukan", datetime: formatDateSystem() });
    const oData = { kode_cabang: oPayload.kode_cabang, nama_musim: oPayload.nama_musim, tanggal_mulai: oPayload.tanggal_mulai ?? existing.tanggal_mulai, tanggal_selesai: oPayload.tanggal_selesai ?? existing.tanggal_selesai, hari_berlaku: oPayload.hari_berlaku ?? existing.hari_berlaku, is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active, updated_by: req.auth?.user_id || 1, updated_at: formatDateSystem() };
    await DB.transaction(async (trx) => {
      await trx("mst_musim").where("kode_musim", oPayload.kode_musim).update(oData);
      await ChangesLog({ description: "Update Master Season", tableName: "mst_musim", referenceCode: oPayload.kode_musim, action: "UPDATE", dataBefore: existing, dataAfter: { ...existing, ...oData }, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data berhasil diperbarui", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/season/season_update.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
