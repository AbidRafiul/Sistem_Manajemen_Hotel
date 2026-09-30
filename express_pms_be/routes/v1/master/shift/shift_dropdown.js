/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_dropdown.js
 * @description Endpoint dropdown daftar shift aktif untuk form buka kasir
 * @author Antigravity
 * @created 2026-09-30
 * @version 1.0.0
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
    const baseQuery = DB("mst_shift as s")
      .where("s.is_active", 1)
      .whereNull("s.deleted_at")
      .modify((qb) => {
        if (oPayload.kode_cabang) {
          qb.where("s.kode_cabang", oPayload.kode_cabang);
        }
      });

    const selectFields = [
      "s.id",
      "s.kode_shift",
      "s.kode_cabang",
      "s.nama_shift",
      "s.waktu_mulai",
      "s.waktu_selesai",
      "s.default_opening_cash",
      "s.is_night_audit",
      "s.urutan",
    ];

    const vaData = await baseQuery
      .clone()
      .select(selectFields)
      .orderBy("s.urutan", "asc")
      .orderBy("s.waktu_mulai", "asc");

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data shift ditemukan",
      datetime: formatDateSystem(),
      data: vaData,
      total_data: vaData.length,
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SHIFT_DROPDOWN",
      TableName: "mst_shift",
      User: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Gagal memuat dropdown shift",
      datetime: formatDateSystem(),
      data: [],
    });
  }
});

export default router;
