/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file cashier_counter_data.js
 * @description Endpoint data master cashier counter
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
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
    "kode_counter",
    "kode_cabang",
    "cabang_name",
    "name",
    "is_active",
    "created_at",
    "updated_at",
  ].includes(oPayload.sortField)
    ? oPayload.sortField
    : "updated_at";
    
  const sortOrder = oPayload.sortOrder || "desc";

  try {
    const baseQuery = DB("mst_cashier_counter as cc")
      .join("mst_cabang as c", "cc.kode_cabang", "c.kode_cabang")
      .whereNull("cc.deleted_at")
      .modify((qb) => {
        if (keyword) {
          qb.where(function () {
            this.whereRaw("LOWER(cc.name) LIKE ?", [`%${keyword.toLowerCase()}%`])
                .orWhereRaw("LOWER(cc.kode_counter) LIKE ?", [`%${keyword.toLowerCase()}%`]);
          });
        }
      });

    const selectFields = [
      "cc.id",
      "cc.kode_counter",
      "cc.kode_cabang",
      "c.nama_hotel as cabang_name",
      "cc.name",
      "cc.is_active",
      "cc.created_at",
      "cc.updated_at",
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
        created_at: formatDateSystem(row.created_at),
        updated_at: formatDateSystem(row.updated_at),
      }));

      return res.status(200).json({
        status: status.SUKSES,
        message: "SUCCESS",
        datetime: formatDateSystem(),
        data: vaData,
        pagination: {
          page,
          perPage,
          totalPages,
          totalRows,
        },
      });
    } else {
      result = await baseQuery.clone().select(selectFields).orderBy(sortField, sortOrder);

      const vaData = result.map((row) => ({
        ...row,
        created_at: formatDateSystem(row.created_at),
        updated_at: formatDateSystem(row.updated_at),
      }));

      return res.status(200).json({
        status: status.SUKSES,
        message: "SUCCESS",
        datetime: formatDateSystem(),
        data: vaData,
      });
    }
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET DATA",
      TableName: "mst_cashier_counter",
      file: "cashier_counter_data.js",
      username: username,
    });
    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
