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
  const user_id = req?.auth?.user_id || req?.auth?.id || 0;

  try {
    const existingOpenShift = await DB("trx_cashier_shift as cs")
      .select(
        "cs.kode_cashier_shift",
        "cs.kode_cabang",
        "cs.kode_cashier_counter",
        "cs.sesi",
        "ms.nama_shift",
        "ms.is_night_audit",
        "ms.waktu_mulai as shift_mulai",
        "ms.waktu_selesai as shift_selesai",
        "cc.name as nama_counter",
        "c.nama_hotel as cabang_name",
        "cs.opening_cash",
        "cs.opened_at",
        "cs.user_id",
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
      .where("cs.user_id", user_id)
      .andWhere("cs.status", "open")
      .first();

    if (!existingOpenShift) {
      return res.status(200).json({
        status: status.SUKSES,
        message: "Tidak ada shift kasir aktif",
        datetime: formatDateSystem(),
        data: null,
      });
    }

    const shiftCode = existingOpenShift.kode_cashier_shift;

    // 1. Metrik Check-in (Kamar & Pax)
    const checkinStats = await DB("trx_checkin as ci")
      .leftJoin("trx_reservation_room as rr", "ci.kode_reservation_room", "rr.kode_reservasi_room")
      .leftJoin("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .where("ci.kode_cashier_shift", shiftCode)
      .whereNull("ci.deleted_at")
      .select(
        DB.raw("COUNT(ci.id) as total_checkin_kamar"),
        DB.raw("COALESCE(SUM(ci.guest_count), 0) as total_checkin_pax"),
        DB.raw("COALESCE(SUM(CASE WHEN r.booking_type = 'walk_in' OR r.source_channel = 'walk_in' THEN 1 ELSE 0 END), 0) as walkin_kamar"),
        DB.raw("COALESCE(SUM(CASE WHEN r.booking_type = 'walk_in' OR r.source_channel = 'walk_in' THEN ci.guest_count ELSE 0 END), 0) as walkin_pax"),
        DB.raw("COALESCE(SUM(CASE WHEN r.booking_type != 'walk_in' AND r.source_channel != 'walk_in' THEN 1 ELSE 0 END), 0) as reservasi_kamar"),
        DB.raw("COALESCE(SUM(CASE WHEN r.booking_type != 'walk_in' AND r.source_channel != 'walk_in' THEN ci.guest_count ELSE 0 END), 0) as reservasi_pax")
      )
      .first();

    // 2. Metrik Check-out (Kamar & Pax)
    const checkoutStats = await DB("trx_checkout")
      .where("kode_cashier_shift", shiftCode)
      .whereNull("deleted_at")
      .select(
        DB.raw("COUNT(id) as total_checkout_kamar"),
        DB.raw("COALESCE(SUM(guest_count), 0) as total_checkout_pax")
      )
      .first();

    // 3. Metrik Pembayaran (Cash, Non-Cash, Total)
    const paymentStats = await DB("trx_payment")
      .where("kode_cashier_shift", shiftCode)
      .select(
        DB.raw("COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as total_cash_in"),
        DB.raw("COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN amount ELSE 0 END), 0) as total_non_cash_in"),
        DB.raw("COALESCE(SUM(amount), 0) as total_payment_in")
      )
      .first();

    // 4. Metrik Fasilitas Tambahan Terjual
    const facilityStats = await DB("trx_folio_charge")
      .where("kode_cashier_shift", shiftCode)
      .where("charge_type", "!=", "room")
      .where("is_active", 1)
      .select(
        DB.raw("COALESCE(SUM(qty), 0) as total_fasilitas_item"),
        DB.raw("COALESCE(SUM(amount), 0) as total_fasilitas_amount")
      )
      .first();

    const openingCash = parseFloat(existingOpenShift.opening_cash) || 0;
    const totalCashIn = parseFloat(paymentStats?.total_cash_in) || 0;
    const totalNonCashIn = parseFloat(paymentStats?.total_non_cash_in) || 0;
    const systemCash = openingCash + totalCashIn;

    const enrichedShift = {
      ...existingOpenShift,
      stats: {
        total_checkin_kamar: parseInt(checkinStats?.total_checkin_kamar, 10) || 0,
        total_checkin_pax: parseInt(checkinStats?.total_checkin_pax, 10) || 0,
        walkin_kamar: parseInt(checkinStats?.walkin_kamar, 10) || 0,
        walkin_pax: parseInt(checkinStats?.walkin_pax, 10) || 0,
        reservasi_kamar: parseInt(checkinStats?.reservasi_kamar, 10) || 0,
        reservasi_pax: parseInt(checkinStats?.reservasi_pax, 10) || 0,
        total_checkout_kamar: parseInt(checkoutStats?.total_checkout_kamar, 10) || 0,
        total_checkout_pax: parseInt(checkoutStats?.total_checkout_pax, 10) || 0,
        opening_cash: openingCash,
        total_cash_in: totalCashIn,
        total_non_cash_in: totalNonCashIn,
        total_payment_in: parseFloat(paymentStats?.total_payment_in) || 0,
        system_cash: systemCash,
        total_fasilitas_item: parseFloat(facilityStats?.total_fasilitas_item) || 0,
        total_fasilitas_amount: parseFloat(facilityStats?.total_fasilitas_amount) || 0,
      }
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: "SUCCESS",
      datetime: formatDateSystem(),
      data: enrichedShift,
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
