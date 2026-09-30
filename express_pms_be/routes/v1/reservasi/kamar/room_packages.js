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
                .select('kode_tipe_kamar', 'nama_tipe', 'harga_default', 'luas_sqm as luas_m2', 'kapasitas_dasar', 'kapasitas_maksimal', 'deskripsi');

            if (tipeKamars.length === 0) return [];

            // 1.1 Ambil foto cover & count foto untuk tipe kamar
            const roomTypeCodes = tipeKamars.map(tk => tk.kode_tipe_kamar);
            const photos = await trx('mst_tipe_kamar_foto')
                .whereIn('kode_tipe_kamar', roomTypeCodes)
                .whereNull('deleted_at')
                .where('is_active', 1)
                .orderBy('is_cover', 'desc')
                .orderBy('urutan', 'asc')
                .orderBy('id', 'asc')
                .select('kode_tipe_kamar', 'foto_url', 'is_cover');

            const coverMap = new Map();
            const countMap = new Map();

            for (const p of photos) {
                countMap.set(p.kode_tipe_kamar, (countMap.get(p.kode_tipe_kamar) || 0) + 1);
                if (!coverMap.has(p.kode_tipe_kamar) || p.is_cover === 1) {
                    coverMap.set(p.kode_tipe_kamar, p.foto_url);
                }
            }

            // 1.2 Ambil fasilitas & amenity untuk tipe kamar
            const fasilitasList = await trx('mst_room_type_fasilitas as rtf')
                .join('mst_fasilitas as f', 'rtf.kode_fasilitas', 'f.kode_fasilitas')
                .whereIn('rtf.kode_tipe_kamar', roomTypeCodes)
                .whereNull('f.deleted_at')
                .select('rtf.kode_tipe_kamar', 'rtf.kode_fasilitas', 'f.name as nama_fasilitas');

            const amenityList = await trx('mst_room_type_amenity as rta')
                .join('mst_amenity as a', 'rta.kode_amenity', 'a.kode_amenity')
                .whereIn('rta.kode_tipe_kamar', roomTypeCodes)
                .whereNull('a.deleted_at')
                .select('rta.kode_tipe_kamar', 'rta.kode_amenity', 'a.name as nama_amenity');

            const fasMap = new Map();
            for (const f of fasilitasList) {
                if (!fasMap.has(f.kode_tipe_kamar)) fasMap.set(f.kode_tipe_kamar, []);
                fasMap.get(f.kode_tipe_kamar).push(f);
            }

            const amMap = new Map();
            for (const a of amenityList) {
                if (!amMap.has(a.kode_tipe_kamar)) amMap.set(a.kode_tipe_kamar, []);
                amMap.get(a.kode_tipe_kamar).push(a);
            }

            const assetsPath = process.env.ASSETS_PATH || "";

            // 2. Ambil semua rate plan aktif untuk cabang ini
            const ratePlans = await trx('mst_paket_harga')
                .where('kode_cabang', oPayload.kode_cabang)
                .where('is_active', 1)
                .whereNull('deleted_at')
                .select('kode_paket_harga as kode_rate_plan', 'nama_paket as nama_rate_plan', 'tipe_markup', 'nilai_markup');

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
                const rooms = ketersediaan.all_rooms || [];

                const coverFilename = coverMap.get(tk.kode_tipe_kamar) || null;
                let fotoCoverUrl = null;
                if (coverFilename) {
                    if (coverFilename.startsWith("http://") || coverFilename.startsWith("https://")) {
                        fotoCoverUrl = coverFilename;
                    } else if (coverFilename.startsWith("/api/assets/")) {
                        fotoCoverUrl = coverFilename;
                    } else if (coverFilename.startsWith("/uploads/")) {
                        fotoCoverUrl = `${assetsPath}${coverFilename}`;
                    } else if (coverFilename.startsWith("uploads/")) {
                        fotoCoverUrl = `${assetsPath}/${coverFilename}`;
                    } else {
                        fotoCoverUrl = `${assetsPath}/uploads/tipe_kamar/${coverFilename}`;
                    }
                }
                const jumlahFoto = countMap.get(tk.kode_tipe_kamar) || 0;

                // Buat item master Tipe Kamar
                const productGroup = {
                    ...tk,
                    deskripsi: tk.deskripsi || '',
                    foto_cover_url: fotoCoverUrl,
                    jumlah_foto: jumlahFoto,
                    fasilitas: fasMap.get(tk.kode_tipe_kamar) || [],
                    amenities: amMap.get(tk.kode_tipe_kamar) || [],
                    available_count,
                    available_rooms,
                    rooms,
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
