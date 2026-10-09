/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file cancel_submit.js
 * @description API endpoint untuk pembatalan reservasi, pelepasan alokasi kamar, dan penanganan refund deposit vs non-refundable fee
 * @author Antigravity
 * @created 2026-10-08
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { assertBranchScope } from "../../components/tools/scope_helper.js";

const router = express.Router();

const schema = Joi.object({
  kode_reservasi: Joi.string().required().label("Kode Reservasi"),
  cancellation_reason: Joi.string().required().label("Alasan Pembatalan"),
  notes: Joi.string().optional().allow(null, "").label("Catatan Tambahan"),
  refund_type: Joi.string().valid("refund_deposit", "non_refundable").required().label("Jenis Kebijakan Refund"),
  penalty_amount: Joi.number().min(0).default(0).label("Biaya Administrasi / Denda Pembatalan"),
  payment_method: Joi.string().valid("cash", "transfer", "card", "qris").optional().allow(null, "").label("Metode Pengembalian Dana"),
  bank_name: Joi.string().optional().allow(null, "").label("Nama Bank"),
  reference_no: Joi.string().optional().allow(null, "").label("Nomor Referensi"),
  kode_cashier_shift: Joi.string().optional().allow(null, "").label("Shift Kasir")
});

router.post("/", async (req, res) => {
  const db = DB;
  const userId = req?.auth?.user_id || null;

  try {
    const oPayload = req.body || {};
    const { error } = schema.validate(oPayload);
    if (error) {
      return res.status(400).json({
        status: status.GAGAL,
        message: error.details[0].message,
        datetime: formatDateSystem()
      });
    }

    const tNow = formatDateSystem();

    const result = await db.transaction(async (trx) => {
      // 1. Ambil data reservasi
      const reservation = await trx("trx_reservation as r")
        .join("mst_guest as g", "r.kode_guest", "g.kode_tamu")
        .select(
          "r.*",
          "g.full_name as guest_name",
          "g.phone as guest_phone"
        )
        .where("r.kode_reservasi", oPayload.kode_reservasi)
        .whereNull("r.deleted_at")
        .forUpdate()
        .first();

      if (!reservation) {
        throw new Error(`Reservasi '${oPayload.kode_reservasi}' tidak ditemukan.`);
      }

      // Validasi branch scope (RBAC)
      assertBranchScope(req, reservation.kode_cabang);

      if (["checked_in", "checked_out", "cancelled"].includes(reservation.status)) {
        throw new Error(`Reservasi tidak dapat dibatalkan karena status saat ini: '${reservation.status}'.`);
      }

      const depositAmount = parseFloat(reservation.deposit_amount || 0);
      const isRefundOption = oPayload.refund_type === "refund_deposit";
      let penaltyAmount = parseFloat(oPayload.penalty_amount || 0);

      // Pastikan pinalti tidak melebihi deposit
      if (penaltyAmount > depositAmount) {
        penaltyAmount = depositAmount;
      }

      const refundAmount = isRefundOption ? Math.max(0, depositAmount - penaltyAmount) : 0;
      const actualPenalty = isRefundOption ? penaltyAmount : depositAmount;

      // 2. Integrasi Shift Kasir (Hanya jika ada uang refund fisik yang dikembalikan > 0)
      let shiftCode = oPayload.kode_cashier_shift || null;
      if (isRefundOption && refundAmount > 0) {
        if (!shiftCode && userId) {
          // Cari shift aktif kasir yang bertugas di cabang ini
          const activeShift = await trx("trx_cashier_shift")
            .where("user_id", userId)
            .where("kode_cabang", reservation.kode_cabang)
            .where("status", "open")
            .orderBy("opened_at", "desc")
            .first();

          if (activeShift) {
            shiftCode = activeShift.kode_cashier_shift;
          }
        }

        if (oPayload.payment_method === "cash" && !shiftCode) {
          throw new Error("Shift kasir aktif tidak ditemukan. Harap buka shift kasir sebelum memproses refund uang tunai.");
        }
      }

      // 3. Update status reservasi jadi cancelled & simpan alasan
      const fullReason = oPayload.notes 
        ? `${oPayload.cancellation_reason} (${oPayload.notes})` 
        : oPayload.cancellation_reason;

      await trx("trx_reservation")
        .where("kode_reservasi", oPayload.kode_reservasi)
        .update({
          status: "cancelled",
          cancellation_reason: fullReason,
          cancellation_penalty: actualPenalty,
          updated_by: userId,
          updated_at: tNow
        });

      // 4. Update seluruh kamar reservasi jadi cancelled (otomatis melepas kamar)
      await trx("trx_reservation_room")
        .where("kode_reservation", oPayload.kode_reservasi)
        .update({
          status: "cancelled",
          updated_by: userId,
          updated_at: tNow
        });

      // 5. Penanganan Folio & Finansial
      const folio = await trx("trx_folio")
        .where("kode_reservation", oPayload.kode_reservasi)
        .first();

      let folioCode = folio?.kode_folio || null;
      let paymentRecordCode = null;

      if (folio) {
        // Nonaktifkan seluruh room charges karena kamar batal digunakan
        await trx("trx_folio_charge")
          .where("kode_folio", folio.kode_folio)
          .where("charge_type", "room")
          .update({
            is_active: 0
          });

        // Jika ada denda pembatalan (baik dari potongan refund maupun non-refundable hangus)
        if (actualPenalty > 0) {
          const chargeCode = await generateSequence("FMT-FOLIOCHARGE", trx);
          await trx("trx_folio_charge").insert({
            kode_folio_charge: chargeCode,
            kode_folio: folio.kode_folio,
            charge_type: "other",
            description: isRefundOption
              ? `Biaya Denda Pembatalan Reservasi (${oPayload.cancellation_reason})`
              : `Denda Pembatalan / Non-Refundable Deposit Hangus (${oPayload.cancellation_reason})`,
            qty: 1,
            unit_price: actualPenalty,
            amount: actualPenalty,
            ref_source_type: "trx_reservation",
            kode_ref_source: oPayload.kode_reservasi,
            kode_cashier_shift: shiftCode || null,
            posted_by: userId,
            posted_at: tNow,
            created_by: userId,
            created_at: tNow,
            is_active: 1
          });
        }

        // Jika ada dana deposit yang dikembalikan riil ke tamu
        if (isRefundOption && refundAmount > 0) {
          paymentRecordCode = await generateSequence("FMT-PAYMENT", trx);
          // Dicatat sebagai pengeluaran / nilai negatif di trx_payment
          await trx("trx_payment").insert({
            kode_payment: paymentRecordCode,
            kode_folio: folio.kode_folio,
            payment_method: oPayload.payment_method || "cash",
            bank_name: oPayload.bank_name || null,
            card_type: oPayload.card_type || null,
            amount: -refundAmount,
            reference_no: oPayload.reference_no 
              ? `REFUND: ${oPayload.reference_no}` 
              : `REFUND-DEPOSIT-${oPayload.kode_reservasi}`,
            kode_cashier_shift: shiftCode || null,
            received_by: userId,
            paid_at: tNow,
            created_by: userId,
            created_at: tNow,
            is_active: 1
          });
        }

        // Tutup Folio (Balance seimbang dengan denda)
        await trx("trx_folio")
          .where("kode_folio", folio.kode_folio)
          .update({
            subtotal: actualPenalty,
            tax_amount: 0,
            service_charge_amount: 0,
            grand_total: actualPenalty,
            status: "closed",
            closed_at: tNow,
            updated_by: userId,
            updated_at: tNow
          });
      }

      return {
        kode_reservasi: oPayload.kode_reservasi,
        guest_name: reservation.guest_name,
        refund_type: oPayload.refund_type,
        cancellation_reason: fullReason,
        deposit_awal: depositAmount,
        penalty_amount: actualPenalty,
        refund_amount: refundAmount,
        payment_method: oPayload.payment_method || null,
        kode_cashier_shift: shiftCode,
        kode_payment_refund: paymentRecordCode,
        kode_folio: folioCode
      };
    });

    const msg = result.refund_type === "refund_deposit"
      ? `Reservasi berhasil dibatalkan. Pengembalian deposit sebesar Rp ${result.refund_amount.toLocaleString("id-ID")} diproses melalui ${result.payment_method || "kasir"}.`
      : `Reservasi berhasil dibatalkan. Dana deposit sebesar Rp ${result.deposit_awal.toLocaleString("id-ID")} dibukukan sebagai denda pembatalan (Non-Refundable).`;

    return res.status(200).json({
      status: status.SUKSES,
      message: msg,
      datetime: formatDateSystem(),
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memproses pembatalan reservasi",
      datetime: formatDateSystem()
    });
  }
});

export default router;
