/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file kamar_data.js
 * @description Endpoint data master kamar
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
  const sortField = ["kode_kamar","nomor_kamar","room_type_name","floor_name","tipe_view","is_active","created_at","updated_at"].includes(oPayload.sortField) ? oPayload.sortField : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";
  try {
    // if (!oPayload.kode_cabang) {
    //     return res.status(400).json({ status: status.BAD_REQUEST, message: "kode_cabang wajib dikirim", datetime: formatDateSystem() });
    // }
    const baseQuery = DB("mst_kamar as r")
      .join("mst_cabang as h", "r.kode_cabang", "h.kode_cabang")
      .join("mst_lantai as f", "r.kode_lantai", "f.kode_lantai")
      .join("mst_tipe_kamar as rt", "r.kode_tipe_kamar", "rt.kode_tipe_kamar")
      .leftJoin("mst_bed_type as bt", "r.kode_bed_type", "bt.kode_bed_type")
      .whereNull("r.deleted_at").modify(qb => {
      if (oPayload.kode_cabang) qb.where("r.kode_cabang", oPayload.kode_cabang);
      if (oPayload.kode_lantai) qb.where("r.kode_lantai", oPayload.kode_lantai);
      if (oPayload.kode_tipe_kamar) qb.where("r.kode_tipe_kamar", oPayload.kode_tipe_kamar);
      if (keyword) qb.where(function() { this.whereRaw("LOWER(r.nomor_kamar) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw("LOWER(r.kode_kamar) LIKE ?", [`%${keyword.toLowerCase()}%`]); });
    });
    const selectFields = [
      "r.id","r.kode_cabang","r.kode_gedung","r.kode_lantai","r.kode_tipe_kamar","r.kode_bed_type","r.kode_kamar","r.nomor_kamar as name",
      "r.tipe_pemandangan as tipe_view","r.catatan","r.boleh_merokok","r.occupancy_status","r.housekeeping_status","r.is_active","r.created_at","r.updated_at",
      "h.nama_hotel as cabang_name","f.nama_lantai as floor_name","rt.nama_tipe as room_type_name","bt.name as bed_type_name"
    ];
    let orderByCol = `r.${sortField}`;
    if (sortField === 'nomor_kamar' || sortField === 'name') orderByCol = 'r.nomor_kamar';
    else if (sortField === 'room_type_name') orderByCol = 'rt.nama_tipe';
    else if (sortField === 'floor_name') orderByCol = 'f.nama_lantai';
    else if (sortField === 'tipe_view') orderByCol = 'r.tipe_pemandangan';
    
    let vaData = [], totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1, perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("r.id as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery.clone().select(selectFields).orderByRaw(`${orderByCol} ${sortOrder}`).limit(perPage).offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery.clone().select(selectFields).orderByRaw(`${orderByCol} ${sortOrder}`);
      totalRecords = vaData.length;
    }
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/kamar/kamar_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
