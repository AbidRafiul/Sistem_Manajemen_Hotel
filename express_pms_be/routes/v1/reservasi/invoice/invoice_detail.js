/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file invoice_detail.js
 * @description Endpoint terpadu untuk mengambil/menerbitkan dokumen invoice resmi (Single Source of Truth)
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.0
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateSequence } from "../../components/tools/generateCode.js";
import { calculateFolioBilling } from "../../components/tools/billing_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const userId = req?.auth?.user_id || null;

  try {
    const { kode_folio, kode_reservation, kode_reservasi_room } = oPayload;

    if (!kode_folio && !kode_reservation && !kode_reservasi_room) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_folio, kode_reservation, atau kode_reservasi_room wajib dikirim",
        datetime: formatDateSystem(),
      });
    }

    // 1. Dapatkan kalkulasi billing lengkap dari Single Source of Truth
    const billing = await calculateFolioBilling({
      kode_folio,
      kode_reservation,
      kode_reservasi_room,
      trx: DB
    });

    if (!billing) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data transaksi/folio tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // 2. Kelola Nomor Invoice Unik di trx_fiscal_document (Idempoten: cetak ulang tidak membuat nomor baru)
    let fiscalDoc = await DB("trx_fiscal_document")
      .where("kode_folio", billing.folio.kode_folio)
      .where("doc_type", "invoice")
      .where("is_active", 1)
      .first();

    if (!fiscalDoc) {
      const invoiceNumber = await generateSequence("FMT-INVOICE", DB);
      const fiscalDocCode = `FDC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

      await DB("trx_fiscal_document").insert({
        kode_fiscal_document: fiscalDocCode,
        kode_cabang: billing.folio.kode_cabang,
        kode_folio: billing.folio.kode_folio,
        doc_type: "invoice",
        doc_number: invoiceNumber,
        amount: billing.folio.grand_total,
        issued_by: userId,
        issued_at: formatDateSystem(),
        created_by: userId,
        created_at: formatDateSystem(),
        is_active: 1
      });

      fiscalDoc = {
        kode_fiscal_document: fiscalDocCode,
        doc_number: invoiceNumber,
        issued_at: formatDateSystem()
      };
    }

    const invoiceData = {
      invoice_number: fiscalDoc.doc_number,
      issued_at: fiscalDoc.issued_at,
      hotel: billing.hotel,
      guest: billing.guest,
      reservation: billing.reservation,
      rooms: billing.rooms,
      charges: billing.charges,
      tax_breakdown: billing.tax_breakdown,
      payments: billing.payments,
      summary: {
        subtotal: billing.folio.subtotal,
        tax_amount: billing.folio.tax_amount,
        service_charge_amount: billing.folio.service_charge_amount,
        grand_total: billing.folio.grand_total,
        total_paid: billing.folio.total_paid,
        balance: billing.folio.balance,
        payment_status: billing.folio.payment_status,
        payment_status_label: billing.folio.payment_status_label,
        is_settled: billing.folio.is_settled,
        status_menginap: billing.reservation.status
      }
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data invoice berhasil dimuat",
      datetime: formatDateSystem(),
      data: invoiceData
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET INVOICE DETAIL",
      TableName: "trx_fiscal_document",
      file: "invoice_detail.js",
      username: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Terjadi kesalahan internal saat memuat invoice.",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
