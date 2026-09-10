/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file room_packages.js
 * @description API endpoint untuk menampilkan katalog produk kamar (tipe kamar x rate plan)
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
    kode_cabang: Joi.string().required(),
    check_in_date: Joi.date().iso().required(),
    check_out_date: Joi.date().iso().greater(Joi.ref('check_in_date')).required(),
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

        const cin = new Date(oPayload.check_in_date);
        const cout = new Date(oPayload.check_out_date);
        const nights = Math.max(1, Math.round((cout - cin) / (1000 * 60 * 60 * 24)));

        const result = await db.transaction(async (trx) => {
            // 1. Ambil semua tipe kamar aktif untuk cabang ini
            const tipeKamars = await trx('mst_tipe_kamar')
                .where('kode_cabang', oPayload.kode_cabang)
                .where('is_active', 1)
                .whereNull('deleted_at')
                .select('kode_tipe_kamar', 'nama_tipe', 'harga_default', 'luas_sqm as luas_m2', 'kapasitas_dasar', 'kapasitas_maksimal');

            if (tipeKamars.length === 0) return [];

            // 2. Ambil semua rate plan aktif untuk cabang ini
            const ratePlans = await trx('mst_paket_harga')
                .where('kode_cabang', oPayload.kode_cabang)
                .where('is_active', 1)
                .whereNull('deleted_at')
                .select('kode_paket_harga as kode_rate_plan', 'nama_paket as nama_rate_plan', 'tipe_markup', 'nilai_markup');

            // Bulk logic dihapus, dipindah ke helper dalam loop

            const packagesList = [];

            // 4. Generate kombinasi (Tipe Kamar x Rate Plan)
            for (const tk of tipeKamars) {
                const ketersediaan = await hitungKetersediaanTipeKamar({
                    kode_cabang: oPayload.kode_cabang,
                    kode_tipe_kamar: tk.kode_tipe_kamar,
                    check_in_date: cin,
                    check_out_date: cout
                }, trx);
                
                const available_count = ketersediaan.available_count;
                const available_rooms = ketersediaan.available_rooms || [];

                // Buat item master Tipe Kamar
                const productGroup = {
                    ...tk,
                    available_count,
                    available_rooms,
                    packages: []
                };

                for (const rp of ratePlans) {
                    // Hitung harga
                    let rateInfo;
                    try {
                        rateInfo = await hitungHargaKamar({
                            kode_tipe_kamar: tk.kode_tipe_kamar,
                            kode_rate_plan: rp.kode_rate_plan,
                            tanggal: cin // season otomatis di-detect
                        }, trx);
                    } catch (e) {
                        // Skip if rate logic fails for some reason
                        continue;
                    }

                    productGroup.packages.push({
                        kode_rate_plan: rp.kode_rate_plan,
                        nama_rate_plan: rp.nama_rate_plan,
                        price_per_night: rateInfo.price,
                        total_price: rateInfo.price * nights,
                        available_count: available_count,
                        source: rateInfo.source
                    });
                }
                
                if (productGroup.packages.length > 0) {
                    packagesList.push(productGroup);
                }
            }

            return packagesList;
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: "Room packages retrieved",
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
