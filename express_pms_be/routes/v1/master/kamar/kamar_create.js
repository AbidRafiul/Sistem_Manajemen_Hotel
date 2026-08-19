/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file kamar_create.js
 * @description Endpoint create master kamar
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
import { generateSequence } from "../../components/tools/generateCode.js";
const router = express.Router();
router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  try {
    if (!oPayload || Object.keys(oPayload).length < 1) return res.status(400).json({ status: status.BAD_REQUEST, message: "Invalid request body", datetime: formatDateSystem() });
    const cValidation = await validatePayload(
      { kode_cabang: Joi.string().required().label("Cabang"), kode_gedung: Joi.string().allow(null).optional().label("Gedung"), kode_lantai: Joi.string().required().label("Lantai"), kode_tipe_kamar: Joi.string().required().label("Tipe Kamar"), kode_bed_type: Joi.string().allow(null).optional().label("Bed Type"), name: Joi.string().min(1).max(20).required().label("Nomor Kamar"), tipe_view: Joi.string().allow("",null).optional().label("View"), catatan: Joi.string().allow("",null).optional().label("Catatan"), boleh_merokok: Joi.number().valid(0,1).optional().label("Smoking"), occupancy_status: Joi.string().valid("vacant","occupied","blocked").optional().label("Occupancy Status"), housekeeping_status: Joi.string().valid("clean","dirty","inspection","maintenance").optional().label("Housekeeping Status"), is_active: Joi.number().valid(0,1).optional().default(1).label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi", "any.only": "{#label} nilai tidak valid" },
      oPayload, { table: "mst_kamar", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    if (oPayload.occupancy_status === "occupied" && oPayload.housekeeping_status === "maintenance") {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Kamar yang sedang ditempati (Occupied) tidak boleh berstatus Maintenance.", datetime: formatDateSystem() });
    }

    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-KAMAR", trx);
      const oData = { kode_cabang: oPayload.kode_cabang, kode_gedung: oPayload.kode_gedung || null, kode_lantai: oPayload.kode_lantai, kode_tipe_kamar: oPayload.kode_tipe_kamar, kode_bed_type: oPayload.kode_bed_type || null, kode_kamar: cUniqueCode, nomor_kamar: oPayload.name, tipe_pemandangan: oPayload.tipe_view || null, catatan: oPayload.catatan || null, boleh_merokok: oPayload.boleh_merokok ?? 0, occupancy_status: oPayload.occupancy_status || "vacant", housekeeping_status: oPayload.housekeeping_status || "clean", is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1, created_by: req.auth?.user_id || 1, created_at: formatDateSystem(), updated_at: formatDateSystem() };
      
      const existingData = await trx("mst_kamar").where("kode_kamar", cUniqueCode).first();
      if (existingData) {
        throw new Error("DUPLICATE_CODE");
      }
      
      await trx("mst_kamar").insert(oData);
      await ChangesLog({ description: "Tambah Master Kamar", tableName: "mst_kamar", referenceCode: cUniqueCode, action: "CREATE", dataBefore: null, dataAfter: oData, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data Master Kamar berhasil dibuat", datetime: formatDateSystem(), data: { kode_kamar: cUniqueCode } });
  } catch (error) {
    if (error.message === "DUPLICATE_CODE") {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Kode sudah digunakan, silakan coba lagi.", datetime: formatDateSystem() });
    }
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/kamar/kamar_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
