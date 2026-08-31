/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_price_data.js
 * @description Endpoint data master rate plan price
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-27
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-27)
 * @version 1.0.1
 */
import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const hasPagination = oPayload.page !== undefined || oPayload.perPage !== undefined;
  const sortField = [
    "kode_harga_price",
    "tipe_kamar_name",
    "rate_plan_name",
    "season_name",
    "price",
    "extra_bed_price",
    "valid_from",
    "valid_to",
    "is_active",
    "created_at",
    "updated_at",
  ].includes(oPayload.sortField)
    ? oPayload.sortField
    : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";

  try {
    const baseQuery = DB("mst_rate_plan_price as rpp")
      .join("mst_tipe_kamar as tk", "rpp.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .join("mst_paket_harga as ph", "rpp.kode_rate_plan", "ph.kode_paket_harga")
      .leftJoin("mst_musim as m", "rpp.kode_season", "m.kode_musim")
      .whereNull("rpp.deleted_at")
      .modify((qb) => {
        if (oPayload.kode_tipe_kamar) qb.where("rpp.kode_tipe_kamar", oPayload.kode_tipe_kamar);
        if (oPayload.kode_rate_plan) qb.where("rpp.kode_rate_plan", oPayload.kode_rate_plan);
        if (oPayload.kode_season) qb.where("rpp.kode_season", oPayload.kode_season);
        if (oPayload.is_active !== undefined) qb.where("rpp.is_active", oPayload.is_active);
      });

    const selectFields = [
      "rpp.id",
      "rpp.kode_harga_price",
      "rpp.kode_tipe_kamar",
      "tk.nama_tipe as tipe_kamar_name",
      "rpp.kode_rate_plan",
      "ph.nama_paket as rate_plan_name",
      "rpp.kode_season",
      "m.nama_musim as season_name",
      "rpp.price",
      "rpp.extra_bed_price",
      "rpp.valid_from",
      "rpp.valid_to",
      "rpp.is_active",
      "rpp.created_at",
      "rpp.updated_at",
    ];

    let vaData = [],
      totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1,
        perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("rpp.id as total").first();
      totalRecords = parseInt(count.total || 0);

      let actualSortField = `rpp.${sortField}`;
      if (sortField === "tipe_kamar_name") actualSortField = "tk.nama_tipe";
      if (sortField === "rate_plan_name") actualSortField = "ph.nama_paket";
      if (sortField === "season_name") actualSortField = "m.nama_musim";

      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(actualSortField, sortOrder)
        .limit(perPage)
        .offset((page - 1) * perPage);
    } else {
      let actualSortField = `rpp.${sortField}`;
      if (sortField === "tipe_kamar_name") actualSortField = "tk.nama_tipe";
      if (sortField === "rate_plan_name") actualSortField = "ph.nama_paket";
      if (sortField === "season_name") actualSortField = "m.nama_musim";

      vaData = await baseQuery.clone().select(selectFields).orderBy(actualSortField, sortOrder);
      totalRecords = vaData.length;
    }

    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data ditemukan",
        datetime: formatDateSystem(),
        data: vaData,
        total_data: totalRecords,
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/rate_plan_price/rate_plan_price_data.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
