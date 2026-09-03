/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file availability.js
 * @description Endpoint untuk mengecek ketersediaan kamar dan rate walk-in
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @version 1.0.0
 */
import express from "express";
import { status } from "../../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../../core/config/knex.js";
import { Logging, validatePayload } from "../../../components/tools/servertool.js";
import { formatDateSystem } from "../../../components/tools/date_tools.js";
import { hitungHargaKamar } from "../../../components/tools/pricing_helper.js";

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
      kode_cabang: Joi.string().required().label("Kode Cabang"),
      kode_tipe_kamar: Joi.string().required().label("Kode Tipe Kamar"),
      kode_rate_plan: Joi.string().required().label("Kode Rate Plan"),
      kode_season: Joi.string().optional().allow(null, "").label("Kode Season"),
      check_in_date: Joi.date().iso().required().label("Tanggal Check In"),
      check_out_date: Joi.date().iso().required().label("Tanggal Check Out")
    };

    const cValidation = await validatePayload(
      schema,
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "date.format": "{#label} format tanggal salah"
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    // 1. Cek Kamar Fisik yang Kosong dan Bersih
    // Simplifikasi Walk-In: Hanya mengecek status saat ini (tidak cek kalender ke depan)
    const availableRooms = await DB("mst_kamar")
      .where("kode_cabang", oPayload.kode_cabang)
      .where("kode_tipe_kamar", oPayload.kode_tipe_kamar)
      .where("occupancy_status", "vacant")
      .where("housekeeping_status", "clean")
      .where("is_active", 1)
      .whereNull("deleted_at")
      .select("kode_kamar", "nomor_kamar", "tipe_pemandangan");

    if (!availableRooms || availableRooms.length === 0) {
      return res.status(200).json({
        status: status.SUKSES, // Tetap sukses tapi data kosong agar FE tahu formatnya
        message: "Tidak ada kamar tersedia untuk tipe kamar tersebut",
        datetime: formatDateSystem(),
        data: {
            available_rooms: [],
            rate_info: null
        }
      });
    }

    // 2. Hitung harga menggunakan helper dengan tanggal check-in aktual
    let rateInfo = null;
    try {
        rateInfo = await hitungHargaKamar({
            kode_tipe_kamar: oPayload.kode_tipe_kamar,
            kode_rate_plan: oPayload.kode_rate_plan,
            kode_season: oPayload.kode_season,
            tanggal: oPayload.check_in_date
        }, DB);
    } catch (e) {
        return res.status(404).json({
            status: status.NOT_FOUND,
            message: e.message || "Gagal menghitung tarif kamar",
            datetime: formatDateSystem(),
        });
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Ketersediaan kamar dan rate berhasil diambil",
      datetime: formatDateSystem(),
      data: {
          available_rooms: availableRooms,
          rate_info: rateInfo
      },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "reservasi/kamar/availability.js",
      func: "availability",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
