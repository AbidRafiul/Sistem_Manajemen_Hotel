/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file wilayah_update.js
 * @description Endpoint untuk memperbarui data Master Wilayah / Regional
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";

  const schema = Joi.object({
    id: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    kode_wilayah: Joi.string().optional().allow(""),
    code: Joi.string().optional().allow(""),
    nama_wilayah: Joi.string().max(150).optional().allow(""),
    name: Joi.string().max(150).optional().allow(""),
    status: Joi.string().valid("active", "inactive").optional(),
    is_active: Joi.number().optional(),
  }).unknown(true);

  const { error } = schema.validate(oPayload);
  if (error) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: error.details[0].message,
      datetime: formatDateSystem(),
    });
  }

  const targetId = oPayload.id;
  const targetCode = (oPayload.kode_wilayah || oPayload.code || "").trim();

  if (!targetId && !targetCode) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: "ID atau Kode Wilayah wajib disertakan untuk pembaruan.",
      datetime: formatDateSystem(),
    });
  }

  try {
    const existing = await DB("org_nodes")
      .modify((qb) => {
        if (targetId) qb.where("id", targetId);
        else qb.where("code", targetCode);
      })
      .first();

    if (!existing) {
      return res.status(404).json({
        status: status.GAGAL,
        message: "Data wilayah tidak ditemukan.",
        datetime: formatDateSystem(),
      });
    }

    const dataToUpdate = {
      updated_at: formatDateSystem(),
    };

    if (oPayload.nama_wilayah || oPayload.name) {
      dataToUpdate.name = (oPayload.nama_wilayah || oPayload.name).trim();
    }

    if (oPayload.status) {
      dataToUpdate.status = oPayload.status;
    } else if (oPayload.is_active !== undefined) {
      dataToUpdate.status = Number(oPayload.is_active) === 1 ? "active" : "inactive";
    }

    await DB("org_nodes").where("id", existing.id).update(dataToUpdate);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data wilayah berhasil diperbarui",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Gagal memperbarui data wilayah",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/wilayah/wilayah_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
