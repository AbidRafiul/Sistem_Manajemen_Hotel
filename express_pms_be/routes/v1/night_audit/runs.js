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
    const hasTotalInHouse = await DB.schema.hasColumn("trx_night_audit", "total_in_house").catch(() => false);
    const hasTriggeredBy = await DB.schema.hasColumn("trx_night_audit", "triggered_by").catch(() => false);

    const query = DB("trx_night_audit as na")
      .leftJoin("mst_user as u", "na.run_by", "u.id")
      .select(
        "na.id",
        "na.kode_night_audit",
        "na.kode_cabang",
        "na.business_date",
        "na.status",
        hasTotalInHouse ? "na.total_in_house" : DB.raw("0 as total_in_house"),
        hasTotalInHouse ? "na.total_posted" : DB.raw("0 as total_posted"),
        hasTotalInHouse ? "na.total_failed" : DB.raw("0 as total_failed"),
        hasTotalInHouse ? "na.total_room_revenue" : DB.raw("0.00 as total_room_revenue"),
        hasTotalInHouse ? "na.total_tax" : DB.raw("0.00 as total_tax"),
        hasTotalInHouse ? "na.total_service" : DB.raw("0.00 as total_service"),
        "na.started_at",
        "na.completed_at",
        hasTriggeredBy ? "na.triggered_by" : DB.raw("'manual' as triggered_by"),
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

    const runQuery = DB("trx_night_audit");
    if (idOrCode && !isNaN(Number(idOrCode))) {
      runQuery.where(function () {
        this.where("kode_night_audit", idOrCode).orWhere("id", Number(idOrCode));
      });
    } else {
      runQuery.where("kode_night_audit", idOrCode);
    }
    const run = await runQuery.select("kode_night_audit", "kode_cabang").first();

    if (!run) {
      return res.status(404).json({
        status: status.GAGAL,
        message: `Audit run ${idOrCode} tidak ditemukan`,
        datetime: formatDateSystem()
      });
    }

    assertBranchScope(req, run.kode_cabang);

    // Ambil data item posting audit secara langsung untuk menghindari error 'Illegal mix of collations'
    const items = await DB("trx_night_audit_item")
      .where("kode_night_audit", run.kode_night_audit)
      .orderBy("id", "asc");

    let postings = items;
    if (items.length > 0) {
      const resCodes = items.map((i) => i.kode_reservation).filter(Boolean);
      const roomCodes = items.map((i) => i.kode_kamar).filter(Boolean);

      let guestMap = new Map();
      if (resCodes.length > 0) {
        try {
          const resRows = await DB("trx_reservation as r")
            .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
            .whereIn("r.kode_reservasi", resCodes)
            .select("r.kode_reservasi", "g.full_name as guest_name");
          guestMap = new Map(resRows.map((r) => [r.kode_reservasi, r.guest_name]));
        } catch {
          guestMap = new Map();
        }
      }

      let roomMap = new Map();
      if (roomCodes.length > 0) {
        try {
          const roomRows = await DB("mst_kamar")
            .whereIn("kode_kamar", roomCodes)
            .select("kode_kamar", "nomor_kamar");
          roomMap = new Map(roomRows.map((rm) => [rm.kode_kamar, rm.nomor_kamar]));
        } catch {
          roomMap = new Map();
        }
      }

      postings = items.map((itm) => ({
        ...itm,
        guest_name: guestMap.get(itm.kode_reservation) || "-",
        nomor_kamar: roomMap.get(itm.kode_kamar) || itm.kode_kamar || "-"
      }));
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Daftar posting Night Audit berhasil diambil",
      datetime: formatDateSystem(),
      data: postings
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

router.get("/", handleRunsList);
router.post("/", handleRunsList);

router.get("/:id", handleRunDetail);
router.post("/:id", handleRunDetail);

router.get("/:id/postings", handleRunPostings);
router.post("/:id/postings", handleRunPostings);

export default router;
