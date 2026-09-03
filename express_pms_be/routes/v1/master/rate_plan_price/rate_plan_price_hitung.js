/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_price_hitung.js
 * @description Endpoint hitung harga kamar final
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-28
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-28)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { hitungHargaKamar } from "../../components/tools/pricing_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";

  try {
    if (!oPayload || Object.keys(oPayload).length < 1) {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Invalid request body",
          datetime: formatDateSystem(),
        });
    }

    const schema = {
      kode_tipe_kamar: Joi.string().required().label("Kode Tipe Kamar"),
      kode_rate_plan: Joi.string().required().label("Kode Rate Plan"),
      kode_season: Joi.string().optional().allow(null, "").label("Kode Season"),
      tanggal: Joi.date().iso().optional().allow(null, "").label("Tanggal"),
    };

    const cValidation = await validatePayload(
      schema,
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "date.format": "{#label} format tanggal salah",
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    const finalPriceData = await hitungHargaKamar({
      kode_tipe_kamar: oPayload.kode_tipe_kamar,
      kode_rate_plan: oPayload.kode_rate_plan,
      kode_season: oPayload.kode_season,
      tanggal: oPayload.tanggal
    }, DB);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Harga berhasil dihitung",
      datetime: formatDateSystem(),
      data: finalPriceData
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/rate_plan_price/rate_plan_price_hitung.js",
      func: "hitung",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
