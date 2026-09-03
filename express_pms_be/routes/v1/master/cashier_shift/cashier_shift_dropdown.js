/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file cashier_shift_dropdown.js
 * @description Endpoint dropdown shift kasir yang sedang aktif/open
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
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
    // Ambil shift kasir yang statusnya 'open' untuk cabang yang dipilih
    const baseQuery = DB("trx_cashier_shift as cs")
      .leftJoin("mst_cashier_counter as cc", "cs.kode_cashier_counter", "cc.kode_cashier_counter")
      .where("cs.status", "open")
      .modify((qb) => {
        if (oPayload.kode_cabang) {
          qb.where("cs.kode_cabang", oPayload.kode_cabang);
        }
      });

    const selectFields = [
      "cs.id",
      "cs.kode_cashier_shift",
      "cs.kode_cabang",
      "cs.kode_cashier_counter",
      "cc.nama_counter as nama_shift",
      "cs.user_id",
      "cs.opening_cash",
      "cs.opened_at",
      "cs.status",
    ];

    const vaData = await baseQuery.clone().select(selectFields).orderBy("cs.opened_at", "desc");

    return res.status(200).json({
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
      file: "master/cashier_shift/cashier_shift_dropdown.js",
      func: "dropdown",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
