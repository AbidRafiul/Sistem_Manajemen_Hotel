/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file me.js
 * @description Endpoint informasi user profile, active branch, dan allowed scope
 * @author Antigravity
 * @created 2026-09-22
 * @version 1.0.0
 */

import express from "express";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { getUserScopeDetails } from "../components/tools/scope_helper.js";
import DB from "../../../core/config/knex.js";

const router = express.Router();

const handleGetMe = async (req, res) => {
  try {
    const userId = req.auth?.user_id;

    if (!userId) {
      return res.status(401).json({
        status: status.BAD_REQUEST,
        message: "Unauthorized",
        datetime: formatDateSystem(),
      });
    }

    const user = await DB("mst_user")
      .where("id", userId)
      .select("id", "user_code", "username", "fullname", "role", "telp")
      .first();

    if (!user) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "User tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    const scope = await getUserScopeDetails(userId);

    // Active branch: gunakan active_branch dari token jika masih valid, atau default
    let activeBranchId = req.auth?.active_branch_id || scope.active_branch_id;
    let activeKodeCabang = req.auth?.active_kode_cabang || scope.active_kode_cabang;
    let activeBranchName = req.auth?.active_branch_name || scope.active_branch_name;

    // Validasi apakah active branch saat ini masih ada dalam scope
    const isValidActive = scope.allowed_kode_cabang.includes(activeKodeCabang);
    if (!isValidActive) {
      activeBranchId = scope.default_branch_id;
      activeKodeCabang = scope.default_kode_cabang;
      activeBranchName = scope.default_branch_name;
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Session Profile Berhasil Diambil",
      datetime: formatDateSystem(),
      data: {
        user_id: user.id,
        user_code: user.user_code,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        telp: user.telp,
        company_id: scope.company_id,
        company_name: scope.company_name,
        company_code: scope.company_code,
        default_branch_id: scope.default_branch_id,
        default_kode_cabang: scope.default_kode_cabang,
        default_branch_name: scope.default_branch_name,
        active_branch_id: activeBranchId,
        active_kode_cabang: activeKodeCabang,
        active_branch_name: activeBranchName,
        allowed_branches: scope.allowed_branches,
        allowed_branch_ids: scope.allowed_branch_ids,
        allowed_kode_cabang: scope.allowed_kode_cabang,
        can_switch_branch: scope.can_switch_branch,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal mengambil data session profile",
      datetime: formatDateSystem(),
    });
  }
};

router.get("/", handleGetMe);
router.post("/", handleGetMe);

export default router;
