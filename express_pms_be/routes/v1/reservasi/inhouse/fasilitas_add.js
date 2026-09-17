/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file fasilitas_add.js
 * @description Endpoint untuk menambah tagihan fasilitas/layanan kamar in-house (Charge to Room atau Pay on the Spot)
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-16
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const userId = req?.auth?.user_id || null;

  try {
    const cValidation = await validatePayload(
      {
        kode_reservasi_room: Joi.string().required().label("Kode Reservasi Kamar"),
        items: Joi.array()
          .items(
            Joi.object({
              kode_fasilitas: Joi.string().optional().allow(null, ""),
              nama: Joi.string().required().label("Nama Layanan/Fasilitas"),
              qty: Joi.number().integer().min(1).required().label("Jumlah"),
              harga: Joi.number().min(0).required().label("Harga Satuan"),
              charge_type: Joi.string()
                .valid("restaurant", "laundry", "room", "other")
                .default("other")
                .label("Tipe Charge")
            })
          )
          .min(1)
          .required()
          .label("Daftar Fasilitas"),
        is_paid_now: Joi.boolean().default(false).label("Bayar Langsung"),
        payment_method: Joi.string()
          .when("is_paid_now", {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, "")
          })
          .label("Metode Pembayaran"),
        kode_cashier_shift: Joi.string()
          .when("payment_method", {
            is: "cash",
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, "")
          })
          .label("Kode Shift Kasir"),
        reference_no: Joi.string().optional().allow(null, "").label("Nomor Referensi")
      },
      {
        "any.required": "{#label} wajib diisi",
        "number.min": "{#label} minimal {#limit}"
      },
      oPayload,
      { allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem()
      });
    }

    // 1. Cek kamar reservasi
    const resRoom = await DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .select("rr.*", "r.kode_cabang")
      .where("rr.kode_reservasi_room", oPayload.kode_reservasi_room)
      .first();

    if (!resRoom) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data reservasi kamar tidak ditemukan",
        datetime: formatDateSystem()
      });
    }

    if (resRoom.status !== "checked_in") {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: `Kamar tidak dalam status menginap (Status saat ini: ${resRoom.status})`,
        datetime: formatDateSystem()
      });
    }

    // 2. Cari folio aktif
    const folio = await DB("trx_folio")
      .where("kode_reservation", resRoom.kode_reservation)
      .where("status", "open")
      .first();

    if (!folio) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: "Folio aktif untuk reservasi ini tidak ditemukan atau sudah ditutup.",
        datetime: formatDateSystem()
      });
    }

    // 3. Jika bayar langsung dengan Cash, validasi shift
    if (oPayload.is_paid_now && oPayload.payment_method === "cash") {
      const shift = await DB("trx_cashier_shift")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .first();

      if (!shift || shift.status !== "open") {
        return res.status(422).json({
          status: status.BAD_REQUEST,
          message: `Shift kasir ${oPayload.kode_cashier_shift} tidak aktif/tidak valid. Silakan buka shift terlebih dahulu.`,
          datetime: formatDateSystem()
        });
      }
    }

    let resultData = null;

    await DB.transaction(async (trx) => {
      const tNow = formatDateSystem();
      let totalItemsAmount = 0;
      const createdCharges = [];

      for (const item of oPayload.items) {
        const qty = Number(item.qty) || 1;
        const unitPrice = Number(item.harga) || 0;
        const subtotal = qty * unitPrice;

        if (subtotal > 0) {
          const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
          if (!noFolioCharge) throw new Error("Gagal membuat kode transaksi charge folio");

          await trx("trx_folio_charge").insert({
            kode_folio_charge: noFolioCharge,
            kode_folio: folio.kode_folio,
            charge_type: item.charge_type || "other",
            description: `${item.nama}${qty > 1 ? ` (${qty}x)` : ""}`,
            qty: qty,
            unit_price: unitPrice,
            amount: subtotal,
            ref_source_type: "manual_addon",
            kode_ref_source: oPayload.kode_reservasi_room,
            posted_by: userId,
            posted_at: tNow,
            created_by: userId,
            created_at: tNow,
            is_active: 1
          });

          createdCharges.push({
            kode_folio_charge: noFolioCharge,
            nama: item.nama,
            qty,
            unit_price: unitPrice,
            amount: subtotal
          });

          totalItemsAmount += subtotal;
        }
      }

      // Update saldo trx_folio
      await trx("trx_folio")
        .where("kode_folio", folio.kode_folio)
        .update({
          subtotal: trx.raw("subtotal + ?", [totalItemsAmount]),
          grand_total: trx.raw("grand_total + ?", [totalItemsAmount]),
          updated_by: userId,
          updated_at: tNow
        });

      let paymentResult = null;

      // 4. Jika is_paid_now === true, langsung catat trx_payment
      if (oPayload.is_paid_now && totalItemsAmount > 0) {
        const noPayment = await generateSequence("FMT-PAYMENT", trx);
        if (!noPayment) throw new Error("Gagal membuat nomor transaksi pembayaran");

        await trx("trx_payment").insert({
          kode_payment: noPayment,
          kode_folio: folio.kode_folio,
          payment_method: oPayload.payment_method,
          amount: totalItemsAmount,
          reference_no: oPayload.reference_no || null,
          kode_cashier_shift: oPayload.kode_cashier_shift || null,
          received_by: userId,
          paid_at: tNow,
          created_by: userId,
          created_at: tNow
        });

        paymentResult = {
          kode_payment: noPayment,
          payment_method: oPayload.payment_method,
          amount: totalItemsAmount,
          paid_at: tNow
        };
      }

      // Hitung balance terbaru
      const sumPayment = await trx("trx_payment")
        .where("kode_folio", folio.kode_folio)
        .sum("amount as total_paid")
        .first();

      const newGrandTotal = parseFloat(folio.grand_total) + totalItemsAmount;
      const newTotalPaid = parseFloat(sumPayment.total_paid || 0);
      const newBalance = newGrandTotal - newTotalPaid;

      resultData = {
        kode_folio: folio.kode_folio,
        charges: createdCharges,
        total_charge_added: totalItemsAmount,
        payment: paymentResult,
        grand_total: newGrandTotal,
        total_paid: newTotalPaid,
        balance: newBalance,
        billing_status: newBalance <= 0 ? "settled" : "outstanding"
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: oPayload.is_paid_now
        ? "Fasilitas berhasil ditambahkan dan langsung dibayar lunas"
        : "Fasilitas berhasil dibebankan ke tagihan kamar tamu",
      datetime: formatDateSystem(),
      data: resultData
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "ADD INHOUSE FACILITY",
      TableName: "trx_folio_charge",
      file: "fasilitas_add.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan sistem saat menambahkan fasilitas.",
      datetime: formatDateSystem()
    });
  }
});

export default router;
