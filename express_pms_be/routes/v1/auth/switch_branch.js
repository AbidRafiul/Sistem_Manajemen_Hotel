/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file switch_branch.js
 * @description Endpoint untuk berpindah cabang aktif bagi user yang memiliki kewenangan
 * @author Antigravity
 * @created 2026-09-22
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { generateUserTokens, Logging, validatePayload } from "../components/tools/servertool.js";
import { getUserScopeDetails } from "../components/tools/scope_helper.js";
import DB from "../../../core/config/knex.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const userId = req?.auth?.user_id;

  try {
    const cValidation = await validatePayload(
      {
        kode_cabang: Joi.string().optional().label("Kode Cabang"),
        target_kode_cabang: Joi.string().optional().label("Kode Cabang Target"),
        target_branch_id: Joi.number().optional().label("ID Cabang Target"),
        branch_id: Joi.number().optional().label("ID Cabang Target"),
      },
      { "any.required": "{#label} wajib diisi" },
      oPayload,
      { allowUnknown: true }
    );

    const targetKode = oPayload.target_kode_cabang || oPayload.kode_cabang;
    const targetId = oPayload.target_branch_id || oPayload.branch_id;

    if (cValidation || (!targetKode && !targetId)) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation || "Harap pilih cabang target untuk berpindah.",
        datetime: formatDateSystem(),
      });
    }

    // 1. Validasi hak berpindah cabang
    if (!req.auth?.can_switch_branch) {
      return res.status(403).json({
        status: status.BAD_REQUEST,
        message: "Akses ditolak: User Anda tidak memiliki izin untuk berpindah cabang.",
        datetime: formatDateSystem(),
      });
    }

    // 2. Ambil fresh scope dari DB
    const scope = await getUserScopeDetails(userId);

    // 3. Validasi target cabang
    const targetBranch = scope.allowed_branches.find((b) => {
      if (targetKode && b.kode_cabang === targetKode) return true;
      if (targetId && Number(b.id) === Number(targetId)) return true;
      return false;
    });

    if (!targetBranch) {
      return res.status(403).json({
        status: status.BAD_REQUEST,
        message: "Akses ditolak: Cabang target berada di luar scope kewenangan Anda.",
        datetime: formatDateSystem(),
      });
    }

    // 4. Update default_branch_id di database jika diinginkan atau simpan konteks baru
    const oUser = await DB("mst_user")
      .where("id", userId)
      .select("id", "user_code", "username", "role", "fullname")
      .first();

    const newBranchContext = {
      ...scope,
      active_branch_id: targetBranch.id,
      active_kode_cabang: targetBranch.kode_cabang,
      active_branch_name: targetBranch.nama_hotel,
    };

    // 5. Terbitkan Token Baru dengan Active Branch Baru
    const oToken = await generateUserTokens(oUser, false, newBranchContext);

    // 6. Catat Audit Log
    try {
      const cForwardedFor = req.headers["x-forwarded-for"];
      const ipAddress = cForwardedFor ? cForwardedFor.split(",")[0].trim() : (req.ip || "127.0.0.1");

      await DB("trx_audit_log").insert({
        kode_audit_log: `LOG-SW-${Date.now()}`,
        kode_cabang: targetBranch.kode_cabang,
        user_id: userId,
        table_name: "auth_session",
        record_id: userId,
        action: "update",
        old_value: JSON.stringify({ active_kode_cabang: req.auth.active_kode_cabang }),
        new_value: JSON.stringify({ active_kode_cabang: targetBranch.kode_cabang }),
        ip_address: ipAddress,
        created_at: formatDateSystem(),
      });
    } catch (auditErr) {
      console.warn("Gagal mencatat audit log switch branch:", auditErr.message);
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: `Berhasil beralih ke cabang ${targetBranch.nama_hotel}`,
      datetime: formatDateSystem(),
      data: {
        access_token: oToken.access_token,
        refresh_token: oToken.refresh_token,
        active_branch: {
          id: targetBranch.id,
          kode_cabang: targetBranch.kode_cabang,
          nama_hotel: targetBranch.nama_hotel,
          alamat: targetBranch.alamat,
          timezone: targetBranch.timezone,
        },
      },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: error.message || "Gagal berpindah cabang",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "v1/auth/switch_branch.js",
      func: "switch_branch",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
