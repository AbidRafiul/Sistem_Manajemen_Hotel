/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file guest_search.js
 * @description Endpoint untuk mencari data tamu
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
      keyword: Joi.string().required().label("Keyword (ID/Telepon)"),
      kode_cabang: Joi.string().required().label("Kode Cabang")
    };

    const cValidation = await validatePayload(
      schema,
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    const data = await DB("mst_guest")
      .where("kode_cabang", oPayload.kode_cabang)
      .andWhere(function () {
        this.where("id_number", oPayload.keyword)
            .orWhere("phone", oPayload.keyword)
            .orWhere("kode_tamu", oPayload.keyword);
      })
      .whereNull("deleted_at")
      .first();

    if (!data) {
      return res.status(200).json({
        status: status.NOT_FOUND,
        message: "Data tamu tidak ditemukan",
        datetime: formatDateSystem(),
        data: null
      });
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data tamu ditemukan",
      datetime: formatDateSystem(),
      data: data,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "reservasi/guest/guest_search.js",
      func: "search",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
