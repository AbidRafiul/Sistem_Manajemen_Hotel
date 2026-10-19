/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_status_update.js
 * @description POST /api/v1/event/status-update - Perubahan status siklus hidup event (Tentative, Confirmed, In-Progress, Completed, Cancelled)
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { ChangesLog } from "../components/tools/servertool.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const {
    kode_reservasi_event,
    new_status,
    deposit_amount = 0,
    catatan_batal = null,
    notes = null,
  } = req.body || {};

  const username = req?.auth?.username || "system";

  try {
    if (!kode_reservasi_event || !new_status) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_reservasi_event dan new_status wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const validStatuses = ["tentative", "confirmed", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(new_status)) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: `Status baru '${new_status}' tidak valid. Pilihan: ${validStatuses.join(", ")}`,
        datetime: formatDateSystem(),
      });
    }

    const existing = await DB("trx_reservasi_event")
      .where("kode_reservasi_event", kode_reservasi_event)
      .where("is_active", 1)
      .first();

    if (!existing) {
      return res.status(404).json({
        status: status.GAGAL,
        message: "Data pemesanan ruang event tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    const currentStatus = existing.status_event;
    if (currentStatus === new_status) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: `Status pemesanan sudah dalam status '${new_status}'`,
        datetime: formatDateSystem(),
      });
    }

    if (currentStatus === "completed" && new_status !== "completed") {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Event yang sudah berstatus 'completed' tidak dapat diubah lagi",
        datetime: formatDateSystem(),
      });
    }

    if (new_status === "cancelled" && !catatan_batal) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Alasan pembatalan (catatan_batal) wajib dicantumkan jika membatalkan event",
        datetime: formatDateSystem(),
      });
    }

    const updateFields = {
      status_event: new_status,
      updated_by: req.auth?.user_id || 1,
      updated_at: formatDateSystem(),
    };

    if (catatan_batal) {
      updateFields.catatan_batal = catatan_batal;
    }

    // Jika ada penambahan pembayaran DP saat konfirmasi
    if (deposit_amount && parseFloat(deposit_amount) > 0) {
      const addedDeposit = parseFloat(deposit_amount);
      const newDepositPaid = (parseFloat(existing.deposit_paid) || 0) + addedDeposit;
      const totalBiaya = parseFloat(existing.total_biaya) || 0;
      const newSisa = Math.max(0, totalBiaya - newDepositPaid);

      updateFields.deposit_paid = newDepositPaid;
      updateFields.sisa_tagihan = newSisa;

      if (newDepositPaid >= totalBiaya && totalBiaya > 0) {
        updateFields.status_pembayaran = "paid";
      } else if (newDepositPaid > 0) {
        updateFields.status_pembayaran = "deposit";
      }
    }

    await DB.transaction(async (trx) => {
      await trx("trx_reservasi_event")
        .where("kode_reservasi_event", kode_reservasi_event)
        .update(updateFields);

      await ChangesLog(
        {
          description: `Ubah Status Event ${kode_reservasi_event}: ${currentStatus} -> ${new_status}`,
          tableName: "trx_reservasi_event",
          referenceCode: kode_reservasi_event,
          action: "UPDATE_STATUS",
          dataBefore: { status_event: currentStatus },
          dataAfter: { status_event: new_status, notes: notes || catatan_batal },
          user: username,
          tz: req.body?.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Status pemesanan ${kode_reservasi_event} berhasil diubah menjadi '${new_status}'`,
      datetime: formatDateSystem(),
      data: {
        kode_reservasi_event,
        old_status: currentStatus,
        new_status,
      },
    });
  } catch (error) {
    console.error("Error in event_status_update.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal mengubah status pemesanan ruang event",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
