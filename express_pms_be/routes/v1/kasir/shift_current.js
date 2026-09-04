/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_current.js
 * @description Endpoint cek shift kasir aktif
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { Logging } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const username = req?.auth?.username || "";
  const user_id = req?.auth?.user_id || 0;

  try {
    const existingOpenShift = await DB("trx_cashier_shift as cs")
      .select(
        "cs.kode_cashier_shift",
        "cs.kode_cabang",
        "cs.kode_cashier_counter",
        "cc.name as nama_counter",
        "c.nama_hotel as cabang_name",
        "cs.opening_cash",
        "cs.opened_at"
      )
      .leftJoin("mst_cashier_counter as cc", "cs.kode_cashier_counter", "cc.kode_counter")
      .leftJoin("mst_cabang as c", "cs.kode_cabang", "c.kode_cabang")
      .where("cs.user_id", user_id)
      .andWhere("cs.status", "open")
      .first();

    return res.status(200).json({
      status: status.SUKSES,
      message: "SUCCESS",
      datetime: formatDateSystem(),
      data: existingOpenShift || null,
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET DATA",
      TableName: "trx_cashier_shift",
      file: "shift_current.js",
      username: username,
    });
    
    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
