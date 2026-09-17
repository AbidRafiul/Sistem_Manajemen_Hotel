/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file extend_submit.js
 * @description Endpoint untuk mengeksekusi perpanjangan masa menginap (update reservasi & posting folio)
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
import { hitungHargaKamar } from "../../components/tools/pricing_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const userId = req?.auth?.user_id || null;

  try {
    const cValidation = await validatePayload(
      {
        kode_reservasi_room: Joi.string().required().label("Kode Reservasi Kamar"),
        new_check_out_date: Joi.date().iso().required().label("Tanggal Check-out Baru"),
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
        "date.format": "{#label} format tanggal salah"
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

    // 1. Ambil data reservasi kamar
    const resRoom = await DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .join("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .select(
        "rr.*",
        "r.kode_cabang",
        "r.check_in_date",
        "r.check_out_date as current_check_out_date",
        "mk.nomor_kamar"
      )
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
        message: `Kamar tidak dalam status aktif menginap (Status: ${resRoom.status})`,
        datetime: formatDateSystem()
      });
    }

    const parseToYmd = (d) => {
      if (!d) return "";
      if (typeof d === "string") {
        const m = d.match(/^(\d{4}-\d{2}-\d{2})/);
        if (m) return m[1];
      }
      return formatDateSystem(d, "yyyy-MM-dd");
    };

    const curCheckoutStr = parseToYmd(resRoom.current_check_out_date);
    const newCheckoutStr = parseToYmd(oPayload.new_check_out_date);

    const currentCheckout = new Date(`${curCheckoutStr}T00:00:00Z`);
    const newCheckout = new Date(`${newCheckoutStr}T00:00:00Z`);

    const timeDiff = newCheckout.getTime() - currentCheckout.getTime();
    const additionalNights = Math.round(timeDiff / (1000 * 3600 * 24));

    if (additionalNights <= 0) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: `Tanggal check-out baru (${newCheckoutStr}) harus lebih besar dari tanggal check-out saat ini (${curCheckoutStr})`,
        datetime: formatDateSystem()
      });
    }

    // 2. Cek konflik ketersediaan kamar yang sama
    const conflictBooking = await DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .where("rr.kode_kamar", resRoom.kode_kamar)
      .where("rr.kode_reservasi_room", "!=", resRoom.kode_reservasi_room)
      .whereIn("rr.status", ["booked", "assigned", "checked_in"])
      .whereIn("r.status", ["reserved", "confirmed", "checked_in"])
      .where(function () {
        this.where("r.check_in_date", "<", newCheckoutStr).andWhere(
          "r.check_out_date",
          ">",
          curCheckoutStr
        );
      })
      .first();

    if (conflictBooking) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: `Kamar ${resRoom.nomor_kamar} sudah di-booking oleh reservasi lain (${conflictBooking.kode_reservation}) pada rentang tanggal perpanjangan tersebut.`,
        datetime: formatDateSystem()
      });
    }

    // 3. Ambil folio aktif
    const folio = await DB("trx_folio")
      .where("kode_reservation", resRoom.kode_reservation)
      .where("status", "open")
      .first();

    if (!folio) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: "Folio aktif tidak ditemukan untuk reservasi ini.",
        datetime: formatDateSystem()
      });
    }

    // 4. Validasi shift jika bayar langsung tunai
    if (oPayload.is_paid_now && oPayload.payment_method === "cash") {
      const shift = await DB("trx_cashier_shift")
        .where("kode_cashier_shift", oPayload.kode_cashier_shift)
        .first();

      if (!shift || shift.status !== "open") {
        return res.status(422).json({
          status: status.BAD_REQUEST,
          message: `Shift kasir ${oPayload.kode_cashier_shift} tidak aktif/tidak valid. Buka shift kasir terlebih dahulu.`,
          datetime: formatDateSystem()
        });
      }
    }

    // 5. Hitung harga per malam untuk extend
    const rateInfo = await hitungHargaKamar(
      {
        kode_tipe_kamar: resRoom.kode_tipe_kamar,
        kode_rate_plan: resRoom.kode_rate_plan,
        tanggal: curCheckoutStr
      },
      DB
    );

    const ratePerNight = parseFloat(rateInfo.price || resRoom.rate_per_night || 0);
    const totalAdditionalCharge = ratePerNight * additionalNights;

    let resultData = null;

    await DB.transaction(async (trx) => {
      const tNow = formatDateSystem();
      const newTotalNights = (parseInt(resRoom.nights, 10) || 0) + additionalNights;

      // Update trx_reservation_room
      await trx("trx_reservation_room")
        .where("kode_reservasi_room", resRoom.kode_reservasi_room)
        .update({
          nights: newTotalNights,
          updated_by: userId,
          updated_at: tNow
        });

      // Update trx_reservation
      await trx("trx_reservation")
        .where("kode_reservasi", resRoom.kode_reservation)
        .update({
          check_out_date: newCheckoutStr,
          updated_by: userId,
          updated_at: tNow
        });

      // Insert trx_folio_charge untuk malam tambahan
      const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
      if (!noFolioCharge) throw new Error("Gagal membuat nomor charge folio");

      await trx("trx_folio_charge").insert({
        kode_folio_charge: noFolioCharge,
        kode_folio: folio.kode_folio,
        charge_type: "room",
        description: `Perpanjangan Kamar (${additionalNights} malam) s.d. ${newCheckoutStr} - Kamar ${resRoom.nomor_kamar}`,
        qty: additionalNights,
        unit_price: ratePerNight,
        amount: totalAdditionalCharge,
        ref_source_type: "trx_reservation_room",
        kode_ref_source: resRoom.kode_reservasi_room,
        posted_by: userId,
        posted_at: tNow,
        created_by: userId,
        created_at: tNow,
        is_active: 1
      });

      // Update total tagihan trx_folio
      await trx("trx_folio")
        .where("kode_folio", folio.kode_folio)
        .update({
          subtotal: trx.raw("subtotal + ?", [totalAdditionalCharge]),
          grand_total: trx.raw("grand_total + ?", [totalAdditionalCharge]),
          updated_by: userId,
          updated_at: tNow
        });

      let paymentResult = null;

      // Jika is_paid_now === true, buat payment
      if (oPayload.is_paid_now && totalAdditionalCharge > 0) {
        const noPayment = await generateSequence("FMT-PAYMENT", trx);
        if (!noPayment) throw new Error("Gagal membuat kode transaksi pembayaran");

        await trx("trx_payment").insert({
          kode_payment: noPayment,
          kode_folio: folio.kode_folio,
          payment_method: oPayload.payment_method,
          amount: totalAdditionalCharge,
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
          amount: totalAdditionalCharge,
          paid_at: tNow
        };
      }

      // Hitung balance terbaru
      const sumPayment = await trx("trx_payment")
        .where("kode_folio", folio.kode_folio)
        .sum("amount as total_paid")
        .first();

      const newGrandTotal = parseFloat(folio.grand_total) + totalAdditionalCharge;
      const newTotalPaid = parseFloat(sumPayment.total_paid || 0);
      const newBalance = newGrandTotal - newTotalPaid;

      resultData = {
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_reservation: resRoom.kode_reservation,
        nomor_kamar: resRoom.nomor_kamar,
        old_check_out_date: curCheckoutStr,
        new_check_out_date: newCheckoutStr,
        additional_nights: additionalNights,
        total_nights: newTotalNights,
        rate_per_night: ratePerNight,
        total_additional_charge: totalAdditionalCharge,
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
        ? `Perpanjangan menginap sampai ${newCheckoutStr} berhasil dan langsung dibayar lunas.`
        : `Perpanjangan menginap sampai ${newCheckoutStr} berhasil dibebankan ke tagihan kamar.`,
      datetime: formatDateSystem(),
      data: resultData
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SUBMIT EXTEND STAY",
      TableName: "trx_reservation_room",
      file: "extend_submit.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan sistem saat memperpanjang masa menginap.",
      datetime: formatDateSystem()
    });
  }
});

export default router;
