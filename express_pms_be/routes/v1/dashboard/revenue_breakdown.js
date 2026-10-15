/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file revenue_breakdown.js
 * @description POST /api/v1/dashboard/revenue-breakdown - Komposisi pendapatan berdasarkan
 *              kategori charge (Kamar, F&B, Laundry, Minibar, dsb.) dan metode pembayaran (Cash, EDC, QRIS, Transfer).
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";
import {
  getBusinessDate,
  logDashboardError,
  round,
  startOfMonth,
  toNumber,
} from "../components/tools/dashboard_metrics.js";

const router = express.Router();

const CHARGE_TYPE_LABELS = {
  room: "Kamar (Room Charge)",
  restaurant: "Restoran / F&B",
  room_service: "Room Service",
  laundry: "Laundry",
  minibar: "Minibar",
  spa: "Spa & Wellness",
  parking: "Parkir",
  penalty: "Denda / Penalty",
  other: "Lainnya",
};

const PAYMENT_METHOD_LABELS = {
  cash: "Tunai (Cash)",
  card: "Kartu Kredit/Debit",
  transfer: "Transfer Bank",
  qris: "QRIS",
  edc: "Mesin EDC",
  deposit: "Saldo Deposit",
  voucher: "Voucher",
};

router.post("/", async (req, res) => {
  try {
    const { kodeCabang, namaHotel } = resolveEffectiveBranch(req, req.body?.kode_cabang);
    if (!kodeCabang) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Kode cabang tidak valid atau belum ditentukan.",
        datetime: formatDateSystem(),
      });
    }

    const businessDate = await getBusinessDate(kodeCabang);
    const fromDate = req.body?.date_from || startOfMonth(businessDate);
    const toDate = req.body?.date_to || businessDate;

    // 1. Komposisi Pendapatan per Charge Type
    const chargeRows = await DB("trx_folio_charge as fc")
      .join("trx_folio as f", "fc.kode_folio", "f.kode_folio")
      .where("f.kode_cabang", kodeCabang)
      .whereNot("f.status", "void")
      .where("fc.is_active", 1)
      .whereNot("fc.charge_type", "deposit")
      .whereRaw("COALESCE(fc.business_date, DATE(fc.posted_at)) BETWEEN ? AND ?", [fromDate, toDate])
      .select(
        "fc.charge_type",
        DB.raw("COUNT(fc.id) as item_count"),
        DB.raw("COALESCE(SUM(fc.amount), 0) as total_amount")
      )
      .groupBy("fc.charge_type")
      .orderBy("total_amount", "desc");

    const totalRevenue = chargeRows.reduce((sum, r) => sum + toNumber(r.total_amount), 0);

    const chargeBreakdown = chargeRows.map((r) => {
      const amt = toNumber(r.total_amount);
      const pct = totalRevenue > 0 ? round((amt / totalRevenue) * 100, 1) : 0;
      return {
        charge_type: r.charge_type,
        label: CHARGE_TYPE_LABELS[r.charge_type] || r.charge_type,
        item_count: parseInt(r.item_count, 10) || 0,
        amount: round(amt, 2),
        percentage: pct,
      };
    });

    // 2. Komposisi Pembayaran per Payment Method
    const paymentRows = await DB("trx_payment as p")
      .join("trx_folio as f", "p.kode_folio", "f.kode_folio")
      .where("f.kode_cabang", kodeCabang)
      .where("p.is_active", 1)
      .whereRaw("DATE(p.paid_at) BETWEEN ? AND ?", [fromDate, toDate])
      .select(
        "p.payment_method",
        DB.raw("COUNT(p.id) as payment_count"),
        DB.raw("COALESCE(SUM(p.amount), 0) as total_amount")
      )
      .groupBy("p.payment_method")
      .orderBy("total_amount", "desc");

    const totalPayment = paymentRows.reduce((sum, r) => sum + toNumber(r.total_amount), 0);

    const paymentBreakdown = paymentRows.map((r) => {
      const amt = toNumber(r.total_amount);
      const pct = totalPayment > 0 ? round((amt / totalPayment) * 100, 1) : 0;
      return {
        payment_method: r.payment_method,
        label: PAYMENT_METHOD_LABELS[r.payment_method] || r.payment_method,
        payment_count: parseInt(r.payment_count, 10) || 0,
        amount: round(amt, 2),
        percentage: pct,
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data komposisi pendapatan berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        date_from: fromDate,
        date_to: toDate,
        total_revenue: round(totalRevenue, 2),
        total_payment_collected: round(totalPayment, 2),
        by_charge_type: chargeBreakdown,
        by_payment_method: paymentBreakdown,
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/revenue_breakdown.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat komposisi pendapatan." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
