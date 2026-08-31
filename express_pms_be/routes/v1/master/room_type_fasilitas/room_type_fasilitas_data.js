/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file room_type_fasilitas_data.js
 * @description Endpoint data fasilitas by tipe kamar
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
  try {
    if (!oPayload.kode_tipe_kamar) {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "kode_tipe_kamar wajib dikirim",
          datetime: formatDateSystem(),
        });
    }
    const vaData = await DB("mst_room_type_fasilitas as rtf")
      .join("mst_fasilitas as f", "rtf.kode_fasilitas", "f.kode_fasilitas")
      .where("rtf.kode_tipe_kamar", oPayload.kode_tipe_kamar)
      .select(
        "rtf.id",
        "rtf.kode_tipe_kamar",
        "rtf.kode_fasilitas",
        "f.name as nama_fasilitas",
        "rtf.created_at",
        "rtf.created_by"
      );

    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data ditemukan",
        datetime: formatDateSystem(),
        data: vaData,
        total_data: vaData.length,
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/room_type_fasilitas/room_type_fasilitas_data.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
