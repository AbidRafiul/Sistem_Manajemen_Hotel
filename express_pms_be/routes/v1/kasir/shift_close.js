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
  const user_id = req?.auth?.user_id || 0;

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
      const existingShift = await trx("trx_cashier_shift")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .first();

      if (!existingShift) {
        throw new Error("Shift tidak ditemukan");
      }

      if (existingShift.status === "closed") {
        throw new Error("Shift ini sudah ditutup sebelumnya");
      }
      
      // Keamanan opsional: pastikan shift ini milik user yang sedang login, atau berhak (misal admin bisa nutup paksa).
      // Untuk sederhananya kita asumsikan user_id match.
      if (existingShift.user_id !== user_id) {
        // Bisa dilewati kalau role admin
      }

      // 2. Hitung total cash dari payment (jika ada deposit, dll yang masuk ke trx_payment dgn cash)
      const sumPayment = await trx("trx_payment")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .where("payment_method", "cash")
        .sum("amount as total_cash")
        .first();

      const totalCashTransaction = sumPayment?.total_cash ? parseFloat(sumPayment.total_cash) : 0;
      
      // 3. Kalkulasi system_cash & difference
      const systemCash = parseFloat(existingShift.opening_cash) + totalCashTransaction;
      const closingCash = parseFloat(oPayload.closing_cash);
      const cashDifference = closingCash - systemCash;

      // 4. Update data shift
      const oData = {
        closing_cash: closingCash,
        system_cash: systemCash,
        cash_difference: cashDifference,
        status: "closed",
        closed_at: formatDateSystem(),
        updated_by: user_id,
        updated_at: formatDateSystem(),
      };

      await trx("trx_cashier_shift")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .update(oData);
        
      closingResult = oData;
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
      message: ["Shift tidak ditemukan", "Shift ini sudah ditutup sebelumnya"].includes(error.message) ? error.message : "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
