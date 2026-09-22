/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file login.js
 * @description File untuk login user
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-08-03)
 * @version 1.0.1
 */


import "dotenv/config";

import express from "express";
import {
  status,
} from "../components/tools/general.js";
import { generateUserTokens, Logging, validatePayload } from "../components/tools/servertool.js";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { jwtVerify, SignJWT } from "jose";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { hashEquals, hmac } from "../components/tools/encrypt_tools.js";
import { getUserScopeDetails } from "../components/tools/scope_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;

  const cAuth = req.headers["authorization"];
  const cForwardedFor = req.headers["x-forwarded-for"];
  const cIp = cForwardedFor ? cForwardedFor.split(",")[0].trim() : "";
  const cEndpoint = req.originalUrl;

  let oPayload = body

  try {

    if (!oPayload || Object.keys(oPayload).length < 1) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Invalid request body",
        datetime: formatDateSystem(),
      });
    }

    const cValidation = await validatePayload(
      {
        username: Joi.string().required().label("Username"),
        password: Joi.string().required().label("Password"),
        remember_me: Joi.string().valid('1', '0').required().label("Remember me"),
      },
      {
        "string.base": "{#label} harus berupa string",
        "string.empty": "{#label} tidak boleh kosong",
        "any.required": "{#label} wajib diisi",
      },
      oPayload
    );

    if (cValidation) {
      const oResult = {
        status: status.BAD_REQUEST,
        message: cValidation || "Terdapat kesalahan pada data anda",
        datetime: formatDateSystem(),
      };

      Logging(null, {
        file: "login.js",
        func: "login",
        request: oPayload,
        response: oResult,
        user: oPayload?.username || "",
      });

      return res.status(422).json(oResult);
    }

    const oUser = await DB("mst_user")
      .where("username", oPayload.username)
      .select(
        "id",
        "user_code",
        "password",
        "username",
        "role",
        "fullname",
        "status",
        "telp",
        "created_at"
      )
      .first();

    if (oUser) {
      const secret = process.env.USER_SECRET;
      const cPassword =
        process.env.USER_KEY + oUser.user_code + oPayload.password;

      if (!hashEquals(hmac(cPassword, secret, "sha512"), oUser.password)) {
        return res.status(400).json({
          status: status.GAGAL,
          message: "Password salah",
          datetime: formatDateSystem(),
        });
      }

      if (oUser.status != "1") {
        return res.status(400).json({
          status: status.GAGAL,
          message: "User belum aktif",
          datetime: formatDateSystem(),
        });
      }

      // Validasi konfigurasi role user di mst_navigation
      const oNavigation = await DB("mst_navigation")
        .select("menu")
        .whereRaw("LOWER(role) = LOWER(?)", [oUser.role])
        .first();

      if (!oNavigation || !oNavigation?.menu) {
        return res.status(400).json({
          status: status.GAGAL,
          message: `Role ${oUser.role} belum memiliki konfigurasi navigasi di database`,
          datetime: formatDateSystem(),
        });
      }

      // Hitung enterprise hierarchy & scope user
      const branchContext = await getUserScopeDetails(oUser.id);

      const credential = {
        id: oUser.id,
        user_code: oUser.user_code,
        username: oUser.username,
        fullname: oUser.fullname,
        role: oUser.role,
        company_id: branchContext.company_id,
        company_name: branchContext.company_name,
        company_code: branchContext.company_code,
        default_branch_id: branchContext.default_branch_id,
        default_kode_cabang: branchContext.default_kode_cabang,
        default_branch_name: branchContext.default_branch_name,
        active_branch_id: branchContext.active_branch_id,
        active_kode_cabang: branchContext.active_kode_cabang,
        active_branch_name: branchContext.active_branch_name,
        allowed_branches: branchContext.allowed_branches,
        allowed_kode_cabang: branchContext.allowed_kode_cabang,
        can_switch_branch: branchContext.can_switch_branch,
      };

      const oToken = await generateUserTokens(
        oUser,
        oPayload.remember_me == '1' ? true : false,
        branchContext
      );

      return res.status(200).json({
        status: status.SUKSES,
        message: "Login Berhasil",
        datetime: formatDateSystem(),
        data: {
          access_token: oToken.access_token,
          refresh_token: oToken.refresh_token,
          user_info: credential
        },
      });
    }

    return res.status(400).json({
      status: status.GAGAL,
      message: "Username tidak ditemukan",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    console.error("Login Error:", error);
    
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "v1/auth/login.js",
      func: "login",
      request: oPayload,
      response: oResult,
      user: oPayload?.username || "",
    });

    return res.status(500).json(oResult);
  }
});

export default router;
