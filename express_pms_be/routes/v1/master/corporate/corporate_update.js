/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file corporate_update.js
 * @description Endpoint update master corporate
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
      { kode_cabang: Joi.string().required().label("Kode Cabang"),  kode_corporate: Joi.string().required().label("Kode"), name: Joi.string().min(2).max(150).required().label("Nama"), account_type: Joi.string().valid("corporate","travel_agent","ota").required().label("Tipe Akun"), npwp: Joi.string().allow("",null).max(30).optional().label("NPWP"), billing_address: Joi.string().allow("",null).optional().label("Alamat Billing"), payment_term_days: Joi.number().min(0).optional().label("Term Pembayaran"), commission_pct: Joi.number().min(0).max(100).allow(null).optional().label("Komisi (%)"), contact_person: Joi.string().allow("",null).max(100).optional().label("Kontak Person"), contact_phone: Joi.string().allow("",null).max(30).optional().label("Telepon"), contact_email: Joi.string().email().allow("",null).optional().label("Email"), is_active: Joi.number().valid(0,1).optional().label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi", "any.only": "{#label} nilai tidak valid", "string.email": "{#label} format email tidak valid" },
      oPayload, { table: "mst_corporate_account", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_corporate_account").where("kode_corporate", oPayload.kode_corporate).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ status: status.NOT_FOUND, message: "Data tidak ditemukan", datetime: formatDateSystem() });
    const oData = { kode_cabang: oPayload.kode_cabang, name: oPayload.name, account_type: oPayload.account_type, npwp: oPayload.npwp ?? existing.npwp, billing_address: oPayload.billing_address ?? existing.billing_address, payment_term_days: oPayload.payment_term_days ?? existing.payment_term_days, commission_pct: oPayload.commission_pct ?? existing.commission_pct, contact_person: oPayload.contact_person ?? existing.contact_person, contact_phone: oPayload.contact_phone ?? existing.contact_phone, contact_email: oPayload.contact_email ?? existing.contact_email, is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active, updated_by: req.auth?.user_id || 1, updated_at: formatDateSystem() };
    await DB.transaction(async (trx) => {
      await trx("mst_corporate_account").where("kode_corporate", oPayload.kode_corporate).update(oData);
      await ChangesLog({ description: "Update Master Corporate", tableName: "mst_corporate_account", referenceCode: oPayload.kode_corporate, action: "UPDATE", dataBefore: existing, dataAfter: { ...existing, ...oData }, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data berhasil diperbarui", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/corporate/corporate_update.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
