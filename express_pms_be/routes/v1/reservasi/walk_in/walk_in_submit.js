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
import { Logging, validatePayload } from "../../components/tools/servertool.js";
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
      kode_kamar: Joi.string().optional().allow(null, "").label("Kode Kamar"),
      kode_tipe_kamar: Joi.string().optional().allow(null, "").label("Kode Tipe Kamar"),
      kode_rate_plan: Joi.string().optional().allow(null, "").label("Kode Rate Plan"),
      rooms: Joi.array().items(Joi.object({
          kode_tipe_kamar: Joi.string().required().label("Kode Tipe Kamar"),
          kode_kamar: Joi.string().required().label("Kode Kamar"),
          kode_rate_plan: Joi.string().required().label("Kode Rate Plan"),
          kode_season: Joi.string().optional().allow(null, "").label("Kode Season")
      })).optional(),
      extra_facilities: Joi.array().optional().allow(null),
      special_request: Joi.string().optional().allow(null, "").label("Catatan Khusus"),
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

    // Normalisasi daftar kamar (support single room atau multi-room array)
    let roomsToProcess = [];
    if (Array.isArray(oPayload.rooms) && oPayload.rooms.length > 0) {
        roomsToProcess = oPayload.rooms;
    } else if (oPayload.kode_kamar && oPayload.kode_tipe_kamar && oPayload.kode_rate_plan) {
        roomsToProcess = [{
            kode_tipe_kamar: oPayload.kode_tipe_kamar,
            kode_kamar: oPayload.kode_kamar,
            kode_rate_plan: oPayload.kode_rate_plan,
            kode_season: oPayload.kode_season
        }];
    } else {
        return res.status(422).json({
            status: status.BAD_REQUEST,
            message: "Data kamar tidak lengkap. Silakan pilih minimal 1 kamar.",
            datetime: formatDateSystem()
        });
    }

    // 2. Hitung nights = hari antara check-in dan check-out
    const checkinDate = new Date(oPayload.check_in_date);
    const checkoutDate = new Date(oPayload.check_out_date);
    checkinDate.setHours(0,0,0,0);
    checkoutDate.setHours(0,0,0,0);

    const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
    let computedNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (computedNights < 1) computedNights = 1;

    // 3. Mulai Transaksi
    let reservationData = null;

    await DB.transaction(async (trx) => {
        const isGroup = roomsToProcess.length > 1;
        const bookingType = isGroup ? "group" : "walk_in";
        const groupCode = isGroup ? `GRP-${Date.now().toString(36).toUpperCase()}` : null;

        const noReservasi = await generateSequence("FMT-RESERVASI", trx);
        if (!noReservasi) throw new Error("Gagal membuat nomor transaksi reservasi");

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
            booking_type: bookingType,
            group_code: groupCode,
            special_request: oPayload.special_request || null,
            created_by: userId,
            created_at: tNow
        });

        let lastFolioCode = null;
        const processedRooms = [];

        for (const rm of roomsToProcess) {
            // Validasi ketersediaan kamar
            const ketersediaan = await hitungKetersediaanTipeKamar({
                kode_cabang: oPayload.kode_cabang,
                kode_tipe_kamar: rm.kode_tipe_kamar,
                check_in_date: checkinDate,
                check_out_date: checkoutDate
            }, trx);

            if (ketersediaan.available_count <= 0) {
                throw new Error(`Kamar pada tipe ${rm.kode_tipe_kamar} sudah penuh atau belum siap.`);
            }

            if (rm.kode_kamar && ketersediaan.terpakai_kamar_ids.includes(rm.kode_kamar)) {
                throw new Error(`Kamar fisik ${rm.kode_kamar} sedang tidak tersedia atau belum bersih.`);
            }

            // Hitung harga
            const rateInfo = await hitungHargaKamar({
                kode_tipe_kamar: rm.kode_tipe_kamar,
                kode_rate_plan: rm.kode_rate_plan,
                kode_season: rm.kode_season || oPayload.kode_season,
                tanggal: oPayload.check_in_date
            }, trx);

            const ratePerNight = rateInfo.price;
            const noResRoom = await generateSequence("FMT-RESROOM", trx);
            if (!noResRoom) throw new Error("Gagal membuat nomor reservasi kamar");

            await trx("trx_reservation_room").insert({
                kode_reservasi_room: noResRoom,
                kode_reservation: noReservasi,
                kode_tipe_kamar: rm.kode_tipe_kamar,
                kode_rate_plan: rm.kode_rate_plan,
                kode_kamar: rm.kode_kamar,
                rate_per_night: ratePerNight,
                nights: computedNights,
                status: "booked", // akan di-update oleh processCheckIn
                created_by: userId,
                created_at: tNow
            });

            // Proses check-in untuk kamar ini
            const checkinData = await processCheckIn({
                kode_reservasi_room: noResRoom,
                trx: trx,
                userId: userId,
                kode_kamar_manual: rm.kode_kamar
            });

            lastFolioCode = checkinData.kode_folio;
            processedRooms.push({
                kode_reservasi_room: noResRoom,
                kode_kamar: rm.kode_kamar,
                kode_checkin: checkinData.kode_checkin,
                rate_per_night: ratePerNight,
                total_charge: checkinData.total_charge
            });
        }

        // Insert trx_folio_charge untuk fasilitas tambahan jika ada
        if (Array.isArray(oPayload.extra_facilities) && oPayload.extra_facilities.length > 0 && lastFolioCode) {
            for (const ef of oPayload.extra_facilities) {
                const qty = Number(ef.qty) || 0;
                const subtotal = Number(ef.subtotal) || (Number(ef.harga) * qty);
                if (subtotal > 0) {
                    const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
                    const chargeType = ef.id === 'laundry' ? 'laundry' 
                                     : ef.id === 'sarapan' ? 'restaurant' 
                                     : 'other';
                    await trx("trx_folio_charge").insert({
                        kode_folio_charge: noFolioCharge,
                        kode_folio: lastFolioCode,
                        charge_type: chargeType,
                        description: `Fasilitas: ${ef.nama}${qty > 1 ? ` (${qty}x)` : ''}`,
                        qty: qty || 1,
                        unit_price: ef.harga,
                        amount: subtotal,
                        ref_source_type: "trx_reservation",
                        kode_ref_source: noReservasi,
                        posted_by: userId,
                        posted_at: tNow,
                        created_by: userId,
                        created_at: tNow,
                        is_active: 1
                    });
                }
            }
        }

        // 4. Rekonsiliasi total folio, pajak, dan service charge secara menyeluruh
        const allCharges = await trx("trx_folio_charge").where("kode_folio", lastFolioCode).where("is_active", 1);
        const totalSubtotal = allCharges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

        const activeTaxes = await trx("mst_tax")
            .where("kode_cabang", oPayload.kode_cabang)
            .where("is_active", 1)
            .whereNull("deleted_at");

        let totalTaxAmount = 0;
        let totalServiceCharge = 0;
        activeTaxes.forEach((t) => {
            const pct = parseFloat(t.percentage) || 0;
            const nominal = Math.round(totalSubtotal * (pct / 100));
            if (t.tax_type === "service_charge") totalServiceCharge += nominal;
            else totalTaxAmount += nominal;
        });

        const finalGrandTotal = totalSubtotal + totalTaxAmount + totalServiceCharge;

        await trx("trx_folio")
            .where("kode_folio", lastFolioCode)
            .update({
                subtotal: totalSubtotal,
                tax_amount: totalTaxAmount,
                service_charge_amount: totalServiceCharge,
                grand_total: finalGrandTotal,
                updated_by: userId,
                updated_at: tNow
            });

        // Insert trx_payment (Deposit / Pelunasan) jika ada
        const paymentAmount = parseFloat(oPayload.deposit_amount || oPayload.payment_amount || 0);
        if (paymentAmount > 0 && lastFolioCode) {
            const noPayment = await generateSequence("FMT-PAYMENT", trx);
            if (!noPayment) throw new Error("Gagal membuat nomor transaksi pembayaran");

            await trx("trx_payment").insert({
                kode_payment: noPayment,
                kode_folio: lastFolioCode,
                payment_method: oPayload.payment_method || 'cash',
                amount: paymentAmount,
                kode_cashier_shift: oPayload.kode_cashier_shift || null,
                reference_no: oPayload.reference_no || null,
                received_by: userId,
                paid_at: tNow,
                created_by: userId,
                created_at: tNow
            });
        }

        const finalBalance = finalGrandTotal - paymentAmount;
        const isSettled = finalBalance <= 0;

        // Inisialisasi dokumen invoice unik di trx_fiscal_document
        const invoiceNumber = await generateSequence("FMT-INVOICE", trx);
        const fiscalDocCode = `FDC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        await trx("trx_fiscal_document").insert({
            kode_fiscal_document: fiscalDocCode,
            kode_cabang: oPayload.kode_cabang,
            kode_folio: lastFolioCode,
            doc_type: "invoice",
            doc_number: invoiceNumber,
            amount: finalGrandTotal,
            issued_by: userId,
            issued_at: tNow,
            created_by: userId,
            created_at: tNow,
            is_active: 1
        });

        reservationData = {
            kode_reservasi: noReservasi,
            booking_type: bookingType,
            group_code: groupCode,
            kode_folio: lastFolioCode,
            invoice_number: invoiceNumber,
            nights: computedNights,
            subtotal: totalSubtotal,
            tax_amount: totalTaxAmount,
            service_charge_amount: totalServiceCharge,
            grand_total: finalGrandTotal,
            total_paid: paymentAmount,
            balance: finalBalance,
            is_settled: isSettled,
            payment_status: isSettled ? "paid" : (paymentAmount > 0 ? "partially_paid" : "unpaid"),
            payment_status_label: isSettled ? "Lunas" : (paymentAmount > 0 ? "Dibayar Sebagian" : "Belum Dibayar"),
            rooms: processedRooms
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
