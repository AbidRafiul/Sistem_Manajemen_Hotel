/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file room_type_amenity_data.js
 * @description Endpoint data amenity per tipe kamar
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-28
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-28)
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
  try {
    if (!oPayload.kode_tipe_kamar) {
      return res.status(400).json({ status: status.BAD_REQUEST, message: "Kode Tipe Kamar wajib diisi", datetime: formatDateSystem() });
    }
    
    const baseQuery = DB("mst_room_type_amenity as rta")
      .join("mst_amenity as a", "rta.kode_amenity", "a.kode_amenity")
      .where("rta.kode_tipe_kamar", oPayload.kode_tipe_kamar)
      .whereNull("a.deleted_at");
      
    const selectFields = ["rta.id", "rta.kode_rta", "rta.kode_tipe_kamar", "rta.kode_amenity", "a.name as nama_amenity"];
    
    const vaData = await baseQuery.clone().select(selectFields);
    const totalRecords = vaData.length;
    
    return res.status(200).json({ status: status.SUKSES, message: "Data ditemukan", datetime: formatDateSystem(), data: vaData, total_data: totalRecords });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/room_type_amenity/room_type_amenity_data.js", func: "get", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
