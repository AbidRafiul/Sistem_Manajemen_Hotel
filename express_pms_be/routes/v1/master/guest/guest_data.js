/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_data.js
 * @description Endpoint data master tamu (list, search, filter, pagination, masking)
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

  const hasPagination = oPayload.page !== undefined || oPayload.perPage !== undefined;
  const keyword = oPayload.keyword || "";
  const guestType = oPayload.guest_type || "";
  const nationality = oPayload.nationality || "";
  const vipLevel = oPayload.vip_level || "";
  const isBlacklisted = oPayload.is_blacklisted;
  const isMerged = oPayload.is_merged !== undefined ? oPayload.is_merged : 0;

  const sortField = [
    "kode_tamu", "full_name", "phone", "email", "nationality", 
    "total_stay", "total_spending", "created_at", "updated_at", "last_stay_date"
  ].includes(oPayload.sortField)
    ? oPayload.sortField
    : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";

  try {
    const baseQuery = DB("mst_guest as g")
      .leftJoin("mst_corporate_account as c", "g.company_id", "c.kode_corporate")
      .whereNull("g.deleted_at")
      .modify((qb) => {
        if (isMerged !== null && isMerged !== undefined) {
          qb.where("g.is_merged", isMerged);
        }
        if (guestType) {
          qb.where("g.guest_type", guestType);
        }
        if (nationality) {
          qb.where("g.nationality", nationality);
        }
        if (vipLevel) {
          qb.where("g.vip_level", vipLevel);
        }
        if (isBlacklisted !== undefined && isBlacklisted !== null && isBlacklisted !== "") {
          qb.where("g.is_blacklisted", Number(isBlacklisted));
        }
        if (keyword) {
          const kw = `%${keyword.toLowerCase()}%`;
          qb.where(function () {
            this.whereRaw("LOWER(g.full_name) LIKE ?", [kw])
              .orWhereRaw("LOWER(g.kode_tamu) LIKE ?", [kw])
              .orWhereRaw("LOWER(g.phone) LIKE ?", [kw])
              .orWhereRaw("LOWER(g.id_number) LIKE ?", [kw])
              .orWhereRaw("LOWER(g.email) LIKE ?", [kw]);
          });
        }
      });

    const selectFields = [
      "g.id",
      "g.kode_cabang",
      "g.kode_tamu",
      "g.full_name",
      "g.title",
      "g.first_name",
      "g.last_name",
      "g.id_type",
      "g.id_number",
      "g.phone",
      "g.email",
      "g.nationality",
      "g.gender",
      "g.birth_date",
      "g.guest_type",
      "g.vip_level",
      "g.is_vip",
      "g.is_blacklisted",
      "g.blacklist_reason",
      "g.company_id",
      "c.name as company_name",
      "g.total_stay",
      "g.total_night",
      "g.total_spending",
      "g.avg_adr",
      "g.last_stay_date",
      "g.completeness_score",
      "g.source",
      "g.is_merged",
      "g.merged_into_guest_id",
      "g.is_active",
      "g.created_at",
      "g.updated_at"
    ];

    let vaData = [], totalRecords = 0;

    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("g.id as total").first();
      totalRecords = parseInt(count?.total || 0);

      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(`g.${sortField}`, sortOrder)
        .limit(perPage)
        .offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(`g.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }

    // Mask sensitive id_number if no permission
    const formattedData = vaData.map(item => ({
      ...item,
      id_number_raw: canViewSensitive ? item.id_number : undefined,
      id_number_masked: maskIdNumber(item.id_number),
      id_number: canViewSensitive ? item.id_number : maskIdNumber(item.id_number)
    }));

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data tamu ditemukan",
      datetime: formatDateSystem(),
      data: formattedData,
      total_data: totalRecords,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat memuat data tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_data.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
