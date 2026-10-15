/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file start.js
 * @description POST /api/v1/night-audit/start - Memulai eksekusi Night Audit
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";
import { startNightAudit } from "../components/tools/night_audit_service.js";

const router = express.Router();

const schema = Joi.object({
  kode_cabang: Joi.string().optional().allow(null, ""),
  business_date: Joi.string().optional().allow(null, ""),
  acknowledged_warnings: Joi.array().items(Joi.string()).optional().default([]),
  idempotency_key: Joi.string().optional().allow(null, ""),
  notes: Joi.string().optional().allow(null, "")
}).unknown(true);

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

    const { kodeCabang } = resolveEffectiveBranch(req, oPayload.kode_cabang);
    if (!kodeCabang) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Kode cabang tidak valid atau belum ditentukan.",
        datetime: formatDateSystem()
      });
    }

    // Validasi Wewenang Role (RBAC) untuk menjalankan Night Audit
    const userRole = (req?.auth?.role || "").toLowerCase().trim();
    const authorizedAuditRoles = [
      "superadmin",
      "master",
      "corporate_manager",
      "regional_manager",
      "general_manager",
      "hotel_manager",
      "duty_manager",
      "night_auditor",
      "finance_manager",
      "accounting",
      "front_office_manager",
      "admin"
    ];
    if (userRole && !authorizedAuditRoles.includes(userRole)) {
      return res.status(403).json({
        status: status.GAGAL,
        message: `Akses ditolak: Role '${req?.auth?.role}' tidak memiliki wewenang untuk mengeksekusi Night Audit.`,
        datetime: formatDateSystem()
      });
    }

    const userId = req?.auth?.user_id || 1;

    const result = await startNightAudit({
      kodeCabang,
      userId,
      businessDate: oPayload.business_date || null,
      acknowledgedWarnings: oPayload.acknowledged_warnings || [],
      idempotencyKey: oPayload.idempotency_key || null,
      notes: oPayload.notes || ""
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Night Audit berhasil diselesaikan",
      datetime: formatDateSystem(),
      data: result
    });
  } catch (err) {
    const httpStatus = err.status || err.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: err.message,
      datetime: formatDateSystem(),
      data: err.data || null
    });
  }
});

export default router;
