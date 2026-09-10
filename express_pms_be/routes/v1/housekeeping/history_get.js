/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file history_get.js
 * @description Endpoint untuk melihat riwayat aktivitas dan audit trail housekeeping
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-10
 * @version 1.0.0
 */
import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

const handleGetHistory = async (req, res) => {
  const { cabang, kode_kamar, status: filterStatus, search } = req.body || {};

  try {
    let query = DB("trx_housekeeping_task as t")
      .select(
        "t.id",
        "t.kode_housekeeping_task",
        "t.kode_cabang",
        "t.kode_kamar",
        "k.nomor_kamar",
        "tk.nama_tipe as nama_tipe_kamar",
        "t.task_type",
        "t.assigned_to",
        "u.fullname as assigned_to_name",
        "t.priority",
        "t.status",
        "t.started_at",
        "t.finished_at",
        "t.approved_at",
        "t.supervisor_id",
        "spv.fullname as supervisor_name",
        "t.cancel_reason",
        "t.created_at",
        "t.updated_at"
      )
      .leftJoin("mst_kamar as k", "t.kode_kamar", "k.kode_kamar")
      .leftJoin("mst_tipe_kamar as tk", "k.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("mst_user as u", "t.assigned_to", "u.id")
      .leftJoin("mst_user as spv", "t.supervisor_id", "spv.id")
      .where("t.is_active", 1)
      .whereNull("t.deleted_at")
      .orderBy("t.id", "desc");

    if (cabang) {
      query.where("t.kode_cabang", cabang);
    }
    if (kode_kamar) {
      query.where("t.kode_kamar", kode_kamar);
    }
    if (filterStatus) {
      query.where("t.status", filterStatus);
    }
    if (search) {
      query.where(function() {
        this.where("k.nomor_kamar", "like", `%${search}%`)
          .orWhere("u.fullname", "like", `%${search}%`)
          .orWhere("t.kode_housekeeping_task", "like", `%${search}%`);
      });
    }

    const rows = await query;

    const mapped = rows.map(row => {
      let durationMinutes = null;
      if (row.started_at && row.finished_at) {
        const diffMs = new Date(row.finished_at).getTime() - new Date(row.started_at).getTime();
        durationMinutes = Math.max(0, Math.round(diffMs / 60000));
      }
      return {
        ...row,
        duration_minutes: durationMinutes
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Riwayat aktivitas housekeeping berhasil dimuat",
      datetime: formatDateSystem(),
      data: mapped,
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal",
      datetime: formatDateSystem(),
    });
  }
};

router.post("/", handleGetHistory);
router.get("/", handleGetHistory);

export default router;
