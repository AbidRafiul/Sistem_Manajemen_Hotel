/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file alerts.js
 * @description POST /api/v1/dashboard/alerts - Deteksi anomali operasional & kepatuhan:
 *              Night audit tertinggal/gagal, overdue checkout, shift kasir terbuka lama,
 *              unsettled folio, no-show berisiko, dan tiket perbaikan maintenance terbuka.
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
  diffDays,
  getBranchCalendarDate,
  getBusinessDate,
  logDashboardError,
} from "../components/tools/dashboard_metrics.js";

const router = express.Router();

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
    const calendarDate = await getBranchCalendarDate(kodeCabang);

    const alerts = [];

    // 1. Alert Night Audit Tertinggal
    const daysBehind = diffDays(businessDate, calendarDate);
    if (daysBehind > 0) {
      alerts.push({
        id: "audit_lagging",
        level: "danger",
        title: "Night Audit Tertinggal",
        message: `Business Date (${businessDate}) tertinggal ${daysBehind} hari dari tanggal kalender properti (${calendarDate}). Jalankan Night Audit untuk menutup hari operasional.`,
        count: daysBehind,
        action_label: "Buka Night Audit",
        action_route: "/night_audit",
        items: [],
      });
    }

    // 2. Alert Status Run Night Audit Terakhir Bermasalah
    const lastAudit = await DB("trx_night_audit")
      .where("kode_cabang", kodeCabang)
      .orderBy("id", "desc")
      .first();

    if (lastAudit && ["failed", "completed_with_exceptions"].includes(lastAudit.status)) {
      alerts.push({
        id: "audit_failed",
        level: "danger",
        title: "Night Audit Membutuhkan Tindakan",
        message: `Eksekusi Night Audit (${lastAudit.kode_night_audit}) berstatus '${lastAudit.status}'. Periksa log transaksi yang gagal atau tidak ter-posting.`,
        count: 1,
        action_label: "Tinjau Audit",
        action_route: "/night_audit",
        items: [
          {
            kode_night_audit: lastAudit.kode_night_audit,
            business_date: formatDateSystem(new Date(lastAudit.business_date), "yyyy-MM-dd"),
            status: lastAudit.status,
            total_failed: lastAudit.total_failed || 0,
          },
        ],
      });
    }

    // 3. Alert Tamu Lewat Jadwal Checkout (Overdue Checkout)
    const overdueDepartures = await DB("trx_reservation as r")
      .join("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
      .leftJoin("mst_kamar as k", "rr.kode_kamar", "k.kode_kamar")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .where("r.kode_cabang", kodeCabang)
      .where("r.status", "checked_in")
      .where("rr.status", "checked_in")
      .whereRaw("DATE(r.check_out_date) < ?", [businessDate])
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .select(
        "r.kode_reservasi",
        "rr.kode_reservasi_room",
        "k.nomor_kamar",
        "g.full_name as guest_name",
        DB.raw("DATE_FORMAT(r.check_out_date, '%Y-%m-%d') as check_out_date")
      )
      .limit(10);

    if (overdueDepartures.length > 0) {
      alerts.push({
        id: "overdue_checkout",
        level: "danger",
        title: "Tamu Lewat Jadwal Checkout",
        message: `Terdapat ${overdueDepartures.length} kamar in-house yang tanggal checkout-nya telah terlewati dari Business Date aktif (${businessDate}). Lakukan perpanjangan stay atau proses checkout.`,
        count: overdueDepartures.length,
        action_label: "Proses Checkout",
        action_route: "/checkout",
        items: overdueDepartures,
      });
    }

    // 4. Alert Shift Kasir Terbuka Terlalu Lama (> 12 jam)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const longOpenShifts = await DB("trx_cashier_shift as cs")
      .leftJoin("mst_cashier_counter as cc", "cs.kode_cashier_counter", "cc.kode_counter")
      .leftJoin("mst_user as u", "cs.user_id", "u.id")
      .where("cs.kode_cabang", kodeCabang)
      .where("cs.status", "open")
      .where("cs.opened_at", "<", twelveHoursAgo)
      .where("cs.is_active", 1)
      .select(
        "cs.kode_cashier_shift",
        "cs.sesi",
        "cc.name as nama_counter",
        "u.fullname as nama_kasir",
        "cs.opened_at",
        DB.raw("ROUND(TIMESTAMPDIFF(MINUTE, cs.opened_at, NOW()) / 60, 1) as hours_open")
      )
      .limit(10);

    if (longOpenShifts.length > 0) {
      alerts.push({
        id: "cashier_shift_overdue",
        level: "warning",
        title: "Sesi Kasir Terbuka > 12 Jam",
        message: `Terdapat ${longOpenShifts.length} shift kasir yang masih berstatus 'open' melebihi 12 jam. Lakukan serah terima atau penutupan kasir.`,
        count: longOpenShifts.length,
        action_label: "Kelola Shift Kasir",
        action_route: "/kasir_shift",
        items: longOpenShifts.map((s) => ({
          kode_cashier_shift: s.kode_cashier_shift,
          nama_kasir: s.nama_kasir || "Kasir",
          counter: s.nama_counter || "-",
          hours_open: `${s.hours_open} jam`,
          opened_at: formatDateSystem(new Date(s.opened_at), "yyyy-MM-dd HH:mm"),
        })),
      });
    }

    // 5. Alert Folio Belum Ditutup Setelah Tamu Checkout (Unsettled Folio)
    const unsettledFolios = await DB("trx_folio as f")
      .join("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .where("f.kode_cabang", kodeCabang)
      .where("r.status", "checked_out")
      .where("f.status", "open")
      .where("f.is_active", 1)
      .whereNull("f.deleted_at")
      .select(
        "f.kode_folio",
        "r.kode_reservasi",
        "g.full_name as guest_name",
        "f.grand_total"
      )
      .limit(10);

    if (unsettledFolios.length > 0) {
      alerts.push({
        id: "unsettled_folio",
        level: "warning",
        title: "Folio Belum Tertutup",
        message: `Terdapat ${unsettledFolios.length} folio tamu yang reservasi-nya sudah checkout namun folio masih berstatus 'open'.`,
        count: unsettledFolios.length,
        action_label: "Tinjau Billing",
        action_route: "/checkout",
        items: unsettledFolios,
      });
    }

    // 6. Alert Potensi No-Show (Check-in Date Terlewat tapi Belum Datang)
    const potentialNoShows = await DB("trx_reservation as r")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .where("r.kode_cabang", kodeCabang)
      .whereIn("r.status", ["reserved", "confirmed"])
      .whereRaw("DATE(r.check_in_date) < ?", [businessDate])
      .where("r.is_active", 1)
      .whereNull("r.deleted_at")
      .select(
        "r.kode_reservasi",
        "g.full_name as guest_name",
        DB.raw("DATE_FORMAT(r.check_in_date, '%Y-%m-%d') as check_in_date")
      )
      .limit(10);

    if (potentialNoShows.length > 0) {
      alerts.push({
        id: "potential_no_show",
        level: "warning",
        title: "Reservasi Potensi No-Show",
        message: `Terdapat ${potentialNoShows.length} reservasi dengan tanggal check-in sebelum Business Date aktif yang belum di-check in atau dibatalkan.`,
        count: potentialNoShows.length,
        action_label: "Tinjau di Night Audit",
        action_route: "/night_audit",
        items: potentialNoShows,
      });
    }

    // 7. Alert Tiket Maintenance Kamar Terbuka
    const openTickets = await DB("trx_maintenance_ticket as mt")
      .leftJoin("mst_kamar as k", "mt.kode_kamar", "k.kode_kamar")
      .where("mt.kode_cabang", kodeCabang)
      .whereIn("mt.status", ["open", "in_progress"])
      .where("mt.is_active", 1)
      .select(
        "mt.kode_maintenance_ticket",
        "k.nomor_kamar",
        "mt.issue_type",
        "mt.status",
        "mt.description"
      )
      .limit(10);

    if (openTickets.length > 0) {
      alerts.push({
        id: "open_maintenance",
        level: "info",
        title: "Kamar Dalam Perbaikan / Tiket Terbuka",
        message: `Terdapat ${openTickets.length} tiket perbaikan kamar fisik yang sedang open atau in-progress.`,
        count: openTickets.length,
        action_label: "Lihat Board Kamar",
        action_route: "/housekeeping/room_status_board",
        items: openTickets,
      });
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data peringatan operasional berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        kode_cabang: kodeCabang,
        nama_hotel: namaHotel,
        business_date: businessDate,
        total_alerts: alerts.length,
        danger_count: alerts.filter((a) => a.level === "danger").length,
        warning_count: alerts.filter((a) => a.level === "warning").length,
        info_count: alerts.filter((a) => a.level === "info").length,
        alerts,
      },
    });
  } catch (error) {
    await logDashboardError(error, req, "dashboard/alerts.js");
    const httpStatus = error.status || error.statusCode || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: httpStatus === 500 ? "Terjadi kesalahan saat memuat alert dashboard." : error.message,
      datetime: formatDateSystem(),
    });
  }
});

export default router;
