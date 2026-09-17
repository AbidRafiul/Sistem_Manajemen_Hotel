/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_kamar_foto_set_cover.js
 * @description Endpoint untuk menandai sebuah foto sebagai foto cover/utama tipe kamar
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-15
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { body, auth } = req;
    const username = auth?.username || "SYSTEM";
    const oPayload = { ...body };

    try {
        const cValidation = await validatePayload(
            {
                id: Joi.alternatives().try(
                    Joi.number().required(),
                    Joi.string().required()
                ).label("ID Foto"),
            },
            {
                "any.required": "{#label} wajib diisi",
            },
            oPayload
        );

        if (cValidation) {
            return res.status(422).json({
                status: status.BAD_REQUEST,
                message: cValidation,
                datetime: formatDateSystem(),
            });
        }

        const photoId = Number(oPayload.id);

        const targetPhoto = await DB("mst_tipe_kamar_foto")
            .where("id", photoId)
            .whereNull("deleted_at")
            .where("is_active", 1)
            .first();

        if (!targetPhoto) {
            return res.status(404).json({
                status: status.NOT_FOUND,
                message: "Foto tipe kamar tidak ditemukan",
                datetime: formatDateSystem(),
            });
        }

        await DB.transaction(async (trx) => {
            // Set is_cover = 0 untuk semua foto aktif milik tipe kamar ini
            await trx("mst_tipe_kamar_foto")
                .where("kode_tipe_kamar", targetPhoto.kode_tipe_kamar)
                .whereNull("deleted_at")
                .where("is_active", 1)
                .update({ is_cover: 0 });

            // Set is_cover = 1 untuk foto yang dipilih
            await trx("mst_tipe_kamar_foto")
                .where("id", photoId)
                .update({ is_cover: 1 });
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: "Foto berhasil ditetapkan sebagai cover utama",
            datetime: formatDateSystem(),
        });

    } catch (error) {
        const oResultError = {
            status: status.BAD_REQUEST,
            message: "Sistem sedang maintenance harap tunggu sebentar",
            datetime: formatDateSystem(),
        };

        Logging(error, {
            file: "/master/tipe_kamar_foto/tipe_kamar_foto_set_cover.js",
            func: "setCover",
            request: body,
            response: oResultError,
            user: username,
        });

        return res.status(500).json(oResultError);
    }
});

export default router;
