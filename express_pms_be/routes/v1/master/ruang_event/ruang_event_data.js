/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file ruang_event_data.js
 * @description Endpoint data ruang event
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
  const sortField = ["kode","nama_ruang","kode_cabang","kode_tipe_ruang_event","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_ruang_event as re")
      .join("mst_cabang as c", "re.kode_cabang", "c.kode")
      .join("mst_tipe_ruang_event as tre", "re.kode_tipe_ruang_event", "tre.kode")
      .whereNull("re.deleted_at").modify(qb => {
      if (oPayload.kode_cabang) qb.where("re.kode_cabang", oPayload.kode_cabang);
      if (oPayload.kode_tipe_ruang_event) qb.where("re.kode_tipe_ruang_event", oPayload.kode_tipe_ruang_event);
      if (keyword) qb.where(function() { this.whereRaw("LOWER(re.nama_ruang) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(re.kode) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["re.id","re.kode","re.kode_cabang","c.nama_hotel as cabang_name","re.kode_tipe_ruang_event","tre.nama_tipe as tipe_ruang_name","re.nama_ruang","re.kapasitas_orang","re.luas_sqm","re.layout_support","re.is_active","re.created_at","re.updated_at"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("re.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderBy(`re.${sortField}`, sortOrder).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(`re.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/ruang_event/ruang_event_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
