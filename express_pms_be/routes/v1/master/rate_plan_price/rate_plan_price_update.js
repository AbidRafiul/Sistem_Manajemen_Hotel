/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_price_update.js
 * @description Endpoint update master rate plan price
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
      kode_harga_price: Joi.string().required().label("Kode Harga Price"),
      kode_tipe_kamar: Joi.string().optional().label("Tipe Kamar"),
      kode_rate_plan: Joi.string().optional().label("Rate Plan"),
      kode_season: Joi.string().optional().allow(null, "").label("Season"),
      price: Joi.number().min(0).optional().label("Harga"),
      extra_bed_price: Joi.number().min(0).optional().allow(null, "").label("Harga Extra Bed"),
      valid_from: Joi.date().iso().optional().label("Berlaku Mulai"),
      valid_to: Joi.date().iso().optional().allow(null, "").label("Berlaku Sampai"),
      is_active: Joi.number().valid(0, 1).optional().label("Status Aktif"),
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

    await DB.transaction(async (trx) => {
      const existingData = await trx("mst_rate_plan_price")
        .where("kode_harga_price", oPayload.kode_harga_price)
        .whereNull("deleted_at")
        .first();
      if (!existingData) {
        throw new Error("NOT_FOUND");
      }

      // Prepare update payload
      const oData = {};
      if (oPayload.kode_tipe_kamar !== undefined) oData.kode_tipe_kamar = oPayload.kode_tipe_kamar;
      if (oPayload.kode_rate_plan !== undefined) oData.kode_rate_plan = oPayload.kode_rate_plan;
      if (oPayload.kode_season !== undefined) oData.kode_season = oPayload.kode_season || null;
      if (oPayload.price !== undefined) oData.price = oPayload.price;
      if (oPayload.extra_bed_price !== undefined)
        oData.extra_bed_price =
          oPayload.extra_bed_price === "" || oPayload.extra_bed_price == null
            ? null
            : oPayload.extra_bed_price;
      if (oPayload.valid_from !== undefined)
        oData.valid_from = oPayload.valid_from
          ? formatDateSystem(oPayload.valid_from, "yyyy-MM-dd")
          : null;
      if (oPayload.valid_to !== undefined)
        oData.valid_to = oPayload.valid_to
          ? formatDateSystem(oPayload.valid_to, "yyyy-MM-dd")
          : null;
      if (oPayload.is_active !== undefined) oData.is_active = oPayload.is_active;

      // Variables for overlap check
      const checkTipeKamar =
        oData.kode_tipe_kamar !== undefined ? oData.kode_tipe_kamar : existingData.kode_tipe_kamar;
      const checkRatePlan =
        oData.kode_rate_plan !== undefined ? oData.kode_rate_plan : existingData.kode_rate_plan;
      const checkSeason =
        oData.kode_season !== undefined ? oData.kode_season : existingData.kode_season;
      const checkValidFrom =
        oData.valid_from !== undefined ? oData.valid_from : existingData.valid_from;
      const checkValidTo = oData.valid_to !== undefined ? oData.valid_to : existingData.valid_to;
      const checkIsActive =
        oData.is_active !== undefined ? oData.is_active : existingData.is_active;

      // Only check overlap if it's active
      if (checkIsActive === 1) {
        const existingQuery = trx("mst_rate_plan_price")
          .where("kode_tipe_kamar", checkTipeKamar)
          .where("kode_rate_plan", checkRatePlan)
          .where("is_active", 1)
          .whereNot("kode_harga_price", oPayload.kode_harga_price)
          .whereNull("deleted_at");

        if (checkSeason) {
          existingQuery.where("kode_season", checkSeason);
        } else {
          existingQuery.whereNull("kode_season");
        }

        existingQuery
          .where(function () {
            if (checkValidTo) {
              this.where("valid_from", "<=", checkValidTo);
            }
          })
          .andWhere(function () {
            this.where("valid_to", ">=", checkValidFrom).orWhereNull("valid_to");
          });

        const overlaps = await existingQuery;
        if (overlaps.length > 0) {
          throw new Error("OVERLAP_DATE");
        }
      }

      if (Object.keys(oData).length > 0) {
        oData.updated_by = req.auth?.user_id || 1;
        oData.updated_at = formatDateSystem();
        await trx("mst_rate_plan_price")
          .where("kode_harga_price", oPayload.kode_harga_price)
          .update(oData);
        await ChangesLog(
          {
            description: "Update Master Harga Kamar",
            tableName: "mst_rate_plan_price",
            referenceCode: oPayload.kode_harga_price,
            action: "UPDATE",
            dataBefore: existingData,
            dataAfter: { ...existingData, ...oData },
            user: username,
            tz: oPayload.tz || "UTC",
          },
          trx
        );
      }
    });

    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data Master Harga Kamar berhasil diubah",
        datetime: formatDateSystem(),
      });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return res
        .status(404)
        .json({
          status: status.BAD_REQUEST,
          message: "Data tidak ditemukan",
          datetime: formatDateSystem(),
        });
    }
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
      file: "master/rate_plan_price/rate_plan_price_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
