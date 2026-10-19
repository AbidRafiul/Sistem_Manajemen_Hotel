/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_update.js
 * @description POST /api/v1/event/update - Memperbarui pemesanan ruang event (BEO)
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { ChangesLog, validatePayload } from "../components/tools/servertool.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "system";

  try {
    if (!oPayload || !oPayload.kode_reservasi_event) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Parameter kode_reservasi_event wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const cValidation = await validatePayload(
      {
        kode_reservasi_event: Joi.string().required().label("Kode Reservasi Event"),
        nama_event: Joi.string().required().label("Nama Event"),
        kode_ruang_event: Joi.string().required().label("Ruang Event"),
        kode_tamu: Joi.string().required().label("Tamu / Pemesan"),
        kode_corporate: Joi.string().optional().allow("", null).label("Corporate"),
        tgl_mulai: Joi.string().required().label("Tanggal Mulai"),
        tgl_selesai: Joi.string().optional().allow("", null).label("Tanggal Selesai"),
        jam_mulai: Joi.string().required().label("Jam Mulai"),
        jam_selesai: Joi.string().required().label("Jam Selesai"),
        jumlah_tamu: Joi.number().required().min(1).label("Jumlah Tamu (Pax)"),
        layout_setup: Joi.string().optional().valid("theater", "classroom", "u_shape", "boardroom", "banquet", "standing", "hollow_square", "custom").label("Layout Setup"),
        tipe_sewa: Joi.string().optional().valid("per_jam", "half_day", "full_day", "custom_package").label("Tipe Sewa"),
        durasi_jam: Joi.number().optional().label("Durasi Jam"),
        tarif_sewa: Joi.number().optional().label("Tarif Sewa"),
        diskon: Joi.number().optional().label("Diskon"),
        pajak_persen: Joi.number().optional().label("Pajak (%)"),
        service_charge_persen: Joi.number().optional().label("Service Charge (%)"),
        deposit_paid: Joi.number().optional().label("Uang Muka (Deposit)"),
        contact_person: Joi.string().optional().allow("", null).label("PIC Lapangan"),
        contact_phone: Joi.string().optional().allow("", null).label("No HP PIC"),
        contact_email: Joi.string().optional().allow("", null).label("Email PIC"),
        setup_buffer_minutes: Joi.number().optional().label("Buffer Setup (Menit)"),
        teardown_buffer_minutes: Joi.number().optional().label("Buffer Teardown (Menit)"),
        catatan_khusus: Joi.string().optional().allow("", null).label("Catatan Khusus BEO"),
        items: Joi.array().items(
          Joi.object({
            id: Joi.number().optional(),
            item_type: Joi.string().valid("fnb", "equipment", "facility", "other").default("fnb"),
            item_name: Joi.string().required().label("Nama Item"),
            qty: Joi.number().required().min(1).label("Jumlah"),
            unit: Joi.string().default("pax").label("Satuan"),
            harga_satuan: Joi.number().required().label("Harga Satuan"),
            subtotal: Joi.number().optional().label("Subtotal"),
            catatan: Joi.string().optional().allow("", null),
          })
        ).optional().label("Rincian Item Tambahan"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "any.required": "{#label} wajib diisi",
        "number.base": "{#label} harus berupa angka",
      },
      oPayload,
      { table: "trx_reservasi_event", allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });
    }

    const existing = await DB("trx_reservasi_event")
      .where("kode_reservasi_event", oPayload.kode_reservasi_event)
      .where("is_active", 1)
      .first();

    if (!existing) {
      return res.status(404).json({
        status: status.GAGAL,
        message: "Data pemesanan ruang event tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    if (["completed", "cancelled"].includes(existing.status_event)) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: `Pemesanan dengan status '${existing.status_event}' sudah terkunci dan tidak dapat diubah`,
        datetime: formatDateSystem(),
      });
    }

    const tglMulai = oPayload.tgl_mulai;
    const tglSelesai = oPayload.tgl_selesai || tglMulai;
    const jamMulai = oPayload.jam_mulai.slice(0, 5);
    const jamSelesai = oPayload.jam_selesai.slice(0, 5);

    const itemsList = Array.isArray(oPayload.items) ? oPayload.items : [];
    let biayaTambahan = 0;
    const parsedItems = itemsList.map((it) => {
      const qty = parseInt(it.qty, 10) || 1;
      const hargaSatuan = parseFloat(it.harga_satuan) || 0;
      const subtotal = it.subtotal !== undefined ? parseFloat(it.subtotal) : qty * hargaSatuan;
      biayaTambahan += subtotal;
      return {
        item_type: it.item_type || "fnb",
        item_name: it.item_name,
        qty,
        unit: it.unit || "pax",
        harga_satuan: hargaSatuan,
        subtotal,
        catatan: it.catatan || null,
      };
    });

    const tarifSewa = parseFloat(oPayload.tarif_sewa !== undefined ? oPayload.tarif_sewa : existing.tarif_sewa) || 0;
    const diskon = parseFloat(oPayload.diskon !== undefined ? oPayload.diskon : existing.diskon) || 0;
    const baseAmount = Math.max(0, tarifSewa + biayaTambahan - diskon);

    const pajakPersen = parseFloat(oPayload.pajak_persen !== undefined ? oPayload.pajak_persen : existing.pajak_persen) || 0;
    const serviceChargePersen = parseFloat(oPayload.service_charge_persen !== undefined ? oPayload.service_charge_persen : existing.service_charge_persen) || 0;

    const nominalServiceCharge = Math.round(baseAmount * (serviceChargePersen / 100));
    const nominalPajak = Math.round((baseAmount + nominalServiceCharge) * (pajakPersen / 100));
    const totalBiaya = baseAmount + nominalServiceCharge + nominalPajak;

    const depositPaid = parseFloat(oPayload.deposit_paid !== undefined ? oPayload.deposit_paid : existing.deposit_paid) || 0;
    const sisaTagihan = Math.max(0, totalBiaya - depositPaid);

    let statusPembayaran = "unpaid";
    if (depositPaid >= totalBiaya && totalBiaya > 0) {
      statusPembayaran = "paid";
    } else if (depositPaid > 0) {
      statusPembayaran = "deposit";
    }

    const setupBuffer = parseInt(oPayload.setup_buffer_minutes !== undefined ? oPayload.setup_buffer_minutes : existing.setup_buffer_minutes, 10) || 30;
    const teardownBuffer = parseInt(oPayload.teardown_buffer_minutes !== undefined ? oPayload.teardown_buffer_minutes : existing.teardown_buffer_minutes, 10) || 30;

    await DB.transaction(async (trx) => {
      // 1. Conflict check excluding self
      const existingConflict = await trx("trx_reservasi_event")
        .where("kode_ruang_event", oPayload.kode_ruang_event)
        .where("is_active", 1)
        .whereNot("kode_reservasi_event", oPayload.kode_reservasi_event)
        .whereIn("status_event", ["tentative", "confirmed", "in_progress"])
        .whereRaw("tgl_mulai <= ?", [tglSelesai])
        .whereRaw("tgl_selesai >= ?", [tglMulai])
        .select("kode_reservasi_event", "nama_event", "jam_mulai", "jam_selesai", "setup_buffer_minutes", "teardown_buffer_minutes");

      const newStart = new Date(`${tglMulai}T${jamMulai}:00`).getTime() - setupBuffer * 60000;
      const newEnd = new Date(`${tglSelesai}T${jamSelesai}:00`).getTime() + teardownBuffer * 60000;

      for (const ex of existingConflict) {
        const exStart = new Date(`${String(ex.tgl_mulai).slice(0, 10)}T${String(ex.jam_mulai).slice(0, 5)}:00`).getTime() - (parseInt(ex.setup_buffer_minutes, 10) || 30) * 60000;
        const exEnd = new Date(`${String(ex.tgl_selesai).slice(0, 10)}T${String(ex.jam_selesai).slice(0, 5)}:00`).getTime() + (parseInt(ex.teardown_buffer_minutes, 10) || 30) * 60000;

        if (newStart < exEnd && newEnd > exStart) {
          throw new Error(`Bentrok jadwal: Ruangan telah terpesan untuk '${ex.nama_event}' (${ex.kode_reservasi_event})`);
        }
      }

      const updateHeader = {
        nama_event: oPayload.nama_event,
        kode_ruang_event: oPayload.kode_ruang_event,
        kode_tamu: oPayload.kode_tamu,
        kode_corporate: oPayload.kode_corporate || null,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
        jam_mulai: `${jamMulai}:00`,
        jam_selesai: `${jamSelesai}:00`,
        jumlah_tamu: parseInt(oPayload.jumlah_tamu, 10),
        layout_setup: oPayload.layout_setup || existing.layout_setup,
        tipe_sewa: oPayload.tipe_sewa || existing.tipe_sewa,
        durasi_jam: parseFloat(oPayload.durasi_jam || existing.durasi_jam) || 4,
        tarif_sewa: tarifSewa,
        biaya_tambahan: biayaTambahan,
        diskon: diskon,
        pajak_persen: pajakPersen,
        nominal_pajak: nominalPajak,
        service_charge_persen: serviceChargePersen,
        nominal_service_charge: nominalServiceCharge,
        total_biaya: totalBiaya,
        deposit_paid: depositPaid,
        sisa_tagihan: sisaTagihan,
        status_pembayaran: statusPembayaran,
        contact_person: oPayload.contact_person || null,
        contact_phone: oPayload.contact_phone || null,
        contact_email: oPayload.contact_email || null,
        setup_buffer_minutes: setupBuffer,
        teardown_buffer_minutes: teardownBuffer,
        catatan_khusus: oPayload.catatan_khusus || null,
        updated_by: req.auth?.user_id || 1,
        updated_at: formatDateSystem(),
      };

      await trx("trx_reservasi_event")
        .where("kode_reservasi_event", oPayload.kode_reservasi_event)
        .update(updateHeader);

      // Re-sync items if provided in payload
      if (Array.isArray(oPayload.items)) {
        await trx("trx_reservasi_event_item")
          .where("kode_reservasi_event", oPayload.kode_reservasi_event)
          .delete();

        if (parsedItems.length > 0) {
          const itemRows = parsedItems.map((item) => ({
            kode_reservasi_event: oPayload.kode_reservasi_event,
            item_type: item.item_type,
            item_name: item.item_name,
            qty: item.qty,
            unit: item.unit,
            harga_satuan: item.harga_satuan,
            subtotal: item.subtotal,
            catatan: item.catatan,
            created_at: formatDateSystem(),
            created_by: req.auth?.user_id || 1,
            is_active: 1,
          }));
          await trx("trx_reservasi_event_item").insert(itemRows);
        }
      }

      await ChangesLog(
        {
          description: `Ubah Pemesanan Ruang Event: ${oPayload.nama_event}`,
          tableName: "trx_reservasi_event",
          referenceCode: oPayload.kode_reservasi_event,
          action: "UPDATE",
          dataBefore: existing,
          dataAfter: { ...existing, ...updateHeader, items: parsedItems },
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Pemesanan ruang event ${oPayload.kode_reservasi_event} berhasil diperbarui`,
      datetime: formatDateSystem(),
      data: {
        kode_reservasi_event: oPayload.kode_reservasi_event,
        total_biaya: totalBiaya,
        deposit_paid: depositPaid,
        sisa_tagihan: sisaTagihan,
      },
    });
  } catch (error) {
    console.error("Error in event_update.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal memperbarui pemesanan ruang event",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
