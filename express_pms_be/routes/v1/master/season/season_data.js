/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file season_data.js
 * @description Endpoint data master season
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
  const sortField = ["kode_musim","nama_musim","tanggal_mulai","tanggal_selesai","hari_berlaku","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_musim as s").join("mst_cabang as h", "s.kode_cabang", "h.kode_cabang").whereNull("s.deleted_at").modify(qb => {
      if (keyword) qb.where(function() { this.whereRaw("LOWER(s.nama_musim) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(s.kode_musim) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["s.id","s.kode_musim","s.kode_cabang","h.nama_hotel as cabang_name","s.nama_musim","s.nama_musim as name","s.tanggal_mulai","s.tanggal_selesai","s.hari_berlaku","s.is_active","s.created_at","s.updated_at"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("s.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 's.nama_musim' : (sortField === 'cabang_name' ? 'h.nama_hotel' : `s.${sortField}`), sortOrder).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 's.nama_musim' : (sortField === 'cabang_name' ? 'h.nama_hotel' : `s.${sortField}`), sortOrder);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/season/season_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
