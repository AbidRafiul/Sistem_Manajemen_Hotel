/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file reschedule_check.js
 * @description API endpoint untuk simulasi ubah tanggal reservasi (cek ketersediaan & hitung selisih harga dinamis)
 * @author Antigravity
 * @created 2026-10-08
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { hitungHargaKamar } from "../../components/tools/pricing_helper.js";
import { hitungKetersediaanTipeKamar } from "../../components/tools/availability_helper.js";
import { assertBranchScope } from "../../components/tools/scope_helper.js";

const router = express.Router();

const schema = Joi.object({
  kode_reservasi: Joi.string().required().label("Kode Reservasi"),
  new_check_in_date: Joi.date().iso().required().label("Tanggal Check-in Baru"),
  new_check_out_date: Joi.date().iso().greater(Joi.ref("new_check_in_date")).required().label("Tanggal Check-out Baru")
});

router.post("/", async (req, res) => {
  const db = DB;
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

    // 1. Ambil data reservasi
    const reservation = await db("trx_reservation as r")
      .join("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .select(
        "r.*",
        "g.full_name as guest_name",
        "g.phone as guest_phone"
      )
      .where("r.kode_reservasi", oPayload.kode_reservasi)
      .whereNull("r.deleted_at")
      .first();

    if (!reservation) {
      return res.status(404).json({
        status: status.GAGAL,
        message: `Reservasi '${oPayload.kode_reservasi}' tidak ditemukan.`,
        datetime: formatDateSystem()
      });
    }

    // Validasi otorisasi branch scope (RBAC)
    assertBranchScope(req, reservation.kode_cabang);

    if (["checked_in", "checked_out", "cancelled"].includes(reservation.status)) {
      return res.status(400).json({
        status: status.GAGAL,
        message: `Reservasi tidak dapat diubah tanggal karena berstatus '${reservation.status}'.`,
        datetime: formatDateSystem()
      });
    }

    // 2. Ambil seluruh kamar terkait reservasi
    const resRooms = await db("trx_reservation_room as rr")
      .join("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .select(
        "rr.*",
        "tk.nama_tipe as tipe_kamar_name",
        "mk.nomor_kamar"
      )
      .where("rr.kode_reservation", oPayload.kode_reservasi)
      .whereNull("rr.deleted_at")
      .where("rr.is_active", 1);

    if (!resRooms || resRooms.length === 0) {
      return res.status(400).json({
        status: status.GAGAL,
        message: "Data rincian kamar reservasi tidak ditemukan.",
        datetime: formatDateSystem()
      });
    }

    const cin = new Date(oPayload.new_check_in_date);
    const cout = new Date(oPayload.new_check_out_date);
    const newNights = Math.max(1, Math.round((cout - cin) / (1000 * 60 * 60 * 24)));

    let isAvailableAll = true;
    let oldGrandRoomCharge = 0;
    let newGrandRoomCharge = 0;
    const roomSimulation = [];

    // 3. Simulasi perhitungan setiap kamar pada tanggal baru
    for (const rm of resRooms) {
      const oldRoomSubtotal = parseFloat(rm.rate_per_night || 0) * (parseInt(rm.nights, 10) || 1);
      oldGrandRoomCharge += oldRoomSubtotal;

      // Cek ketersediaan tipe kamar
      const availCheck = await hitungKetersediaanTipeKamar({
        kode_cabang: reservation.kode_cabang,
        kode_tipe_kamar: rm.kode_tipe_kamar,
        check_in_date: cin,
        check_out_date: cout,
        exclude_kode_reservation: oPayload.kode_reservasi
      }, db);

      const isRoomTypeAvailable = availCheck.available_count > 0;
      if (!isRoomTypeAvailable) {
        isAvailableAll = false;
      }

      // Hitung harga dinamis baru untuk tanggal check-in baru
      let newPricePerNight = parseFloat(rm.rate_per_night || 0);
      try {
        const rateCalc = await hitungHargaKamar({
          kode_tipe_kamar: rm.kode_tipe_kamar,
          kode_rate_plan: rm.kode_rate_plan,
          tanggal: cin
        }, db);
        if (rateCalc?.price) {
          newPricePerNight = parseFloat(rateCalc.price);
        }
      } catch (eRate) {
        // Fallback gunakan tarif lama jika lookup paket rate plan tidak berubah
      }

      const newRoomSubtotal = newPricePerNight * newNights;
      newGrandRoomCharge += newRoomSubtotal;

      const isRoomConflict = Boolean(
        rm.kode_kamar &&
        availCheck.terpakai_kamar_ids &&
        availCheck.terpakai_kamar_ids.includes(rm.kode_kamar)
      );

      const selectableRooms = (availCheck.all_rooms || [])
        .filter((r) => r.is_selectable)
        .map((r) => ({
          kode_kamar: r.kode_kamar,
          nomor_kamar: r.nomor_kamar
        }));

      roomSimulation.push({
        kode_reservasi_room: rm.kode_reservasi_room,
        kode_tipe_kamar: rm.kode_tipe_kamar,
        tipe_kamar_name: rm.tipe_kamar_name,
        kode_kamar: rm.kode_kamar,
        nomor_kamar: rm.nomor_kamar,
        old_rate_per_night: parseFloat(rm.rate_per_night || 0),
        new_rate_per_night: newPricePerNight,
        old_subtotal: oldRoomSubtotal,
        new_subtotal: newRoomSubtotal,
        is_available: isRoomTypeAvailable,
        available_quota: availCheck.available_count,
        has_assigned_room: Boolean(rm.kode_kamar),
        is_room_conflict: isRoomConflict,
        available_rooms: selectableRooms
      });
    }

    // Rekomendasi tipe kamar alternatif jika kuota kamar yang dipesan penuh
    let alternativeTypes = [];
    if (!isAvailableAll) {
      try {
        const bookedTypes = resRooms.map((r) => r.kode_tipe_kamar);
        const otherTypes = await db("mst_tipe_kamar")
          .where("kode_cabang", reservation.kode_cabang)
          .where("is_active", 1)
          .whereNull("deleted_at")
          .whereNotIn("kode_tipe_kamar", bookedTypes)
          .select("kode_tipe_kamar", "nama_tipe");

        for (const ot of otherTypes) {
          const altAvail = await hitungKetersediaanTipeKamar({
            kode_cabang: reservation.kode_cabang,
            kode_tipe_kamar: ot.kode_tipe_kamar,
            check_in_date: cin,
            check_out_date: cout,
            exclude_kode_reservation: oPayload.kode_reservasi
          }, db);

          if (altAvail.available_count > 0) {
            let altPrice = 0;
            try {
              const calc = await hitungHargaKamar({
                kode_tipe_kamar: ot.kode_tipe_kamar,
                tanggal: cin
              }, db);
              if (calc?.price) altPrice = parseFloat(calc.price);
            } catch (_) {}

            const baseOldRate = resRooms[0]?.rate_per_night ? parseFloat(resRooms[0].rate_per_night) : 0;
            alternativeTypes.push({
              kode_tipe_kamar: ot.kode_tipe_kamar,
              nama_tipe: ot.nama_tipe,
              available_quota: altAvail.available_count,
              rate_per_night: altPrice,
              diff_per_night: altPrice - baseOldRate
            });
          }
        }
      } catch (eAlt) {
        // Abaikan error pengecekan alternatif jika terjadi kendala query
      }
    }

    const diffAmount = newGrandRoomCharge - oldGrandRoomCharge;
    let statusDiff = "no_change";
    if (diffAmount > 0) statusDiff = "additional_charge"; // Tambahan bayar
    else if (diffAmount < 0) statusDiff = "refund_credit"; // Pengurangan tagihan

    return res.status(200).json({
      status: status.SUKSES,
      message: isAvailableAll 
        ? "Kamar tersedia pada rentang tanggal baru" 
        : "Sebagian tipe kamar tidak tersedia pada rentang tanggal baru",
      datetime: formatDateSystem(),
      data: {
        is_available: isAvailableAll,
        kode_reservasi: reservation.kode_reservasi,
        guest_name: reservation.guest_name,
        current_check_in_date: formatDateSystem(reservation.check_in_date, "yyyy-MM-dd"),
        current_check_out_date: formatDateSystem(reservation.check_out_date, "yyyy-MM-dd"),
        current_nights: resRooms[0]?.nights || 1,
        new_check_in_date: formatDateSystem(cin, "yyyy-MM-dd"),
        new_check_out_date: formatDateSystem(cout, "yyyy-MM-dd"),
        new_nights: newNights,
        old_total_room_charge: oldGrandRoomCharge,
        new_total_room_charge: newGrandRoomCharge,
        diff_amount: Math.abs(diffAmount),
        raw_diff: diffAmount,
        status_diff: statusDiff,
        deposit_amount: parseFloat(reservation.deposit_amount || 0),
        rooms: roomSimulation,
        alternative_types: alternativeTypes
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal melakukan pengecekan ubah tanggal",
      datetime: formatDateSystem()
    });
  }
});

export default router;
