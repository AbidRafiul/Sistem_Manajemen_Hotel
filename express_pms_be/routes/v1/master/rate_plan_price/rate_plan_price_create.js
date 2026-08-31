/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_price_create.js
 * @description Endpoint create master rate plan price
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-27
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-27)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, ChangesLog, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  try {
    if (!oPayload || Object.keys(oPayload).length < 1)
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Invalid request body",
          datetime: formatDateSystem(),
        });

    const schema = {
      kode_tipe_kamar: Joi.string().required().label("Tipe Kamar"),
      kode_rate_plan: Joi.string().required().label("Rate Plan"),
      kode_season: Joi.string().optional().allow(null, "").label("Season"),
      price: Joi.number().min(0).required().label("Harga"),
      extra_bed_price: Joi.number().min(0).optional().allow(null, "").label("Harga Extra Bed"),
      valid_from: Joi.date().iso().required().label("Berlaku Mulai"),
      valid_to: Joi.date().iso().optional().allow(null, "").label("Berlaku Sampai"),
      is_active: Joi.number().valid(0, 1).optional().default(1).label("Status Aktif"),
    };

    const cValidation = await validatePayload(
      schema,
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
        "number.min": "{#label} tidak boleh negatif",
        "date.format": "{#label} format tanggal salah",
      },
      oPayload,
      { table: "mst_rate_plan_price", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    let cUniqueCode = "";

    // Normalize empty strings to null and format dates
    const season = oPayload.kode_season || null;
    const validTo = oPayload.valid_to ? formatDateSystem(oPayload.valid_to, "yyyy-MM-dd") : null;
    const validFrom = formatDateSystem(oPayload.valid_from, "yyyy-MM-dd");
    const extraBed =
      oPayload.extra_bed_price === "" || oPayload.extra_bed_price == null
        ? null
        : oPayload.extra_bed_price;

    await DB.transaction(async (trx) => {
      // Validasi Overlap
      const existingQuery = trx("mst_rate_plan_price")
        .where("kode_tipe_kamar", oPayload.kode_tipe_kamar)
        .where("kode_rate_plan", oPayload.kode_rate_plan)
        .where("is_active", 1)
        .whereNull("deleted_at");

      if (season) {
        existingQuery.where("kode_season", season);
      } else {
        existingQuery.whereNull("kode_season");
      }

      existingQuery
        .where(function () {
          if (validTo) {
            this.where("valid_from", "<=", validTo);
          }
        })
        .andWhere(function () {
          this.where("valid_to", ">=", validFrom).orWhereNull("valid_to");
        });

      const overlaps = await existingQuery;
      if (overlaps.length > 0) {
        throw new Error("OVERLAP_DATE");
      }

      cUniqueCode = await generateSequence("FMT-HARGAKAMAR", trx);

      const oData = {
        kode_harga_price: cUniqueCode,
        kode_tipe_kamar: oPayload.kode_tipe_kamar,
        kode_rate_plan: oPayload.kode_rate_plan,
        kode_season: season,
        price: oPayload.price,
        extra_bed_price: extraBed,
        valid_from: validFrom,
        valid_to: validTo,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1,
        created_by: req.auth?.user_id || 1,
        created_at: formatDateSystem(),
        updated_at: formatDateSystem(),
      };

      await trx("mst_rate_plan_price").insert(oData);
      await ChangesLog(
        {
          description: "Tambah Master Harga Kamar",
          tableName: "mst_rate_plan_price",
          referenceCode: cUniqueCode,
          action: "CREATE",
          dataBefore: null,
          dataAfter: oData,
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data Master Harga Kamar berhasil dibuat",
        datetime: formatDateSystem(),
        data: { kode_harga_price: cUniqueCode },
      });
  } catch (error) {
    if (error.message === "OVERLAP_DATE") {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Sudah ada harga aktif untuk kombinasi ini pada rentang tanggal tersebut",
          datetime: formatDateSystem(),
        });
    }
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/rate_plan_price/rate_plan_price_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
