/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file extend_check.js
 * @description Endpoint simulasi perpanjangan masa menginap (cek ketersediaan & hitung tarif dinamis)
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
import { hitungHargaKamar } from "../../components/tools/pricing_helper.js";
import { hitungKetersediaanTipeKamar } from "../../components/tools/availability_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        kode_reservasi_room: Joi.string().required().label("Kode Reservasi Kamar"),
        new_check_out_date: Joi.date().iso().required().label("Tanggal Check-out Baru")
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

    // 1. Ambil data reservasi kamar aktif
    const resRoom = await DB("trx_reservation_room as rr")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .join("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .join("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .select(
        "rr.*",
        "r.kode_cabang",
        "r.check_in_date",
        "r.check_out_date as current_check_out_date",
        "mk.nomor_kamar",
        "tk.nama_tipe as nama_tipe_kamar"
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
        message: `Tanggal check-out baru (${newCheckoutStr}) harus lebih lambat dari tanggal check-out saat ini (${curCheckoutStr})`,
        datetime: formatDateSystem()
      });
    }

    // 2. Cek apakah kamar fisik yang sama bentrok dengan reservasi lain di rentang tanggal perpanjangan
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

    const canExtendSameRoom = !conflictBooking;

    // 3. Cek ketersediaan tipe kamar secara umum pada rentang tanggal extend
    const availability = await hitungKetersediaanTipeKamar(
      {
        kode_cabang: resRoom.kode_cabang,
        kode_tipe_kamar: resRoom.kode_tipe_kamar,
        check_in_date: curCheckoutStr,
        check_out_date: newCheckoutStr
      },
      DB
    );

    // 4. Hitung harga kamar per malam untuk periode perpanjangan
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

    // Filter kamar lain yang tersedia jika kamar saat ini bentrok
    const alternativeRooms = (availability.available_rooms || []).filter(
      (rm) => rm.kode_kamar !== resRoom.kode_kamar
    );

    let infoMessage = "";
    if (canExtendSameRoom) {
      infoMessage = `Kamar ${resRoom.nomor_kamar} tersedia untuk diperpanjang selama ${additionalNights} malam.`;
    } else if (alternativeRooms.length > 0) {
      infoMessage = `Kamar ${resRoom.nomor_kamar} sudah memiliki reservasi lain pada tanggal tersebut. Tamu dapat memilih pindah kamar (Room Move) ke kamar yang tersedia.`;
    } else {
      infoMessage = `Seluruh kamar pada tipe ${resRoom.nama_tipe_kamar} sudah penuh pada tanggal tersebut.`;
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Simulasi perpanjang kamar berhasil",
      datetime: formatDateSystem(),
      data: {
        kode_reservasi_room: resRoom.kode_reservasi_room,
        kode_kamar: resRoom.kode_kamar,
        nomor_kamar: resRoom.nomor_kamar,
        nama_tipe_kamar: resRoom.nama_tipe_kamar,
        current_check_out_date: curCheckoutStr,
        new_check_out_date: newCheckoutStr,
        additional_nights: additionalNights,
        rate_per_night: ratePerNight,
        total_additional_charge: totalAdditionalCharge,
        can_extend_same_room: canExtendSameRoom,
        conflict_booking: conflictBooking
          ? {
              kode_reservation: conflictBooking.kode_reservation,
              check_in_date: conflictBooking.check_in_date,
              check_out_date: conflictBooking.check_out_date
            }
          : null,
        available_alternative_rooms: alternativeRooms,
        is_type_available: availability.available_count > 0,
        info_message: infoMessage
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "EXTEND STAY CHECK",
      TableName: "trx_reservation_room",
      file: "extend_check.js",
      username: username
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan sistem saat mengecek perpanjangan kamar.",
      datetime: formatDateSystem()
    });
  }
});

export default router;
