/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file pajak_data.js
 * @description Endpoint data master pajak & service charge
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-13
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-13)
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
  const keyword = oPayload.keyword || "";
  const sortField = [
    "kode_pajak",
    "kode_cabang",
    "cabang_name",
    "name",
    "tax_type",
    "percentage",
    "is_active",
    "created_at",
    "updated_at",
  ].includes(oPayload.sortField)
    ? oPayload.sortField
    : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_tax as t")
      .join("mst_cabang as h", "t.kode_cabang", "h.kode_cabang")
      .whereNull("t.deleted_at")
      .modify((qb) => {
        if (keyword)
          qb.where(function () {
            this.whereRaw("LOWER(t.name) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw(
              "LOWER(t.kode_pajak) LIKE ?",
              [`%${keyword.toLowerCase()}%`]
            );
          });
      });
    const selectFields = [
      "t.id",
      "t.kode_pajak",
      "t.kode_cabang",
      "h.nama_hotel as cabang_name",
      "t.name",
      "t.tax_type",
      "t.percentage",
      "t.is_compounding",
      "t.is_active",
      "t.created_at",
      "t.updated_at",
    ];
    let vaData = [],
      totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1,
        perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("* as total").first();
      totalRecords = parseInt(count.total || 0);
      const orderByRaw = sortField === "cabang_name" ? "h.nama_hotel" : `t.${sortField}`;
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderByRaw(`${orderByRaw} ${sortOrder}`)
        .limit(perPage)
        .offset((page - 1) * perPage);
    } else {
      const orderByRaw = sortField === "cabang_name" ? "h.nama_hotel" : `t.${sortField}`;
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderByRaw(`${orderByRaw} ${sortOrder}`);
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
      file: "master/pajak/pajak_data.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
