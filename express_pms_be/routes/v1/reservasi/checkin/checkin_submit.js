/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file checkin_submit.js
 * @description API endpoint untuk melakukan check-in dari reservasi yang sudah ada
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-04
 * @version 1.0.0
 */

import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { processCheckIn } from "../../components/tools/checkin_helper.js";

import express from "express";

const router = express.Router();

const schema = Joi.object({
    kode_reservasi_room: Joi.string().required(),
    kode_cashier_shift: Joi.string().optional().allow(null, ""), // untuk memasukkan deposit ke shift jika ada
    payment_method: Joi.string().optional().allow(null, "")
});

router.post("/", async (req, res) => {
    const db = DB;
    try {
        const oPayload = req.body;
        const { error } = schema.validate(oPayload);
        if (error) {
            return res.status(400).json({
                status: status.GAGAL,
                message: error.details[0].message,
                datetime: formatDateSystem()
            });
        }

        const userId = req?.auth?.user_id || null;

        const result = await db.transaction(async (trx) => {
            // 1. Validasi Reservasi Room
            const resRoom = await trx("trx_reservation_room as rr")
                .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
                .join("mst_guest as g", "r.kode_guest", "g.kode_tamu")
                .select(
                    "rr.*",
                    "r.status as res_status",
                    "r.deposit_amount",
                    "r.kode_cabang",
                    "g.is_blacklisted",
                    "g.blacklist_reason"
                )
                .where("rr.kode_reservasi_room", oPayload.kode_reservasi_room)
                .first();

            if (!resRoom) {
                throw new Error("Data reservasi tidak ditemukan");
            }

            if (resRoom.status === 'checked_in') {
                throw new Error("Kamar ini sudah di-check-in");
            }
            if (resRoom.res_status === 'cancelled' || resRoom.res_status === 'no_show') {
                throw new Error(`Kamar tidak bisa di-check-in karena status reservasi: ${resRoom.res_status}`);
            }

            // 2. Cek Blacklist
            if (resRoom.is_blacklisted) {
                throw new Error(`Tamu masuk dalam daftar blacklist. Alasan: ${resRoom.blacklist_reason || 'Tidak ada alasan.'}`);
            }

            // 3. Proses Check-in (Helper)
            // Ini akan assign kamar secara otomatis, buat folio, charge kamar, dll.
            const checkinData = await processCheckIn({
                kode_reservasi_room: oPayload.kode_reservasi_room,
                trx: trx,
                userId: userId
            });

            // 4. Proses Deposit (jika ada deposit_amount > 0 di trx_reservation)
            const depositAmount = parseFloat(resRoom.deposit_amount || 0);
            if (depositAmount > 0) {
                if (!oPayload.kode_cashier_shift || !oPayload.payment_method) {
                    throw new Error("Reservasi ini memiliki deposit. Harap kirimkan kode_cashier_shift dan payment_method untuk memproses deposit ke folio.");
                }

                const noPayment = await generateSequence("FMT-PAYMENT", trx);
                if (!noPayment) throw new Error("Gagal membuat nomor transaksi deposit");

                const tNow = formatDateSystem();
                await trx("trx_payment").insert({
                    kode_payment: noPayment,
                    kode_folio: checkinData.kode_folio,
                    payment_method: oPayload.payment_method,
                    amount: depositAmount,
                    kode_cashier_shift: oPayload.kode_cashier_shift,
                    received_by: userId,
                    paid_at: tNow,
                    created_by: userId,
                    created_at: tNow
                });
            }

            return checkinData;
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: "Check-in berhasil",
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
