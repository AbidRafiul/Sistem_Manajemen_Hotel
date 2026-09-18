/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_export.js
 * @description Endpoint export data master tamu ke Excel / JSON
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

  const { is_marketing_export, kode_cabang } = oPayload;

  try {
    const query = DB("mst_guest as g")
      .leftJoin("mst_corporate_account as c", "g.company_id", "c.kode_corporate")
      .whereNull("g.deleted_at")
      .andWhere("g.is_merged", 0);

    if (kode_cabang) query.where("g.kode_cabang", kode_cabang);

    // UU PDP: Exclude guests who rejected marketing consent if marketing export
    if (is_marketing_export) {
      query.where("g.consent_marketing", 1);
    }

    const guests = await query.select(
      "g.kode_tamu",
      "g.full_name",
      "g.id_type",
      "g.id_number",
      "g.phone",
      "g.email",
      "g.nationality",
      "g.guest_type",
      "g.vip_level",
      "g.is_blacklisted",
      "c.name as company_name",
      "g.total_stay",
      "g.total_spending",
      "g.last_stay_date",
      "g.created_at"
    ).orderBy("g.full_name", "asc");

    const exportedData = guests.map(g => ({
      ...g,
      id_number: canViewSensitive ? g.id_number : maskIdNumber(g.id_number)
    }));

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data export tamu berhasil disiapkan",
      datetime: formatDateSystem(),
      data: exportedData,
      total_data: exportedData.length
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat menyiapkan export data tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_export.js",
      func: "export",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
