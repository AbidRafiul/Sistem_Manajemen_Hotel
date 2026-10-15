/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file task_submit_inspection.js
 * @description Submit hasil inspeksi kamar checkout (Clear, Minibar, Kerusakan/Denda, Lost & Found) dengan sinkronisasi otomatis ke Folio tamu
 * @author Antigravity
 * @created 2026-10-06
 * @version 1.0.0
 */

import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { ChangesLog, Logging } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { generateSequence } from "../components/tools/generateCode.js";
import { calculateFolioBilling } from "../components/tools/billing_helper.js";
import { assertBranchScope } from "../components/tools/scope_helper.js";

const router = express.Router();

router.post("/:id/submit-inspection", async (req, res) => {
  const { id } = req.params;
  const oPayload = req.body || {};
  const username = req?.auth?.username || "system";
  const user_id = req?.auth?.user_id || null;

  try {
    const task = await DB("trx_housekeeping_task")
      .where("kode_housekeeping_task", id)
      .where("is_active", 1)
      .whereNull("deleted_at")
      .first();

    if (!task) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Tugas inspeksi tidak ditemukan.",
        datetime: formatDateSystem()
      });
    }

    assertBranchScope(req, task.kode_cabang);

    if (task.status === "finished" || task.status === "supervisor_approved") {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Hasil inspeksi kamar untuk tugas ini sudah pernah disubmit sebelumnya.",
        datetime: formatDateSystem()
      });
    }

    const tNow = formatDateSystem();

    // 1. Cari data kamar & reservasi aktif
    let resRoom = null;
    if (task.kode_reservasi_room) {
      resRoom = await DB("trx_reservation_room")
        .where("kode_reservasi_room", task.kode_reservasi_room)
        .first();
    } else {
      resRoom = await DB("trx_reservation_room")
        .where("kode_kamar", task.kode_kamar)
        .where("status", "checked_in")
        .whereNull("deleted_at")
        .first();
    }

    let folio = null;
    if (resRoom) {
      folio = await DB("trx_folio")
        .where("kode_reservation", resRoom.kode_reservation)
        .where("status", "open")
        .first();
    }

    const minibarItems = Array.isArray(oPayload.minibar_items) ? oPayload.minibar_items : [];
    const damagedItems = Array.isArray(oPayload.damaged_items) ? oPayload.damaged_items : [];
    const lostAndFound = oPayload.lost_and_found && oPayload.lost_and_found.item_description
      ? oPayload.lost_and_found
      : null;

    let totalAdditionalCharges = 0;
    const createdCharges = [];
    let createdLostAndFound = null;

    await DB.transaction(async (trx) => {
      // Resolusi shift kasir aktif jika ada (opsional)
      let cashierShiftCode = null;
      if (user_id) {
        const activeShift = await trx("trx_cashier_shift")
          .where("user_id", user_id)
          .where("status", "open")
          .first();
        if (activeShift) cashierShiftCode = activeShift.kode_cashier_shift;
      }

      // A. Proses Konsumsi Minibar jika dilaporkan
      if (minibarItems.length > 0 && folio) {
        for (const item of minibarItems) {
          const qty = Number(item.qty) || 1;
          const unitPrice = Number(item.unit_price) || 0;
          const itemTotal = qty * unitPrice;

          if (itemTotal > 0) {
            totalAdditionalCharges += itemTotal;

            // 1. Posting ke trx_folio_charge
            const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
            await trx("trx_folio_charge").insert({
              kode_folio_charge: noFolioCharge,
              kode_folio: folio.kode_folio,
              charge_type: "minibar",
              description: `[Minibar] ${item.item_name} (${qty}x)`,
              qty: qty,
              unit_price: unitPrice,
              amount: itemTotal,
              ref_source_type: "checkout_inspection",
              kode_ref_source: id,
              kode_cashier_shift: cashierShiftCode,
              posted_by: user_id || 1,
              posted_at: tNow,
              created_by: user_id || 1,
              created_at: tNow,
              is_active: 1
            });

            // 2. Catat ke trx_minibar_consumption
            const noMinibar = await generateSequence("FMT-MINIBAR", trx);
            await trx("trx_minibar_consumption").insert({
              kode_minibar_consumption: noMinibar,
              kode_cabang: task.kode_cabang,
              kode_reservation_room: resRoom?.kode_reservasi_room || null,
              item_name: item.item_name,
              qty: qty,
              unit_price: unitPrice,
              amount: itemTotal,
              recorded_at_checkout: 1,
              kode_folio_charge: noFolioCharge,
              created_by: user_id || 1,
              created_at: tNow,
              is_active: 1
            });

            createdCharges.push({
              type: "minibar",
              name: item.item_name,
              qty,
              unit_price: unitPrice,
              amount: itemTotal,
              kode_folio_charge: noFolioCharge
            });
          }
        }
      }

      // B. Proses Kerusakan / Denda jika dilaporkan
      if (damagedItems.length > 0 && folio) {
        for (const dmg of damagedItems) {
          const qty = Number(dmg.qty) || 1;
          const chargeAmount = Number(dmg.charge_amount || dmg.amount) || 0;

          if (chargeAmount > 0) {
            totalAdditionalCharges += chargeAmount;

            const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
            const desc = `[Denda/Kerusakan] ${dmg.item_name}${dmg.notes ? ` - ${dmg.notes}` : ""}`;

            await trx("trx_folio_charge").insert({
              kode_folio_charge: noFolioCharge,
              kode_folio: folio.kode_folio,
              charge_type: "penalty",
              description: desc,
              qty: qty,
              unit_price: chargeAmount,
              amount: chargeAmount,
              ref_source_type: "checkout_inspection",
              kode_ref_source: id,
              kode_cashier_shift: cashierShiftCode,
              posted_by: user_id || 1,
              posted_at: tNow,
              created_by: user_id || 1,
              created_at: tNow,
              is_active: 1
            });

            createdCharges.push({
              type: "damage_penalty",
              name: dmg.item_name,
              qty,
              amount: chargeAmount,
              kode_folio_charge: noFolioCharge
            });
          }
        }
      }

      // C. Proses Barang Tertinggal (Lost & Found) jika dilaporkan
      if (lostAndFound) {
        const noLf = await generateSequence("FMT-LOSTFOUND", trx);
        const lfDesc = `${lostAndFound.item_description}${lostAndFound.location ? ` (Lokasi: ${lostAndFound.location})` : ""}`;

        await trx("trx_lost_and_found").insert({
          kode_lost_and_found: noLf,
          kode_cabang: task.kode_cabang,
          kode_kamar: task.kode_kamar,
          item_description: lfDesc,
          photo_url: lostAndFound.photo_url || null,
          found_by: user_id || 1,
          found_at: tNow,
          status: "stored",
          is_active: 1
        });

        createdLostAndFound = {
          kode_lost_and_found: noLf,
          item_description: lfDesc,
          found_at: tNow
        };
      }

      // D. Update Folio Subtotal & Grand Total jika ada charge tambahan
      let updatedBilling = null;
      if (folio && totalAdditionalCharges > 0) {
        updatedBilling = await calculateFolioBilling({
          kode_folio: folio.kode_folio,
          trx: trx
        });

        if (updatedBilling?.folio) {
          await trx("trx_folio")
            .where("kode_folio", folio.kode_folio)
            .update({
              subtotal: updatedBilling.folio.subtotal,
              tax_amount: updatedBilling.folio.tax_amount,
              service_charge_amount: updatedBilling.folio.service_charge_amount,
              grand_total: updatedBilling.folio.grand_total,
              updated_at: tNow,
              updated_by: user_id
            });
        }
      }

      // E. Update Task Status & Hasil Inspeksi
      const finalResult = (totalAdditionalCharges > 0 || oPayload.result === "with_charges")
        ? "with_charges"
        : "clear";

      const inspectionDetails = {
        result: finalResult,
        notes: oPayload.notes || "",
        inspector_name: username,
        inspected_at: tNow,
        minibar_items: minibarItems,
        damaged_items: damagedItems,
        lost_and_found: createdLostAndFound,
        total_additional_charges: totalAdditionalCharges
      };

      const taskUpdateData = {
        status: "finished",
        finished_at: tNow,
        inspection_result: finalResult,
        inspection_details: JSON.stringify(inspectionDetails),
        updated_at: tNow,
        updated_by: user_id
      };

      if (Array.isArray(oPayload.checklist)) {
        taskUpdateData.checklist = JSON.stringify(oPayload.checklist);
      }

      await trx("trx_housekeeping_task")
        .where("kode_housekeeping_task", id)
        .update(taskUpdateData);

      // F. Update status housekeeping kamar menjadi 'dirty' (menunggu proses checkout selesai & turnover cleaning)
      await trx("mst_kamar")
        .where("kode_kamar", task.kode_kamar)
        .update({
          housekeeping_status: "dirty",
          updated_at: tNow,
          updated_by: user_id
        });

      // Audit Trail
      await ChangesLog(
        {
          tableName: "trx_housekeeping_task",
          action: "UPDATE",
          referenceCode: id,
          description: `Submit hasil inspeksi checkout untuk kamar ${task.kode_kamar} (${finalResult})`,
          dataBefore: task,
          dataAfter: { ...task, ...taskUpdateData },
          user: username
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Hasil inspeksi kamar ${task.kode_kamar} berhasil dikirim ke Front Desk.`,
      datetime: tNow,
      data: {
        kode_housekeeping_task: id,
        kode_kamar: task.kode_kamar,
        inspection_result: totalAdditionalCharges > 0 ? "with_charges" : "clear",
        total_additional_charges: totalAdditionalCharges,
        charges: createdCharges,
        lost_and_found: createdLostAndFound,
        is_clear: totalAdditionalCharges === 0 && !createdLostAndFound
      }
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "SUBMIT CHECKOUT INSPECTION",
      TableName: "trx_housekeeping_task",
      file: "task_submit_inspection.js",
      username: username
    });

    const httpStatus = error.statusCode || error.status || 500;
    return res.status(httpStatus).json({
      status: status.GAGAL,
      message: error.statusCode || error.status ? error.message : "Terjadi kesalahan sistem saat mengirimkan hasil inspeksi kamar.",
      datetime: formatDateSystem(),
      data: null
    });
  }
});

export default router;
