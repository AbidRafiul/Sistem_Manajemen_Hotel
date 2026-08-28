/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_create.js
 * @description Endpoint create master rate plan
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
      { kode_cabang: Joi.string().required().label("Kode Cabang"),  name: Joi.string().required().label("Nama Paket"), tipe_paket: Joi.string().valid('RO','BB','HB','FB','AI').required().label("Tipe Paket"), bisa_refund: Joi.number().valid(0,1).optional().default(0).label("Bisa Refund"), termasuk_sarapan: Joi.number().valid(0,1).optional().default(0).label("Termasuk Sarapan"), minimal_malam: Joi.number().optional().default(1).label("Minimal Malam"), maksimal_malam: Joi.number().optional().allow(null).label("Maksimal Malam"), is_active: Joi.number().valid(0,1).optional().default(1).label("Status Aktif"), tipe_markup: Joi.string().valid('nominal','persen').required().label("Tipe Markup"), nilai_markup: Joi.number().min(0).required().label("Nilai Markup") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi", "number.base": "{#label} harus berupa angka", "any.only": "{#label} nilai tidak valid" },
      oPayload, { table: "mst_paket_harga", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-RATEPLAN", trx);
      const oData = { kode_cabang: oPayload.kode_cabang, kode_paket_harga: cUniqueCode, nama_paket: oPayload.name, tipe_paket: oPayload.tipe_paket, tipe_markup: oPayload.tipe_markup, nilai_markup: oPayload.nilai_markup, dapat_di_refund: oPayload.bisa_refund ?? 0, termasuk_sarapan: oPayload.termasuk_sarapan ?? 0, minimal_malam: oPayload.minimal_malam ?? 1, maksimal_malam: oPayload.maksimal_malam ?? null, is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1, created_by: req.auth?.user_id || 1, created_at: formatDateSystem(), updated_at: formatDateSystem() };
      
      const existingData = await trx("mst_paket_harga").where("kode_paket_harga", cUniqueCode).first();
      if (existingData) {
        throw new Error("DUPLICATE_CODE");
      }
      
      await trx("mst_paket_harga").insert(oData);
      await ChangesLog({ description: "Tambah Master Rate Plan", tableName: "mst_paket_harga", referenceCode: cUniqueCode, action: "CREATE", dataBefore: null, dataAfter: oData, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data Master Rate Plan berhasil dibuat", datetime: formatDateSystem(), data: { kode_paket_harga: cUniqueCode } });
  } catch (error) {
    if (error.message === "DUPLICATE_CODE") {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Kode sudah digunakan, silakan coba lagi.", datetime: formatDateSystem() });
    }
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/rate_plan/rate_plan_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
