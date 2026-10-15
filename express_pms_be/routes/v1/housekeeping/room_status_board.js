/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file room_status_board.js
 * @description Endpoint Room Status Board
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-08
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-08)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { applyBranchFilter } from "../components/tools/scope_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const cabang = req.body?.cabang || req.body?.kode_cabang || null;

  try {
    // Subquery untuk mengambil ID task aktif terbaru per kamar agar 1 baris hanya 1 kamar unik
    const latestTaskSubquery = DB("trx_housekeeping_task")
      .select("kode_kamar", DB.raw("MAX(id) as max_task_id"))
      .whereIn("status", ["assigned", "in_progress", "finished"])
      .where("is_active", 1)
      .whereNull("deleted_at")
      .groupBy("kode_kamar")
      .as("latest_t");

    const query = DB("mst_kamar as k")
      .select(
        "k.kode_cabang",
        "k.kode_kamar",
        "k.nomor_kamar",
        "k.kode_tipe_kamar",
        "tk.nama_tipe as nama_tipe_kamar",
        "k.occupancy_status",
        "k.housekeeping_status",
        "t.kode_housekeeping_task",
        "t.task_type",
        "t.priority",
        "t.notes",
        "t.request_source",
        "t.kode_reservasi_room",
        "t.status as task_status",
        "t.created_at as task_created_at",
        "t.started_at as task_started_at",
        "t.finished_at as task_finished_at",
        "t.checklist",
        "t.inspection_result",
        "t.inspection_details",
        "u.fullname as assigned_to_name"
      )
      .leftJoin("mst_tipe_kamar as tk", "k.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin(latestTaskSubquery, "k.kode_kamar", "latest_t.kode_kamar")
      .leftJoin("trx_housekeeping_task as t", "latest_t.max_task_id", "t.id")
      .leftJoin("mst_user as u", "t.assigned_to", "u.id")
      .where("k.is_active", 1)
      .whereNull("k.deleted_at")
      .orderBy("k.nomor_kamar", "asc");

    // Terapkan isolasi branch scope
    applyBranchFilter(query, req, "k.kode_cabang", cabang);

    const rows = await query;
    const rooms = rows.map((r) => {
      let parsedChecklist = null;
      if (r.checklist) {
        try {
          parsedChecklist = typeof r.checklist === "string" ? JSON.parse(r.checklist) : r.checklist;
        } catch {
          parsedChecklist = null;
        }
      }

      let parsedDetails = null;
      if (r.inspection_details) {
        try {
          parsedDetails = typeof r.inspection_details === "string" ? JSON.parse(r.inspection_details) : r.inspection_details;
        } catch {
          parsedDetails = null;
        }
      }

      return {
        ...r,
        checklist: parsedChecklist,
        inspection_details: parsedDetails
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data berhasil diambil",
      datetime: formatDateSystem(),
      data: rooms,
    });
  } catch (error) {
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
