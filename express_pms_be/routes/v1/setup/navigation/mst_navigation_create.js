/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file mst_navigation_create.js
 * @description Endpoint untuk membuat data master navigasi sidebar baru berdasarkan role
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
                role: Joi.string().max(50).required().label("Role"),
                menu: Joi.string().required().label("Menu"),
                tz: Joi.string().optional().label("Timezone"),
            },
            {
                "string.base": "{#label} harus berupa string",
                "string.empty": "{#label} tidak boleh kosong",
                "any.required": "{#label} wajib diisi",
                "any.only": "{#label} tidak valid",
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
                file: "mst_navigation_create.js",
                func: "create",
                request: oPayload,
                response: oResult,
                user: username,
            });

            return res.status(422).json(oResult);
        }

        // Cek duplikasi role
        const existing = await DB("mst_navigation")
            .where("role", oPayload.role)
            .first();

        if (existing) {
            return res.status(400).json({
                status: status.GAGAL,
                message: `Navigasi untuk role '${oPayload.role}' sudah ada`,
                datetime: formatDateSystem(),
            });
        }

        await DB("mst_navigation").insert({
            role: oPayload.role,
            menu: oPayload.menu,
            tz: oPayload.tz || "UTC",
            created_at: formatDateSystem(),
            updated_at: formatDateSystem(),
        });

        return res.status(200).json({
            status: status.SUKSES,
            message: "Data navigasi berhasil dibuat",
            datetime: formatDateSystem(),
        });
    } catch (error) {
        const oResult = {
            status: status.BAD_REQUEST,
            message: "Sistem sedang maintenance harap tunggu sebentar",
            datetime: formatDateSystem(),
        };

        Logging(error, {
            file: "mst_navigation_create.js",
            func: "create",
            request: oPayload,
            response: oResult,
            user: username,
        });

        return res.status(500).json(oResult);
    }
});

export default router;
