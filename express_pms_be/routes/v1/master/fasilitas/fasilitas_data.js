/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file fasilitas_data.js
 * @description Endpoint data master fasilitas
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
  const sortField = ["kode_fasilitas", "kode_cabang", "cabang_name", "name", "is_active", "created_at", "updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_fasilitas as f").join("mst_cabang as c", "f.kode_cabang", "c.kode_cabang").whereNull("f.deleted_at").modify(qb => {
      if (oPayload.kode_cabang) qb.where("f.kode_cabang", oPayload.kode_cabang);
      if (keyword) qb.where(function() { this.whereRaw("LOWER(f.name) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(f.kode_fasilitas) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["f.id", "f.kode_fasilitas", "f.kode_cabang", "c.nama_hotel as cabang_name", "f.name", "f.is_active", "f.created_at", "f.updated_at"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("* as total").first();
      totalRecords = parseInt(count.total || 0);
      const orderByRaw = sortField === "cabang_name" ? "c.nama_hotel" : `f.${sortField}`;
      vaData = await baseQuery.clone().select(selectFields).orderByRaw(`${orderByRaw} ${sortOrder}`).limit(perPage).offset((page - 1) * perPage);
    } else {
      const orderByRaw = sortField === "cabang_name" ? "c.nama_hotel" : `f.${sortField}`;
      vaData = await baseQuery.clone().select(selectFields).orderByRaw(`${orderByRaw} ${sortOrder}`);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/fasilitas/fasilitas_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
