/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_create.js
 * @description Endpoint tambah data master tamu
 */
import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, ChangesLog, validatePayload } from "../../components/tools/servertool.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

function calculateCompletenessScore(data) {
  let score = 0;
  if (data.full_name) score += 15;
  if (data.phone) score += 15;
  if (data.email) score += 10;
  if (data.id_type && data.id_number) score += 20;
  if (data.birth_date && data.gender) score += 10;
  if (data.nationality) score += 10;
  if (data.identity_file_path) score += 10;
  if (data.preferences) score += 10;
  return Math.min(score, 100);
}

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const userId = req?.auth?.user_id || null;

  try {
    const schema = {
      kode_cabang: Joi.string().required().label("Kode Cabang"),
      full_name: Joi.string().required().max(150).label("Nama Lengkap"),
      title: Joi.string().optional().allow(null, "").label("Gelar"),
      first_name: Joi.string().optional().allow(null, "").label("Nama Depan"),
      last_name: Joi.string().optional().allow(null, "").label("Nama Belakang"),
      id_type: Joi.string().valid('ktp','passport','sim','other').required().label("Tipe Identitas"),
      id_number: Joi.string().required().max(50).label("Nomor Identitas"),
      phone: Joi.string().required().max(30).label("Nomor Telepon"),
      email: Joi.string().email().allow(null, "").max(100).label("Email"),
      nationality: Joi.string().allow(null, "").max(50).default("Indonesia").label("Kewarganegaraan"),
      gender: Joi.string().valid('L','P').optional().allow(null, "").label("Jenis Kelamin"),
      birth_date: Joi.date().iso().optional().allow(null, "").label("Tanggal Lahir"),
      identity_file_path: Joi.string().optional().allow(null, "").label("Scan Identitas"),
      
      // Data WNA
      passport_no: Joi.string().optional().allow(null, "").label("No Paspor"),
      passport_issuing_country: Joi.string().optional().allow(null, "").label("Negara Penerbit Paspor"),
      passport_expiry: Joi.date().iso().optional().allow(null, "").label("Masa Berlaku Paspor"),
      visa_type: Joi.string().optional().allow(null, "").label("Tipe Visa"),
      visa_no: Joi.string().optional().allow(null, "").label("No Visa"),
      arrival_date_indonesia: Joi.date().iso().optional().allow(null, "").label("Tanggal Tiba di Indonesia"),
      purpose_of_visit: Joi.string().optional().allow(null, "").label("Tujuan Kunjungan"),

      // Klasifikasi & Flag
      guest_type: Joi.string().valid('individual','corporate','travel_agent','group').default('individual').label("Jenis Tamu"),
      vip_level: Joi.string().valid('none','vip','vvip','owner').default('none').label("Tingkat VIP"),
      company_id: Joi.string().optional().allow(null, "").label("Perusahaan"),
      loyalty_tier: Joi.string().optional().allow(null, "").label("Loyalty Tier"),
      
      // Preferensi & Consent
      preferences: Joi.any().optional().allow(null).label("Preferensi"),
      internal_notes: Joi.string().optional().allow(null, "").label("Catatan Internal"),
      consent_marketing: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).optional().allow(null, "").default(false).label("Persetujuan Marketing")
    };

    const cValidation = await validatePayload(
      schema,
      {
        "any.required": "{#label} wajib diisi",
        "string.max": "{#label} maksimal {#limit} karakter",
        "string.email": "Format email tidak valid"
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation) {
      return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    }

    // Direct duplicate check for id_number
    if (oPayload.id_number) {
      const existing = await DB("mst_guest")
        .where("kode_cabang", oPayload.kode_cabang)
        .where("id_number", oPayload.id_number)
        .whereNull("deleted_at")
        .andWhere("is_merged", 0)
        .first();

      if (existing && !oPayload.force_create) {
        return res.status(422).json({
          status: status.BAD_REQUEST,
          message: `Tamu dengan Nomor Identitas ${oPayload.id_number} sudah terdaftar (${existing.full_name}).`,
          datetime: formatDateSystem(),
          data: { candidate: existing }
        });
      }
    }

    let insertedKodeTamu = "";

    await DB.transaction(async (trx) => {
      let seq = await generateSequence("FMT-TAMU", trx);
      if (!seq) {
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        seq = `GST-${year}-${rand}`;
      }
      insertedKodeTamu = seq;

      const prefString = typeof oPayload.preferences === 'object' ? JSON.stringify(oPayload.preferences) : (oPayload.preferences || null);
      const score = calculateCompletenessScore({ ...oPayload, preferences: prefString });

      const objInsert = {
        kode_cabang: oPayload.kode_cabang,
        kode_tamu: insertedKodeTamu,
        full_name: oPayload.full_name,
        title: oPayload.title || null,
        first_name: oPayload.first_name || null,
        last_name: oPayload.last_name || null,
        id_type: oPayload.id_type,
        id_number: oPayload.id_number,
        phone: oPayload.phone,
        email: oPayload.email || null,
        nationality: oPayload.nationality || "Indonesia",
        gender: oPayload.gender || null,
        birth_date: oPayload.birth_date ? formatDateSystem(oPayload.birth_date, "yyyy-MM-dd") : null,
        identity_file_path: oPayload.identity_file_path || null,

        passport_no: oPayload.passport_no || null,
        passport_issuing_country: oPayload.passport_issuing_country || null,
        passport_expiry: oPayload.passport_expiry ? formatDateSystem(oPayload.passport_expiry, "yyyy-MM-dd") : null,
        visa_type: oPayload.visa_type || null,
        visa_no: oPayload.visa_no || null,
        arrival_date_indonesia: oPayload.arrival_date_indonesia ? formatDateSystem(oPayload.arrival_date_indonesia, "yyyy-MM-dd") : null,
        purpose_of_visit: oPayload.purpose_of_visit || null,

        guest_type: oPayload.guest_type || "individual",
        vip_level: oPayload.vip_level || "none",
        is_vip: oPayload.vip_level && oPayload.vip_level !== "none" ? 1 : 0,
        company_id: oPayload.company_id || null,
        loyalty_tier: oPayload.loyalty_tier || null,

        preferences: prefString,
        internal_notes: oPayload.internal_notes || null,
        consent_marketing: oPayload.consent_marketing ? 1 : 0,
        consent_at: oPayload.consent_marketing ? formatDateSystem() : null,

        completeness_score: score,
        source: oPayload.source || "manual_input",
        created_by: userId,
        created_at: formatDateSystem()
      };

      await trx("mst_guest").insert(objInsert);

      await ChangesLog({
        description: "Tambah Data Tamu",
        tableName: "mst_guest",
        referenceCode: insertedKodeTamu,
        action: "CREATE",
        dataAfter: objInsert,
        user: username
      }, trx);
    });

    const createdData = await DB("mst_guest").where("kode_tamu", insertedKodeTamu).first();

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data tamu berhasil ditambahkan",
      datetime: formatDateSystem(),
      data: createdData
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: error.message || "Terjadi kesalahan saat menambah data tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
