/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file ruang_event_create.js
 * @description Endpoint create ruang event
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
    if (!oPayload || Object.keys(oPayload).length < 1) return res.status(400).json({ status: status.BAD_REQUEST, message: "Invalid request body", datetime: formatDateSystem() });
    const cValidation = await validatePayload(
      { kode_cabang: Joi.string().required().label("Kode Cabang"), kode_tipe_ruang_event: Joi.string().required().label("Tipe Ruang Event"), nama_ruang: Joi.string().required().label("Nama Ruang"), kapasitas_orang: Joi.number().optional().allow("", null).label("Kapasitas Orang"), luas_sqm: Joi.number().optional().allow("", null).label("Luas m2"), layout_support: Joi.string().optional().allow("", null).label("Layout Support"), is_active: Joi.number().valid(0,1).optional().default(1).label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi", "number.base": "{#label} harus berupa angka" },
      oPayload, { table: "mst_ruang_event", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    
    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-RUANGEVENT", trx);
      const oData = { kode_ruang_event: cUniqueCode, kode_cabang: oPayload.kode_cabang, kode_tipe_ruang_event: oPayload.kode_tipe_ruang_event, nama_ruang: oPayload.nama_ruang, kapasitas_orang: oPayload.kapasitas_orang || null, luas_sqm: oPayload.luas_sqm || null, layout_support: oPayload.layout_support || null, is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1, created_by: req.auth?.user_id || 1, created_at: formatDateSystem(), updated_at: formatDateSystem() };
      
      const existingData = await trx("mst_ruang_event").where("kode_ruang_event", cUniqueCode).first();
      if (existingData) throw new Error("DUPLICATE_CODE");
      
      await trx("mst_ruang_event").insert(oData);
      await ChangesLog({ description: "Tambah Master Ruang Event", tableName: "mst_ruang_event", referenceCode: cUniqueCode, action: "CREATE", dataBefore: null, dataAfter: oData, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data Master Ruang Event berhasil dibuat", datetime: formatDateSystem(), data: { kode_ruang_event: cUniqueCode } });
  } catch (error) {
    if (error.message === "DUPLICATE_CODE") return res.status(400).json({ status: status.BAD_REQUEST, message: "Kode sudah digunakan, silakan coba lagi.", datetime: formatDateSystem() });
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/ruang_event/ruang_event_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
