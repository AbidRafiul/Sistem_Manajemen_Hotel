/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file harga_ruang_event_data.js
 * @description Endpoint data harga ruang event
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-26
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-26)
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
    "kode_harga_ruang_event",
    "kode_ruang_event",
    "tipe_sewa",
    "harga",
    "is_active",
    "created_at",
    "updated_at",
  ].includes(oPayload.sortField)
    ? oPayload.sortField
    : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_harga_ruang_event as hre")
      .join("mst_ruang_event as re", "hre.kode_ruang_event", "re.kode_ruang_event")
      .whereNull("hre.deleted_at")
      .modify((qb) => {
        if (oPayload.kode_ruang_event) qb.where("hre.kode_ruang_event", oPayload.kode_ruang_event);
        if (keyword)
          qb.where(function () {
            this.whereRaw("LOWER(re.nama_ruang) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw(
              "LOWER(hre.kode_harga_ruang_event) LIKE ?",
              [`%${keyword.toLowerCase()}%`]
            );
          });
      });
    const selectFields = [
      "hre.id",
      "hre.kode_harga_ruang_event",
      "hre.kode_ruang_event",
      "re.nama_ruang as ruang_name",
      "hre.tipe_sewa",
      "hre.kode_musim",
      "hre.harga",
      "hre.is_active",
      "hre.created_at",
      "hre.updated_at",
    ];
    let vaData = [],
      totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1,
        perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("hre.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(`hre.${sortField}`, sortOrder)
        .limit(perPage)
        .offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(`hre.${sortField}`, sortOrder);
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
      file: "master/harga_ruang_event/harga_ruang_event_data.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
