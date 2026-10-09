/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file reschedule_submit.js
 * @description API endpoint untuk mengeksekusi perubahan tanggal reservasi & rekonsiliasi folio
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
  new_check_out_date: Joi.date().iso().greater(Joi.ref("new_check_in_date")).required().label("Tanggal Check-out Baru"),
  notes: Joi.string().optional().allow(null, "").label("Catatan Perubahan"),
  room_assignments: Joi.array().items(
    Joi.object({
      kode_reservasi_room: Joi.string().required(),
      kode_kamar: Joi.string().allow(null, "").optional()
    })
  ).optional().label("Penetapan Kamar")
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

    const cin = new Date(oPayload.new_check_in_date);
    const cout = new Date(oPayload.new_check_out_date);
    const newNights = Math.max(1, Math.round((cout - cin) / (1000 * 60 * 60 * 24)));
    const checkinDateStr = formatDateSystem(cin, "yyyy-MM-dd");
    const checkoutDateStr = formatDateSystem(cout, "yyyy-MM-dd");
    const tNow = formatDateSystem();

    const result = await db.transaction(async (trx) => {
      // 1. Ambil data reservasi
      const reservation = await trx("trx_reservation")
        .where("kode_reservasi", oPayload.kode_reservasi)
        .whereNull("deleted_at")
        .forUpdate()
        .first();

      if (!reservation) {
        throw new Error(`Reservasi '${oPayload.kode_reservasi}' tidak ditemukan.`);
      }

      // Validasi branch scope (RBAC)
      assertBranchScope(req, reservation.kode_cabang);

      if (["checked_in", "checked_out", "cancelled"].includes(reservation.status)) {
        throw new Error(`Reservasi tidak dapat diubah tanggal karena status saat ini: '${reservation.status}'.`);
      }

      // 2. Ambil seluruh kamar terkait
      const resRooms = await trx("trx_reservation_room")
        .where("kode_reservation", oPayload.kode_reservasi)
        .whereNull("deleted_at")
        .where("is_active", 1);

      if (!resRooms || resRooms.length === 0) {
        throw new Error("Data rincian kamar reservasi tidak ditemukan.");
      }

      // 3. Validasi ketersediaan dan kalkulasi harga baru
      for (const rm of resRooms) {
        const availCheck = await hitungKetersediaanTipeKamar({
          kode_cabang: reservation.kode_cabang,
          kode_tipe_kamar: rm.kode_tipe_kamar,
          check_in_date: cin,
          check_out_date: cout,
          exclude_kode_reservation: oPayload.kode_reservasi
        }, trx);

        if (availCheck.available_count <= 0) {
          throw new Error(`Tipe kamar ${rm.kode_tipe_kamar} sudah penuh pada tanggal ${checkinDateStr} s/d ${checkoutDateStr}.`);
        }

        let newPricePerNight = parseFloat(rm.rate_per_night || 0);
        try {
          const rateCalc = await hitungHargaKamar({
            kode_tipe_kamar: rm.kode_tipe_kamar,
            kode_rate_plan: rm.kode_rate_plan,
            tanggal: cin
          }, trx);
          if (rateCalc?.price) {
            newPricePerNight = parseFloat(rateCalc.price);
          }
        } catch (eRate) {
          // Fallback harga lama jika rate plan tidak berubah
        }

        // Cek penugasan kamar fisik baru jika dikirimkan oleh klien
        const requestedAssignment = (oPayload.room_assignments || []).find(
          (ra) => ra.kode_reservasi_room === rm.kode_reservasi_room
        );

        let assignedRoom = rm.kode_kamar;

        if (requestedAssignment !== undefined) {
          if (requestedAssignment.kode_kamar) {
            // Validasi apakah kamar yang dipilih sedang terisi / bentrok
            if (availCheck.terpakai_kamar_ids && availCheck.terpakai_kamar_ids.includes(requestedAssignment.kode_kamar)) {
              throw new Error(`Kamar fisik yang dipilih sudah tidak tersedia pada rentang tanggal baru.`);
            }
            assignedRoom = requestedAssignment.kode_kamar;
          } else {
            // Pengguna memilih untuk unassign kamar agar dialokasikan saat check-in
            assignedRoom = null;
          }
        } else {
          // Fallback bawaan: jika kamar fisik lama bentrok, reset jadi null (akan di-assign ulang saat checkin)
          if (assignedRoom && availCheck.terpakai_kamar_ids && availCheck.terpakai_kamar_ids.includes(assignedRoom)) {
            assignedRoom = null;
          }
        }

        // Update kamar reservasi
        await trx("trx_reservation_room")
          .where("kode_reservasi_room", rm.kode_reservasi_room)
          .update({
            nights: newNights,
            rate_per_night: newPricePerNight,
            kode_kamar: assignedRoom,
            updated_by: userId,
            updated_at: tNow
          });

        // Update charge kamar di trx_folio_charge jika ada
        const newRoomSubtotal = newPricePerNight * newNights;
        await trx("trx_folio_charge")
          .where("ref_source_type", "trx_reservation_room")
          .where("kode_ref_source", rm.kode_reservasi_room)
          .where("is_active", 1)
          .update({
            description: `Sewa Kamar (${newNights} Malam)`,
            qty: newNights,
            unit_price: newPricePerNight,
            amount: newRoomSubtotal,
            posted_by: userId,
            posted_at: tNow
          });
      }

      // 4. Update tanggal di header reservasi
      let noteUpdate = reservation.special_request || "";
      const reschLabel = `Reschedule (${formatDateSystem(reservation.check_in_date, "yyyy-MM-dd")} -> ${checkinDateStr})${oPayload.notes ? `: ${oPayload.notes}` : ''}`;
      noteUpdate = noteUpdate ? `${noteUpdate} | ${reschLabel}` : reschLabel;

      await trx("trx_reservation")
        .where("kode_reservasi", oPayload.kode_reservasi)
        .update({
          check_in_date: checkinDateStr,
          check_out_date: checkoutDateStr,
          special_request: noteUpdate || null,
          updated_by: userId,
          updated_at: tNow
        });

      // 5. Rekonsiliasi Folio
      const folio = await trx("trx_folio")
        .where("kode_reservation", oPayload.kode_reservasi)
        .where("status", "open")
        .first();

      if (folio) {
        // Ambil semua charges aktif
        const allCharges = await trx("trx_folio_charge")
          .where("kode_folio", folio.kode_folio)
          .where("is_active", 1);

        const newSubtotal = allCharges.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);

        // Hitung Pajak & Service Charge Aktif
        const activeTaxes = await trx("mst_tax")
          .where(function() {
            this.where("kode_cabang", reservation.kode_cabang).orWhereNull("kode_cabang");
          })
          .where("is_active", 1)
          .whereNull("deleted_at");

        let totalTaxAmount = 0;
        let totalServiceCharge = 0;
        activeTaxes.forEach((t) => {
          const pct = parseFloat(t.percentage) || 0;
          const nominal = Math.round(newSubtotal * (pct / 100));
          if (t.tax_type === "service_charge") {
            totalServiceCharge += nominal;
          } else {
            totalTaxAmount += nominal;
          }
        });

        const newGrandTotal = newSubtotal + totalTaxAmount + totalServiceCharge;

        await trx("trx_folio")
          .where("kode_folio", folio.kode_folio)
          .update({
            subtotal: newSubtotal,
            tax_amount: totalTaxAmount,
            service_charge_amount: totalServiceCharge,
            grand_total: newGrandTotal,
            updated_by: userId,
            updated_at: tNow
          });
      }

      return {
        kode_reservasi: oPayload.kode_reservasi,
        new_check_in_date: checkinDateStr,
        new_check_out_date: checkoutDateStr,
        new_nights: newNights
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Tanggal reservasi berhasil diperbarui menjadi ${result.new_check_in_date} s/d ${result.new_check_out_date} (${result.new_nights} Malam)`,
      datetime: formatDateSystem(),
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memperbarui tanggal reservasi",
      datetime: formatDateSystem()
    });
  }
});

export default router;
