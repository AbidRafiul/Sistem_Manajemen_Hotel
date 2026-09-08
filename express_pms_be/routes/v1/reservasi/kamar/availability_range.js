/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file availability_range.js
 * @description API endpoint untuk mengecek ketersediaan tipe kamar pada rentang tanggal
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-04
 * @version 1.0.0
 */

import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { hitungHargaKamar } from "../../components/tools/pricing_helper.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { hitungKetersediaanTipeKamar } from "../../components/tools/availability_helper.js";

import express from "express";

const router = express.Router();

const schema = Joi.object({
    kode_tipe_kamar: Joi.string().required(),
    check_in_date: Joi.date().iso().required(),
    check_out_date: Joi.date().iso().greater(Joi.ref('check_in_date')).required(),
    kode_rate_plan: Joi.string().optional().allow(null, ""),
    kode_season: Joi.string().optional().allow(null, ""),
    kode_cabang: Joi.string().required() // dibutuhkan untuk menghitung kamar aktif per cabang
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

        const checkinDateStr = formatDateSystem(oPayload.check_in_date, "yyyy-MM-dd");
        const checkoutDateStr = formatDateSystem(oPayload.check_out_date, "yyyy-MM-dd");

        const result = await db.transaction(async (trx) => {
            const cin = new Date(oPayload.check_in_date);
            const cout = new Date(oPayload.check_out_date);

            const { available_count, total } = await hitungKetersediaanTipeKamar({
                kode_cabang: oPayload.kode_cabang,
                kode_tipe_kamar: oPayload.kode_tipe_kamar,
                check_in_date: cin,
                check_out_date: cout
            }, trx);

            if (total === 0) {
                return { available_count: 0, price_preview: null };
            }

            // 3. Price Preview (jika requested)
            let price_preview = null;
            if (oPayload.kode_rate_plan) {
                const nights = Math.max(1, Math.round((cout - cin) / (1000 * 60 * 60 * 24)));

                const rateInfo = await hitungHargaKamar({
                    kode_tipe_kamar: oPayload.kode_tipe_kamar,
                    kode_rate_plan: oPayload.kode_rate_plan,
                    kode_season: oPayload.kode_season,
                    tanggal: cin
                }, trx);

                price_preview = {
                    rate_per_night: rateInfo.price,
                    nights: nights,
                    total_room_charge: rateInfo.price * nights
                };
            }

            return {
                available_count,
                available: available_count > 0,
                price_preview
            };
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: "Availability checked",
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
// Trigger restart

export default router;
