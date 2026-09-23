/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file wilayah_create.js
 * @description Endpoint untuk menambah data Master Wilayah / Regional
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
    kode_wilayah: Joi.string().max(50).optional().allow("").label("Kode Wilayah"),
    code: Joi.string().max(50).optional().allow("").label("Kode Wilayah"),
    nama_wilayah: Joi.string().max(150).required().label("Nama Wilayah"),
    name: Joi.string().max(150).optional().allow("").label("Nama Wilayah"),
    status: Joi.string().valid("active", "inactive").default("active").label("Status"),
    is_active: Joi.number().optional().default(1),
  }).unknown(true);

  const { error } = schema.validate(oPayload);
  if (error) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: error.details[0].message,
      datetime: formatDateSystem(),
    });
  }

  const rawCode = (oPayload.kode_wilayah || oPayload.code || "").trim();
  const name = (oPayload.nama_wilayah || oPayload.name || "").trim();
  const stat = oPayload.status || (oPayload.is_active === 0 ? "inactive" : "active");

  try {
    let finalCode = rawCode;
    if (!finalCode) {
      // Auto-generate kode wilayah (REG-001, REG-002, ...)
      const last = await DB("org_nodes")
        .where("node_type", "region")
        .orderBy("id", "desc")
        .first();
      const nextNum = last ? Number(last.id) + 1 : 1;
      finalCode = `REG-${String(nextNum).padStart(3, "0")}`;
    }

    // Cek apakah code sudah ada di company_id yang sama
    const companyId = req?.auth?.company_id || 1;
    const existing = await DB("org_nodes")
      .where("company_id", companyId)
      .where("code", finalCode)
      .first();

    if (existing) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: `Kode wilayah '${finalCode}' sudah digunakan. Gunakan kode lain.`,
        datetime: formatDateSystem(),
      });
    }

    const [newId] = await DB("org_nodes").insert({
      company_id: companyId,
      parent_id: null,
      node_type: "region",
      code: finalCode.toUpperCase(),
      name: name,
      status: stat,
      created_at: formatDateSystem(),
      updated_at: formatDateSystem(),
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data wilayah berhasil disimpan",
      datetime: formatDateSystem(),
      data: { id: newId, code: finalCode, name: name },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Gagal menyimpan data wilayah",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/wilayah/wilayah_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
