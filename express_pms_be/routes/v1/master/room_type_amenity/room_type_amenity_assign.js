/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file room_type_amenity_assign.js
 * @description Endpoint assign amenity ke master tipe kamar
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
import { generateSequence } from "../../components/tools/generateCode.js";
const router = express.Router();
router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  try {
    const cValidation = await validatePayload(
      {
        kode_tipe_kamar: Joi.string().required().label("Kode Tipe Kamar"),
        kode_amenity: Joi.array().items(Joi.string()).label("Amenity"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "array.base": "{#label} harus berupa array",
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    await DB.transaction(async (trx) => {
      // Delete existing
      await trx("mst_room_type_amenity").where("kode_tipe_kamar", oPayload.kode_tipe_kamar).del();

      // Insert new
      if (oPayload.kode_amenity && oPayload.kode_amenity.length > 0) {
        for (const amenity of oPayload.kode_amenity) {
          const kode_rta = await generateSequence("FMT-RTA", trx);
          await trx("mst_room_type_amenity").insert({
            kode_rta,
            kode_tipe_kamar: oPayload.kode_tipe_kamar,
            kode_amenity: amenity,
          });
        }
      }
    });
    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Amenity berhasil disimpan ke Tipe Kamar",
        datetime: formatDateSystem(),
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/room_type_amenity/room_type_amenity_assign.js",
      func: "assign",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
