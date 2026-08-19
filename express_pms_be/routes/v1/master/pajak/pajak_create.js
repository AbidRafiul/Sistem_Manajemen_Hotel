/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file pajak_create.js
 * @description Endpoint create master pajak
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
      { kode_cabang: Joi.string().required().label("Kode Cabang"),  name: Joi.string().min(2).max(50).required().label("Nama Pajak"), tax_type: Joi.string().valid("tax","service_charge").required().label("Tipe Pajak"), percentage: Joi.number().min(0).max(100).required().label("Persentase"), is_compounding: Joi.number().valid(0,1).optional().default(0).label("Compounding"), is_active: Joi.number().valid(0,1).optional().default(1).label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "string.empty": "{#label} tidak boleh kosong", "any.required": "{#label} wajib diisi", "any.only": "{#label} nilai tidak valid", "number.base": "{#label} harus berupa angka", "number.min": "{#label} minimal {#limit}", "number.max": "{#label} maksimal {#limit}" },
      oPayload, { table: "mst_tax", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-PAJAK", trx);
      const oData = { kode_cabang: oPayload.kode_cabang, kode_pajak: cUniqueCode, name: oPayload.name, tax_type: oPayload.tax_type, percentage: oPayload.percentage, is_compounding: oPayload.is_compounding !== undefined ? oPayload.is_compounding : 0, is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1, created_by: req.auth?.user_id || 1, created_at: formatDateSystem(), updated_at: formatDateSystem() };
      
      const existingData = await trx("mst_tax").where("kode_pajak", cUniqueCode).first();
      if (existingData) {
        throw new Error("DUPLICATE_CODE");
      }
      
      await trx("mst_tax").insert(oData);
      await ChangesLog({ description: "Tambah Master Pajak", tableName: "mst_tax", referenceCode: cUniqueCode, action: "CREATE", dataBefore: null, dataAfter: oData, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data Master Pajak berhasil dibuat", datetime: formatDateSystem(), data: { kode_pajak: cUniqueCode } });
  } catch (error) {
    if (error.message === "DUPLICATE_CODE") {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Kode sudah digunakan, silakan coba lagi.", datetime: formatDateSystem() });
    }
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/pajak/pajak_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
