/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_detail.js
 * @description Endpoint detail lengkap master tamu
 */
import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

function maskIdNumber(idNum) {
  if (!idNum) return "-";
  if (idNum.length <= 6) return idNum.slice(0, 2) + "•••" + idNum.slice(-1);
  return idNum.slice(0, 4) + "••••••••" + idNum.slice(-4);
}

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const canViewSensitive = req?.auth?.permissions?.includes("guest.view_sensitive") || req?.auth?.role === "superadmin";

  const { id, kode_tamu } = oPayload;

  if (!id && !kode_tamu) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: "ID atau Kode Tamu wajib diisi",
      datetime: formatDateSystem(),
    });
  }

  try {
    const guest = await DB("mst_guest as g")
      .leftJoin("mst_corporate_account as c", "g.company_id", "c.kode_corporate")
      .select(
        "g.*",
        "c.name as company_name"
      )
      .whereNull("g.deleted_at")
      .andWhere(function() {
        if (id) this.where("g.id", id);
        if (kode_tamu) this.orWhere("g.kode_tamu", kode_tamu);
      })
      .first();

    if (!guest) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data tamu tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Parse JSON preferences
    let parsedPreferences = {};
    if (guest.preferences) {
      try {
        parsedPreferences = typeof guest.preferences === 'string' ? JSON.parse(guest.preferences) : guest.preferences;
      } catch (e) {
        parsedPreferences = {};
      }
    }

    // Fetch documents
    const documents = await DB("trx_guest_document")
      .where("kode_guest", guest.kode_tamu)
      .andWhere("is_active", 1);

    // Masking
    guest.id_number_masked = maskIdNumber(guest.id_number);
    if (!canViewSensitive) {
      guest.id_number = guest.id_number_masked;
      guest.identity_file_path = null;
    }

    guest.preferences_parsed = parsedPreferences;
    guest.documents = documents;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Detail tamu ditemukan",
      datetime: formatDateSystem(),
      data: guest
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat memuat detail tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_detail.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
