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
  
  const sortMap = {
    kode_counter: "cc.kode_counter",
    kode_cabang: "cc.kode_cabang",
    cabang_name: "c.nama_hotel",
    name: "cc.name",
    is_active: "cc.is_active",
    created_at: "cc.created_at",
    updated_at: "cc.updated_at",
  };
  const sortField = sortMap[oPayload.sortField] || "cc.updated_at";
  const sortOrder = oPayload.sortOrder || "desc";

  try {
    const baseQuery = DB("mst_cashier_counter as cc")
      .leftJoin("mst_cabang as c", "cc.kode_cabang", "c.kode_cabang")
      .leftJoin("trx_cashier_shift as cs", function () {
        this.on(
          DB.raw("cc.kode_counter COLLATE utf8mb4_unicode_ci"),
          "=",
          DB.raw("cs.kode_cashier_counter COLLATE utf8mb4_unicode_ci")
        )
        .andOn(
          DB.raw("cc.kode_cabang COLLATE utf8mb4_unicode_ci"),
          "=",
          DB.raw("cs.kode_cabang COLLATE utf8mb4_unicode_ci")
        )
        .andOn(DB.raw("cs.status COLLATE utf8mb4_unicode_ci"), "=", DB.raw("'open'"));
      })
      .leftJoin("mst_user as u", "cs.user_id", "u.id")
      .whereNull("cc.deleted_at")
      .modify((qb) => {
        if (oPayload.kode_cabang) qb.where("cc.kode_cabang", oPayload.kode_cabang);
        if (oPayload.is_active !== undefined) qb.where("cc.is_active", oPayload.is_active);
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
      "cs.kode_cashier_shift as active_shift_code",
      "cs.user_id as active_user_id",
      "cs.opened_at as active_opened_at",
      "u.username as active_username",
      "u.fullname as active_fullname",
    ];

    const formatRow = (row) => {
      const rawUser = row.active_username || row.active_fullname || (row.active_user_id ? `user_${row.active_user_id}` : null);
      const cleanUser = rawUser ? (rawUser.includes("@") ? rawUser.split("@")[0] : rawUser) : null;
      const activeUserDisplay = cleanUser ? `@${cleanUser}` : null;
      const isInUse = !!row.active_shift_code;

      return {
        ...row,
        is_in_use: isInUse,
        active_username: row.active_username || null,
        active_fullname: row.active_fullname || null,
        active_user: activeUserDisplay,
        status_keterangan: isInUse ? `Sudah digunakan oleh user ${activeUserDisplay}` : "Tersedia",
        created_at: row.created_at ? formatDateSystem(row.created_at) : null,
        updated_at: row.updated_at ? formatDateSystem(row.updated_at) : null,
      };
    };

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

      const totalResult = await baseQuery.clone().count("cc.id as total").first();
      const totalRows = totalResult ? totalResult.total : 0;
      const totalPages = Math.ceil(totalRows / perPage);

      const vaData = result.map(formatRow);

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

      const vaData = result.map(formatRow);

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
