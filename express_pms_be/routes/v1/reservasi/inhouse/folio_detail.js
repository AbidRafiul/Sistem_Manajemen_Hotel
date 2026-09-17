/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file folio_detail.js
 * @description Endpoint rincian kartu tagihan folio (charges & payments) per kamar/reservasi
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

  try {
    const { kode_reservasi_room, kode_folio } = oPayload;

    if (!kode_reservasi_room && !kode_folio) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_reservasi_room atau kode_folio wajib dikirim",
        datetime: formatDateSystem()
      });
    }

    // 1. Ambil info reservasi room & folio
    let folioQuery = DB("trx_folio as f")
      .select(
        "f.*",
        "r.kode_reservasi",
        "r.kode_cabang",
        "r.check_in_date",
        "r.check_out_date",
        "r.booking_type",
        "g.kode_tamu",
        "g.full_name as guest_name",
        "g.phone as guest_phone",
        "g.email as guest_email",
        "mk.nomor_kamar",
        "tk.nama_tipe as nama_tipe_kamar"
      )
      .join("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .leftJoin("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
      .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar");

    if (kode_folio) {
      folioQuery.where("f.kode_folio", kode_folio);
    } else if (kode_reservasi_room) {
      folioQuery.where("rr.kode_reservasi_room", kode_reservasi_room);
    }

    const folioInfo = await folioQuery.first();

    if (!folioInfo) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data folio tidak ditemukan",
        datetime: formatDateSystem()
      });
    }

    // 2. Ambil daftar tagihan (charges)
    const charges = await DB("trx_folio_charge")
      .where("kode_folio", folioInfo.kode_folio)
      .andWhere("is_active", 1)
      .orderBy("created_at", "asc");

    // 3. Ambil daftar pembayaran (payments)
    const payments = await DB("trx_payment")
      .where("kode_folio", folioInfo.kode_folio)
      .orderBy("paid_at", "asc");

    const grandTotal = parseFloat(folioInfo.grand_total || 0);
    const totalPaid = payments.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const balance = grandTotal - totalPaid;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Rincian folio berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        folio: {
          kode_folio: folioInfo.kode_folio,
          kode_reservation: folioInfo.kode_reservation,
          kode_cabang: folioInfo.kode_cabang,
          nomor_kamar: folioInfo.nomor_kamar,
          nama_tipe_kamar: folioInfo.nama_tipe_kamar,
          guest_name: folioInfo.guest_name,
          guest_phone: folioInfo.guest_phone,
          guest_email: folioInfo.guest_email,
          check_in_date: folioInfo.check_in_date,
          check_out_date: folioInfo.check_out_date,
          status: folioInfo.status,
          subtotal: parseFloat(folioInfo.subtotal || 0),
          tax_amount: parseFloat(folioInfo.tax_amount || 0),
          service_charge_amount: parseFloat(folioInfo.service_charge_amount || 0),
          grand_total: grandTotal,
          total_paid: totalPaid,
          balance: balance,
          billing_status: balance <= 0 ? "settled" : "outstanding"
        },
        charges: charges,
        payments: payments
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET FOLIO DETAIL",
      TableName: "trx_folio",
      file: "folio_detail.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan sistem saat memuat rincian folio.",
      datetime: formatDateSystem()
    });
  }
});

export default router;
