/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_update.js
 * @description Endpoint update master rate plan
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
      { kode_cabang: Joi.string().required().label("Kode Cabang"),  kode_paket_harga: Joi.string().required().label("Kode"), name: Joi.string().required().label("Nama Paket"), tipe_paket: Joi.string().valid('RO','BB','HB','FB','AI').required().label("Tipe Paket"), bisa_refund: Joi.number().valid(0,1).optional().default(0).label("Bisa Refund"), termasuk_sarapan: Joi.number().valid(0,1).optional().default(0).label("Termasuk Sarapan"), minimal_malam: Joi.number().optional().default(1).label("Minimal Malam"), maksimal_malam: Joi.number().optional().allow(null).label("Maksimal Malam"), is_active: Joi.number().valid(0,1).optional().default(1).label("Status Aktif"), tipe_markup: Joi.string().valid('nominal','persen').required().label("Tipe Markup"), nilai_markup: Joi.number().min(0).required().label("Nilai Markup") },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi", "any.only": "{#label} nilai tidak valid" },
      oPayload, { table: "mst_paket_harga", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_paket_harga").where("kode_paket_harga", oPayload.kode_paket_harga).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ status: status.NOT_FOUND, message: "Data tidak ditemukan", datetime: formatDateSystem() });
    const oData = { kode_cabang: oPayload.kode_cabang, nama_paket: oPayload.name, tipe_paket: oPayload.tipe_paket, tipe_markup: oPayload.tipe_markup, nilai_markup: oPayload.nilai_markup, dapat_di_refund: oPayload.bisa_refund ?? existing.dapat_di_refund, termasuk_sarapan: oPayload.termasuk_sarapan ?? existing.termasuk_sarapan, minimal_malam: oPayload.minimal_malam ?? existing.minimal_malam, maksimal_malam: oPayload.maksimal_malam ?? existing.maksimal_malam, is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active, updated_by: req.auth?.user_id || 1, updated_at: formatDateSystem() };
    await DB.transaction(async (trx) => {
      await trx("mst_paket_harga").where("kode_paket_harga", oPayload.kode_paket_harga).update(oData);
      await ChangesLog({ description: "Update Master Rate Plan", tableName: "mst_paket_harga", referenceCode: oPayload.kode_paket_harga, action: "UPDATE", dataBefore: existing, dataAfter: { ...existing, ...oData }, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data berhasil diperbarui", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/rate_plan/rate_plan_update.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
