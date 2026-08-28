/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_kamar_update.js
 * @deskripsi Endpoint update master tipe kamar
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
      { kode_cabang: Joi.string().required().label("Kode Cabang"),  kode_tipe_kamar: Joi.string().required().label("Kode"), name: Joi.string().required().label("Nama Tipe"), kode_bed_type: Joi.string().allow(null).optional().label("Bed Type"), kapasitas_dasar: Joi.number().required().label("Kapasitas Dasar"), kapasitas_maksimal: Joi.number().required().label("Kapasitas Maksimal"), luas_m2: Joi.number().optional().allow("", null).label("Luas m2"), deskripsi: Joi.string().optional().allow("", null).label("Deskripsi"), is_active: Joi.number().valid(0,1).optional().default(1).label("Status Aktif"), harga_default: Joi.number().min(0).required().label("Harga Default") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi" },
      oPayload, { table: "mst_tipe_kamar", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_tipe_kamar").where("kode_tipe_kamar", oPayload.kode_tipe_kamar).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ status: status.NOT_FOUND, message: "Data tidak ditemukan", datetime: formatDateSystem() });
    const oData = { kode_cabang: oPayload.kode_cabang, nama_tipe: oPayload.name, kode_bed_type: oPayload.kode_bed_type !== undefined ? oPayload.kode_bed_type : existing.kode_bed_type, kapasitas_dasar: oPayload.kapasitas_dasar ?? existing.kapasitas_dasar, kapasitas_maksimal: oPayload.kapasitas_maksimal ?? existing.kapasitas_maksimal, luas_sqm: oPayload.luas_m2 ?? existing.luas_sqm, harga_default: oPayload.harga_default ?? existing.harga_default, deskripsi: oPayload.deskripsi ?? existing.deskripsi, is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active, updated_by: req.auth?.user_id || 1, updated_at: formatDateSystem() };
    await DB.transaction(async (trx) => {
      await trx("mst_tipe_kamar").where("kode_tipe_kamar", oPayload.kode_tipe_kamar).update(oData);
      await ChangesLog({ deskripsi: "Update Master Tipe Kamar", tableName: "mst_tipe_kamar", referenceCode: oPayload.kode_tipe_kamar, action: "UPDATE", dataBefore: existing, dataAfter: { ...existing, ...oData }, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data berhasil diperbarui", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/tipe_kamar/tipe_kamar_update.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
