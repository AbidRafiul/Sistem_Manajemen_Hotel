/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file guest_create.js
 * @description Endpoint untuk membuat data tamu baru
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @version 1.0.0
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
  const userId = req?.auth?.user_id || null;

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
      full_name: Joi.string().required().max(150).label("Nama Lengkap"),
      id_type: Joi.string().valid('ktp','passport','sim','other').required().label("Tipe ID"),
      id_number: Joi.string().required().max(50).label("Nomor ID"),
      phone: Joi.string().required().max(30).label("Nomor Telepon"),
      email: Joi.string().email().allow(null, "").max(100).label("Email"),
      nationality: Joi.string().allow(null, "").max(50).label("Kewarganegaraan")
    };

    const cValidation = await validatePayload(
      schema,
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "string.max": "{#label} maksimal {#limit} karakter",
        "any.only": "{#label} tidak valid",
        "string.email": "{#label} format tidak valid"
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    // Cek duplikasi id_number atau phone
    const existingGuest = await DB("mst_guest")
      .where("kode_cabang", oPayload.kode_cabang)
      .whereNull("deleted_at")
      .andWhere(function () {
        this.where("id_number", oPayload.id_number)
            .orWhere("phone", oPayload.phone);
      })
      .first();

    if (existingGuest) {
        return res
            .status(422)
            .json({ 
                status: status.BAD_REQUEST, 
                message: existingGuest.id_number === oPayload.id_number 
                            ? "Tamu dengan Nomor ID tersebut sudah terdaftar." 
                            : "Tamu dengan Nomor Telepon tersebut sudah terdaftar.", 
                datetime: formatDateSystem() 
            });
    }

    let insertedKodeTamu = "";
    
    await DB.transaction(async (trx) => {
      const generateNumber = await generateSequence("FMT-TAMU", trx);
      if (!generateNumber) throw new Error("Gagal generate kode tamu");
      
      insertedKodeTamu = generateNumber;

      const objInsert = {
        kode_cabang: oPayload.kode_cabang,
        kode_tamu: insertedKodeTamu,
        full_name: oPayload.full_name,
        id_type: oPayload.id_type,
        id_number: oPayload.id_number,
        nationality: oPayload.nationality || null,
        email: oPayload.email || null,
        phone: oPayload.phone,
        created_by: userId,
        created_at: formatDateSystem()
      };

      await trx("mst_guest").insert(objInsert);

      await ChangesLog({
        description: "Tamu baru dibuat",
        tableName: "mst_guest",
        referenceCode: insertedKodeTamu,
        action: "CREATE",
        dataAfter: objInsert,
        dataBefore: null,
        user: username
      }, trx);
    });

    const newData = await DB("mst_guest").where("kode_tamu", insertedKodeTamu).first();

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data tamu berhasil ditambahkan",
      datetime: formatDateSystem(),
      data: newData,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "reservasi/guest/guest_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
