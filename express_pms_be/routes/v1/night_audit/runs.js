/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file runs.js
 * @description GET /api/v1/night-audit/runs - Daftar riwayat audit
 *              GET /api/v1/night-audit/runs/:id - Detail audit run
 *              GET /api/v1/night-audit/runs/:id/postings - Rincian posting per reservasi
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch, assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router();

// Handlers
const handleRunsList = async (req, res) => {
  try {
    const requestedBranch = req.query.kode_cabang || req.body?.kode_cabang;
    const { kodeCabang } = resolveEffectiveBranch(req, requestedBranch);
    const query = DB("trx_night_audit as na")
      .leftJoin("mst_user as u", "na.run_by", "u.id")
      .select(
        "na.id",
        "na.kode_night_audit",
        "na.kode_cabang",
        "na.business_date",
        "na.status",
        "na.total_in_house",
        "na.total_posted",
        "na.total_failed",
        "na.total_room_revenue",
        "na.total_tax",
        "na.total_service",
        "na.started_at",
        "na.completed_at",
        "na.triggered_by",
        "na.note",
        "u.username as run_by_user"
      )
      .orderBy("na.id", "desc");

    if (kodeCabang) {
      query.where("na.kode_cabang", kodeCabang);
    }
    const statusParam = req.query.status || req.body?.status;
    if (statusParam) {
      query.where("na.status", statusParam);
    }
    const fromDate = req.query.from_date || req.body?.from_date;
    if (fromDate) {
      query.where("na.business_date", ">=", fromDate);
    }
    const toDate = req.query.to_date || req.body?.to_date;
    if (toDate) {
      query.where("na.business_date", "<=", toDate);
    }

    const rows = await query;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Daftar riwayat Night Audit berhasil diambil",
      datetime: formatDateSystem(),
      data: rows
    });
  } catch (err) {
    return res.status(500).json({
      status: status.GAGAL,
      message: err.message,
      datetime: formatDateSystem()
    });
  }
};

const handleRunDetail = async (req, res) => {
  try {
    const idOrCode = req.params.id || req.body?.id || req.body?.kode_night_audit;
    const run = await DB("trx_night_audit as na")
      .leftJoin("mst_user as u", "na.run_by", "u.id")
      .where(function () {
        this.where("na.kode_night_audit", idOrCode).orWhere("na.id", idOrCode);
      })
      .select("na.*", "u.username as run_by_user")
      .first();

    if (!run) {
      return res.status(404).json({
        status: status.GAGAL,
        message: `Audit run ${idOrCode} tidak ditemukan`,
        datetime: formatDateSystem()
      });
    }

    assertBranchScope(req, run.kode_cabang);

    let reports = null;
    try {
      if (run.report_snapshots) {
        reports = JSON.parse(run.report_snapshots);
      }
    } catch {
      reports = null;
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Detail Night Audit berhasil diambil",
      datetime: formatDateSystem(),
      data: {
        ...run,
        report_snapshots: reports
      }
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

const handleRunPostings = async (req, res) => {
  try {
    const idOrCode = req.params.id || req.body?.id || req.body?.kode_night_audit;

    const run = await DB("trx_night_audit")
      .where("kode_night_audit", idOrCode)
      .orWhere("id", idOrCode)
      .select("kode_night_audit", "kode_cabang")
      .first();

    if (!run) {
      return res.status(404).json({
        status: status.GAGAL,
        message: `Audit run ${idOrCode} tidak ditemukan`,
        datetime: formatDateSystem()
      });
    }

    assertBranchScope(req, run.kode_cabang);

    const postings = await DB("trx_night_audit_item as nai")
      .leftJoin("trx_reservation as r", "nai.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .leftJoin("mst_kamar as mk", "nai.kode_kamar", "mk.kode_kamar")
      .where("nai.kode_night_audit", run.kode_night_audit)
      .select(
        "nai.*",
        "g.full_name as guest_name",
        "mk.nomor_kamar"
      )
      .orderBy("nai.id", "asc");

    return res.status(200).json({
      status: status.SUKSES,
      message: "Daftar posting Night Audit berhasil diambil",
      datetime: formatDateSystem(),
      data: postings
    });
  } catch (err) {
    return res.status(500).json({
      status: status.GAGAL,
      message: err.message,
      datetime: formatDateSystem()
    });
  }
};

router.get("/", handleRunsList);
router.post("/", handleRunsList);

router.get("/:id", handleRunDetail);
router.post("/:id", handleRunDetail);

router.get("/:id/postings", handleRunPostings);
router.post("/:id/postings", handleRunPostings);

export default router;
