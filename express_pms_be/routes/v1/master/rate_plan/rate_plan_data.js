/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_data.js
 * @description Endpoint data master rate plan
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
  const sortField = ["kode_paket_harga","name","plan_type","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_paket_harga as rp").whereNull("rp.deleted_at").modify(qb => {
      if (keyword) qb.where(function() { this.whereRaw("LOWER(rp.nama_paket) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(rp.kode_paket_harga) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["rp.id","rp.kode_paket_harga","rp.nama_paket as name","rp.tipe_paket","rp.tipe_markup","rp.nilai_markup","rp.dapat_di_refund as bisa_refund","rp.termasuk_sarapan","rp.minimal_malam","rp.maksimal_malam","rp.is_active","rp.created_at","rp.updated_at"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("rp.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 'rp.nama_paket' : `rp.${sortField}`, sortOrder).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(sortField === 'name' ? 'rp.nama_paket' : `rp.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/rate_plan/rate_plan_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
