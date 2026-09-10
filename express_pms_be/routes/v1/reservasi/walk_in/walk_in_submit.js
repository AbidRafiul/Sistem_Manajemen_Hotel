/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file walk_in_submit.js
 * @description Endpoint untuk submit transaksi reservasi walk-in
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @version 1.0.0
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, validatePayload, ChangesLog } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { hitungHargaKamar } from "../../components/tools/pricing_helper.js";
import { processCheckIn } from "../../components/tools/checkin_helper.js";
import { hitungKetersediaanTipeKamar } from "../../components/tools/availability_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const userId = req?.auth?.user_id || null;

  try {
    if (!oPayload || Object.keys(oPayload).length < 1) {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Invalid request body",
          datetime: formatDateSystem(),
        });
    }

    const schema = {
      kode_cabang: Joi.string().required().label("Kode Cabang"),
      kode_guest: Joi.string().required().label("Kode Tamu"),
      check_in_date: Joi.date().iso().required().label("Tanggal Check In"),
      check_out_date: Joi.date().iso().required().label("Tanggal Check Out"),
      nights: Joi.number().integer().min(1).required().label("Jumlah Malam"),
      kode_kamar: Joi.string().required().label("Kode Kamar"),
      kode_tipe_kamar: Joi.string().required().label("Kode Tipe Kamar"),
      kode_rate_plan: Joi.string().required().label("Kode Rate Plan"),
      kode_season: Joi.string().optional().allow(null, "").label("Kode Season"),
      deposit_amount: Joi.number().min(0).optional().default(0).label("Deposit"),
      payment_method: Joi.string().when('deposit_amount', {
          is: Joi.number().greater(0),
          then: Joi.required(),
          otherwise: Joi.optional().allow(null, "")
      }).label("Metode Pembayaran"),
      kode_cashier_shift: Joi.string().when('deposit_amount', {
          is: Joi.number().greater(0),
          then: Joi.required(),
          otherwise: Joi.optional().allow(null, "")
      }).label("Kode Cashier Shift")
    };

    const cValidation = await validatePayload(
      schema,
      {
        "any.required": "{#label} wajib diisi",
        "date.format": "{#label} format tanggal salah",
        "number.min": "{#label} minimal {#limit}"
      },
      oPayload,
      { allowUnknown: true }
    );
    if (cValidation)
      return res
        .status(422)
        .json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });

    // 1. Cek Blacklist Tamu
    const guestInfo = await DB("mst_guest").where("kode_tamu", oPayload.kode_guest).first();
    if (!guestInfo) {
        return res.status(404).json({
            status: status.NOT_FOUND,
            message: "Data tamu tidak ditemukan",
            datetime: formatDateSystem(),
        });
    }

    if (guestInfo.is_blacklisted === 1) {
        return res.status(422).json({
            status: status.BAD_REQUEST,
            message: "Tamu ini masuk daftar blacklist, tidak dapat melakukan check-in.",
            datetime: formatDateSystem(),
        });
    }

    // 2. Hitung nights = hari antara check-in dan check-out
    // Gunakan date_tools atau cukup Math (karena formatDateSystem dll)
    const checkinDate = new Date(oPayload.check_in_date);
    const checkoutDate = new Date(oPayload.check_out_date);
    // Set time to 00:00:00 to avoid timezone issues when diffing dates
    checkinDate.setHours(0,0,0,0);
    checkoutDate.setHours(0,0,0,0);

    const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
    let computedNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (computedNights < 1) computedNights = 1;

    // 3. Mulai Transaksi
    let reservationData = null;

    await DB.transaction(async (trx) => {
        // Validasi ketersediaan kamar
        const ketersediaan = await hitungKetersediaanTipeKamar({
            kode_cabang: oPayload.kode_cabang,
            kode_tipe_kamar: oPayload.kode_tipe_kamar,
            check_in_date: checkinDate,
            check_out_date: checkoutDate
        }, trx);

        if (ketersediaan.available_count <= 0) {
            throw new Error("Kamar pada tipe ini sudah penuh atau belum siap (kamar kotor / sedang inspeksi / terisi).");
        }

        if (oPayload.kode_kamar && ketersediaan.terpakai_kamar_ids.includes(oPayload.kode_kamar)) {
            throw new Error("Kamar fisik yang dipilih sedang tidak tersedia atau belum bersih.");
        }

        // a. Hitung Harga
        const rateInfo = await hitungHargaKamar({
            kode_tipe_kamar: oPayload.kode_tipe_kamar,
            kode_rate_plan: oPayload.kode_rate_plan,
            kode_season: oPayload.kode_season,
            tanggal: oPayload.check_in_date
        }, trx);

        const ratePerNight = rateInfo.price;
        const totalRoomCharge = ratePerNight * computedNights;

        // b. Generate IDs
        const noReservasi = await generateSequence("FMT-RESERVASI", trx);
        const noResRoom = await generateSequence("FMT-RESROOM", trx);
        
        if (!noReservasi || !noResRoom) {
            throw new Error("Gagal membuat nomor transaksi reservasi");
        }

        // c. Insert trx_reservation
        const tNow = formatDateSystem();
        await trx("trx_reservation").insert({
            kode_cabang: oPayload.kode_cabang,
            kode_reservasi: noReservasi,
            kode_guest: oPayload.kode_guest,
            check_in_date: formatDateSystem(checkinDate, "yyyy-MM-dd"),
            check_out_date: formatDateSystem(checkoutDate, "yyyy-MM-dd"),
            deposit_amount: oPayload.deposit_amount,
            status: "reserved", // akan di-update oleh processCheckIn
            source_channel: "walk_in",
            booking_type: "walk_in",
            created_by: userId,
            created_at: tNow
        });

        // d. Insert trx_reservation_room
        await trx("trx_reservation_room").insert({
            kode_reservasi_room: noResRoom,
            kode_reservation: noReservasi,
            kode_tipe_kamar: oPayload.kode_tipe_kamar,
            kode_rate_plan: oPayload.kode_rate_plan,
            kode_kamar: oPayload.kode_kamar,
            rate_per_night: ratePerNight,
            nights: computedNights,
            status: "booked", // akan di-update oleh processCheckIn
            created_by: userId,
            created_at: tNow
        });

        // e. Proses Check-in
        const checkinData = await processCheckIn({
            kode_reservasi_room: noResRoom,
            trx: trx,
            userId: userId,
            kode_kamar_manual: oPayload.kode_kamar
        });

        // f. Insert trx_payment (Deposit)
        if (oPayload.deposit_amount > 0) {
            const noPayment = await generateSequence("FMT-PAYMENT", trx);
            if (!noPayment) throw new Error("Gagal membuat nomor transaksi deposit");

            await trx("trx_payment").insert({
                kode_payment: noPayment,
                kode_folio: checkinData.kode_folio,
                payment_method: oPayload.payment_method,
                amount: oPayload.deposit_amount,
                kode_cashier_shift: oPayload.kode_cashier_shift,
                received_by: userId,
                paid_at: tNow,
                created_by: userId,
                created_at: tNow
            });
        }

        reservationData = {
            kode_reservasi: noReservasi,
            kode_reservasi_room: noResRoom,
            kode_folio: checkinData.kode_folio,
            kode_checkin: checkinData.kode_checkin,
            nights: checkinData.nights,
            total_charge: checkinData.total_charge
        };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Proses walk-in check-in berhasil",
      datetime: formatDateSystem(),
      data: reservationData
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: error.message || "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "reservasi/walk_in/walk_in_submit.js",
      func: "submit",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
