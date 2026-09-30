/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_data.js
 * @description Endpoint data master shift
 * @author Antigravity
 * @created 2026-09-30
 * @version 1.0.0
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
    "kode_shift",
    "kode_cabang",
    "cabang_name",
    "nama_shift",
    "waktu_mulai",
    "waktu_selesai",
    "default_opening_cash",
    "is_night_audit",
    "urutan",
    "is_active",
    "created_at",
    "updated_at",
  ].includes(oPayload.sortField)
    ? oPayload.sortField
    : "urutan";

  const sortOrder = oPayload.sortOrder || "asc";

  try {
    const baseQuery = DB("mst_shift as s")
      .leftJoin("mst_cabang as c", "s.kode_cabang", "c.kode_cabang")
      .whereNull("s.deleted_at")
      .modify((qb) => {
        if (oPayload.kode_cabang) qb.where("s.kode_cabang", oPayload.kode_cabang);
        if (keyword) {
          qb.where(function () {
            this.whereRaw("LOWER(s.nama_shift) LIKE ?", [`%${keyword.toLowerCase()}%`])
              .orWhereRaw("LOWER(s.kode_shift) LIKE ?", [`%${keyword.toLowerCase()}%`]);
          });
        }
      });

    const selectFields = [
      "s.id",
      "s.kode_shift",
      "s.kode_cabang",
      "c.nama_hotel as cabang_name",
      "s.nama_shift",
      "s.waktu_mulai",
      "s.waktu_selesai",
      "s.default_opening_cash",
      "s.is_night_audit",
      "s.urutan",
      "s.is_active",
      "s.created_at",
      "s.updated_at",
    ];

    let result = [];
    if (hasPagination) {
      const page = oPayload.page || 1;
      const perPage = oPayload.perPage || 10;
      const offset = (page - 1) * perPage;

      result = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(sortField, sortOrder)
        .limit(perPage)
        .offset(offset);

      const totalResult = await baseQuery.clone().count("* as total").first();
      const totalRows = totalResult ? totalResult.total : 0;
      const totalPages = Math.ceil(totalRows / perPage);

      const vaData = result.map((row) => ({
        ...row,
        created_at: row.created_at ? formatDateSystem(row.created_at) : null,
        updated_at: row.updated_at ? formatDateSystem(row.updated_at) : null,
      }));

      return res.status(200).json({
        status: status.SUKSES,
        message: "SUCCESS",
        datetime: formatDateSystem(),
        data: vaData,
        total_data: totalRows,
        total_pages: totalPages,
        current_page: page,
        per_page: perPage,
      });
    }

    result = await baseQuery.clone().select(selectFields).orderBy(sortField, sortOrder);
    const vaData = result.map((row) => ({
      ...row,
      created_at: row.created_at ? formatDateSystem(row.created_at) : null,
      updated_at: row.updated_at ? formatDateSystem(row.updated_at) : null,
    }));

    return res.status(200).json({
      status: status.SUKSES,
      message: "SUCCESS",
      datetime: formatDateSystem(),
      data: vaData,
      total_data: vaData.length,
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SHIFT_DATA",
      TableName: "mst_shift",
      User: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan saat memuat data shift",
      datetime: formatDateSystem(),
      data: [],
    });
  }
});

export default router;
