/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file wilayah_dropdown.js
 * @description Endpoint dropdown daftar master wilayah untuk dropdown options
 */

import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const listWilayah = await DB("org_nodes")
      .where("node_type", "region")
      .where("status", "active")
      .select("id", "code", "name")
      .orderBy("name", "asc");

    const data = listWilayah.map((w) => ({
      kode: w.id,
      code: w.code,
      nama: `${w.code} - ${w.name}`,
      name: w.name,
      label: `${w.code} - ${w.name}`,
      value: Number(w.id),
    }));

    return res.status(200).json({
      status: status.SUKSES,
      message: "Dropdown wilayah berhasil dimuat",
      datetime: formatDateSystem(),
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: status.BAD_REQUEST,
      message: "Gagal memuat dropdown wilayah",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
