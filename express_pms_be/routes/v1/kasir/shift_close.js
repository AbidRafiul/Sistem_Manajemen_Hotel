/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_close.js
 * @description Endpoint tutup shift kasir
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../components/tools/general.js";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { Logging, validatePayload } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const user_id = req?.auth?.user_id || req?.auth?.id || 0;

  try {
    if (!oPayload || Object.keys(oPayload).length < 1)
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Invalid request body",
        datetime: formatDateSystem(),
      });

    const cValidation = await validatePayload(
      {
        kode_cashier_shift: Joi.string().required().label("Kode Shift"),
        closing_cash: Joi.number().min(0).required().label("Closing Cash"),
        catatan_handover: Joi.string().optional().allow("", null).label("Catatan Handover"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
        "number.min": "{#label} minimal {#limit}",
      },
      oPayload,
      { table: "trx_cashier_shift", allowUnknown: true }
    );

    if (cValidation)
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });

    let closingResult = {};

    await DB.transaction(async (trx) => {
      // 1. Ambil data shift yang akan ditutup
      const existingShift = await trx("trx_cashier_shift as cs")
        .select(
          "cs.*",
          "cc.name as nama_counter",
          "c.nama_hotel as cabang_name",
          "u.username as cashier_username",
          "u.fullname as cashier_name"
        )
        .leftJoin("mst_cashier_counter as cc", "cs.kode_cashier_counter", "cc.kode_counter")
        .leftJoin("mst_cabang as c", "cs.kode_cabang", "c.kode_cabang")
        .leftJoin("mst_user as u", "cs.user_id", "u.id")
        .where("cs.kode_cashier_shift", oPayload.kode_cashier_shift)
        .first();

      if (!existingShift) {
        throw new Error("Shift tidak ditemukan");
      }

      if (existingShift.status === "closed") {
        throw new Error("Shift ini sudah ditutup sebelumnya");
      }
      
      if (existingShift.user_id !== user_id) {
        throw new Error("Anda tidak berhak menutup shift milik user lain");
      }

      // 2. Hitung total transaksi pembayaran (Cash & Non-Cash)
      const sumPayment = await trx("trx_payment")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .select(
          trx.raw("COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as total_cash"),
          trx.raw("COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN amount ELSE 0 END), 0) as total_non_cash"),
          trx.raw("COALESCE(SUM(amount), 0) as total_payment")
        )
        .first();

      const totalCashTransaction = sumPayment?.total_cash ? parseFloat(sumPayment.total_cash) : 0;
      const totalNonCashTransaction = sumPayment?.total_non_cash ? parseFloat(sumPayment.total_non_cash) : 0;
      
      // 3. Hitung aktivitas check-in, checkout, dan fasilitas
      const checkinCount = await trx("trx_checkin")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .whereNull("deleted_at")
        .select(
          trx.raw("COUNT(id) as total_checkin_kamar"),
          trx.raw("COALESCE(SUM(guest_count), 0) as total_checkin_pax")
        )
        .first();

      const checkoutCount = await trx("trx_checkout")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .whereNull("deleted_at")
        .select(
          trx.raw("COUNT(id) as total_checkout_kamar"),
          trx.raw("COALESCE(SUM(guest_count), 0) as total_checkout_pax")
        )
        .first();

      const facilityCount = await trx("trx_folio_charge")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .where("charge_type", "!=", "room")
        .where("is_active", 1)
        .select(
          trx.raw("COALESCE(SUM(qty), 0) as total_fasilitas_item"),
          trx.raw("COALESCE(SUM(amount), 0) as total_fasilitas_amount")
        )
        .first();

      // 4. Kalkulasi system_cash & difference
      const systemCash = parseFloat(existingShift.opening_cash) + totalCashTransaction;
      const closingCash = parseFloat(oPayload.closing_cash);
      const cashDifference = closingCash - systemCash;
      const closedAt = formatDateSystem();

      // 5. Update data shift
      const oData = {
        closing_cash: closingCash,
        system_cash: systemCash,
        cash_difference: cashDifference,
        catatan_handover: oPayload.catatan_handover || null,
        status: "closed",
        closed_at: closedAt,
        updated_by: user_id,
        updated_at: closedAt,
      };

      await trx("trx_cashier_shift")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .update(oData);
        
      closingResult = {
        ...existingShift,
        ...oData,
        total_checkin_kamar: parseInt(checkinCount?.total_checkin_kamar, 10) || 0,
        total_checkin_pax: parseInt(checkinCount?.total_checkin_pax, 10) || 0,
        total_checkout_kamar: parseInt(checkoutCount?.total_checkout_kamar, 10) || 0,
        total_checkout_pax: parseInt(checkoutCount?.total_checkout_pax, 10) || 0,
        total_cash_in: totalCashTransaction,
        total_non_cash_in: totalNonCashTransaction,
        total_payment_in: parseFloat(sumPayment?.total_payment) || 0,
        total_fasilitas_item: parseFloat(facilityCount?.total_fasilitas_item) || 0,
        total_fasilitas_amount: parseFloat(facilityCount?.total_fasilitas_amount) || 0,
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Shift kasir berhasil ditutup",
      datetime: formatDateSystem(),
      data: closingResult,
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "CLOSE SHIFT",
      TableName: "trx_cashier_shift",
      file: "shift_close.js",
      username: username,
    });
    
    return res.status(500).json({
      status: status.GAGAL,
      message: ["Shift tidak ditemukan", "Shift ini sudah ditutup sebelumnya", "Anda tidak berhak menutup shift milik user lain"].includes(error.message) ? error.message : "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
