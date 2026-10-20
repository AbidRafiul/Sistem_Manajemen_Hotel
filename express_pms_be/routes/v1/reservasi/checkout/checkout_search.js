/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file checkout_search.js
 * @description Pencarian reservasi kamar aktif (checked_in) beserta saldo dan rincian billing akurat
 * @author Antigravity
 * @created 2026-09-18
 * @version 1.0.2
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { resolveEffectiveBranch } from "../../components/tools/scope_helper.js";
import { calculateFolioBilling } from "../../components/tools/billing_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const effective = resolveEffectiveBranch(req, oPayload.kode_cabang);
  const kode_cabang = effective.kodeCabang;

  try {
    let query = DB("trx_reservation_room as rr")
      .select(
        "rr.kode_reservasi_room",
        "rr.kode_reservation",
        "rr.kode_tipe_kamar",
        "tk.nama_tipe as nama_tipe_kamar",
        "rr.kode_kamar",
        "mk.nomor_kamar",
        "rr.rate_per_night",
        "rr.nights",
        "g.kode_tamu",
        "g.full_name as guest_name",
        "g.phone as guest_phone",
        "r.check_in_date",
        "r.check_out_date",
        "r.booking_type",
        "r.kode_cabang",
        "f.kode_folio",
        "f.subtotal",
        "f.tax_amount",
        "f.service_charge_amount",
        "f.grand_total"
      )
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .leftJoin("mst_guest as g", "r.kode_guest", "g.kode_tamu")
      .leftJoin("mst_kamar as mk", "rr.kode_kamar", "mk.kode_kamar")
      .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("trx_folio as f", function () {
        this.on("rr.kode_reservation", "=", "f.kode_reservation")
            .andOn("f.status", "=", DB.raw("?", ["open"]));
      })
      .where("rr.status", "checked_in")
      .whereNull("rr.deleted_at")
      .orderBy("mk.nomor_kamar", "asc");

    if (kode_cabang) {
      query.where("r.kode_cabang", kode_cabang);
    }

    if (oPayload.keyword) {
      const kw = `%${oPayload.keyword}%`;
      query.andWhere((q) => {
        q.where("rr.kode_kamar", "like", kw)
          .orWhere("mk.nomor_kamar", "like", kw)
          .orWhere("g.full_name", "like", kw)
          .orWhere("rr.kode_reservasi_room", "like", kw)
          .orWhere("r.kode_reservasi", "like", kw)
          .orWhere("f.kode_folio", "like", kw);
      });
    }

    const rows = await query.limit(50);

    // Ambil pembayaran untuk semua folio yang ditemukan
    const folioCodes = rows.map((r) => r.kode_folio).filter(Boolean);
    let paymentsMap = {};

    if (folioCodes.length > 0) {
      const payments = await DB("trx_payment")
        .select("kode_folio")
        .sum("amount as total_paid")
        .whereIn("kode_folio", folioCodes)
        .where("is_active", 1)
        .groupBy("kode_folio");

      payments.forEach((p) => {
        paymentsMap[p.kode_folio] = parseFloat(p.total_paid || 0);
      });
    }

    // Ambil dokumen invoice jika sudah terbit
    let invoiceMap = {};
    if (folioCodes.length > 0) {
      const fiscalDocs = await DB("trx_fiscal_document")
        .select("kode_folio", "doc_number")
        .whereIn("kode_folio", folioCodes)
        .where("doc_type", "invoice")
        .where("is_active", 1);

      fiscalDocs.forEach((d) => {
        invoiceMap[d.kode_folio] = d.doc_number;
      });
    }

    // Ambil data tugas inspeksi checkout aktif terbaru per kamar
    const roomCodes = rows.map((r) => r.kode_kamar).filter(Boolean);
    let inspectionTaskMap = {};
    if (roomCodes.length > 0) {
      const latestTaskSub = DB("trx_housekeeping_task")
        .select("kode_kamar", DB.raw("MAX(id) as max_task_id"))
        .where("task_type", "inspection")
        .whereIn("status", ["assigned", "in_progress", "finished"])
        .where("is_active", 1)
        .whereNull("deleted_at")
        .whereIn("kode_kamar", roomCodes)
        .groupBy("kode_kamar");

      const inspectTasks = await DB("trx_housekeeping_task as t")
        .join(latestTaskSub.as("lt"), "t.id", "lt.max_task_id")
        .leftJoin("mst_user as u", "t.assigned_to", "u.id")
        .select(
          "t.id",
          "t.kode_housekeeping_task",
          "t.kode_kamar",
          "t.task_type",
          "t.status",
          "t.priority",
          "t.inspection_result",
          "t.inspection_details",
          "t.checklist",
          "t.notes",
          "t.created_at",
          "t.finished_at",
          "u.fullname as pic_name"
        );

      inspectTasks.forEach((it) => {
        let parsedDetails = null;
        if (it.inspection_details) {
          try {
            parsedDetails = typeof it.inspection_details === "string" ? JSON.parse(it.inspection_details) : it.inspection_details;
          } catch {
            parsedDetails = null;
          }
        }
        let parsedChecklist = null;
        if (it.checklist) {
          try {
            parsedChecklist = typeof it.checklist === "string" ? JSON.parse(it.checklist) : it.checklist;
          } catch {
            parsedChecklist = null;
          }
        }
        inspectionTaskMap[it.kode_kamar] = {
          ...it,
          inspection_details: parsedDetails,
          checklist: parsedChecklist
        };
      });
    }

    // Group rows by folio / reservation
    const folioGroupMap = new Map();

    for (const row of rows) {
      const key = row.kode_folio || row.kode_reservation;
      const tipeName = row.nama_tipe_kamar || row.nama_tipe || "Kamar";
      if (!folioGroupMap.has(key)) {
        folioGroupMap.set(key, {
          kode_folio: row.kode_folio,
          kode_reservation: row.kode_reservation,
          kode_reservasi_room: row.kode_reservasi_room,
          kode_kamar: row.kode_kamar,
          nomor_kamar: row.nomor_kamar,
          guest_name: row.guest_name,
          guest_phone: row.guest_phone,
          nama_tipe: tipeName,
          check_in_date: row.check_in_date,
          check_out_date: row.check_out_date,
          rooms: []
        });
      }

      const group = folioGroupMap.get(key);
      group.rooms.push({
        kode_reservasi_room: row.kode_reservasi_room,
        kode_kamar: row.kode_kamar,
        nomor_kamar: row.nomor_kamar,
        nama_tipe: tipeName,
        rate_per_night: parseFloat(row.rate_per_night || 0),
        nights: parseInt(row.nights || 1, 10),
        subtotal: (parseFloat(row.rate_per_night || 0)) * (parseInt(row.nights || 1, 10)),
        inspection_task: inspectionTaskMap[row.kode_kamar] || null
      });
    }

    const data = await Promise.all(
      Array.from(folioGroupMap.values()).map(async (group) => {
        const targetRoomIds = group.rooms.map((r) => r.kode_reservasi_room);

        // Dapatkan kalkulasi billing presisi untuk kamar-kamar yang checked_in ini
        const billing = await calculateFolioBilling({
          kode_folio: group.kode_folio,
          target_room_ids: targetRoomIds,
          trx: DB
        });

        const subtotal = billing?.folio?.subtotal || 0;
        const taxAmount = billing?.folio?.tax_amount || 0;
        const serviceCharge = billing?.folio?.service_charge_amount || 0;
        const grandTotal = billing?.folio?.grand_total || 0;
        const totalPaid = billing?.folio?.total_paid || (paymentsMap[group.kode_folio] || 0);
        const balance = billing?.folio?.balance ?? Math.max(0, grandTotal - totalPaid);
        const isSettled = billing?.folio?.is_settled ?? (balance <= 0);

        const roomNumbers = group.rooms.map((r) => r.nomor_kamar).filter(Boolean);
        const roomTypes = [...new Set(group.rooms.map((r) => r.nama_tipe).filter(Boolean))];

        // Tentukan status inspeksi untuk grup kamar
        const groupTasks = group.rooms.map((r) => r.inspection_task).filter(Boolean);
        const primaryTask = groupTasks.length > 0 ? groupTasks[0] : null;

        let inspectionStatus = "not_requested";
        if (primaryTask) {
          if (primaryTask.status === "assigned" || primaryTask.status === "in_progress") {
            inspectionStatus = "in_progress";
          } else if (primaryTask.status === "finished") {
            inspectionStatus = primaryTask.inspection_result === "with_charges" ? "with_charges" : "clear";
          }
        }

        return {
          ...group,
          subtotal,
          tax_amount: taxAmount,
          service_charge_amount: serviceCharge,
          room_count: group.rooms.length,
          nomor_kamar: roomNumbers.join(", "),
          nama_tipe: roomTypes.join(", "),
          current_grand_total: grandTotal,
          total_charges: grandTotal,
          total_tax: taxAmount + serviceCharge,
          grand_total: grandTotal,
          total_paid: totalPaid,
          balance: balance,
          is_settled: isSettled,
          invoice_number: invoiceMap[group.kode_folio] || null,
          billing_status: isSettled ? "settled" : "outstanding",
          inspection_status: inspectionStatus,
          active_inspection_task: primaryTask,
          inspection_tasks: groupTasks,
          charges: billing?.charges || [],
          payments: billing?.payments || [],
          tax_details: billing?.tax_breakdown || []
        };
      })
    );

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data checkout ditemukan",
      datetime: formatDateSystem(),
      data: data,
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SEARCH CHECKOUT",
      TableName: "trx_reservation_room",
      file: "checkout_search.js",
      username: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan sistem saat mencari data checkout.",
      datetime: formatDateSystem(),
      data: null,
    });
  }
});

export default router;
