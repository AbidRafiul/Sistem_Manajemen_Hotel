import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";

  const schema = Joi.object({
    kode_cabang: Joi.string().required().label("Kode Cabang"),
    name: Joi.string().required().label("Nama Cabang"),
    address: Joi.string().optional().allow("", null).label("Alamat"),
    telepon: Joi.string().optional().allow("", null).label("Telepon"),
    check_in_time: Joi.string().optional().allow("", null).label("Waktu Check-In"),
    check_out_time: Joi.string().optional().allow("", null).label("Waktu Check-Out"),
    timezone: Joi.string().optional().allow("", null).label("Timezone"),
    is_pkp: Joi.number().valid(0, 1).optional().default(0).label("PKP"),
    is_active: Joi.number().valid(0, 1).optional().default(1).label("Status Aktif"),
  }).unknown(true);

  const { error } = schema.validate(oPayload);
  if (error) {
    return res
      .status(400)
      .json({
        status: status.BAD_REQUEST,
        message: error.details[0].message,
        datetime: formatDateSystem(),
      });
  }

  try {
    const existing = await DB("mst_cabang")
      .where("kode_cabang", oPayload.kode_cabang)
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return res
        .status(404)
        .json({
          status: status.BAD_REQUEST,
          message: "Data tidak ditemukan",
          datetime: formatDateSystem(),
        });
    }

    await DB.transaction(async (trx) => {
      const dataToUpdate = {
        nama_hotel: oPayload.name,
        alamat: oPayload.address || "",
        telepon: oPayload.telepon || null,
        waktu_checkin: oPayload.check_in_time || "14:00:00",
        waktu_checkout: oPayload.check_out_time || "12:00:00",
        zona_waktu: oPayload.timezone || "Asia/Jakarta",
        is_pkp: oPayload.is_pkp ?? 0,
        is_active: oPayload.is_active !== undefined ? oPayload.is_active : 1,
        updated_at: DB.fn.now(),
      };
      await trx("mst_cabang").where("kode_cabang", oPayload.kode_cabang).update(dataToUpdate);
    });

    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data berhasil diperbarui",
        datetime: formatDateSystem(),
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/cabang/cabang_update.js",
      func: "post",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
