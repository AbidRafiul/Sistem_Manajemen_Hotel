/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file scheduler.js
 * @description Endpoint status dan trigger scheduler otomatis Night Audit
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import {
  getSchedulerStatus,
  runScheduledAuditForBranch,
  runScheduledAuditForAllBranches
} from "../components/tools/night_audit_scheduler.js";
import { assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router();

const handleGetStatus = async (req, res) => {
  try {
    const schedulerInfo = await getSchedulerStatus();
    return res.status(200).json({
      status: status.SUKSES,
      message: "Status scheduler berhasil dimuat",
      datetime: formatDateSystem(),
      data: schedulerInfo
    });
  } catch (err) {
    return res.status(500).json({
      status: status.GAGAL,
      message: err.message || "Gagal memuat status scheduler",
      datetime: formatDateSystem()
    });
  }
};

const handleTrigger = async (req, res) => {
  try {
    const { kode_cabang, force } = req.body || {};
    let result;

    if (kode_cabang) {
      assertBranchScope(req, kode_cabang);
      result = await runScheduledAuditForBranch(kode_cabang, Boolean(force));
    } else {
      // Trigger untuk semua cabang hanya boleh dilakukan oleh holding/corporate
      const roleLower = (req?.auth?.role || "").toLowerCase().trim();
      const corporateRoles = ["superadmin", "master", "corporate_manager", "director", "owner", "holding_admin"];
      if (roleLower && !corporateRoles.includes(roleLower)) {
        return res.status(403).json({
          status: status.GAGAL,
          message: "Akses ditolak: Hanya level Holding / Corporate yang dapat memicu audit seluruh cabang sekaligus.",
          datetime: formatDateSystem()
        });
      }
      result = await runScheduledAuditForAllBranches(Boolean(force));
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Pemicu audit otomatis selesai diproses",
      datetime: formatDateSystem(),
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      status: status.GAGAL,
      message: err.message || "Gagal memicu audit otomatis",
      datetime: formatDateSystem()
    });
  }
};

router.get("/", handleGetStatus);
router.post("/", handleGetStatus);
router.post("/trigger", handleTrigger);

export default router;
