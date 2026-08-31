/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file kamar_update.js
 * @description Endpoint update master kamar
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
const router = express.Router();
router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  try {
    const cValidation = await validatePayload(
      {
        kode_kamar: Joi.string().required().label("Kode"),
        kode_cabang: Joi.string().required().label("Cabang"),
        kode_gedung: Joi.string().allow(null).optional().label("Gedung"),
        kode_lantai: Joi.string().required().label("Lantai"),
        kode_tipe_kamar: Joi.string().required().label("Tipe Kamar"),
        name: Joi.string().min(1).max(20).required().label("Nomor Kamar"),
        tipe_view: Joi.string().allow("", null).optional().label("View"),
        catatan: Joi.string().allow("", null).optional().label("Catatan"),
        boleh_merokok: Joi.number().valid(0, 1).optional().label("Smoking"),
        occupancy_status: Joi.string()
          .valid("vacant", "occupied", "blocked")
          .optional()
          .label("Occupancy Status"),
        housekeeping_status: Joi.string()
          .valid("clean", "dirty", "inspection", "maintenance")
          .optional()
          .label("Housekeeping Status"),
        is_active: Joi.number().valid(0, 1).optional().label("Status Aktif"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "any.only": "{#label} nilai tidak valid",
      },
      oPayload,
      { table: "mst_kamar", allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    if (
      oPayload.occupancy_status === "occupied" &&
      oPayload.housekeeping_status === "maintenance"
    ) {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Kamar yang sedang ditempati (Occupied) tidak boleh berstatus Maintenance.",
          datetime: formatDateSystem(),
        });
    }

    const existing = await DB("mst_kamar")
      .where("kode_kamar", oPayload.kode_kamar)
      .whereNull("deleted_at")
      .first();
    if (!existing)
      return res
        .status(404)
        .json({
          status: status.NOT_FOUND,
          message: "Data tidak ditemukan",
          datetime: formatDateSystem(),
        });
    const oData = {
      kode_cabang: oPayload.kode_cabang,
      kode_gedung: oPayload.kode_gedung !== undefined ? oPayload.kode_gedung : existing.kode_gedung,
      kode_lantai: oPayload.kode_lantai,
      kode_tipe_kamar: oPayload.kode_tipe_kamar,
      nomor_kamar: oPayload.name,
      tipe_pemandangan: oPayload.tipe_view ?? existing.tipe_pemandangan,
      catatan: oPayload.catatan ?? existing.catatan,
      boleh_merokok: oPayload.boleh_merokok ?? existing.boleh_merokok,
      occupancy_status: oPayload.occupancy_status ?? existing.occupancy_status,
      housekeeping_status: oPayload.housekeeping_status ?? existing.housekeeping_status,
      is_active: oPayload.is_active !== undefined ? oPayload.is_active : existing.is_active,
      updated_by: req.auth?.user_id || 1,
      updated_at: formatDateSystem(),
    };
    await DB.transaction(async (trx) => {
      await trx("mst_kamar").where("kode_kamar", oPayload.kode_kamar).update(oData);
      await ChangesLog(
        {
          description: "Update Master Kamar",
          tableName: "mst_kamar",
          referenceCode: oPayload.kode_kamar,
          action: "UPDATE",
          dataBefore: existing,
          dataAfter: { ...existing, ...oData },
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
      file: "master/kamar/kamar_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
