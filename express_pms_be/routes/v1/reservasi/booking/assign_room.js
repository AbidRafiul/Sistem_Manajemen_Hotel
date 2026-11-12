/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file assign_room.js
 * @description API endpoint untuk menentukan / memilih nomor kamar fisik (Room Assignment) sebelum atau saat check-in
 * @author Antigravity
 * @created 2026-11-04
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { assertBranchScope } from "../../components/tools/scope_helper.js";
import { hitungKetersediaanTipeKamar } from "../../components/tools/availability_helper.js";

const router = express.Router();

const schema = Joi.object({
    kode_reservasi_room: Joi.string().required().label("Kode Reservasi Room"),
    kode_kamar: Joi.string().optional().allow(null, "").label("Kode Kamar Fisik")
});

router.post("/", async (req, res) => {
    const db = DB;
    const userId = req?.auth?.user_id || null;

    try {
        const oPayload = req.body || {};
        const { error } = schema.validate(oPayload);
        if (error) {
            return res.status(400).json({
                status: status.GAGAL,
                message: error.details[0].message,
                datetime: formatDateSystem()
            });
        }

        const result = await db.transaction(async (trx) => {
            // 1. Ambil data reservasi room
            const resRoom = await trx("trx_reservation_room as rr")
                .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
                .join("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
                .select(
                    "rr.*",
                    "r.kode_cabang",
                    "r.check_in_date",
                    "r.check_out_date",
                    "r.status as res_status",
                    "tk.nama_tipe as tipe_kamar_name"
                )
                .where("rr.kode_reservasi_room", oPayload.kode_reservasi_room)
                .whereNull("rr.deleted_at")
                .first();

            if (!resRoom) {
                throw new Error("Data rincian kamar reservasi tidak ditemukan.");
            }

            assertBranchScope(req, resRoom.kode_cabang);

            if (resRoom.status === "checked_in" || resRoom.status === "checked_out") {
                throw new Error(`Kamar sudah berstatus '${resRoom.status}', nomor kamar tidak dapat diubah dari menu ini.`);
            }
            if (resRoom.res_status === "cancelled") {
                throw new Error("Reservasi ini telah dibatalkan.");
            }

            const targetKodeKamar = (oPayload.kode_kamar || "").trim();
            const tNow = formatDateSystem();

            if (!targetKodeKamar) {
                // Reset / Unassign Kamar Fisik
                await trx("trx_reservation_room")
                    .where("kode_reservasi_room", oPayload.kode_reservasi_room)
                    .update({
                        kode_kamar: null,
                        status: "booked",
                        updated_by: userId,
                        updated_at: tNow
                    });

                return {
                    kode_reservasi_room: resRoom.kode_reservasi_room,
                    kode_kamar: null,
                    nomor_kamar: null,
                    status: "booked",
                    message: "Alokasi kamar fisik berhasil di-reset ke Auto-Assign."
                };
            }

            // Validasi keberadaan kamar fisik & kesesuaian tipe kamar
            const kamarFisik = await trx("mst_kamar")
                .where("kode_kamar", targetKodeKamar)
                .where("kode_cabang", resRoom.kode_cabang)
                .where("is_active", 1)
                .whereNull("deleted_at")
                .first();

            if (!kamarFisik) {
                throw new Error(`Kamar fisik '${targetKodeKamar}' tidak ditemukan atau sedang tidak aktif.`);
            }

            if (kamarFisik.kode_tipe_kamar !== resRoom.kode_tipe_kamar) {
                throw new Error(`Kamar ${kamarFisik.nomor_kamar} adalah tipe ${kamarFisik.kode_tipe_kamar}, tidak cocok dengan tipe pesanan (${resRoom.tipe_kamar_name}).`);
            }

            // Validasi apakah kamar bentrok dengan reservasi lain
            const availCheck = await hitungKetersediaanTipeKamar({
                kode_cabang: resRoom.kode_cabang,
                kode_tipe_kamar: resRoom.kode_tipe_kamar,
                check_in_date: new Date(resRoom.check_in_date),
                check_out_date: new Date(resRoom.check_out_date),
                exclude_kode_reservation: resRoom.kode_reservation
            }, trx);

            if (availCheck.terpakai_kamar_ids && availCheck.terpakai_kamar_ids.includes(targetKodeKamar)) {
                throw new Error(`Kamar ${kamarFisik.nomor_kamar} sedang terisi atau sudah dipesan tamu lain pada rentang tanggal tersebut.`);
            }

            // Update penetapan kamar fisik
            await trx("trx_reservation_room")
                .where("kode_reservasi_room", oPayload.kode_reservasi_room)
                .update({
                    kode_kamar: targetKodeKamar,
                    status: "assigned",
                    updated_by: userId,
                    updated_at: tNow
                });

            return {
                kode_reservasi_room: resRoom.kode_reservasi_room,
                kode_kamar: targetKodeKamar,
                nomor_kamar: kamarFisik.nomor_kamar,
                status: "assigned",
                message: `Kamar ${kamarFisik.nomor_kamar} berhasil dialokasikan untuk reservasi ini.`
            };
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: result.message,
            datetime: formatDateSystem(),
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            status: status.GAGAL,
            message: error.message || "Gagal menetapkan nomor kamar",
            datetime: formatDateSystem()
        });
    }
});

export default router;

