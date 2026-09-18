/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_flag.js
 * @description Endpoint penanganan status VIP dan Blacklist tamu
 */
import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, ChangesLog } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const userId = req?.auth?.user_id || null;
  const { kode_tamu, is_vip, vip_level, is_blacklisted, blacklist_reason } = oPayload;

  if (!kode_tamu) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: "Kode Tamu wajib diisi",
      datetime: formatDateSystem(),
    });
  }

  try {
    const guest = await DB("mst_guest").where("kode_tamu", kode_tamu).whereNull("deleted_at").first();
    if (!guest) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data tamu tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    const tNow = formatDateSystem();
    const updateObj = { updated_at: tNow };

    if (is_vip !== undefined) {
      updateObj.is_vip = Number(is_vip);
      if (vip_level) updateObj.vip_level = vip_level;
    }

    if (is_blacklisted !== undefined) {
      const blVal = Number(is_blacklisted);
      updateObj.is_blacklisted = blVal;
      if (blVal === 1) {
        if (!blacklist_reason || !blacklist_reason.trim()) {
          return res.status(422).json({
            status: status.BAD_REQUEST,
            message: "Alasan Blacklist wajib diisi saat memasukkan tamu ke daftar hitam",
            datetime: formatDateSystem(),
          });
        }
        updateObj.blacklist_reason = blacklist_reason.trim();
        updateObj.blacklist_by = userId;
        updateObj.blacklist_at = tNow;
      } else {
        updateObj.blacklist_reason = null;
        updateObj.blacklist_by = null;
        updateObj.blacklist_at = null;
      }
    }

    await DB.transaction(async (trx) => {
      await trx("mst_guest").where("kode_tamu", kode_tamu).update(updateObj);

      await ChangesLog({
        description: `Update Flag Tamu (VIP: ${updateObj.is_vip ?? guest.is_vip}, Blacklist: ${updateObj.is_blacklisted ?? guest.is_blacklisted})`,
        tableName: "mst_guest",
        referenceCode: kode_tamu,
        action: "UPDATE",
        dataBefore: guest,
        dataAfter: updateObj,
        user: username
      }, trx);
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Flag data tamu berhasil diperbarui",
      datetime: formatDateSystem()
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat memperbarui flag data tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_flag.js",
      func: "flag",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
