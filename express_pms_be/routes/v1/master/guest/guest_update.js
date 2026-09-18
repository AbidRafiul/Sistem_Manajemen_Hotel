/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_update.js
 * @description Endpoint update data master tamu
 */
import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, ChangesLog, validatePayload } from "../../components/tools/servertool.js";
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
    const { id, kode_tamu } = oPayload;
    if (!id && !kode_tamu) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "ID atau Kode Tamu wajib diisi untuk memperbarui data",
        datetime: formatDateSystem(),
      });
    }

    const existingGuest = await DB("mst_guest")
      .whereNull("deleted_at")
      .andWhere(function() {
        if (id) this.where("id", id);
        if (kode_tamu) this.orWhere("kode_tamu", kode_tamu);
      })
      .first();

    if (!existingGuest) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data tamu tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    const prefString = typeof oPayload.preferences === 'object' ? JSON.stringify(oPayload.preferences) : (oPayload.preferences !== undefined ? oPayload.preferences : existingGuest.preferences);
    
    const mergedData = { ...existingGuest, ...oPayload, preferences: prefString };
    const score = calculateCompletenessScore(mergedData);

    const tNow = formatDateSystem();
    const updateObj = {
      full_name: oPayload.full_name ?? existingGuest.full_name,
      title: oPayload.title ?? existingGuest.title,
      first_name: oPayload.first_name ?? existingGuest.first_name,
      last_name: oPayload.last_name ?? existingGuest.last_name,
      id_type: oPayload.id_type ?? existingGuest.id_type,
      id_number: oPayload.id_number ?? existingGuest.id_number,
      phone: oPayload.phone ?? existingGuest.phone,
      email: oPayload.email ?? existingGuest.email,
      nationality: oPayload.nationality ?? existingGuest.nationality,
      gender: oPayload.gender ?? existingGuest.gender,
      birth_date: oPayload.birth_date ? formatDateSystem(oPayload.birth_date, "yyyy-MM-dd") : existingGuest.birth_date,
      identity_file_path: oPayload.identity_file_path ?? existingGuest.identity_file_path,

      passport_no: oPayload.passport_no ?? existingGuest.passport_no,
      passport_issuing_country: oPayload.passport_issuing_country ?? existingGuest.passport_issuing_country,
      passport_expiry: oPayload.passport_expiry ? formatDateSystem(oPayload.passport_expiry, "yyyy-MM-dd") : existingGuest.passport_expiry,
      visa_type: oPayload.visa_type ?? existingGuest.visa_type,
      visa_no: oPayload.visa_no ?? existingGuest.visa_no,
      arrival_date_indonesia: oPayload.arrival_date_indonesia ? formatDateSystem(oPayload.arrival_date_indonesia, "yyyy-MM-dd") : existingGuest.arrival_date_indonesia,
      purpose_of_visit: oPayload.purpose_of_visit ?? existingGuest.purpose_of_visit,

      guest_type: oPayload.guest_type ?? existingGuest.guest_type,
      vip_level: oPayload.vip_level ?? existingGuest.vip_level,
      is_vip: oPayload.vip_level ? (oPayload.vip_level !== "none" ? 1 : 0) : existingGuest.is_vip,
      company_id: oPayload.company_id ?? existingGuest.company_id,
      loyalty_tier: oPayload.loyalty_tier ?? existingGuest.loyalty_tier,

      preferences: prefString,
      internal_notes: oPayload.internal_notes ?? existingGuest.internal_notes,
      consent_marketing: oPayload.consent_marketing !== undefined ? (oPayload.consent_marketing ? 1 : 0) : existingGuest.consent_marketing,
      
      completeness_score: score,
      updated_by: userId,
      updated_at: tNow
    };

    if (oPayload.consent_marketing && !existingGuest.consent_marketing) {
      updateObj.consent_at = tNow;
    }

    await DB.transaction(async (trx) => {
      await trx("mst_guest").where("id", existingGuest.id).update(updateObj);

      await ChangesLog({
        description: "Ubah Data Tamu",
        tableName: "mst_guest",
        referenceCode: existingGuest.kode_tamu,
        action: "UPDATE",
        dataBefore: existingGuest,
        dataAfter: updateObj,
        user: username
      }, trx);
    });

    const updatedData = await DB("mst_guest").where("id", existingGuest.id).first();

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data tamu berhasil diperbarui",
      datetime: formatDateSystem(),
      data: updatedData
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat memperbarui data tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
