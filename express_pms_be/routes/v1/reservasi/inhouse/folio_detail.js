/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file folio_detail.js
 * @description Endpoint rincian kartu tagihan folio (charges & payments) per kamar/reservasi via calculateFolioBilling
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.1
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { calculateFolioBilling } from "../../components/tools/billing_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";

  try {
    const { kode_reservasi_room, kode_folio, kode_reservation } = oPayload;

    if (!kode_reservasi_room && !kode_folio && !kode_reservation) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_reservasi_room, kode_folio, atau kode_reservation wajib dikirim",
        datetime: formatDateSystem()
      });
    }

    const billing = await calculateFolioBilling({
      kode_folio,
      kode_reservation,
      kode_reservasi_room,
      trx: DB
    });

    if (!billing) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data folio tidak ditemukan",
        datetime: formatDateSystem()
      });
    }

    // Ambil nomor kamar dan tipe kamar utama untuk header single-room display compatibility
    const primaryRoom = billing.rooms && billing.rooms.length > 0 ? billing.rooms[0] : null;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Rincian folio berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        hotel: billing.hotel,
        folio: {
          kode_folio: billing.folio.kode_folio,
          kode_reservation: billing.folio.kode_reservation,
          kode_cabang: billing.folio.kode_cabang,
          nomor_kamar: primaryRoom ? primaryRoom.nomor_kamar : "-",
          nama_tipe_kamar: primaryRoom ? primaryRoom.nama_tipe_kamar : "-",
          guest_name: billing.guest.full_name,
          guest_phone: billing.guest.phone,
          guest_email: billing.guest.email,
          check_in_date: billing.reservation.check_in_date,
          check_out_date: billing.reservation.check_out_date,
          status: billing.folio.status,
          subtotal: billing.folio.subtotal,
          tax_amount: billing.folio.tax_amount,
          service_charge_amount: billing.folio.service_charge_amount,
          grand_total: billing.folio.grand_total,
          total_paid: billing.folio.total_paid,
          balance: billing.folio.balance,
          is_settled: billing.folio.is_settled,
          billing_status: billing.folio.is_settled ? "settled" : "outstanding",
          payment_status: billing.folio.payment_status,
          payment_status_label: billing.folio.payment_status_label
        },
        reservation: billing.reservation,
        guest: billing.guest,
        rooms: billing.rooms,
        charges: billing.charges,
        tax_breakdown: billing.tax_breakdown,
        payments: billing.payments
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
