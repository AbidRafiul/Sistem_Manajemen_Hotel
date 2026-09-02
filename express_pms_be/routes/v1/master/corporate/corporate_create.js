/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file corporate_create.js
 * @description Endpoint create master corporate
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
    if (!oPayload || Object.keys(oPayload).length < 1)
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Invalid request body",
          datetime: formatDateSystem(),
        });
    const cValidation = await validatePayload(
      {
        kode_cabang: Joi.string().required().label("Kode Cabang"),
        name: Joi.string().min(2).max(150).required().label("Nama"),
        account_type: Joi.string()
          .valid("corporate", "travel_agent", "ota")
          .required()
          .label("Tipe Akun"),
        npwp: Joi.string().allow("", null).max(30).optional().label("NPWP"),
        billing_address: Joi.string().allow("", null).optional().label("Alamat Billing"),
        payment_term_days: Joi.number().min(0).optional().default(30).label("Term Pembayaran"),
        commission_pct: Joi.number().min(0).max(100).allow(null).optional().label("Komisi (%)"),
        contact_person: Joi.string().allow("", null).max(100).optional().label("Kontak Person"),
        contact_phone: Joi.string().allow("", null).max(30).optional().label("Telepon"),
        contact_email: Joi.string().email().allow("", null).optional().label("Email"),
        is_active: Joi.number().valid(0, 1).optional().default(1).label("Status Aktif"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "any.only": "{#label} nilai tidak valid",
        "string.email": "{#label} format email tidak valid",
      },
      oPayload,
      { table: "mst_corporate_account", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-CORPORATE", trx);
      const oData = {
        kode_cabang: oPayload.kode_cabang,
        kode_corporate: cUniqueCode,
        name: oPayload.name,
        account_type: oPayload.account_type,
        npwp: oPayload.npwp || null,
        billing_address: oPayload.billing_address || null,
        payment_term_days: oPayload.payment_term_days ?? 30,
        commission_pct: oPayload.commission_pct ?? null,
        contact_person: oPayload.contact_person || null,
        contact_phone: oPayload.contact_phone || null,
        contact_email: oPayload.contact_email || null,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1,
        created_by: req.auth?.user_id || 1,
        created_at: formatDateSystem(),
        updated_at: formatDateSystem(),
      };

      const existingData = await trx("mst_corporate_account")
        .where("kode_corporate", cUniqueCode)
        .first();
      if (existingData) {
        throw new Error("DUPLICATE_CODE");
      }

      await trx("mst_corporate_account").insert(oData);
      await ChangesLog(
        {
          description: "Tambah Master Corporate/Travel Agent",
          tableName: "mst_corporate_account",
          referenceCode: cUniqueCode,
          action: "CREATE",
          dataBefore: null,
          dataAfter: oData,
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });
    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data berhasil dibuat",
        datetime: formatDateSystem(),
        data: { kode_corporate: cUniqueCode },
      });
  } catch (error) {
    if (error.message === "DUPLICATE_CODE") {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Kode sudah digunakan, silakan coba lagi.",
          datetime: formatDateSystem(),
        });
    }
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/corporate/corporate_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
