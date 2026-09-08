/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file reservation_create.js
 * @description API endpoint untuk membuat reservasi di muka (tanpa langsung check-in)
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-04
 * @version 1.0.0
 */

import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { hitungHargaKamar } from "../../components/tools/pricing_helper.js";
import { hitungKetersediaanTipeKamar } from "../../components/tools/availability_helper.js";

import express from "express";

const router = express.Router();

const schema = Joi.object({
    kode_cabang: Joi.string().required(),
    kode_guest: Joi.string().required(),
    check_in_date: Joi.date().iso().required(),
    check_out_date: Joi.date().iso().greater(Joi.ref('check_in_date')).required(),
    kode_tipe_kamar: Joi.string().required(),
    kode_rate_plan: Joi.string().required(),
    deposit_amount: Joi.number().min(0).default(0),
    payment_method: Joi.string().when('deposit_amount', {
        is: Joi.number().greater(0),
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, "")
    }),
    kode_cashier_shift: Joi.string().when('deposit_amount', {
        is: Joi.number().greater(0),
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, "")
    })
});

router.post("/", async (req, res) => {
    const db = DB;
    try {
        const oPayload = req.body;
        const { error } = schema.validate(oPayload, { allowUnknown: true });
        if (error) {
            return res.status(400).json({
                status: status.GAGAL,
                message: error.details[0].message,
                datetime: formatDateSystem()
            });
        }

        const userId = req?.auth?.user_id || null; 

        // 1. Validasi Guest & Cabang
        const guest = await db('mst_guest').where('kode_tamu', oPayload.kode_guest).whereNull('deleted_at').first();
        if (!guest) throw new Error("Data tamu tidak valid");

        // 2. Cek Blacklist
        if (guest.is_blacklisted) {
            throw new Error(`Tamu masuk dalam daftar blacklist. Alasan: ${guest.blacklist_reason || 'Tidak ada alasan.'}`);
        }

        const cin = new Date(oPayload.check_in_date);
        const cout = new Date(oPayload.check_out_date);
        const nights = Math.max(1, Math.round((cout - cin) / (1000 * 60 * 60 * 24)));

        const result = await db.transaction(async (trx) => {
            // Hitung harga
            const rateInfo = await hitungHargaKamar({
                kode_tipe_kamar: oPayload.kode_tipe_kamar,
                kode_rate_plan: oPayload.kode_rate_plan,
                tanggal: cin
            }, trx);
            
            const ratePerNight = rateInfo.price;

            // Pastikan masih ada kamar tersedia
            const checkinDateStr = formatDateSystem(cin, "yyyy-MM-dd");
            const checkoutDateStr = formatDateSystem(cout, "yyyy-MM-dd");
            
            const { available_count } = await hitungKetersediaanTipeKamar({
                kode_cabang: oPayload.kode_cabang,
                kode_tipe_kamar: oPayload.kode_tipe_kamar,
                check_in_date: cin,
                check_out_date: cout
            }, trx);

            if (available_count <= 0) {
                throw new Error("Tipe kamar ini sudah penuh pada rentang tanggal tersebut.");
            }

            // Generate ID Reservasi
            const noReservasi = await generateSequence("FMT-RESERVASI", trx);
            const noResRoom = await generateSequence("FMT-RESROOM", trx);
            if (!noReservasi || !noResRoom) {
                throw new Error("Gagal membuat nomor transaksi reservasi");
            }

            const tNow = formatDateSystem();
            const resStatus = oPayload.deposit_amount > 0 ? "confirmed" : "reserved";

            // Insert Reservasi
            await trx("trx_reservation").insert({
                kode_cabang: oPayload.kode_cabang,
                kode_reservasi: noReservasi,
                kode_guest: oPayload.kode_guest,
                check_in_date: checkinDateStr,
                check_out_date: checkoutDateStr,
                deposit_amount: oPayload.deposit_amount,
                status: resStatus,
                source_channel: "walk_in", // atau 'phone', 'website'
                booking_type: "individual",
                created_by: userId,
                created_at: tNow
            });

            // Insert Reservation Room
            await trx("trx_reservation_room").insert({
                kode_reservasi_room: noResRoom,
                kode_reservation: noReservasi,
                kode_tipe_kamar: oPayload.kode_tipe_kamar,
                kode_rate_plan: oPayload.kode_rate_plan,
                kode_kamar: null, // Belum di-assign
                rate_per_night: ratePerNight,
                nights: nights,
                status: "booked",
                created_by: userId,
                created_at: tNow
            });

            // Deposit payment handling akan diselesaikan saat check-in
            // Karena tidak ada folio yang terbuka saat ini, kita hanya catat deposit_amount di trx_reservation
            // Saat check-in, baru akan dibuatkan folio dan trx_payment.

            return {
                kode_reservasi: noReservasi,
                kode_reservasi_room: noResRoom,
                status: resStatus
            };
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: "Reservasi berhasil dibuat",
            datetime: formatDateSystem(),
            data: result
        });
    } catch (e) {
        return res.status(500).json({
            status: status.GAGAL,
            message: e.message,
            datetime: formatDateSystem()
        });
    }
});

export default router;
