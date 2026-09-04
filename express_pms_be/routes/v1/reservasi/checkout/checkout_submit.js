/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file checkout_submit.js
 * @description Submit checkout proses
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-03)
 * @version 1.0.1
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const user_id = req?.auth?.user_id || 0;

  try {
    if (!oPayload || Object.keys(oPayload).length < 1)
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Invalid request body",
        datetime: formatDateSystem(),
      });

    const cValidation = await validatePayload(
      {
        kode_reservasi_room: Joi.string().required().label("Kode Reservasi Room"),
        payment: Joi.array()
          .items(
            Joi.object({
              payment_method: Joi.string().required(),
              amount: Joi.number().min(1).required(),
              kode_cashier_shift: Joi.string().when('payment_method', {
                is: 'cash',
                then: Joi.required(),
                otherwise: Joi.optional()
              }),
              reference_no: Joi.string().optional().allow(''),
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

    if (cValidation)
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });

    let cUniqueCode = "";
    await DB.transaction(async (trx) => {
      // 1. Ambil trx_reservation_room + trx_folio terkait
      const resRoom = await trx("trx_reservation_room")
        .where("kode_reservasi_room", oPayload.kode_reservasi_room)
        .first();

      if (!resRoom) throw new Error("Data kamar reservasi tidak ditemukan");
      if (resRoom.status === "checked_out") throw new Error("Kamar ini sudah checkout sebelumnya");

      const folio = await trx("trx_folio")
        .where("kode_reservation", resRoom.kode_reservation)
        .first();

      if (!folio) throw new Error("Data folio tidak ditemukan");
      if (folio.status === "closed") throw new Error("Folio sudah ditutup");

      // 2. Hitung ulang tax_amount dan service_charge_amount dari mst_tax
      const activeTaxes = await trx("mst_tax")
        .where("kode_cabang", folio.kode_cabang)
        .andWhere("is_active", 1);

      let totalTaxAmount = 0;
      let totalServiceCharge = 0;
      let calculatedSubtotal = parseFloat(folio.subtotal) || 0;

      activeTaxes.forEach(tax => {
          let nominal = 0;
          if (tax.is_compounding) {
             // asumsikan service charge compounding ke tax, dll. Tapi untuk simplifikasi kita hitung dari subtotal base:
             nominal = calculatedSubtotal * (parseFloat(tax.percentage) / 100);
          } else {
             nominal = calculatedSubtotal * (parseFloat(tax.percentage) / 100);
          }

          if (tax.tax_type === 'tax') totalTaxAmount += nominal;
          if (tax.tax_type === 'service_charge') totalServiceCharge += nominal;
      });

      const grandTotal = calculatedSubtotal + totalTaxAmount + totalServiceCharge;

      // 3. Hitung total yang sudah dibayar
      const currentPayments = await trx("trx_payment")
        .where("kode_folio", folio.kode_folio)
        .sum("amount as total_paid")
        .first();
      
      let totalPaid = parseFloat(currentPayments.total_paid || 0);

      // 4. Insert new payments
      if (oPayload.payment && oPayload.payment.length > 0) {
        for (const pay of oPayload.payment) {
           if (pay.payment_method === 'cash') {
              // Cek shift kasir
              const shift = await trx("trx_cashier_shift")
                .where("kode_cashier_shift", pay.kode_cashier_shift)
                .first();
              
              if (!shift || shift.status !== 'open') {
                 throw new Error(`Shift kasir ${pay.kode_cashier_shift} tidak aktif/tidak valid`);
              }
           }

           const payCode = await generateSequence("FMT-PAY", trx);
           await trx("trx_payment").insert({
               kode_payment: payCode,
               kode_folio: folio.kode_folio,
               payment_method: pay.payment_method,
               amount: pay.amount,
               reference_no: pay.reference_no,
               kode_cashier_shift: pay.kode_cashier_shift,
               received_by: user_id,
               paid_at: formatDateSystem(),
               created_by: user_id,
               created_at: formatDateSystem()
           });

           totalPaid += parseFloat(pay.amount);
        }
      }

      // 5. Hitung outstanding
      const outstanding = grandTotal - totalPaid;

      if (outstanding > 0 && folio.folio_owner_type === 'guest') {
          throw new Error(`Masih ada tagihan belum lunas: Rp ${outstanding}`);
      }

      // 6. Row-lock mst_kamar (.forUpdate())
      const mstKamar = await trx("mst_kamar")
        .where("kode_kamar", resRoom.kode_kamar)
        .forUpdate()
        .first();
        
      if (mstKamar) {
          const oldOccupancy = mstKamar.occupancy_status;
          await trx("mst_kamar")
            .where("kode_kamar", resRoom.kode_kamar)
            .update({
                occupancy_status: 'vacant',
                housekeeping_status: 'dirty',
                updated_at: formatDateSystem(),
                updated_by: user_id
            });

          // 7. Insert trx_room_status_log
          const logCode = await generateSequence("FMT-RSL", trx);
          await trx("trx_room_status_log").insert({
              kode_room_status_log: logCode,
              kode_kamar: resRoom.kode_kamar,
              status_from: oldOccupancy,
              status_to: 'vacant',
              changed_by: user_id,
              changed_at: formatDateSystem()
          });
      }

      // 8. Insert trx_housekeeping_task otomatis
      const hkTaskCode = await generateSequence("FMT-HKT", trx);
      await trx("trx_housekeeping_task").insert({
          kode_housekeeping_task: hkTaskCode,
          kode_cabang: folio.kode_cabang,
          kode_kamar: resRoom.kode_kamar,
          task_type: 'cleaning',
          priority: 'normal',
          status: 'assigned',
          created_by: user_id,
          created_at: formatDateSystem()
      });

      // 9. Insert trx_checkout
      cUniqueCode = await generateSequence("FMT-CO", trx);
      await trx("trx_checkout").insert({
          kode_checkout: cUniqueCode,
          kode_reservation_room: oPayload.kode_reservasi_room,
          late_checkout: 0, // hardcoded for simplification
          grand_total: grandTotal,
          checkout_by: user_id,
          checkout_at: formatDateSystem(),
          created_by: user_id,
          created_at: formatDateSystem()
      });

      // 10. Update trx_reservation_room.status='checked_out'
      await trx("trx_reservation_room")
        .where("kode_reservasi_room", oPayload.kode_reservasi_room)
        .update({
            status: 'checked_out',
            updated_by: user_id,
            updated_at: formatDateSystem()
        });

      // 11. Update trx_folio
      await trx("trx_folio")
        .where("kode_folio", folio.kode_folio)
        .update({
            status: 'closed',
            tax_amount: totalTaxAmount,
            service_charge_amount: totalServiceCharge,
            grand_total: grandTotal,
            closed_at: formatDateSystem(),
            updated_by: user_id,
            updated_at: formatDateSystem()
        });

      // 12. Cek trx_reservation apakah semua checked_out
      const allRoomsInRes = await trx("trx_reservation_room")
        .where("kode_reservation", resRoom.kode_reservation);
        
      const allCheckedOut = allRoomsInRes.every(r => r.status === 'checked_out' || r.kode_reservation_room === resRoom.kode_reservation_room); // including the one we just checked out
      
      if (allCheckedOut) {
          await trx("trx_reservation")
            .where("kode_reservasi", resRoom.kode_reservation)
            .update({
                status: 'checked_out',
                updated_at: formatDateSystem(),
                updated_by: user_id
            });
      }
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Checkout berhasil",
      datetime: formatDateSystem(),
      data: { kode_checkout: cUniqueCode },
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    console.error("CHECKOUT ERROR:", error);
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SUBMIT CHECKOUT",
      TableName: "trx_checkout",
      file: "checkout_submit.js",
      username: username,
    });
    
    // Kirim pesan error yang user-friendly (karena di lempar via `throw new Error()`)
    const friendlyErrors = [
      "Data kamar reservasi tidak ditemukan",
      "Kamar ini sudah checkout sebelumnya",
      "Data folio tidak ditemukan",
      "Folio sudah ditutup",
      "Masih ada tagihan belum lunas:"
    ];

    const isFriendly = friendlyErrors.some(fe => error.message.includes(fe)) || error.message.includes("Shift kasir");

    return res.status(500).json({
      status: status.GAGAL,
      message: isFriendly ? error.message : "Terjadi kesalahan sistem.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
