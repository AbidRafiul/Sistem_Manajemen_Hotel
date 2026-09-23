/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file wilayah_delete.js
 * @description Endpoint untuk menghapus data Master Wilayah / Regional
 */

import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";

  const ids = oPayload.ids || (oPayload.id ? [oPayload.id] : []);
  const codes = oPayload.kode_wilayah
    ? Array.isArray(oPayload.kode_wilayah)
      ? oPayload.kode_wilayah
      : [oPayload.kode_wilayah]
    : [];

  if (ids.length === 0 && codes.length === 0) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: "Pilih minimal satu data wilayah untuk dihapus.",
      datetime: formatDateSystem(),
    });
  }

  try {
    // Ambil semua record yang ditargetkan
    const targetWilayah = await DB("org_nodes")
      .where("node_type", "region")
      .modify((qb) => {
        if (ids.length > 0) qb.whereIn("id", ids);
        else qb.whereIn("code", codes);
      })
      .select("id", "code", "name");

    if (targetWilayah.length === 0) {
      return res.status(404).json({
        status: status.GAGAL,
        message: "Data wilayah tidak ditemukan.",
        datetime: formatDateSystem(),
      });
    }

    const targetIds = targetWilayah.map((w) => w.id);

    // Cek apakah ada cabang yang masih menautkan org_node_id ke wilayah ini
    const usedCabang = await DB("mst_cabang")
      .whereIn("org_node_id", targetIds)
      .whereNull("deleted_at")
      .select("id", "nama_hotel", "org_node_id");

    if (usedCabang.length > 0) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: `Wilayah tidak dapat dihapus karena masih digunakan oleh ${usedCabang.length} cabang hotel (e.g. ${usedCabang[0].nama_hotel}). Pindahkan cabang terlebih dahulu.`,
        datetime: formatDateSystem(),
      });
    }

    // Hapus data
    await DB("org_nodes").whereIn("id", targetIds).del();

    return res.status(200).json({
      status: status.SUKSES,
      message: `Berhasil menghapus ${targetWilayah.length} data wilayah.`,
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Gagal menghapus data wilayah",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/wilayah/wilayah_delete.js",
      func: "delete",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
