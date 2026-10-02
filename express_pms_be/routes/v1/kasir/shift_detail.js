/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_detail.js
 * @description Endpoint rincian lengkap aktivitas shift kasir (Check-in, Check-out, Fasilitas, Pembayaran)
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-28
 * @version 1.0.0
 */
import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { Logging } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";

  try {
    const shiftCode = oPayload?.kode_cashier_shift;
    if (!shiftCode) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Kode shift wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    // 1. Ambil data utama shift kasir
    const shiftInfo = await DB("trx_cashier_shift as cs")
      .select(
        "cs.*",
        "ms.nama_shift",
        "ms.is_night_audit",
        "ms.waktu_mulai as shift_mulai",
        "ms.waktu_selesai as shift_selesai",
        "cc.name as nama_counter",
        "c.nama_hotel as cabang_name",
        "u.username as cashier_username",
        "u.fullname as cashier_name"
      )
      .leftJoin("mst_cashier_counter as cc", "cs.kode_cashier_counter", "cc.kode_counter")
      .leftJoin("mst_shift as ms", function () {
        this.on(function () {
          this.on(
            DB.raw("cs.sesi COLLATE utf8mb4_unicode_ci"),
            "=",
            DB.raw("ms.kode_shift COLLATE utf8mb4_unicode_ci")
          ).orOn(
            DB.raw("cs.sesi COLLATE utf8mb4_unicode_ci"),
            "=",
            DB.raw("ms.nama_shift COLLATE utf8mb4_unicode_ci")
          );
        }).andOn(
          DB.raw("cs.kode_cabang COLLATE utf8mb4_unicode_ci"),
          "=",
          DB.raw("ms.kode_cabang COLLATE utf8mb4_unicode_ci")
        );
      })
      .leftJoin("mst_cabang as c", "cs.kode_cabang", "c.kode_cabang")
      .leftJoin("mst_user as u", "cs.user_id", "u.id")
      .where("cs.kode_cashier_shift", shiftCode)
      .first();

    if (!shiftInfo) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data shift kasir tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // 2. Daftar Tamu Check-in
    const checkinList = await DB("trx_checkin as ci")
      .select(
        "ci.kode_checkin",
        "ci.checkin_at",
        "ci.guest_count",
        "rr.kode_reservasi_room",
        "rr.kode_kamar",
        "mk.nomor_kamar",
        "tk.nama_tipe as nama_tipe_kamar",
        "g.kode_tamu",
        "g.full_name as nama_tamu",
        "r.kode_reservasi",
        "r.booking_type",
        "r.source_channel",
        "r.deposit_amount"
      )
      .leftJoin("trx_reservation_room as rr", "ci.kode_reservation_room", "rr.kode_reservasi_room")
      .leftJoin("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .where("ci.kode_cashier_shift", shiftCode)
      .whereNull("ci.deleted_at")
      .orderBy("ci.checkin_at", "asc");

    // 3. Daftar Tamu Check-out
    const checkoutList = await DB("trx_checkout as co")
      .select(
        "co.kode_checkout",
        "co.checkout_at",
        "co.grand_total",
        "co.guest_count",
        "co.late_checkout",
        "rr.kode_reservasi_room",
        "rr.kode_kamar",
        "mk.nomor_kamar",
        "tk.nama_tipe as nama_tipe_kamar",
        "g.kode_tamu",
        "g.full_name as nama_tamu",
        "r.kode_reservasi"
      )
      .leftJoin("trx_reservation_room as rr", "co.kode_reservation_room", "rr.kode_reservasi_room")
      .leftJoin("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .where("co.kode_cashier_shift", shiftCode)
      .whereNull("co.deleted_at")
      .orderBy("co.checkout_at", "asc");

    // 4. Rincian Fasilitas Tambahan Terjual
    const facilityList = await DB("trx_folio_charge as fc")
      .select(
        "fc.id",
        "fc.kode_folio_charge",
        "fc.posted_at",
        "fc.charge_type",
        "fc.description",
        "fc.qty",
        "fc.unit_price",
        "fc.amount",
        "f.kode_folio",
        "r.kode_reservasi",
        "g.full_name as nama_tamu",
        DB.raw("GROUP_CONCAT(DISTINCT mk.nomor_kamar SEPARATOR ', ') as nomor_kamar")
      )
      .leftJoin("trx_folio as f", "fc.kode_folio", "f.kode_folio")
      .leftJoin("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .leftJoin("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
      .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .where("fc.kode_cashier_shift", shiftCode)
      .where("fc.charge_type", "!=", "room")
      .where("fc.is_active", 1)
      .groupBy(
        "fc.id",
        "fc.kode_folio_charge",
        "fc.posted_at",
        "fc.charge_type",
        "fc.description",
        "fc.qty",
        "fc.unit_price",
        "fc.amount",
        "f.kode_folio",
        "r.kode_reservasi",
        "g.full_name"
      )
      .orderBy("fc.posted_at", "asc");

    // 5. Jurnal Pembayaran (Cash, Non-Cash, Deposit, Pelunasan)
    let paymentList = [];
    try {
      paymentList = await DB("trx_payment as p")
        .select(
          "p.id",
          "p.kode_payment",
          "p.paid_at",
          "p.payment_method",
          "p.bank_name",
          "p.card_type",
          "p.amount",
          "p.reference_no",
          "p.kode_folio",
          "r.kode_reservasi",
          "g.full_name as nama_tamu",
          DB.raw("GROUP_CONCAT(DISTINCT mk.nomor_kamar SEPARATOR ', ') as nomor_kamar")
        )
        .leftJoin("trx_folio as f", "p.kode_folio", "f.kode_folio")
        .leftJoin("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
        .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
        .leftJoin("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
        .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
        .where("p.kode_cashier_shift", shiftCode)
        .groupBy(
          "p.id",
          "p.kode_payment",
          "p.paid_at",
          "p.payment_method",
          "p.bank_name",
          "p.card_type",
          "p.amount",
          "p.reference_no",
          "p.kode_folio",
          "r.kode_reservasi",
          "g.full_name"
        )
        .orderBy("p.paid_at", "asc");
    } catch (ePay) {
      // Fallback aman jika kolom bank_name atau card_type belum ditambahkan di database production
      paymentList = await DB("trx_payment as p")
        .select(
          "p.id",
          "p.kode_payment",
          "p.paid_at",
          "p.payment_method",
          DB.raw("NULL as bank_name"),
          DB.raw("NULL as card_type"),
          "p.amount",
          "p.reference_no",
          "p.kode_folio",
          "r.kode_reservasi",
          "g.full_name as nama_tamu",
          DB.raw("GROUP_CONCAT(DISTINCT mk.nomor_kamar SEPARATOR ', ') as nomor_kamar")
        )
        .leftJoin("trx_folio as f", "p.kode_folio", "f.kode_folio")
        .leftJoin("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
        .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
        .leftJoin("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
        .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
        .where("p.kode_cashier_shift", shiftCode)
        .groupBy(
          "p.id",
          "p.kode_payment",
          "p.paid_at",
          "p.payment_method",
          "p.amount",
          "p.reference_no",
          "p.kode_folio",
          "r.kode_reservasi",
          "g.full_name"
        )
        .orderBy("p.paid_at", "asc");
    }

    // Rekapitulasi Pembayaran per Metode
    const paymentSummary = {
      cash: 0,
      card: 0,
      qris: 0,
      transfer: 0,
      edc: 0,
      deposit: 0,
      voucher: 0,
      other: 0,
      total: 0
    };

    paymentList.forEach((pay) => {
      const amt = parseFloat(pay.amount) || 0;
      const m = (pay.payment_method || "").toLowerCase();
      if (paymentSummary[m] !== undefined) {
        paymentSummary[m] += amt;
      } else {
        paymentSummary.other += amt;
      }
      paymentSummary.total += amt;
    });

    const totalCashIn = paymentSummary.cash;
    const totalNonCashIn = paymentSummary.total - paymentSummary.cash;
    const openingCash = parseFloat(shiftInfo.opening_cash) || 0;
    const systemCash = openingCash + totalCashIn;
    const closingCash = shiftInfo.closing_cash !== null ? parseFloat(shiftInfo.closing_cash) : null;
    const cashDifference = shiftInfo.cash_difference !== null ? parseFloat(shiftInfo.cash_difference) : (closingCash !== null ? closingCash - systemCash : null);

    const totalCheckinPax = checkinList.reduce((sum, item) => sum + (parseInt(item.guest_count, 10) || 1), 0);
    const totalCheckoutPax = checkoutList.reduce((sum, item) => sum + (parseInt(item.guest_count, 10) || 1), 0);
    const totalFasilitasQty = facilityList.reduce((sum, item) => sum + (parseFloat(item.qty) || 1), 0);
    const totalFasilitasNominal = facilityList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const result = {
      shift: {
        ...shiftInfo,
        opening_cash: openingCash,
        closing_cash: closingCash,
        system_cash: systemCash,
        cash_difference: cashDifference,
      },
      summary: {
        total_checkin_kamar: checkinList.length,
        total_checkin_pax: totalCheckinPax,
        total_checkout_kamar: checkoutList.length,
        total_checkout_pax: totalCheckoutPax,
        total_fasilitas_item: totalFasilitasQty,
        total_fasilitas_amount: totalFasilitasNominal,
        opening_cash: openingCash,
        total_cash_in: totalCashIn,
        total_non_cash_in: totalNonCashIn,
        total_payment_in: paymentSummary.total,
        system_cash: systemCash,
        closing_cash: closingCash,
        cash_difference: cashDifference,
      },
      payment_summary: paymentSummary,
      checkins: checkinList,
      checkouts: checkoutList,
      facilities: facilityList,
      payments: paymentList,
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data rincian shift kasir berhasil diambil",
      datetime: formatDateSystem(),
      data: result,
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET SHIFT DETAIL",
      TableName: "trx_cashier_shift",
      file: "shift_detail.js",
      username: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan saat memuat rincian shift kasir.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
