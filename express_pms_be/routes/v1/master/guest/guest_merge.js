/**
 * @copyright (c) 2026 PT Marstech Global
 * @file guest_merge.js
 * @description Endpoint penggabungan 2 profil tamu (Merge Profile)
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
  const canMerge = req?.auth?.permissions?.includes("guest.merge") || req?.auth?.role === "superadmin" || req?.auth?.role === "admin";

  if (!canMerge) {
    return res.status(403).json({
      status: status.FORBIDDEN,
      message: "Anda tidak memiliki hak akses untuk mengoperasikan Merge profil tamu (guest.merge)",
      datetime: formatDateSystem(),
    });
  }

  const { primary_kode_tamu, duplicate_kode_tamu } = oPayload;

  if (!primary_kode_tamu || !duplicate_kode_tamu) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: "Kode Tamu Utama dan Kode Tamu Duplikat wajib diisi",
      datetime: formatDateSystem(),
    });
  }

  if (primary_kode_tamu === duplicate_kode_tamu) {
    return res.status(422).json({
      status: status.BAD_REQUEST,
      message: "Profil Utama dan Profil Duplikat tidak boleh sama",
      datetime: formatDateSystem(),
    });
  }

  try {
    const primaryGuest = await DB("mst_guest").where("kode_tamu", primary_kode_tamu).whereNull("deleted_at").first();
    const dupGuest = await DB("mst_guest").where("kode_tamu", duplicate_kode_tamu).whereNull("deleted_at").first();

    if (!primaryGuest || !dupGuest) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Profil tamu utama atau profil duplikat tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    if (dupGuest.is_merged) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: "Profil duplikat ini sudah pernah di-merge sebelumnya",
        datetime: formatDateSystem(),
      });
    }

    await DB.transaction(async (trx) => {
      // 1. Update references in trx_reservation
      const resUpdated = await trx("trx_reservation")
        .where("kode_guest", duplicate_kode_tamu)
        .update({ kode_guest: primary_kode_tamu });

      // 2. Update references in trx_guest_document
      await trx("trx_guest_document")
        .where("kode_guest", duplicate_kode_tamu)
        .update({ kode_guest: primary_kode_tamu });

      // 3. Update references in trx_guest_feedback
      await trx("trx_guest_feedback")
        .where("kode_guest", duplicate_kode_tamu)
        .update({ kode_guest: primary_kode_tamu });

      // 4. Mark duplicate guest as merged
      const tNow = formatDateSystem();
      await trx("mst_guest")
        .where("kode_tamu", duplicate_kode_tamu)
        .update({
          is_merged: 1,
          merged_into_guest_id: primary_kode_tamu,
          is_active: 0,
          updated_at: tNow
        });

      // 5. Recalculate stats for primary guest
      const stayStats = await trx("trx_reservation")
        .where("kode_guest", primary_kode_tamu)
        .whereIn("status", ["checked_in", "checked_out"])
        .select(
          trx.raw("COUNT(id) as total_stay"),
          trx.raw("MAX(check_in_date) as last_stay_date")
        )
        .first();

      const folioStats = await trx("trx_folio as f")
        .join("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
        .where("r.kode_guest", primary_kode_tamu)
        .where("f.status", "closed")
        .select(trx.raw("COALESCE(SUM(f.grand_total), 0) as total_spending"))
        .first();

      const newTotalStay = (primaryGuest.total_stay || 0) + (dupGuest.total_stay || 0);
      const newTotalSpending = (Number(primaryGuest.total_spending || 0) + Number(dupGuest.total_spending || 0));

      await trx("mst_guest")
        .where("kode_tamu", primary_kode_tamu)
        .update({
          total_stay: stayStats?.total_stay ? Math.max(stayStats.total_stay, newTotalStay) : newTotalStay,
          total_spending: folioStats?.total_spending ? Math.max(Number(folioStats.total_spending), newTotalSpending) : newTotalSpending,
          last_stay_date: stayStats?.last_stay_date || primaryGuest.last_stay_date || dupGuest.last_stay_date,
          updated_at: tNow
        });

      // 6. Record to audit log
      await ChangesLog({
        description: `Merge profil tamu ${duplicate_kode_tamu} ke ${primary_kode_tamu} (${resUpdated} reservasi dipindahkan)`,
        tableName: "mst_guest",
        referenceCode: primary_kode_tamu,
        action: "UPDATE",
        dataBefore: dupGuest,
        dataAfter: { primary_kode_tamu, duplicate_kode_tamu, res_transferred: resUpdated },
        user: username
      }, trx);
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Profil tamu ${duplicate_kode_tamu} berhasil digabungkan ke ${primary_kode_tamu}`,
      datetime: formatDateSystem()
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat penggabungan profil tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/guest_merge.js",
      func: "merge",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
