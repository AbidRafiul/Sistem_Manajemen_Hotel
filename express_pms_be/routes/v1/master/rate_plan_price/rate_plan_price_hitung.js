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

    const targetDate = oPayload.tanggal
      ? formatDateSystem(oPayload.tanggal, "yyyy-MM-dd")
      : formatDateSystem(new Date(), "yyyy-MM-dd");
    const season = oPayload.kode_season || null;

    // 1. Cek mst_rate_plan_price untuk override
    const overrideQuery = DB("mst_rate_plan_price")
      .where("kode_tipe_kamar", oPayload.kode_tipe_kamar)
      .where("kode_rate_plan", oPayload.kode_rate_plan)
      .where("is_active", 1)
      .whereNull("deleted_at")
      .where("valid_from", "<=", targetDate)
      .andWhere(function () {
        this.where("valid_to", ">=", targetDate).orWhereNull("valid_to");
      });

    if (season) {
      overrideQuery.where("kode_season", season);
    } else {
      overrideQuery.whereNull("kode_season");
    }

    const overrideData = await overrideQuery.first();

    if (overrideData) {
      return res.status(200).json({
        status: status.SUKSES,
        message: "Harga berhasil dihitung",
        datetime: formatDateSystem(),
        data: {
          price: parseFloat(overrideData.price),
          source: "override",
          kode_harga_price: overrideData.kode_harga_price,
        },
      });
    }

    // 2. Kalau tidak ada override, hitung dari master
    const tkData = await DB("mst_tipe_kamar")
      .where("kode_tipe_kamar", oPayload.kode_tipe_kamar)
      .whereNull("deleted_at")
      .select("harga_default")
      .first();

    const rpData = await DB("mst_paket_harga")
      .where("kode_paket_harga", oPayload.kode_rate_plan)
      .whereNull("deleted_at")
      .select("tipe_markup", "nilai_markup")
      .first();

    if (!tkData || !rpData) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Kombinasi Tipe Kamar dan Rate Plan tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    const hargaDefault = parseFloat(tkData.harga_default || 0);
    const nilaiMarkup = parseFloat(rpData.nilai_markup || 0);
    const tipeMarkup = rpData.tipe_markup;

    let computedPrice = hargaDefault;
    if (tipeMarkup === "nominal") {
      computedPrice += nilaiMarkup;
    } else if (tipeMarkup === "persen") {
      computedPrice += (hargaDefault * nilaiMarkup) / 100;
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Harga berhasil dihitung",
      datetime: formatDateSystem(),
      data: {
        price: computedPrice,
        source: "computed",
        breakdown: {
          harga_default: hargaDefault,
          tipe_markup: tipeMarkup,
          nilai_markup: nilaiMarkup,
        },
      },
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
