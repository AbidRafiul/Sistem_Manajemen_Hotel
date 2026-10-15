/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file kpi.js
 * @description POST /api/v1/dashboard/kpi - KPI utama hotel (Occupancy, ADR, RevPAR, Revenue)
 *              untuk business date aktif, Month-To-Date, dan pembanding periode yang sama bulan lalu.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

import express from "express";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";
import {
  addDays,
  computeKpi,
  getBusinessDate,
  getPaymentsCollected,
  getPostedRevenue,
  getRoomInventory,
  getStayNights,
  logDashboardError,
  pctChange,
  previousMonthRange,
  startOfMonth,
  sumStayNights,
} from "../components/tools/dashboard_metrics.js";

const router = express.Router();

/** Menghitung blok KPI untuk rentang [from, toInclusive]. */
const buildPeriodKpi = async (kodeCabang, from, toInclusive, availablePerNight) => {
  const nightsMap = await getStayNights(kodeCabang, from, addDays(toInclusive, 1));
  const { sold, revenue } = sumStayNights(nightsMap);
  const availableTotal = availablePerNight * nightsMap.size;

  const [totalRevenue, paymentCollected] = await Promise.all([
    getPostedRevenue(kodeCabang, from, toInclusive),
    getPaymentsCollected(kodeCabang, from, toInclusive),
  ]);

  return {
    from,
    to: toInclusive,
    days: nightsMap.size,
    ...computeKpi({ sold, revenue, available: availableTotal }),
    total_revenue: totalRevenue,
    payment_collected: paymentCollected,
  };
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
    const inventory = await getRoomInventory(kodeCabang);

    const mtdFrom = startOfMonth(businessDate);
    const prevRange = previousMonthRange(mtdFrom, businessDate);

    // Catatan: Rooms Available historis memakai snapshot inventory saat ini,
    // karena status OOO per tanggal belum tercatat historisnya.
    const [today, mtd, prevMtd] = await Promise.all([
      buildPeriodKpi(kodeCabang, businessDate, businessDate, inventory.available),
      buildPeriodKpi(kodeCabang, mtdFrom, businessDate, inventory.available),
      buildPeriodKpi(kodeCabang, prevRange.from, prevRange.to, inventory.available),
    ]);

    const change = {
      occupancy_pct: pctChange(mtd.occupancy_pct, prevMtd.occupancy_pct),
      adr: pctChange(mtd.adr, prevMtd.adr),
      revpar: pctChange(mtd.revpar, prevMtd.revpar),
      room_revenue: pctChange(mtd.room_revenue, prevMtd.room_revenue),
      total_revenue: pctChange(mtd.total_revenue, prevMtd.total_revenue),
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: "KPI dashboard berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        inventory,
        today,
        mtd,
        prev_mtd: prevMtd,
        change_vs_prev_mtd: change,
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/kpi.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat KPI dashboard." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
