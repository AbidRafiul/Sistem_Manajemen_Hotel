/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file lantai_data.js
 * @description Endpoint data master lantai
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
  const sortField = ["kode_lantai","name","floor_number","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_lantai as f").join("mst_gedung as b", "f.kode_gedung", "b.kode_gedung").join("mst_cabang as h", "b.kode_cabang", "h.kode_cabang").whereNull("f.deleted_at").modify(qb => {
      if (oPayload.kode_gedung) qb.where("f.kode_gedung", oPayload.kode_gedung);
      if (keyword) qb.where(function() { this.whereRaw("LOWER(f.nama_lantai) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(f.kode_lantai) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["f.id","f.kode_gedung","f.kode_lantai","f.nama_lantai as name","f.nomor_lantai","f.is_active","f.created_at","f.updated_at","b.nama_gedung as building_name","h.nama_hotel as hotel_name", "h.kode_cabang as kode_cabang"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("f.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 'f.nama_lantai' : `f.${sortField}`, sortOrder).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 'f.nama_lantai' : `f.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/lantai/lantai_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
