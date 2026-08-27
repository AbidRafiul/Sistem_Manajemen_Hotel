/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file mst_navigation_delete.js
 * @description Endpoint untuk menghapus data master navigasi sidebar berdasarkan id
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-27
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-27)
 * @version 1.0.1
 */

import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import Joi from "joi";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { body } = req;
    const oPayload = body;
    const username = req?.auth?.username || "";

    try {
        if (!oPayload || Object.keys(oPayload).length < 1) {
            return res.status(400).json({
                status: status.BAD_REQUEST,
                message: "Invalid request body",
                datetime: formatDateSystem(),
            });
        }

        const cValidation = await validatePayload(
            {
                id: Joi.number().integer().required().label("ID"),
                tz: Joi.string().optional().label("Timezone"),
            },
            {
                "number.base": "{#label} harus berupa angka",
                "any.required": "{#label} wajib diisi",
            },
            oPayload
        );

        if (cValidation) {
            const oResult = {
                status: status.BAD_REQUEST,
                message: cValidation || "Terdapat kesalahan pada data anda",
                datetime: formatDateSystem(),
            };

            Logging(null, {
                file: "mst_navigation_delete.js",
                func: "delete",
                request: oPayload,
                response: oResult,
                user: username,
            });

            return res.status(422).json(oResult);
        }

        const existing = await DB("mst_navigation")
            .where("id", oPayload.id)
            .first();

        if (!existing) {
            return res.status(400).json({
                status: status.GAGAL,
                message: "Data navigasi tidak ditemukan",
                datetime: formatDateSystem(),
            });
        }

        await DB("mst_navigation").where("id", oPayload.id).delete();

        return res.status(200).json({
            status: status.SUKSES,
            message: "Data navigasi berhasil dihapus",
            datetime: formatDateSystem(),
        });
    } catch (error) {
        const oResult = {
            status: status.BAD_REQUEST,
            message: "Sistem sedang maintenance harap tunggu sebentar",
            datetime: formatDateSystem(),
        };

        Logging(error, {
            file: "mst_navigation_delete.js",
            func: "delete",
            request: oPayload,
            response: oResult,
            user: username,
        });

        return res.status(500).json(oResult);
    }
});

export default router;
