/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file billing_helper.js
 * @description Single Source of Truth untuk kalkulasi tagihan, pajak, pembayaran, saldo, dan status
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.0
 */

import DB from "../../../../core/config/knex.js";

/**
 * Menghitung tagihan folio lengkap, rincian pajak, histori pembayaran, saldo, dan status akhir.
 * 
 * @param {Object} params
 * @param {string} [params.kode_folio] - Kode folio
 * @param {string} [params.kode_reservation] - Kode reservasi
 * @param {string} [params.kode_reservasi_room] - Kode reservasi room
 * @param {import("knex").Knex} [params.trx] - Instance transaksi knex (opsional)
 * @returns {Promise<Object>} Data kalkulasi billing komprehensif
 */
export const calculateFolioBilling = async ({ kode_folio, kode_reservation, kode_reservasi_room, trx = DB }) => {
  const db = trx;

  // 1. Cari Folio
  let folioQuery = db("trx_folio as f")
    .select(
      "f.*",
      "r.kode_reservasi",
      "r.kode_cabang",
      "r.check_in_date",
      "r.check_out_date",
      "r.booking_type",
      "r.status as reservation_status",
      "r.special_request",
      "g.kode_tamu",
      "g.full_name as guest_name",
      "g.phone as guest_phone",
      "g.email as guest_email",
      "g.id_type as guest_id_type",
      "g.id_number as guest_id_number"
    )
    .join("trx_reservation as r", "f.kode_reservation", "r.kode_reservasi")
    .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu");

  if (kode_folio) {
    folioQuery.where("f.kode_folio", kode_folio);
  } else if (kode_reservation) {
    folioQuery.where("f.kode_reservation", kode_reservation);
  } else if (kode_reservasi_room) {
    folioQuery.whereIn("f.kode_reservation", function () {
      this.select("kode_reservation")
        .from("trx_reservation_room")
        .where("kode_reservasi_room", kode_reservasi_room);
    });
  } else {
    throw new Error("calculateFolioBilling membutuhkan kode_folio, kode_reservation, atau kode_reservasi_room");
  }

  const folioInfo = await folioQuery.first();
  if (!folioInfo) {
    return null;
  }

  // 2. Ambil Semua Kamar Terkait Reservasi Ini
  const rooms = await db("trx_reservation_room as rr")
    .select(
      "rr.kode_reservasi_room",
      "rr.kode_tipe_kamar",
      "rr.kode_kamar",
      "rr.kode_rate_plan",
      "rr.rate_per_night",
      "rr.nights",
      "rr.status as room_stay_status",
      "mk.nomor_kamar",
      "tk.nama_tipe as nama_tipe_kamar",
      "rp.nama_paket as nama_rate_plan"
    )
    .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
    .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
    .leftJoin("mst_paket_harga as rp", "rr.kode_rate_plan", "rp.kode_paket_harga")
    .where("rr.kode_reservation", folioInfo.kode_reservation)
    .whereNull("rr.deleted_at")
    .where("rr.is_active", 1);

  // 3. Ambil Daftar Tagihan (Charges)
  const charges = await db("trx_folio_charge")
    .where("kode_folio", folioInfo.kode_folio)
    .andWhere("is_active", 1)
    .orderBy("created_at", "asc");

  // Subtotal dihitung dari akumulasi rincian charges aktif
  let subtotal = charges.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  // Fallback jika belum ada charge tersimpan di DB tapi kamar sudah terdaftar
  if (subtotal === 0 && rooms.length > 0) {
    subtotal = rooms.reduce((acc, r) => {
      const rate = parseFloat(r.rate_per_night) || 0;
      const n = parseInt(r.nights) || 1;
      return acc + (rate * n);
    }, 0);
  }

  // 4. Hitung Pajak & Service Charge Aktif dari Cabang
  const activeTaxes = await db("mst_tax")
    .where("kode_cabang", folioInfo.kode_cabang)
    .andWhere("is_active", 1)
    .whereNull("deleted_at")
    .orderBy("id", "asc");

  let totalTaxAmount = 0;
  let totalServiceCharge = 0;
  const taxBreakdown = [];

  activeTaxes.forEach((tax) => {
    const pct = parseFloat(tax.percentage) || 0;
    const nominal = Math.round(subtotal * (pct / 100));

    taxBreakdown.push({
      kode_pajak: tax.kode_pajak,
      name: tax.name,
      tax_type: tax.tax_type, // 'tax' | 'service_charge'
      percentage: pct,
      amount: nominal
    });

    if (tax.tax_type === "tax") {
      totalTaxAmount += nominal;
    } else if (tax.tax_type === "service_charge") {
      totalServiceCharge += nominal;
    } else {
      totalTaxAmount += nominal;
    }
  });

  const grandTotal = subtotal + totalTaxAmount + totalServiceCharge;

  // 5. Ambil Riwayat Pembayaran (Payments)
  const payments = await db("trx_payment")
    .where("kode_folio", folioInfo.kode_folio)
    .andWhere("is_active", 1)
    .orderBy("paid_at", "asc");

  const totalPaid = payments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const balance = grandTotal - totalPaid;

  // 6. Tentukan Status Pembayaran (Payment Status)
  let paymentStatus = "unpaid";
  let paymentStatusLabel = "Belum Dibayar";

  if (balance <= 0) {
    paymentStatus = "paid";
    paymentStatusLabel = "Lunas";
  } else if (totalPaid > 0) {
    paymentStatus = "partially_paid";
    paymentStatusLabel = "Dibayar Sebagian";
  }

  const isSettled = balance <= 0;

  // 7. Ambil Identitas Hotel/Cabang
  const cabangInfo = await db("mst_cabang")
    .where("kode_cabang", folioInfo.kode_cabang)
    .first();

  const configs = await db("config")
    .whereIn("kode", [
      "msNamaPerusahaan",
      "msAlamatPerusahaan",
      "msKotaPerusahaan",
      "msTeleponPerusahaan",
      "msCatatanKasir"
    ]);

  const configMap = {};
  configs.forEach(c => { configMap[c.kode] = c.keterangan; });

  const hotelProfile = {
    nama_hotel: cabangInfo?.nama_hotel || configMap.msNamaPerusahaan || "Hotel Management System",
    alamat: cabangInfo?.alamat || configMap.msAlamatPerusahaan || "",
    kota: configMap.msKotaPerusahaan || "",
    telepon: cabangInfo?.telepon || configMap.msTeleponPerusahaan || "",
    catatan_kasir: configMap.msCatatanKasir || "Terima kasih atas kunjungan Anda."
  };

  return {
    hotel: hotelProfile,
    folio: {
      kode_folio: folioInfo.kode_folio,
      kode_reservation: folioInfo.kode_reservation,
      kode_cabang: folioInfo.kode_cabang,
      folio_owner_type: folioInfo.folio_owner_type,
      status: folioInfo.status, // 'open' | 'closed' | 'void'
      subtotal,
      tax_amount: totalTaxAmount,
      service_charge_amount: totalServiceCharge,
      grand_total: grandTotal,
      total_paid: totalPaid,
      balance: balance,
      is_settled: isSettled,
      payment_status: paymentStatus,
      payment_status_label: paymentStatusLabel,
      closed_at: folioInfo.closed_at
    },
    reservation: {
      kode_reservasi: folioInfo.kode_reservasi,
      booking_type: folioInfo.booking_type,
      status: folioInfo.reservation_status,
      check_in_date: folioInfo.check_in_date,
      check_out_date: folioInfo.check_out_date,
      special_request: folioInfo.special_request
    },
    guest: {
      kode_tamu: folioInfo.kode_tamu,
      full_name: folioInfo.guest_name || "-",
      guest_name: folioInfo.guest_name || "-",
      phone: folioInfo.guest_phone || "-",
      guest_phone: folioInfo.guest_phone || "-",
      email: folioInfo.guest_email || "-",
      guest_email: folioInfo.guest_email || "-",
      id_type: folioInfo.guest_id_type || "-",
      guest_id_type: folioInfo.guest_id_type || "-",
      id_number: folioInfo.guest_id_number || "-",
      guest_id_number: folioInfo.guest_id_number || "-"
    },
    rooms,
    charges,
    tax_breakdown: taxBreakdown,
    payments
  };
};
