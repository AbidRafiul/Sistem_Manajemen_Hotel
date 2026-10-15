/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file reports.js
 * @description GET /api/v1/night-audit/runs/:id/reports/:type - Mengambil snapshot laporan Night Audit
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router({ mergeParams: true });

const handleReport = async (req, res) => {
  try {
    const idOrCode = req.params.id || req.body?.id || req.body?.kode_night_audit;
    const reportType = (req.params.type || req.body?.type || "").toLowerCase().replace(/-/g, "_");

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

    if (!run.report_snapshots) {
      return res.status(404).json({
        status: status.GAGAL,
        message: "Snapshot laporan belum tersedia untuk audit run ini.",
        datetime: formatDateSystem()
      });
    }

    let snapshots = {};
    try {
      snapshots = JSON.parse(run.report_snapshots);
    } catch {
      snapshots = {};
    }

    let reportData = null;
    if (reportType === "all" || !reportType) {
      reportData = snapshots;
    } else if (reportType === "daily_revenue" || reportType === "revenue") {
      reportData = snapshots.daily_revenue;
    } else if (reportType === "trial_balance") {
      reportData = snapshots.trial_balance;
    } else if (reportType === "inhouse" || reportType === "inhouse_guest_list") {
      reportData = snapshots.inhouse_guest_list;
    } else if (reportType === "no_show" || reportType === "guest_movement" || reportType === "arrival_departure") {
      reportData = snapshots.guest_movement;
    } else if (reportType === "room_status" || reportType === "housekeeping") {
      reportData = snapshots.room_status_housekeeping;
    } else if (reportType === "exception" || reportType === "exceptions" || reportType === "exception_report") {
      reportData = snapshots.exception_report;
    } else if (reportType === "deposit" || reportType === "ledger" || reportType === "deposit_and_ledger") {
      reportData = snapshots.deposit_and_ledger;
    } else {
      reportData = snapshots[reportType] || snapshots;
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: `Snapshot laporan ${reportType || 'all'} berhasil diambil`,
      datetime: formatDateSystem(),
      data: {
        kode_night_audit: run.kode_night_audit,
        business_date: run.business_date,
        report_type: req.params.type || req.body?.type || "all",
        report: reportData
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: status.GAGAL,
      message: err.message,
      datetime: formatDateSystem()
    });
  }
};

router.get("/:type", handleReport);
router.post("/:type", handleReport);
router.get("/", handleReport);
router.post("/", handleReport);

export default router;
