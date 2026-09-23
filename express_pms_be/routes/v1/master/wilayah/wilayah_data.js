/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file wilayah_data.js
 * @description Endpoint untuk mengambil data Master Wilayah / Regional
 */

import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const hasPagination = oPayload.page !== undefined || oPayload.perPage !== undefined;
  const keyword = oPayload.keyword || "";
  const sortField = ["code", "name", "status", "created_at", "updated_at"].includes(
    oPayload.sortField
  )
    ? oPayload.sortField
    : "created_at";
  const sortOrder = oPayload.sortOrder || "desc";

  try {
    const baseQuery = DB("org_nodes as o")
      .where("o.node_type", "region")
      .modify((qb) => {
        if (keyword) {
          qb.where(function () {
            this.whereRaw("LOWER(o.name) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw(
              "LOWER(o.code) LIKE ?",
              [`%${keyword.toLowerCase()}%`]
            );
          });
        }
      });

    const selectFields = [
      "o.id",
      "o.code as kode_wilayah",
      "o.name as nama_wilayah",
      "o.node_type",
      "o.status",
      "o.created_at",
      "o.updated_at",
    ];

    let vaData = [],
      totalRecords = 0;

    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1,
        perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("o.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(`o.${sortField}`, sortOrder)
        .limit(perPage)
        .offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(`o.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }

    // Ambil jumlah cabang per wilayah
    const cabangCounts = await DB("mst_cabang")
      .whereNull("deleted_at")
      .select("org_node_id")
      .count("id as total_cabang")
      .groupBy("org_node_id");

    const countMap = {};
    cabangCounts.forEach((c) => {
      countMap[c.org_node_id] = parseInt(c.total_cabang || 0);
    });

    const enrichedData = vaData.map((w) => ({
      ...w,
      total_cabang: countMap[w.id] || 0,
      is_active: w.status === "active" ? 1 : 0,
    }));

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data wilayah berhasil dimuat",
      datetime: formatDateSystem(),
      data: enrichedData,
      total_data: totalRecords,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Gagal memuat data master wilayah",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/wilayah/wilayah_data.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
