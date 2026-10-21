/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file night_audit_report_helper.js
 * @description Generator snapshot laporan standar Night Audit:
 *              - Daily Revenue / Manager Report (Occupancy, ADR, RevPAR)
 *              - Trial Balance (Total charges debit vs payments credit)
 *              - In-House Guest List
 *              - Arrival / Departure / No-Show
 *              - Room Status & Housekeeping
 *              - Exception Report
 *              - Deposit & City Ledger
 *              Disimpan sebagai snapshot JSON per audit run agar nilai historis konsisten.
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import DB from "../../../../core/config/knex.js";
import { formatYmd } from "./business_date_helper.js";

/**
 * Menghasilkan snapshot lengkap seluruh laporan Night Audit untuk business date terkait.
 * @param {Object} params
 * @param {string} params.auditCode
 * @param {string} params.kodeCabang
 * @param {string} params.businessDate - Format YYYY-MM-DD
 * @returns {Promise<Object>} Object berisi snapshot 7 laporan wajib
 */
export const generateNightAuditReports = async ({ auditCode, kodeCabang, businessDate }) => {
  // 1. Ambil data total kamar di cabang untuk menghitung Occupancy, ADR, RevPAR
  const totalKamarBranch = await DB("mst_kamar")
    .where("kode_cabang", kodeCabang)
    .where("is_active", 1)
    .whereNull("deleted_at")
    .count("id as total");

  const totalRoomsCapacity = parseInt(totalKamarBranch[0]?.total || 0, 10) || 1;

  // 2. Ambil seluruh charges yang terjadi pada business date ini
  const chargesOnDate = await DB("trx_folio_charge as fc")
    .join("trx_folio as f", "fc.kode_folio", "f.kode_folio")
    .where("f.kode_cabang", kodeCabang)
    .where("fc.business_date", businessDate)
    .where("fc.is_active", 1)
    .select(
      "fc.id",
      "fc.charge_type",
      "fc.description",
      "fc.amount",
      "fc.source",
      "fc.kode_folio",
      "f.kode_reservation"
    );

  // Akumulasi pendapatan per kategori
  let roomRevenue = 0;
  let fbRevenue = 0;
  let otherRevenue = 0;

  for (const c of chargesOnDate) {
    const amt = parseFloat(c.amount || 0);
    if (c.charge_type === "room") {
      roomRevenue += amt;
    } else if (c.charge_type === "restaurant" || c.charge_type === "room_service") {
      fbRevenue += amt;
    } else {
      otherRevenue += amt;
    }
  }

  // Pajak & Service dari audit items
  const auditItems = await DB("trx_night_audit_item")
    .where("kode_night_audit", auditCode);

  let totalTax = 0;
  let totalService = 0;
  let occupiedRoomsCount = 0;

  for (const itm of auditItems) {
    if (itm.status === "POSTED" || itm.status === "SKIPPED") {
      occupiedRoomsCount++;
    }
    totalTax += parseFloat(itm.tax_amount || 0);
    totalService += parseFloat(itm.service_charge_amount || 0);
  }

  const totalRevenue = roomRevenue + totalTax + totalService + fbRevenue + otherRevenue;

  // KPI Hotel: Occupancy, ADR, RevPAR
  const occupancyPercentage = Math.round((occupiedRoomsCount / totalRoomsCapacity) * 10000) / 100;
  const adr = occupiedRoomsCount > 0 ? Math.round(roomRevenue / occupiedRoomsCount) : 0;
  const revpar = Math.round(roomRevenue / totalRoomsCapacity);

  // 3. Daily Revenue Report
  const dailyRevenueReport = {
    business_date: businessDate,
    kode_cabang: kodeCabang,
    total_rooms_capacity: totalRoomsCapacity,
    occupied_rooms: occupiedRoomsCount,
    occupancy_percentage: occupancyPercentage,
    adr: adr,
    revpar: revpar,
    revenue: {
      room_revenue: roomRevenue,
      tax_amount: totalTax,
      service_charge_amount: totalService,
      fb_revenue: fbRevenue,
      other_revenue: otherRevenue,
      grand_total_revenue: totalRevenue
    }
  };

  // 4. Trial Balance Report (Debit = Total Charges vs Credit = Total Payments)
  const paymentsOnDate = await DB("trx_payment as p")
    .join("trx_folio as f", "p.kode_folio", "f.kode_folio")
    .where("f.kode_cabang", kodeCabang)
    .whereRaw("DATE(p.paid_at) = ?", [businessDate])
    .where("p.is_active", 1)
    .select("p.payment_method", "p.amount");

  let totalDebitCharges = totalRevenue;
  let totalCreditPayments = paymentsOnDate.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const paymentsByMethod = {};
  for (const p of paymentsOnDate) {
    const m = p.payment_method;
    paymentsByMethod[m] = (paymentsByMethod[m] || 0) + parseFloat(p.amount || 0);
  }

  const trialBalanceReport = {
    business_date: businessDate,
    kode_cabang: kodeCabang,
    total_debit_charges: totalDebitCharges,
    total_credit_payments: totalCreditPayments,
    net_difference: totalDebitCharges - totalCreditPayments,
    payments_by_method: paymentsByMethod
  };

  // 5. In-House Guest List
  const inhouseGuests = await DB("trx_reservation as r")
    .join("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
    .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
    .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
    .leftJoin("trx_folio as f", "r.kode_reservasi", "f.kode_reservation")
    .where("r.kode_cabang", kodeCabang)
    .where("r.status", "checked_in")
    .where("rr.status", "checked_in")
    .select(
      "r.kode_reservasi",
      "rr.kode_reservasi_room",
      "rr.kode_kamar",
      "mk.nomor_kamar",
      "g.full_name as guest_name",
      "r.check_in_date",
      "r.check_out_date",
      "rr.rate_per_night",
      "f.kode_folio",
      "f.grand_total as folio_grand_total"
    );

  const inhouseListReport = inhouseGuests.map((ig) => ({
    kode_reservasi: ig.kode_reservasi,
    kode_kamar: ig.kode_kamar,
    nomor_kamar: ig.nomor_kamar,
    guest_name: ig.guest_name,
    check_in_date: formatYmd(ig.check_in_date),
    check_out_date: formatYmd(ig.check_out_date),
    rate_per_night: parseFloat(ig.rate_per_night || 0),
    kode_folio: ig.kode_folio,
    folio_grand_total: parseFloat(ig.folio_grand_total || 0)
  }));

  // 6. Arrival / Departure / No-Show Recap
  const arrivalsCount = await DB("trx_reservation")
    .where("kode_cabang", kodeCabang)
    .where("check_in_date", businessDate)
    .count("id as total");

  const departuresCount = await DB("trx_reservation")
    .where("kode_cabang", kodeCabang)
    .where("check_out_date", businessDate)
    .count("id as total");

  const noshowCount = await DB("trx_reservation")
    .where("kode_cabang", kodeCabang)
    .where("check_in_date", businessDate)
    .where("status", "no_show")
    .count("id as total");

  const movementReport = {
    business_date: businessDate,
    total_arrivals: parseInt(arrivalsCount[0]?.total || 0, 10),
    total_departures: parseInt(departuresCount[0]?.total || 0, 10),
    total_noshow: parseInt(noshowCount[0]?.total || 0, 10)
  };

  // 7. Room Status & Housekeeping Summary
  const roomStatusSummary = await DB("mst_kamar")
    .where("kode_cabang", kodeCabang)
    .where("is_active", 1)
    .whereNull("deleted_at")
    .groupBy("occupancy_status", "housekeeping_status")
    .select("occupancy_status", "housekeeping_status")
    .count("id as count");

  // 8. Exception Report (Failed postings & acknowledged warnings)
  const failedItems = auditItems.filter((i) => i.status === "FAILED");
  const auditRow = await DB("trx_night_audit").where("kode_night_audit", auditCode).first();
  let warningsAck = [];
  try {
    warningsAck = JSON.parse(auditRow?.warnings_acknowledged || "[]");
  } catch {
    warningsAck = [];
  }

  const exceptionReport = {
    total_failed_items: failedItems.length,
    failed_items: failedItems.map((f) => ({
      kode_reservasi_room: f.kode_reservasi_room,
      kode_kamar: f.kode_kamar,
      error_message: f.error_message
    })),
    acknowledged_warnings: warningsAck
  };

  // 9. Deposit & City Ledger (Folio saldo piutang & deposit)
  // Sesuai standar akuntansi perhotelan (USALI):
  // - Guest Ledger: Saldo piutang tamu yang BENAR-BENAR SEDANG MENGINAP (in-house) pada saat audit.
  // - City Ledger: Saldo piutang korporasi dari tamu yang telah check-out (direct billing).
  // - Advance Deposit: Uang muka yang diterima untuk reservasi masa depan (future bookings).

  const inhouseFolioCodes = inhouseListReport
    .map((g) => g.kode_folio)
    .filter(Boolean);

  let guestLedgerTotal = 0;
  let cityLedgerTotal = 0;

  if (inhouseFolioCodes.length > 0) {
    const uniqueFolioCodes = [...new Set(inhouseFolioCodes)];
    for (const fCode of uniqueFolioCodes) {
      const folioCharges = await DB("trx_folio_charge")
        .where("kode_folio", fCode)
        .where("is_active", 1)
        .where(function () {
          this.where("business_date", "<=", businessDate).orWhereNull("business_date");
        })
        .sum("amount as total_charges");

      const folioPayments = await DB("trx_payment")
        .where("kode_folio", fCode)
        .where("is_active", 1)
        .sum("amount as total_payments");

      const cAmt = parseFloat(folioCharges[0]?.total_charges || 0);
      const pAmt = parseFloat(folioPayments[0]?.total_payments || 0);
      guestLedgerTotal += Math.max(0, cAmt - pAmt);
    }
  }

  // City Ledger: Piutang korporasi dari folio yang dialihkan ke corporate account / bill to company
  const corporateFolios = await DB("trx_folio as f")
    .join("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
    .where("f.kode_cabang", kodeCabang)
    .where("f.folio_owner_type", "corporate")
    .where("f.status", "open")
    .where("r.status", "checked_out")
    .select("f.kode_folio", "f.grand_total");

  for (const cf of corporateFolios) {
    const cfPayments = await DB("trx_payment")
      .where("kode_folio", cf.kode_folio)
      .where("is_active", 1)
      .sum("amount as total_payments");
    const gTot = parseFloat(cf.grand_total || 0);
    const pTot = parseFloat(cfPayments[0]?.total_payments || 0);
    cityLedgerTotal += Math.max(0, gTot - pTot);
  }

  // Advance Deposit: Pembayaran uang muka untuk reservasi mendatang (status confirmed / booked)
  const advanceDepositRows = await DB("trx_payment as p")
    .join("trx_folio as f", "p.kode_folio", "f.kode_folio")
    .join("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
    .where("f.kode_cabang", kodeCabang)
    .where("p.is_active", 1)
    .where("r.check_in_date", ">", businessDate)
    .whereIn("r.status", ["confirmed", "booked"])
    .sum("p.amount as total_advance");

  const advanceDepositTotal = parseFloat(advanceDepositRows[0]?.total_advance || 0);

  const ledgerReport = {
    guest_ledger_total: guestLedgerTotal,
    city_ledger_total: cityLedgerTotal,
    advance_deposit_total: advanceDepositTotal,
    total_open_receivables: guestLedgerTotal + cityLedgerTotal
  };

  return {
    daily_revenue: dailyRevenueReport,
    trial_balance: trialBalanceReport,
    inhouse_guest_list: inhouseListReport,
    guest_movement: movementReport,
    room_status_housekeeping: roomStatusSummary,
    exception_report: exceptionReport,
    deposit_and_ledger: ledgerReport
  };
};
