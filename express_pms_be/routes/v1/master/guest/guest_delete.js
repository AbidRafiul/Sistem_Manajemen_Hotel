/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_delete.js
 * @description Endpoint soft delete data master tamu
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

  const { id, kode_tamu, ids } = oPayload;

  if (!id && !kode_tamu && (!ids || !Array.isArray(ids) || ids.length === 0)) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: "ID, Kode Tamu, atau daftar ID (ids) wajib diisi untuk menghapus",
      datetime: formatDateSystem(),
    });
  }

  try {
    const targetIds = ids && ids.length > 0 ? ids : (id ? [id] : []);
    let targetGuests = [];

    if (targetIds.length > 0) {
      targetGuests = await DB("mst_guest").whereIn("id", targetIds).whereNull("deleted_at");
    } else if (kode_tamu) {
      targetGuests = await DB("mst_guest").where("kode_tamu", kode_tamu).whereNull("deleted_at");
    }

    if (targetGuests.length === 0) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data tamu tidak ditemukan atau sudah dihapus",
        datetime: formatDateSystem(),
      });
    }

    const tNow = formatDateSystem();
    const guestIds = targetGuests.map(g => g.id);

    await DB.transaction(async (trx) => {
      await trx("mst_guest")
        .whereIn("id", guestIds)
        .update({
          deleted_at: tNow,
          deleted_by: userId,
          is_active: 0
        });

      for (const g of targetGuests) {
        await ChangesLog({
          description: "Hapus Data Tamu (Soft Delete)",
          tableName: "mst_guest",
          referenceCode: g.kode_tamu,
          action: "DELETE",
          dataBefore: g,
          dataAfter: { deleted_at: tNow },
          user: username
        }, trx);
      }
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `${targetGuests.length} data tamu berhasil dihapus`,
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat menghapus data tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_delete.js",
      func: "delete",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
