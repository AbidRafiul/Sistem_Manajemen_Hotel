/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file user_update.js
 * @description File untuk mengupdate data user
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


import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, ChangesLog, validatePayload } from "../../components/tools/servertool.js";
import { jwtVerify } from "jose";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { decryptXCredential, hmac } from "../../components/tools/encrypt_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const username = req?.auth?.username || "";

  const oPayload = {
    ...body,
  };

  try {
    // Validasi body kosong
    if (!oPayload || Object.keys(oPayload).length < 1) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Invalid request body",
        datetime: formatDateSystem(),
      });
    }

    const cValidation = await validatePayload(
      {
        user_code: Joi.string().required().label("user_code"),
        fullname: Joi.string().max(100).required().label("Fullname"),
        username: Joi.string().max(100).required().label("Username"),
        telp: Joi.string()
          .pattern(/^[0-9]+$/)
          .max(13)
          .required()
          .label("Telp"),
        role: Joi.string().required().label("Role"),
        password: Joi.string()
          .min(8)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/)
          .label("Password")
          .optional()
          .allow(""),
        status: Joi.string().required().label("Status"),
      },
      {
        "string.base": "{#label} harus berupa string",
        "string.empty": "{#label} tidak boleh kosong",
        "string.max": "{#label} tidak boleh lebih dari {#limit} karakter",
        "string.min": "{#label} minimal {#limit} karakter",
        "string.pattern.base": "{#label} memiliki format yang salah",
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
      },
      oPayload,
      {
        uniqueField: ["username", "telp"],
        table: "mst_user",
        excludedField: "user_code",
        allowUnknown: true,
      }
    );

    if (cValidation) {
      const oResult = {
        status: status.BAD_REQUEST,
        message: cValidation || "Terdapat kesalahan pada data anda",
        datetime: formatDateSystem(),
      };

      Logging(null, {
        file: "/setup/user_login/user_update.js",
        func: "update",
        request: oPayload,
        response: oResult,
        user: username,
      });

      return res.status(422).json(oResult);
    }

    // Ambil data user sebelumnya di mst_user
    const oDataBefore = await DB("mst_user")
      .where("user_code", oPayload.user_code)
      .first();

    if (!oDataBefore) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data dengan kode tersebut tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Persiapan data yang akan diupdate
    const oData = {
      fullname: oPayload.fullname,
      username: oPayload.username,
      telp: oPayload.telp,
      role: oPayload.role,
      status: oPayload.status,
      updated_by: username,
      updated_at: formatDateSystem(),
    };

    // Best practice permission check for branch mutation (pindah tugas cabang):
    const cUserRole = String(req?.auth?.role || "").toLowerCase();
    const canMutateBranch = [
      "superadmin",
      "admin",
      "corporate_manager",
      "regional_manager",
    ].includes(cUserRole);

    let isBranchMutated = false;

    if (oPayload.default_branch_id !== undefined) {
      const newBranchId = oPayload.default_branch_id ? Number(oPayload.default_branch_id) : null;
      if (
        newBranchId &&
        oDataBefore.default_branch_id &&
        newBranchId !== oDataBefore.default_branch_id &&
        !canMutateBranch
      ) {
        return res.status(403).json({
          status: status.GAGAL,
          message:
            "Anda tidak memiliki wewenang untuk memindahkan/memutasikan cabang penugasan user. Hanya Corporate / Regional Manager yang dapat melakukan mutasi cabang.",
          datetime: formatDateSystem(),
        });
      }

      if (newBranchId !== oDataBefore.default_branch_id) {
        isBranchMutated = true;
      }

      oData.default_branch_id = newBranchId;

      // Sinkronisasi otomatis wilayah ke wilayah cabang baru
      if (newBranchId) {
        const oBranch = await DB("mst_cabang").where("id", newBranchId).select("org_node_id").first();
        if (oBranch && oBranch.org_node_id) {
          oData.org_node_id = Number(oBranch.org_node_id);
        }
      }
    }

    if (oPayload.org_node_id !== undefined && !oData.org_node_id) {
      oData.org_node_id = oPayload.org_node_id ? Number(oPayload.org_node_id) : null;
    }

    if (oPayload.can_switch_branch !== undefined) {
      oData.can_switch_branch = oPayload.can_switch_branch ? 1 : 0;
    }

    // Logika enkripsi password jika dikirimkan oleh client
    if (oPayload.password) {
      const cPassword = process.env.USER_KEY + oPayload.user_code + oPayload.password;
      const dCreatedAt = oDataBefore.created_at || oDataBefore.CreatedAt;
      const secret = process.env.USER_SECRET;
      oData["password"] = hmac(cPassword, secret, "sha512");
    }

    // Eksekusi perubahan di dalam Transaksi Database
    await DB.transaction(async (trx) => {
      // Update data mst_user
      await trx("mst_user")
        .where("user_code", oPayload.user_code)
        .update(oData);

      // Masking password lama & baru pada audit log demi keamanan data
      const oLogDataBefore = { ...oDataBefore };
      if (oLogDataBefore.password) {
        oLogDataBefore.password = "[PROTECTED]";
      }

      const oLogDataAfter = { ...oDataBefore, ...oData };
      if (oLogDataAfter.password) {
        oLogDataAfter.password = "[PROTECTED]";
      }

      await ChangesLog(
        {
          description: isBranchMutated ? "Mutasi Cabang User" : "Update User",
          tableName: "mst_user",
          referenceCode: oPayload.user_code,
          action: "UPDATE",
          dataBefore: oLogDataBefore,
          dataAfter: oLogDataAfter,
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data berhasil diupdate",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/setup/user_login/user_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;