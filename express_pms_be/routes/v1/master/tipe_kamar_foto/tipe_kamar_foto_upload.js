/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file tipe_kamar_foto_upload.js
 * @description Endpoint upload foto tipe kamar (bisa multiple file)
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-15
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { status } from "../../components/tools/general.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

const upload = multer({
    dest: "temp/",
    limits: { fileSize: 2 * 1024 * 1024 }, // Maksimal 2MB per file
});

router.post("/", upload.any(), async (req, res) => {
    const { body, auth, files } = req;
    const username = auth?.username || "SYSTEM";
    const userId = auth?.user_id || 1;
    const oPayload = { ...body };
    const aSavedFiles = [];

    const cleanupFiles = () => {
        files?.forEach((f) => {
            if (fs.existsSync(f.path)) {
                try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ }
            }
        });
    };

    try {
        if (!oPayload.kode_tipe_kamar) {
            cleanupFiles();
            return res.status(400).json({
                status: status.BAD_REQUEST,
                message: "Kode Tipe Kamar wajib diisi",
                datetime: formatDateSystem(),
            });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({
                status: status.BAD_REQUEST,
                message: "Paling sedikit harus memilih 1 file foto untuk diunggah",
                datetime: formatDateSystem(),
            });
        }

        // Cek tipe kamar di DB
        const tipeKamar = await DB("mst_tipe_kamar")
            .where("kode_tipe_kamar", oPayload.kode_tipe_kamar)
            .whereNull("deleted_at")
            .first();

        if (!tipeKamar) {
            cleanupFiles();
            return res.status(404).json({
                status: status.NOT_FOUND,
                message: "Tipe kamar tidak ditemukan",
                datetime: formatDateSystem(),
            });
        }

        const allowedExt = [".png", ".jpg", ".jpeg", ".webp"];
        for (const file of files) {
            const ext = path.extname(file.originalname).toLowerCase();
            if (!allowedExt.includes(ext)) {
                cleanupFiles();
                return res.status(400).json({
                    status: status.BAD_REQUEST,
                    message: `Format file ${file.originalname} tidak didukung (Gunakan PNG, JPG, JPEG, atau WEBP)`,
                    datetime: formatDateSystem(),
                });
            }
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "tipe_kamar");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        let insertedRecords = [];

        await DB.transaction(async (trx) => {
            // Cek foto aktif yang sudah ada untuk tipe kamar ini
            const existingPhotos = await trx("mst_tipe_kamar_foto")
                .where("kode_tipe_kamar", oPayload.kode_tipe_kamar)
                .whereNull("deleted_at")
                .where("is_active", 1);

            let maxUrutan = existingPhotos.reduce((max, p) => Math.max(max, p.urutan || 0), 0);
            const isFirstPhoto = existingPhotos.length === 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const ext = path.extname(file.originalname).toLowerCase();
                const filename = `foto_${oPayload.kode_tipe_kamar}_${Date.now()}_${i}${ext}`;
                const destPath = path.join(uploadDir, filename);

                fs.renameSync(file.path, destPath);
                aSavedFiles.push(destPath);

                maxUrutan += 1;
                const isCover = isFirstPhoto && i === 0 ? 1 : 0;

                const oInsertData = {
                    kode_tipe_kamar: oPayload.kode_tipe_kamar,
                    foto_url: filename,
                    urutan: maxUrutan,
                    is_cover: isCover,
                    created_by: userId,
                    created_at: formatDateSystem(),
                    is_active: 1,
                };

                const [insertedId] = await trx("mst_tipe_kamar_foto").insert(oInsertData);
                insertedRecords.push({
                    id: insertedId,
                    ...oInsertData,
                    full_url: `${process.env.ASSETS_PATH || ''}/uploads/tipe_kamar/${filename}`,
                });
            }
        });

        cleanupFiles();

        return res.status(200).json({
            status: status.SUKSES,
            message: `${insertedRecords.length} foto berhasil diunggah`,
            datetime: formatDateSystem(),
            data: insertedRecords,
        });

    } catch (error) {
        cleanupFiles();

        // Bersihkan file yang sudah sempat dipindahkan ke public/uploads
        aSavedFiles.forEach((filePath) => {
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
            }
        });

        const oResultError = {
            status: status.BAD_REQUEST,
            message: "Sistem sedang maintenance harap tunggu sebentar",
            datetime: formatDateSystem(),
        };

        Logging(error, {
            file: "/master/tipe_kamar_foto/tipe_kamar_foto_upload.js",
            func: "upload",
            request: body,
            response: oResultError,
            user: username,
        });

        return res.status(500).json(oResultError);
    }
});

export default router;
