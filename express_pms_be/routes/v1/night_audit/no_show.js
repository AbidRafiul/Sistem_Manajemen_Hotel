/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file no_show.js
 * @description POST /api/v1/night-audit/no-show - Menandai reservasi sebagai No-Show sebelum audit
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { markReservationNoShow } from "../components/tools/night_audit_service.js";
import { assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router();

const schema = Joi.object({
  kode_reservasi: Joi.string().optional().allow(null, ""),
  kode_reservation: Joi.string().optional().allow(null, ""),
  kode_cabang: Joi.string().optional().allow(null, ""),
  reason: Joi.string().optional().allow(null, "").default("Tamu tidak hadir (No-Show)"),
  notes: Joi.string().optional().allow(null, ""),
  no_show_fee: Joi.number().optional().allow(null)
}).or("kode_reservasi", "kode_reservation");

router.post("/", async (req, res) => {
  try {
    const oPayload = req.body || {};
    const { error } = schema.validate(oPayload);
    if (error) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: error.details[0].message,
        datetime: formatDateSystem()
      });
    }

    const userId = req?.auth?.user_id || 1;
    const resCode = oPayload.kode_reservasi || oPayload.kode_reservation;

    // Validasi cabang reservasi berada dalam wewenang user
    const resv = await DB("trx_reservation").where("kode_reservasi", resCode).first();
    if (resv && resv.kode_cabang) {
      assertBranchScope(req, resv.kode_cabang);
    }

    const result = await markReservationNoShow({
      kodeReservasi: resCode,
      userId,
      reason: oPayload.reason || oPayload.notes || "Tamu tidak hadir (No-Show)"
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Reservasi ${oPayload.kode_reservasi} berhasil ditandai sebagai No-Show`,
      datetime: formatDateSystem(),
      data: result
    });
  } catch (err) {
    const httpStatus = err.status || err.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: err.message,
      datetime: formatDateSystem()
    });
  }
});

export default router;
