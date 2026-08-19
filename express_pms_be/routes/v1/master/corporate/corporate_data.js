/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file corporate_data.js
 * @description Endpoint data master corporate / travel agent
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
  const sortField = ["kode_corporate","name","account_type","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    const baseQuery = DB("mst_corporate_account as c").whereNull("c.deleted_at").modify(qb => {
      if (keyword) qb.where(function() { this.whereRaw("LOWER(c.name) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(c.kode_corporate) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(c.contact_person) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = ["c.id","c.kode_corporate","c.name","c.account_type","c.npwp","c.payment_term_days","c.commission_pct","c.contact_person","c.contact_phone","c.contact_email","c.is_active","c.created_at","c.updated_at"];
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("* as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderBy(`c.${sortField}`, sortOrder).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderBy(`c.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/corporate/corporate_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
