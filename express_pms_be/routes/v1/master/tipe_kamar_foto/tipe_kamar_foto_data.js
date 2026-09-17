/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_kamar_foto_data.js
 * @description Endpoint list galeri foto tipe kamar
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
                kode_tipe_kamar: Joi.string().required().label("Kode Tipe Kamar"),
            },
            {
                "string.base": "{#label} harus berupa teks",
                "string.empty": "{#label} tidak boleh kosong",
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

        const photos = await DB("mst_tipe_kamar_foto")
            .where("kode_tipe_kamar", oPayload.kode_tipe_kamar)
            .whereNull("deleted_at")
            .where("is_active", 1)
            .orderBy("is_cover", "desc")
            .orderBy("urutan", "asc")
            .orderBy("id", "asc")
            .select(
                "id",
                "kode_tipe_kamar",
                "foto_url",
                "urutan",
                "is_cover",
                "created_by",
                "created_at"
            );

        const assetsPath = process.env.ASSETS_PATH || "";
        const formattedPhotos = photos.map((p) => ({
            ...p,
            file_name: p.foto_url,
            foto_url: `${assetsPath}/uploads/tipe_kamar/${p.foto_url}`,
        }));

        return res.status(200).json({
            status: status.SUKSES,
            message: "Data foto tipe kamar berhasil diambil",
            datetime: formatDateSystem(),
            data: formattedPhotos,
        });

    } catch (error) {
        const oResultError = {
            status: status.BAD_REQUEST,
            message: "Sistem sedang maintenance harap tunggu sebentar",
            datetime: formatDateSystem(),
        };

        Logging(error, {
            file: "/master/tipe_kamar_foto/tipe_kamar_foto_data.js",
            func: "getData",
            request: body,
            response: oResultError,
            user: username,
        });

        return res.status(500).json(oResultError);
    }
});

export default router;
