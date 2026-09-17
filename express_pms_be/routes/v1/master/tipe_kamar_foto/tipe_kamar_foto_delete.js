/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_kamar_foto_delete.js
 * @description Endpoint hapus foto tipe kamar (soft delete di DB + hapus file fisik)
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
import path from "path";
import fs from "fs";

const router = express.Router();

router.post("/", async (req, res) => {
    const { body, auth } = req;
    const username = auth?.username || "SYSTEM";
    const userId = auth?.user_id || 1;
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
            .first();

        if (!targetPhoto) {
            return res.status(404).json({
                status: status.NOT_FOUND,
                message: "Foto tipe kamar tidak ditemukan atau sudah dihapus",
                datetime: formatDateSystem(),
            });
        }

        await DB.transaction(async (trx) => {
            // 1. Soft delete di database
            await trx("mst_tipe_kamar_foto")
                .where("id", photoId)
                .update({
                    is_active: 0,
                    deleted_by: userId,
                    deleted_at: formatDateSystem(),
                });

            // 2. Jika foto yang dihapus adalah cover, otomatis jadikan foto lain sebagai cover baru
            if (targetPhoto.is_cover === 1) {
                const nextCover = await trx("mst_tipe_kamar_foto")
                    .where("kode_tipe_kamar", targetPhoto.kode_tipe_kamar)
                    .whereNull("deleted_at")
                    .where("is_active", 1)
                    .orderBy("urutan", "asc")
                    .orderBy("id", "asc")
                    .first();

                if (nextCover) {
                    await trx("mst_tipe_kamar_foto")
                        .where("id", nextCover.id)
                        .update({ is_cover: 1 });
                }
            }
        });

        // 3. Hapus file fisik dari public/uploads/tipe_kamar
        if (targetPhoto.foto_url) {
            const uploadDir = path.join(process.cwd(), "public", "uploads", "tipe_kamar");
            const physicalFilePath = path.join(uploadDir, targetPhoto.foto_url);
            if (fs.existsSync(physicalFilePath)) {
                try {
                    fs.unlinkSync(physicalFilePath);
                } catch (err) {
                    console.error("Gagal menghapus file fisik foto:", physicalFilePath, err);
                }
            }
        }

        return res.status(200).json({
            status: status.SUKSES,
            message: "Foto tipe kamar berhasil dihapus",
            datetime: formatDateSystem(),
        });

    } catch (error) {
        const oResultError = {
            status: status.BAD_REQUEST,
            message: "Sistem sedang maintenance harap tunggu sebentar",
            datetime: formatDateSystem(),
        };

        Logging(error, {
            file: "/master/tipe_kamar_foto/tipe_kamar_foto_delete.js",
            func: "delete",
            request: body,
            response: oResultError,
            user: username,
        });

        return res.status(500).json(oResultError);
    }
});

export default router;
