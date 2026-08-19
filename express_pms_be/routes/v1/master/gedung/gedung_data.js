/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file gedung_data.js
 * @description Endpoint data master gedung
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
  const sortField = ["kode_gedung","nama_gedung","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    // if (!oPayload.kode_cabang) {
    //     return res.status(400).json({ status: status.BAD_REQUEST, message: "kode_cabang wajib dikirim", datetime: formatDateSystem() });
    // }
    const baseQuery = DB("mst_gedung as b").join("mst_cabang as h", "b.kode_cabang", "h.kode_cabang").whereNull("b.deleted_at").modify(qb => {
      if (oPayload.kode_cabang) {
          qb.where("b.kode_cabang", oPayload.kode_cabang);
      }
      if (keyword) qb.where(function() { this.whereRaw("LOWER(b.nama_gedung) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(b.kode_gedung) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["b.kode_gedung","b.kode_cabang","b.nama_gedung","b.is_active","b.created_at","b.updated_at","h.nama_hotel as cabang_name"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("b.kode_gedung as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderBy(`b.${sortField}`, sortOrder).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(`b.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/gedung/gedung_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
