/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file staff_get.js
 * @description Endpoint untuk mengambil daftar staf housekeeping beserta beban kerja & rekomendasi auto-assign
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-10
 * @version 1.0.0
 */
import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { getHousekeepingStaffList } from "../components/tools/housekeeping_helper.js";

const router = express.Router();

const handleGetStaff = async (req, res) => {
  const { cabang } = req.body || {};

  try {
    const result = await getHousekeepingStaffList(cabang, DB);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data petugas housekeeping berhasil dimuat",
      datetime: formatDateSystem(),
      data: result.staff,
      recommended: result.recommended,
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal",
      datetime: formatDateSystem(),
    });
  }
};

router.post("/", handleGetStaff);
router.get("/", handleGetStaff);

export default router;
