/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file reservation_data.js
 * @description API endpoint untuk mengambil daftar reservasi / arrivals
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-04
 * @version 1.0.0
 */

import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import express from "express";

const router = express.Router();

const schema = Joi.object({
    kode_cabang: Joi.string().optional().allow(null, ""),
    status: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).optional(), // 'reserved', 'confirmed', dll
    check_in_date: Joi.date().iso().optional() // untuk filter arrivals
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

        const query = db('trx_reservation_room as rr')
            .join('trx_reservation as r', 'rr.kode_reservation', 'r.kode_reservasi')
            .join('mst_guest as g', 'r.kode_guest', 'g.kode_tamu')
            .join('mst_tipe_kamar as tk', 'rr.kode_tipe_kamar', 'tk.kode_tipe_kamar')
            .leftJoin('mst_kamar as k', 'rr.kode_kamar', 'k.kode_kamar')
            .select(
                'rr.kode_reservasi_room',
                'r.kode_reservasi',
                'r.kode_cabang',
                'g.full_name as guest_name',
                'g.phone as guest_phone',
                'r.check_in_date',
                'r.check_out_date',
                'tk.nama_tipe as tipe_kamar_name',
                'rr.nights',
                'rr.status as room_status',
                'r.deposit_amount',
                'k.nomor_kamar'
            );

        if (oPayload.kode_cabang) {
            query.where('r.kode_cabang', oPayload.kode_cabang);
        }

        if (oPayload.status) {
            if (Array.isArray(oPayload.status)) {
                query.whereIn('rr.status', oPayload.status);
            } else {
                query.where('rr.status', oPayload.status);
            }
        } else {
            // Default filter yang belum check-in tapi sudah dibook
            query.whereIn('rr.status', ['booked', 'reserved', 'confirmed']);
        }

        if (oPayload.check_in_date) {
            const cin = formatDateSystem(oPayload.check_in_date, "yyyy-MM-dd");
            query.where('r.check_in_date', cin);
        }

        query.orderBy('r.check_in_date', 'asc');

        const data = await query;

        return res.status(200).json({
            status: status.SUKSES,
            message: "Data reservasi berhasil diambil",
            datetime: formatDateSystem(),
            data: data
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
