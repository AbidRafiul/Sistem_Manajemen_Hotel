/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file bed_type_update.js
 * @description Endpoint update master bed type
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
    if (!oPayload || Object.keys(oPayload).length < 1) return res.status(400).json({ status: status.BAD_REQUEST, message: "Invalid request body", datetime: formatDateSystem() });
    const cValidation = await validatePayload(
      { kode_bed_type: Joi.string().required().label("Kode Bed Type"), name: Joi.string().min(2).max(50).required().label("Nama Bed Type"), is_active: Joi.number().valid(0, 1).optional().label("Status Aktif") },
      { "string.base": "{#label} harus berupa teks", "string.empty": "{#label} tidak boleh kosong", "any.required": "{#label} wajib diisi" },
      oPayload, { table: "mst_bed_type", allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    const existing = await DB("mst_bed_type").where("kode_bed_type", oPayload.kode_bed_type).whereNull("deleted_at").first();
    if (!existing) return res.status(404).json({ status: status.NOT_FOUND, message: "Data Bed Type tidak ditemukan", datetime: formatDateSystem() });
    const oData = { name: oPayload.name, is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active, updated_by: req.auth?.user_id || 1, updated_at: formatDateSystem() };
    await DB.transaction(async (trx) => {
      await trx("mst_bed_type").where("kode_bed_type", oPayload.kode_bed_type).update(oData);
      await ChangesLog({ description: "Update Master Bed Type", tableName: "mst_bed_type", referenceCode: oPayload.kode_bed_type, action: "UPDATE", dataBefore: existing, dataAfter: { ...existing, ...oData }, user: username, tz: oPayload.tz || "UTC" }, trx);
    });
    return res.status(200).json({ status: status.SUKSES, message: "Data Master Bed Type berhasil diperbarui", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/bed_type/bed_type_update.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
