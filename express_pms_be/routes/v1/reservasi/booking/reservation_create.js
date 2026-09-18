/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file reservation_create.js
 * @description API endpoint untuk membuat reservasi booking, alokasi folio, pencatatan pembayaran DP/Lunas, dan penerbitan dokumen invoice
 * @author Antigravity
 * @created 2026-09-04
 * @version 1.1.0
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
    }),
    reference_no: Joi.string().optional().allow(null, "")
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
        const paymentAmount = parseFloat(oPayload.deposit_amount || 0);

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
            const resStatus = paymentAmount > 0 ? "confirmed" : "reserved";
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
                deposit_amount: paymentAmount,
                status: resStatus,
                source_channel: "walk_in",
                booking_type: bookingType,
                group_code: groupCode,
                special_request: specialRequestText || null,
                created_by: userId,
                created_at: tNow
            });

            // Ambil Tarif Pajak Aktif
            const activeTaxes = await trx("mst_tax")
                .where(function() {
                    this.where("kode_cabang", oPayload.kode_cabang).orWhereNull("kode_cabang");
                })
                .where("is_active", 1)
                .whereNull("deleted_at");

            let totalSubtotal = 0;
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
                const roomChargeSubtotal = ratePerNight * nights;
                totalSubtotal += roomChargeSubtotal;

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
                    rate_per_night: ratePerNight,
                    subtotal: roomChargeSubtotal
                });
            }

            // Hitung Fasilitas Tambahan
            const activeExtraFacs = Array.isArray(oPayload.extra_facilities) 
                ? oPayload.extra_facilities.filter(f => (f.qty > 0 || f.subtotal > 0) && f.kode_fasilitas)
                : [];
            const totalFasilitas = activeExtraFacs.reduce((sum, f) => sum + parseFloat(f.subtotal || 0), 0);
            totalSubtotal += totalFasilitas;

            // Hitung Pajak & Service Charge
            let totalTaxAmount = 0;
            let totalServiceCharge = 0;
            activeTaxes.forEach(t => {
                const pct = parseFloat(t.percentage) || 0;
                const nominal = Math.round(totalSubtotal * (pct / 100));
                if (t.tax_type === 'service_charge') {
                    totalServiceCharge += nominal;
                } else {
                    totalTaxAmount += nominal;
                }
            });

            const finalGrandTotal = totalSubtotal + totalTaxAmount + totalServiceCharge;
            const finalBalance = Math.max(0, finalGrandTotal - paymentAmount);
            const isSettled = paymentAmount >= finalGrandTotal;

            // Inisialisasi trx_folio
            const lastFolioCode = await generateSequence("FMT-FOLIO", trx);
            if (!lastFolioCode) throw new Error("Gagal membuat nomor transaksi folio");

            await trx("trx_folio").insert({
                kode_cabang: oPayload.kode_cabang,
                kode_folio: lastFolioCode,
                kode_reservation: noReservasi,
                folio_owner_type: "guest",
                status: "open",
                subtotal: totalSubtotal,
                tax_amount: totalTaxAmount,
                service_charge_amount: totalServiceCharge,
                grand_total: finalGrandTotal,
                created_by: userId,
                created_at: tNow
            });

            // Insert charges untuk kamar
            for (const r of processedRooms) {
                const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
                await trx("trx_folio_charge").insert({
                    kode_folio_charge: noFolioCharge,
                    kode_folio: lastFolioCode,
                    kode_reservasi_room: r.kode_reservasi_room,
                    charge_type: "room",
                    description: `Sewa Kamar (${nights} Malam)`,
                    amount: r.subtotal,
                    tax_amount: Math.round(r.subtotal * (totalTaxAmount / (totalSubtotal || 1))),
                    service_charge_amount: Math.round(r.subtotal * (totalServiceCharge / (totalSubtotal || 1))),
                    created_by: userId,
                    created_at: tNow
                });
            }

            // Insert charges untuk fasilitas tambahan
            for (const fac of activeExtraFacs) {
                const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
                await trx("trx_folio_charge").insert({
                    kode_folio_charge: noFolioCharge,
                    kode_folio: lastFolioCode,
                    kode_fasilitas: fac.kode_fasilitas,
                    charge_type: "facility",
                    description: `Fasilitas Tambahan: ${fac.nama} (${fac.qty}x)`,
                    amount: fac.subtotal,
                    created_by: userId,
                    created_at: tNow
                });
            }

            // Insert trx_payment (DP / Pelunasan) jika ada
            if (paymentAmount > 0) {
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

            // Terbitkan Dokumen Invoice Unik di trx_fiscal_document
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

            return {
                kode_reservasi: noReservasi,
                kode_folio: lastFolioCode,
                invoice_number: invoiceNumber,
                booking_type: bookingType,
                group_code: groupCode,
                status: resStatus,
                nights: nights,
                subtotal: totalSubtotal,
                tax_amount: totalTaxAmount,
                service_charge_amount: totalServiceCharge,
                grand_total: finalGrandTotal,
                total_paid: paymentAmount,
                balance: finalBalance,
                is_settled: isSettled,
                payment_status: isSettled ? "paid" : (paymentAmount > 0 ? "partially_paid" : "unpaid"),
                payment_status_label: isSettled ? "Lunas" : (paymentAmount > 0 ? "Dibayar Sebagian (DP)" : "Belum Dibayar"),
                rooms: processedRooms
            };
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: "Reservasi booking berhasil dibuat",
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
