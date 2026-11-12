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
import { assertBranchScope, applyBranchFilter } from "../../components/tools/scope_helper.js";
import express from "express";

const router = express.Router();

const schema = Joi.object({
    kode_cabang: Joi.string().optional().allow(null, ""),
    status: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).optional(), // 'reserved', 'confirmed', dll
    check_in_date: Joi.date().iso().optional().allow(null, "") // untuk filter arrivals (bisa tanggal spesifik atau null/kosong untuk semua tanggal)
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
            .leftJoin('mst_cabang as c', 'r.kode_cabang', 'c.kode_cabang')
            .leftJoin('mst_kamar as k', 'rr.kode_kamar', 'k.kode_kamar')
            .leftJoin('trx_folio as f', function() {
                this.on('f.kode_reservation', '=', 'r.kode_reservasi');
            })
            .select(
                'rr.kode_reservasi_room',
                'r.kode_reservasi',
                'r.kode_cabang',
                'c.nama_hotel as nama_cabang',
                'c.waktu_checkin',
                'c.waktu_checkout',
                'g.kode_tamu',
                'g.full_name as guest_name',
                'g.phone as guest_phone',
                'g.email as guest_email',
                'g.id_number as guest_id_number',
                'r.check_in_date',
                'r.check_out_date',
                'r.special_request',
                'r.status as res_status',
                'r.source_channel',
                'r.booking_type',
                'r.cancellation_reason',
                'r.cancellation_penalty',
                'r.created_at as reservation_created_at',
                'r.updated_at as reservation_updated_at',
                'rr.kode_tipe_kamar',
                'rr.kode_rate_plan',
                'rr.rate_per_night',
                'tk.nama_tipe as tipe_kamar_name',
                'rr.nights',
                'rr.status as room_status',
                'r.deposit_amount',
                'k.nomor_kamar',
                'f.kode_folio',
                'f.subtotal as folio_subtotal',
                'f.tax_amount as folio_tax_amount',
                'f.service_charge_amount as folio_service_charge',
                'f.grand_total as folio_grand_total'
            );

        if (oPayload.kode_cabang) {
            assertBranchScope(req, oPayload.kode_cabang);
            query.where('r.kode_cabang', oPayload.kode_cabang);
        } else {
            applyBranchFilter(query, req, 'r.kode_cabang');
        }

        if (oPayload.status) {
            const statusArr = Array.isArray(oPayload.status) ? oPayload.status : [oPayload.status];
            // Include 'assigned' when searching for confirmed/reserved/booked rooms
            if (statusArr.some(s => ['reserved', 'confirmed', 'booked'].includes(s)) && !statusArr.includes('assigned')) {
                statusArr.push('assigned');
            }
            query.where(function() {
                this.whereIn('rr.status', statusArr)
                    .orWhereIn('r.status', statusArr);
            });
        } else {
            // Default filter kedatangan (termasuk reservasi booking yang menunggu maupun walk-in/booking yang sudah check-in)
            query.whereIn('rr.status', ['booked', 'assigned', 'reserved', 'confirmed', 'checked_in']);
        }

        if (oPayload.check_in_date) {
            const cin = formatDateSystem(oPayload.check_in_date, "yyyy-MM-dd");
            query.where('r.check_in_date', cin);
        }

        query.orderBy('r.check_in_date', 'asc').orderBy('r.id', 'desc');

        const data = await query;

        const folioCodes = [...new Set(data.map(d => d.kode_folio).filter(Boolean))];
        if (folioCodes.length > 0) {
            const charges = await db('trx_folio_charge')
                .whereIn('kode_folio', folioCodes)
                .where('is_active', 1)
                .select('kode_folio', 'charge_type', 'description', 'qty', 'unit_price', 'amount');

            const chargesByFolio = {};
            charges.forEach(c => {
                if (!chargesByFolio[c.kode_folio]) chargesByFolio[c.kode_folio] = [];
                chargesByFolio[c.kode_folio].push(c);
            });

            const payments = await db('trx_payment as p')
                .leftJoin('mst_user as u', 'p.received_by', 'u.id')
                .whereIn('p.kode_folio', folioCodes)
                .where('p.is_active', 1)
                .select(
                    'p.id',
                    'p.kode_payment',
                    'p.kode_folio',
                    'p.payment_method',
                    'p.bank_name',
                    'p.card_type',
                    'p.amount',
                    'p.reference_no',
                    'p.kode_cashier_shift',
                    'p.paid_at',
                    'u.fullname as received_by_name'
                );

            const paymentsByFolio = {};
            payments.forEach(p => {
                if (!paymentsByFolio[p.kode_folio]) paymentsByFolio[p.kode_folio] = [];
                paymentsByFolio[p.kode_folio].push(p);
            });

            data.forEach(d => {
                d.charges = chargesByFolio[d.kode_folio] || [];
                const folioPays = paymentsByFolio[d.kode_folio] || [];
                d.payments = folioPays;
                const refundPays = folioPays.filter(p => Number(p.amount) < 0 || (p.reference_no && p.reference_no.includes('REFUND')));
                d.refund_payments = refundPays;
                d.refund_amount = refundPays.reduce((acc, curr) => acc + Math.abs(Number(curr.amount || 0)), 0);
            });
        } else {
            data.forEach(d => {
                d.charges = [];
                d.payments = [];
                d.refund_payments = [];
                d.refund_amount = 0;
            });
        }

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
