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

const router = express.Router();

router.post("/", async (req, res) => {
  const { cabang } = req.body;

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
        "k.kode_kamar",
        "k.nomor_kamar",
        "k.occupancy_status",
        "k.housekeeping_status",
        "t.kode_housekeeping_task",
        "t.task_type",
        "t.status as task_status",
        "u.fullname as assigned_to_name"
      )
      .leftJoin(latestTaskSubquery, "k.kode_kamar", "latest_t.kode_kamar")
      .leftJoin("trx_housekeeping_task as t", "latest_t.max_task_id", "t.id")
      .leftJoin("mst_user as u", "t.assigned_to", "u.id")
      .where("k.is_active", 1)
      .whereNull("k.deleted_at")
      .orderBy("k.nomor_kamar", "asc");

    if (cabang) {
      query.where("k.kode_cabang", cabang);
    }

    const rooms = await query;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data berhasil diambil",
      datetime: formatDateSystem(),
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
