/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file status.js
 * @description GET /api/v1/night-audit/status - Mengambil status Night Audit dan Business Date aktif
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";
import { getNightAuditStatus } from "../components/tools/night_audit_service.js";

const router = express.Router();

const handleStatus = async (req, res) => {
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

    const auditStatus = await getNightAuditStatus(kodeCabang);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Status Night Audit berhasil diambil",
      datetime: formatDateSystem(),
      data: auditStatus
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

router.get("/", handleStatus);
router.post("/", handleStatus);

export default router;
