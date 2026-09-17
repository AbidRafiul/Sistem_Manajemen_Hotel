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
    kode_tipe_kamar: Joi.string().optional().allow(null, ""),
    kode_rate_plan: Joi.string().optional().allow(null, ""),
    kode_kamar: Joi.string().optional().allow(null, ""),
    rooms: Joi.array().items(Joi.object({
        kode_tipe_kamar: Joi.string().required(),
        kode_rate_plan: Joi.string().required(),
        kode_kamar: Joi.string().optional().allow(null, ""),
        kode_season: Joi.string().optional().allow(null, "")
    })).optional(),
    extra_facilities: Joi.array().optional().allow(null),
    special_request: Joi.string().optional().allow(null, ""),
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
            throw new Error("Tamu berada dalam daftar blacklist");
        }

        let roomsToProcess = [];
        if (Array.isArray(oPayload.rooms) && oPayload.rooms.length > 0) {
            roomsToProcess = oPayload.rooms;
        } else if (oPayload.kode_tipe_kamar && oPayload.kode_rate_plan) {
            roomsToProcess = [{
                kode_tipe_kamar: oPayload.kode_tipe_kamar,
                kode_rate_plan: oPayload.kode_rate_plan,
                kode_kamar: oPayload.kode_kamar || null
            }];
        } else {
            return res.status(400).json({
                status: status.GAGAL,
                message: "Pilihan kamar tidak valid. Harap pilih minimal 1 kamar.",
                datetime: formatDateSystem()
            });
        }

        const cin = new Date(oPayload.check_in_date);
        const cout = new Date(oPayload.check_out_date);
        const nights = Math.max(1, Math.round((cout - cin) / (1000 * 60 * 60 * 24)));

        const result = await db.transaction(async (trx) => {
            const isGroup = roomsToProcess.length > 1;
            const bookingType = isGroup ? "group" : "individual";
            const groupCode = isGroup ? `GRP-${Date.now().toString(36).toUpperCase()}` : null;

            // Generate ID Reservasi
            const noReservasi = await generateSequence("FMT-RESERVASI", trx);
            if (!noReservasi) {
                throw new Error("Gagal membuat nomor transaksi reservasi");
            }

            const tNow = formatDateSystem();
            const resStatus = oPayload.deposit_amount > 0 ? "confirmed" : "reserved";
            const checkinDateStr = formatDateSystem(cin, "yyyy-MM-dd");
            const checkoutDateStr = formatDateSystem(cout, "yyyy-MM-dd");

            let specialRequestText = oPayload.special_request || "";
            if (Array.isArray(oPayload.extra_facilities) && oPayload.extra_facilities.length > 0) {
                const activeFacs = oPayload.extra_facilities.filter(f => f.qty > 0 || f.subtotal > 0);
                if (activeFacs.length > 0) {
                    const facSummary = activeFacs.map(f => `${f.nama} (${f.qty}x${Number(f.subtotal) > 0 ? ` - Rp ${Number(f.subtotal).toLocaleString('id-ID')}` : ' - Termasuk'})`).join(', ');
                    specialRequestText = specialRequestText ? `${specialRequestText} | Fasilitas: ${facSummary}` : `Fasilitas: ${facSummary}`;
                }
            }

            // Insert Reservasi
            await trx("trx_reservation").insert({
                kode_cabang: oPayload.kode_cabang,
                kode_reservasi: noReservasi,
                kode_guest: oPayload.kode_guest,
                check_in_date: checkinDateStr,
                check_out_date: checkoutDateStr,
                deposit_amount: oPayload.deposit_amount,
                status: resStatus,
                source_channel: "walk_in",
                booking_type: bookingType,
                group_code: groupCode,
                special_request: specialRequestText || null,
                created_by: userId,
                created_at: tNow
            });

            const processedRooms = [];
            for (const rm of roomsToProcess) {
                // Pastikan kamar tersedia
                const { available_count, terpakai_kamar_ids } = await hitungKetersediaanTipeKamar({
                    kode_cabang: oPayload.kode_cabang,
                    kode_tipe_kamar: rm.kode_tipe_kamar,
                    check_in_date: cin,
                    check_out_date: cout
                }, trx);

                if (available_count <= 0) {
                    throw new Error(`Tipe kamar ${rm.kode_tipe_kamar} sudah penuh pada rentang tanggal tersebut.`);
                }
                if (rm.kode_kamar && terpakai_kamar_ids && terpakai_kamar_ids.includes(rm.kode_kamar)) {
                    throw new Error(`Kamar fisik ${rm.kode_kamar} sedang tidak tersedia.`);
                }

                // Hitung harga
                const rateInfo = await hitungHargaKamar({
                    kode_tipe_kamar: rm.kode_tipe_kamar,
                    kode_rate_plan: rm.kode_rate_plan,
                    tanggal: cin
                }, trx);
                
                const ratePerNight = rateInfo.price;
                const noResRoom = await generateSequence("FMT-RESROOM", trx);
                if (!noResRoom) {
                    throw new Error("Gagal membuat nomor transaksi reservasi kamar");
                }

                // Insert Reservation Room
                await trx("trx_reservation_room").insert({
                    kode_reservasi_room: noResRoom,
                    kode_reservation: noReservasi,
                    kode_tipe_kamar: rm.kode_tipe_kamar,
                    kode_rate_plan: rm.kode_rate_plan,
                    kode_kamar: rm.kode_kamar || null,
                    rate_per_night: ratePerNight,
                    nights: nights,
                    status: "booked",
                    created_by: userId,
                    created_at: tNow
                });

                processedRooms.push({
                    kode_reservasi_room: noResRoom,
                    kode_tipe_kamar: rm.kode_tipe_kamar,
                    kode_kamar: rm.kode_kamar || null,
                    rate_per_night: ratePerNight
                });
            }

            return {
                kode_reservasi: noReservasi,
                booking_type: bookingType,
                group_code: groupCode,
                status: resStatus,
                rooms: processedRooms
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
