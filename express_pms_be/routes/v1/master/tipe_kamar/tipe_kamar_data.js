/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_kamar_data.js
 * @description Endpoint data master tipe kamar
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
  const sortField = ["kode_tipe_kamar","name","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_tipe_kamar as rt")
      .join("mst_cabang as h", "rt.kode_cabang", "h.kode_cabang")
      .leftJoin("mst_bed_type as bt", "rt.kode_bed_type", "bt.kode_bed_type")
      .whereNull("rt.deleted_at").modify(qb => {
      if (keyword) qb.where(function() { this.whereRaw("LOWER(rt.nama_tipe) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(rt.kode_tipe_kamar) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["rt.id","rt.kode_tipe_kamar","rt.kode_cabang","h.nama_hotel as cabang_name","rt.nama_tipe as name","rt.kode_bed_type","bt.name as bed_type_name","rt.kapasitas_dasar","rt.kapasitas_maksimal","rt.luas_sqm as luas_m2","rt.harga_default","rt.deskripsi","rt.is_active","rt.created_at","rt.updated_at"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("rt.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 'rt.nama_tipe' : `rt.${sortField}`, sortOrder).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 'rt.nama_tipe' : `rt.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/tipe_kamar/tipe_kamar_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
