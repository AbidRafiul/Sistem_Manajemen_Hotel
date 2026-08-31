/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_kamar_create.js
 * @deskripsi Endpoint create master tipe kamar
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-13
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-13)
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
    const cValidation = await validatePayload(
      {
        kode_cabang: Joi.string().required().label("Kode Cabang"),
        name: Joi.string().required().label("Nama Tipe"),
        kode_bed_type: Joi.string().allow(null).optional().label("Bed Type"),
        kapasitas_dasar: Joi.number().required().label("Kapasitas Dasar"),
        kapasitas_maksimal: Joi.number().required().label("Kapasitas Maksimal"),
        luas_m2: Joi.number().optional().allow("", null).label("Luas m2"),
        deskripsi: Joi.string().optional().allow("", null).label("Deskripsi"),
        is_active: Joi.number().valid(0, 1).optional().default(1).label("Status Aktif"),
        harga_default: Joi.number().min(0).required().label("Harga Default"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
      },
      oPayload,
      { table: "mst_tipe_kamar", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      cUniqueCode = await generateSequence("FMT-TIPEKAMAR", trx);
      const oData = {
        kode_cabang: oPayload.kode_cabang,
        kode_tipe_kamar: cUniqueCode,
        kode_bed_type: oPayload.kode_bed_type || null,
        nama_tipe: oPayload.name,
        kapasitas_dasar: oPayload.kapasitas_dasar,
        kapasitas_maksimal: oPayload.kapasitas_maksimal,
        luas_sqm: oPayload.luas_m2,
        harga_default: oPayload.harga_default,
        deskripsi: oPayload.deskripsi,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1,
        created_by: req.auth?.user_id || 1,
        created_at: formatDateSystem(),
        updated_at: formatDateSystem(),
      };

      const existingData = await trx("mst_tipe_kamar")
        .where("kode_tipe_kamar", cUniqueCode)
        .first();
      if (existingData) {
        throw new Error("DUPLICATE_CODE");
      }

      await trx("mst_tipe_kamar").insert(oData);
      await ChangesLog(
        {
          deskripsi: "Tambah Master Tipe Kamar",
          tableName: "mst_tipe_kamar",
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
        message: "Data Master Tipe Kamar berhasil dibuat",
        datetime: formatDateSystem(),
        data: { kode_tipe_kamar: cUniqueCode },
      });
  } catch (error) {
    if (error.message === "DUPLICATE_CODE") {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Kode sudah digunakan, silakan coba lagi.",
          datetime: formatDateSystem(),
        });
    }
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/tipe_kamar/tipe_kamar_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
