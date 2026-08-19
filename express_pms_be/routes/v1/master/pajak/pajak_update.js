/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file pajak_update.js
 * @description Endpoint update master pajak
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
      { kode_cabang: Joi.string().required().label("Kode Cabang"),  kode_pajak: Joi.string().required().label("Kode Pajak"), name: Joi.string().min(2).max(50).required().label("Nama Pajak"), tax_type: Joi.string().valid("tax","service_charge").required().label("Tipe Pajak"), percentage: Joi.number().min(0).max(100).required().label("Persentase"), is_compounding: Joi.number().valid(0,1).optional().label("Compounding"), is_active: Joi.number().valid(0,1).optional().label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi", "any.only": "{#label} nilai tidak valid" },
      oPayload, { table: "mst_tax", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_tax").where("kode_pajak", oPayload.kode_pajak).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ status: status.NOT_FOUND, message: "Data Pajak tidak ditemukan", datetime: formatDateSystem() });
    const oData = { kode_cabang: oPayload.kode_cabang, name: oPayload.name, tax_type: oPayload.tax_type, percentage: oPayload.percentage, is_compounding: oPayload.is_compounding !== undefined ? oPayload.is_compounding : existing.is_compounding, is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active, updated_by: req.auth?.user_id || 1, updated_at: formatDateSystem() };
    await DB.transaction(async (trx) => {
      await trx("mst_tax").where("kode_pajak", oPayload.kode_pajak).update(oData);
      await ChangesLog({ description: "Update Master Pajak", tableName: "mst_tax", referenceCode: oPayload.kode_pajak, action: "UPDATE", dataBefore: existing, dataAfter: { ...existing, ...oData }, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data Master Pajak berhasil diperbarui", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/pajak/pajak_update.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
