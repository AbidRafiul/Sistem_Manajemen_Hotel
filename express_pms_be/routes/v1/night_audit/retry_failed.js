/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file retry_failed.js
 * @description POST /api/v1/night-audit/runs/:id/retry-failed - Mengulang posting hanya untuk item gagal
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { retryFailedAuditItems } from "../components/tools/night_audit_service.js";
import { assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router({ mergeParams: true });

router.post("/", async (req, res) => {
  try {
    const idOrCode = req.params.id;
    const userId = req?.auth?.user_id || 1;

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

    const result = await retryFailedAuditItems({
      auditCode: run.kode_night_audit,
      userId
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Proses retry item gagal selesai",
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
