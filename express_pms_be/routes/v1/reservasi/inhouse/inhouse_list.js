/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file inhouse_list.js
 * @description Endpoint untuk menampilkan daftar tamu menginap (in-house) beserta status tagihan/folio
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-16
 * @version 1.0.0
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const kode_cabang = oPayload.kode_cabang || req?.auth?.kode_cabang || "";

  try {
    let query = DB("trx_reservation_room as rr")
      .select(
        "rr.kode_reservasi_room",
        "rr.kode_reservation",
        "rr.kode_tipe_kamar",
        "tk.nama_tipe as nama_tipe_kamar",
        "rr.kode_rate_plan",
        "rr.kode_kamar",
        "mk.nomor_kamar",
        "g.kode_tamu",
        "g.full_name as guest_name",
        "g.phone as guest_phone",
        "r.kode_cabang",
        "r.check_in_date",
        "r.check_out_date",
        "rr.nights",
        "rr.rate_per_night",
        "r.booking_type",
        "r.group_code",
        "f.kode_folio",
        "f.subtotal",
        "f.tax_amount",
        "f.service_charge_amount",
        "f.grand_total"
      )
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("trx_folio as f", function () {
        this.on("rr.kode_reservation", "=", "f.kode_reservation")
            .andOn("f.status", "=", DB.raw("?", ["open"]));
      })
      .where("rr.status", "checked_in")
      .orderBy("mk.nomor_kamar", "asc");

    if (kode_cabang) {
      query.where("r.kode_cabang", kode_cabang);
    }

    if (oPayload.keyword) {
      const kw = `%${oPayload.keyword}%`;
      query.andWhere((q) => {
        q.where("rr.kode_kamar", "like", kw)
          .orWhere("mk.nomor_kamar", "like", kw)
          .orWhere("g.full_name", "like", kw)
          .orWhere("rr.kode_reservasi_room", "like", kw)
          .orWhere("r.kode_reservasi", "like", kw)
          .orWhere("f.kode_folio", "like", kw);
      });
    }

    const rows = await query;

    // Ambil pembayaran untuk semua folio yang ditemukan
    const folioCodes = rows.map((r) => r.kode_folio).filter(Boolean);
    let paymentsMap = {};

    if (folioCodes.length > 0) {
      const payments = await DB("trx_payment")
        .select("kode_folio")
        .sum("amount as total_paid")
        .whereIn("kode_folio", folioCodes)
        .groupBy("kode_folio");

      payments.forEach((p) => {
        paymentsMap[p.kode_folio] = parseFloat(p.total_paid || 0);
      });
    }

    // Format data dan kalkulasi balance real-time
    const data = rows.map((item) => {
      const grandTotal = parseFloat(item.grand_total || 0);
      const totalPaid = paymentsMap[item.kode_folio] || 0;
      const balance = grandTotal - totalPaid;

      return {
        ...item,
        grand_total: grandTotal,
        total_paid: totalPaid,
        balance: balance,
        billing_status: balance <= 0 ? "settled" : "outstanding"
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data tamu menginap berhasil dimuat",
      datetime: formatDateSystem(),
      data: data
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET INHOUSE LIST",
      TableName: "trx_reservation_room",
      file: "inhouse_list.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan sistem saat memuat data tamu menginap.",
      datetime: formatDateSystem(),
      data: []
    });
  }
});

export default router;
