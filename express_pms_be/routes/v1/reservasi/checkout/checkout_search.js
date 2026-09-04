/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file checkout_search.js
 * @description Pencarian reservasi kamar aktif (checked_in)
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.1
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const kode_cabang = req?.auth?.kode_cabang || "";

  try {
    let query = DB("trx_reservation_room as rr")
      .select(
        "rr.kode_reservasi_room",
        "rr.kode_reservasi_room",
        "rr.kode_reservation",
        "rr.kode_kamar",
        "g.full_name as guest_name",
        "r.check_in_date",
        "r.check_out_date",
        "f.kode_folio",
        "f.grand_total as current_grand_total"
      )
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .join("trx_folio as f", "rr.kode_reservation", "f.kode_reservation")
      .where("rr.status", "checked_in");

    if (oPayload.keyword) {
      const kw = `%${oPayload.keyword}%`;
      query.andWhere((q) => {
        q.where("rr.kode_kamar", "like", kw)
          .orWhere("g.full_name", "like", kw)
          .orWhere("rr.kode_reservasi_room", "like", kw)
          .orWhere("r.kode_reservasi", "like", kw);
      });
    }

    // Cabang filtering if applicable
    if (kode_cabang) {
        // Asumsi data sudah difilter by user's cabang access jika implementasi role ada, 
        // namun untuk saat ini opsional
    }

    const data = await query.limit(50);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data ditemukan",
      datetime: formatDateSystem(),
      data: data,
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SEARCH CHECKOUT",
      TableName: "trx_reservation_room",
      file: "checkout_search.js",
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
