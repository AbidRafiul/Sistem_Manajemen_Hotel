/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tasks_get.js
 * @description Endpoint Get Housekeeping Tasks
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
import { applyBranchFilter, assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { status: taskStatus, cabang } = req.query;
  try {
    const query = DB("trx_housekeeping_task as t")
      .select(
        "t.id",
        "t.kode_housekeeping_task",
        "t.kode_cabang",
        "t.kode_kamar",
        "k.nomor_kamar",
        "t.task_type",
        "t.assigned_to",
        "u.fullname as assigned_to_name",
        "t.priority",
        "t.status",
        "t.created_at"
      )
      .leftJoin("mst_kamar as k", "t.kode_kamar", "k.kode_kamar")
      .leftJoin("mst_user as u", "t.assigned_to", "u.id")
      .where("t.is_active", 1)
      .whereNull("t.deleted_at")
      .orderBy("t.created_at", "desc");

    if (taskStatus) {
      query.where("t.status", taskStatus);
    }
    // Terapkan branch scope filter
    applyBranchFilter(query, req, "t.kode_cabang", cabang);

    const tasks = await query;
    return res.status(200).json({
      status: status.SUKSES,
      message: "Data berhasil diambil",
      datetime: formatDateSystem(),
      data: tasks,
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

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const task = await DB("trx_housekeeping_task as t")
      .select(
        "t.*",
        "k.nomor_kamar",
        "k.occupancy_status",
        "k.housekeeping_status",
        "u.fullname as assigned_to_name"
      )
      .leftJoin("mst_kamar as k", "t.kode_kamar", "k.kode_kamar")
      .leftJoin("mst_user as u", "t.assigned_to", "u.id")
      .where("t.kode_housekeeping_task", id)
      .where("t.is_active", 1)
      .whereNull("t.deleted_at")
      .first();

    if (!task) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Task tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Validasi scope cabang untuk detail task
    assertBranchScope(req, task.kode_cabang);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data berhasil diambil",
      datetime: formatDateSystem(),
      data: task,
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
