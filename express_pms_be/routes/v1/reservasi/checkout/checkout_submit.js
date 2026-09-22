/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file checkout_submit.js
 * @description Submit proses checkout tamu, rekonsiliasi saldo akurat, auto penugasan housekeeping tepat 1 kali, dan finalisasi dokumen invoice
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.2
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { findIdleHousekeeper } from "../../components/tools/housekeeping_helper.js";
import { calculateFolioBilling } from "../../components/tools/billing_helper.js";
import { assertBranchScope } from "../../components/tools/scope_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const user_id = req?.auth?.user_id || 0;

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
        kode_reservasi_room: Joi.string().optional().allow(null, "").label("Kode Reservasi Room"),
        kode_reservasi_rooms: Joi.array().items(Joi.string()).optional().label("Kode Reservasi Rooms"),
        kode_folio: Joi.string().optional().allow(null, "").label("Kode Folio"),
        payment: Joi.array()
          .items(
            Joi.object({
              payment_method: Joi.string().required(),
              amount: Joi.number().min(1).required(),
              kode_cashier_shift: Joi.string().when("payment_method", {
                is: "cash",
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, "")
              }),
              reference_no: Joi.string().optional().allow("", null),
            })
          )
          .optional()
          .label("Payment"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.required": "{#label} wajib diisi",
      },
      oPayload,
      { table: "trx_checkout", allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });
    }

    let sInvoiceNumber = "";
    let sFolioCode = "";
    const processedRooms = [];
    let isFolioClosed = false;

    await DB.transaction(async (trx) => {
      // 1. Tentukan kamar-kamar yang akan di-checkout
      let targetRoomIds = [];
      if (Array.isArray(oPayload.kode_reservasi_rooms) && oPayload.kode_reservasi_rooms.length > 0) {
        targetRoomIds = oPayload.kode_reservasi_rooms;
      } else if (oPayload.kode_reservasi_room) {
        targetRoomIds = [oPayload.kode_reservasi_room];
      } else if (oPayload.kode_folio) {
        const roomsInFolio = await trx("trx_reservation_room as rr")
          .join("trx_folio as f", "rr.kode_reservation", "f.kode_reservation")
          .where("f.kode_folio", oPayload.kode_folio)
          .where("rr.status", "checked_in")
          .select("rr.kode_reservasi_room");
        targetRoomIds = roomsInFolio.map((r) => r.kode_reservasi_room);
      }

      if (targetRoomIds.length === 0) {
        throw new Error("Tidak ada kamar yang dipilih untuk checkout.");
      }

      // Ambil seluruh data kamar target
      const resRooms = await trx("trx_reservation_room")
        .whereIn("kode_reservasi_room", targetRoomIds)
        .forUpdate();

      if (resRooms.length === 0) {
        throw new Error("Data kamar reservasi tidak ditemukan.");
      }

      const activeRooms = resRooms.filter((r) => r.status === "checked_in");
      if (activeRooms.length === 0) {
        throw new Error("Seluruh kamar yang dipilih sudah di-checkout sebelumnya.");
      }

      const primaryResRoom = activeRooms[0];

      // 2. Dapatkan perhitungan tagihan akurat via calculateFolioBilling
      const billing = await calculateFolioBilling({
        kode_reservasi_room: primaryResRoom.kode_reservasi_room,
        kode_folio: oPayload.kode_folio,
        trx: trx
      });

      if (!billing) throw new Error("Data folio billing tidak ditemukan");
      const folio = billing.folio;
      sFolioCode = folio.kode_folio;

      // Validasi branch scope
      assertBranchScope(req, folio.kode_cabang);

      let totalPaid = billing.folio.total_paid;
      const tNow = formatDateSystem();

      // 3. Proses Pembayaran Pelunasan jika dikirimkan
      if (Array.isArray(oPayload.payment) && oPayload.payment.length > 0) {
        for (const pay of oPayload.payment) {
          if (pay.payment_method === "cash") {
            const shift = await trx("trx_cashier_shift")
              .where("kode_cashier_shift", pay.kode_cashier_shift)
              .first();

            if (!shift || shift.status !== "open") {
              throw new Error(`Shift kasir ${pay.kode_cashier_shift || ""} tidak aktif/tidak valid. Harap buka shift terlebih dahulu.`);
            }
          }

          const payCode = await generateSequence("FMT-PAYMENT", trx);
          await trx("trx_payment").insert({
            kode_payment: payCode,
            kode_folio: folio.kode_folio,
            payment_method: pay.payment_method,
            amount: pay.amount,
            reference_no: pay.reference_no || null,
            kode_cashier_shift: pay.kode_cashier_shift || null,
            received_by: user_id,
            paid_at: tNow,
            created_by: user_id,
            created_at: tNow
          });

          totalPaid += parseFloat(pay.amount);
        }
      }

      // 4. Validasi Saldo Akhir (Outstanding Balance)
      const outstanding = billing.folio.grand_total - totalPaid;
      if (outstanding > 0 && folio.folio_owner_type === "guest") {
        throw new Error(`Masih ada tagihan belum lunas: Rp ${Math.round(outstanding).toLocaleString('id-ID')}. Selesaikan pelunasan sebelum konfirmasi checkout.`);
      }

      // 5. Proses checkout untuk setiap kamar target
      for (const roomItem of activeRooms) {
        // Row-Lock mst_kamar & Update status kamar jadi vacant + dirty
        const mstKamar = await trx("mst_kamar")
          .where("kode_kamar", roomItem.kode_kamar)
          .forUpdate()
          .first();

        if (mstKamar) {
          const oldOccupancy = mstKamar.occupancy_status;
          await trx("mst_kamar")
            .where("kode_kamar", roomItem.kode_kamar)
            .update({
              occupancy_status: "vacant",
              housekeeping_status: "dirty",
              updated_at: tNow,
              updated_by: user_id
            });

          // Catat ke trx_room_status_log
          const logCode = await generateSequence("FMT-RSL", trx);
          await trx("trx_room_status_log").insert({
            kode_room_status_log: logCode,
            kode_kamar: roomItem.kode_kamar,
            status_from: oldOccupancy,
            status_to: "vacant",
            changed_by: user_id,
            changed_at: tNow
          });
        }

        // Penugasan Housekeeping Otomatis TEPAT 1 KALI (Idempoten)
        const activeTask = await trx("trx_housekeeping_task")
          .where("kode_kamar", roomItem.kode_kamar)
          .whereIn("status", ["assigned", "in_progress"])
          .whereNull("deleted_at")
          .where("is_active", 1)
          .first();

        let hkTask = activeTask;
        if (!activeTask) {
          const hkTaskCode = await generateSequence("FMT-TASK", trx);
          const idleStaff = await findIdleHousekeeper(folio.kode_cabang, trx);
          await trx("trx_housekeeping_task").insert({
            kode_housekeeping_task: hkTaskCode,
            kode_cabang: folio.kode_cabang,
            kode_kamar: roomItem.kode_kamar,
            task_type: "cleaning",
            assigned_to: idleStaff ? idleStaff.id : null,
            priority: "normal",
            status: "assigned",
            created_by: user_id,
            created_at: tNow
          });
          hkTask = { kode_housekeeping_task: hkTaskCode, kode_kamar: roomItem.kode_kamar };
        }

        // Insert trx_checkout per kamar
        const cCheckoutCode = await generateSequence("FMT-CO", trx);
        await trx("trx_checkout").insert({
          kode_checkout: cCheckoutCode,
          kode_reservation_room: roomItem.kode_reservasi_room,
          late_checkout: 0,
          grand_total: roomItem.rate_per_night,
          checkout_by: user_id,
          checkout_at: tNow,
          created_by: user_id,
          created_at: tNow
        });

        // Update trx_reservation_room jadi checked_out
        await trx("trx_reservation_room")
          .where("kode_reservasi_room", roomItem.kode_reservasi_room)
          .update({
            status: "checked_out",
            updated_by: user_id,
            updated_at: tNow
          });

        processedRooms.push({
          kode_reservasi_room: roomItem.kode_reservasi_room,
          kode_kamar: roomItem.kode_kamar,
          nomor_kamar: mstKamar?.nomor_kamar || roomItem.kode_kamar,
          kode_checkout: cCheckoutCode,
          housekeeping_task: hkTask
        });
      }

      // 6. Cek apakah seluruh kamar dalam reservasi ini sudah checked_out
      const allRoomsInRes = await trx("trx_reservation_room")
        .where("kode_reservation", primaryResRoom.kode_reservation);

      const allCheckedOut = allRoomsInRes.every((r) => r.status === "checked_out");
      isFolioClosed = allCheckedOut;

      if (allCheckedOut) {
        // Tutup Folio
        await trx("trx_folio")
          .where("kode_folio", folio.kode_folio)
          .update({
            status: "closed",
            subtotal: billing.folio.subtotal,
            tax_amount: billing.folio.tax_amount,
            service_charge_amount: billing.folio.service_charge_amount,
            grand_total: billing.folio.grand_total,
            closed_at: tNow,
            updated_by: user_id,
            updated_at: tNow
          });

        // Update Reservasi
        await trx("trx_reservation")
          .where("kode_reservasi", primaryResRoom.kode_reservation)
          .update({
            status: "checked_out",
            updated_at: tNow,
            updated_by: user_id
          });
      }

      // 10. Terbitkan / Catat Dokumen Invoice Unik di trx_fiscal_document
      let fiscalDoc = await trx("trx_fiscal_document")
        .where("kode_folio", folio.kode_folio)
        .where("doc_type", "invoice")
        .where("is_active", 1)
        .first();

      if (!fiscalDoc) {
        sInvoiceNumber = await generateSequence("FMT-INVOICE", trx);
        const fiscalDocCode = `FDC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

        await trx("trx_fiscal_document").insert({
          kode_fiscal_document: fiscalDocCode,
          kode_cabang: folio.kode_cabang,
          kode_folio: folio.kode_folio,
          doc_type: "invoice",
          doc_number: sInvoiceNumber,
          amount: billing.folio.grand_total,
          issued_by: user_id,
          issued_at: tNow,
          created_by: user_id,
          created_at: tNow,
          is_active: 1
        });
      } else {
        sInvoiceNumber = fiscalDoc.doc_number;
      }
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Checkout berhasil diproses untuk ${processedRooms.length} kamar`,
      datetime: formatDateSystem(),
      data: {
        rooms_checked_out: processedRooms,
        room_count: processedRooms.length,
        nomor_kamar: processedRooms.map((r) => r.nomor_kamar).join(", "),
        kode_folio: sFolioCode,
        invoice_number: sInvoiceNumber,
        is_folio_closed: isFolioClosed,
        is_settled: true
      },
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SUBMIT CHECKOUT",
      TableName: "trx_checkout",
      file: "checkout_submit.js",
      username: username,
    });

    const friendlyErrors = [
      "Data kamar reservasi tidak ditemukan",
      "Kamar ini sudah checkout sebelumnya",
      "Data folio tidak ditemukan",
      "Folio sudah ditutup",
      "Masih ada tagihan belum lunas:",
      "Shift kasir",
      "Akses ditolak"
    ];

    const isFriendly = friendlyErrors.some(fe => error.message.includes(fe));
    const httpStatus = error.status || error.statusCode || 500;

    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: isFriendly ? error.message : "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
