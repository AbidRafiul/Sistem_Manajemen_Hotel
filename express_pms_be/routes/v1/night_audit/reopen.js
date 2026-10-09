/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file reopen.js
 * @description POST /api/v1/night-audit/runs/:id/reopen - Membuka kembali audit terakhir (Manager only)
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { reopenNightAudit } from "../components/tools/night_audit_service.js";
import { assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router({ mergeParams: true });

const schema = Joi.object({
  reason: Joi.string().min(5).required().label("Alasan Reopen")
});

router.post("/", async (req, res) => {
  try {
    const oPayload = req.body || {};
    const { error } = schema.validate(oPayload);
    if (error) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: error.details[0].message,
        datetime: formatDateSystem()
      });
    }

    const idOrCode = req.params.id;
    const userId = req?.auth?.user_id || 1;
    const userRole = req?.auth?.role || "";

    // Cari kode audit
    const run = await DB("trx_night_audit")
      .where("kode_night_audit", idOrCode)
      .orWhere("id", idOrCode)
      .first();

    if (!run) {
      return res.status(404).json({
        status: status.GAGAL,
        message: `Audit run ${idOrCode} tidak ditemukan`,
        datetime: formatDateSystem()
      });
    }

    assertBranchScope(req, run.kode_cabang);

    const result = await reopenNightAudit({
      auditCode: run.kode_night_audit,
      userId,
      userRole,
      reason: oPayload.reason
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Night Audit berhasil dibuka kembali dan reversal posting telah dibuat",
      datetime: formatDateSystem(),
      data: result
    });
  } catch (err) {
    const httpStatus = err.status || err.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: err.message,
      datetime: formatDateSystem()
    });
  }
});

export default router;
