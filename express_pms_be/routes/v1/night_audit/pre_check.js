/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file pre_check.js
 * @description GET /api/v1/night-audit/pre-check - Pengecekan pra-audit (Blockers & Warnings)
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";
import { runPreAuditCheck } from "../components/tools/night_audit_service.js";

const router = express.Router();

const handlePreCheck = async (req, res) => {
  try {
    const requestedBranch = req.query.kode_cabang || req.body?.kode_cabang;
    const { kodeCabang } = resolveEffectiveBranch(req, requestedBranch);
    if (!kodeCabang) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Kode cabang tidak valid atau belum ditentukan.",
        datetime: formatDateSystem()
      });
    }

    const preCheckResult = await runPreAuditCheck(kodeCabang);

    return res.status(200).json({
      status: status.SUKSES,
      message: preCheckResult.can_proceed
        ? "Pre-audit check lolos. Siap menjalankan Night Audit."
        : "Terdapat blocker yang harus diselesaikan sebelum Night Audit dapat dijalankan.",
      datetime: formatDateSystem(),
      data: preCheckResult
    });
  } catch (err) {
    const httpStatus = err.status || err.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: err.message,
      datetime: formatDateSystem()
    });
  }
};

router.get("/", handlePreCheck);
router.post("/", handlePreCheck);

export default router;
