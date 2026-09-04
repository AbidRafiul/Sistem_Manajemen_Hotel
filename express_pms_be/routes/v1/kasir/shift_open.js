/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_open.js
 * @description Endpoint buka shift kasir
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
import { generateSequence } from "../components/tools/generateCode.js";

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
        kode_cabang: Joi.string().required().label("Kode Cabang"),
        kode_cashier_counter: Joi.string().required().label("Kode Counter"),
        opening_cash: Joi.number().min(0).required().label("Opening Cash"),
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

    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      // 1. Cek apakah user masih punya shift yang sedang open
      const existingOpenShift = await trx("trx_cashier_shift")
        .where("user_id", user_id)
        .andWhere("status", "open")
        .first();

      if (existingOpenShift) {
        throw new Error("Anda masih memiliki shift aktif. Tutup shift sebelumnya sebelum membuka yang baru.");
      }

      // 2. Generate kode shift baru
      cUniqueCode = await generateSequence("FMT-SHIFT", trx);

      // 3. Insert shift baru
      const oData = {
        kode_cashier_shift: cUniqueCode,
        kode_cabang: oPayload.kode_cabang,
        kode_cashier_counter: oPayload.kode_cashier_counter,
        user_id: user_id,
        opening_cash: oPayload.opening_cash,
        status: "open",
        opened_at: formatDateSystem(),
        created_by: user_id,
        created_at: formatDateSystem(),
        updated_by: user_id,
        updated_at: formatDateSystem(),
      };

      await trx("trx_cashier_shift").insert(oData);
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Shift kasir berhasil dibuka",
      datetime: formatDateSystem(),
      data: { kode_cashier_shift: cUniqueCode },
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "OPEN SHIFT",
      TableName: "trx_cashier_shift",
      file: "shift_open.js",
      username: username,
    });
    
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message === "Anda masih memiliki shift aktif. Tutup shift sebelumnya sebelum membuka yang baru." ? error.message : "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
