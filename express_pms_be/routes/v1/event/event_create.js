/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file event_create.js
 * @description POST /api/v1/event/create - Membuat pemesanan ruang event baru (BEO)
 * @author Antigravity
 * @created 2026-10-19
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { generateSequence } from "../components/tools/generateCode.js";
import { ChangesLog, validatePayload } from "../components/tools/servertool.js";
import { resolveEffectiveBranch } from "../components/tools/scope_helper.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "system";

  try {
    if (!oPayload || Object.keys(oPayload).length < 1) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Payload permohonan pemesanan event tidak boleh kosong",
        datetime: formatDateSystem(),
      });
    }

    const { kodeCabang } = resolveEffectiveBranch(req, oPayload.kode_cabang);
    if (!kodeCabang) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Kode cabang wajib ditentukan",
        datetime: formatDateSystem(),
      });
    }

    const cValidation = await validatePayload(
      {
        nama_event: Joi.string().required().label("Nama Event"),
        kode_ruang_event: Joi.string().required().label("Ruang Event"),
        kode_tamu: Joi.string().required().label("Tamu / Pemesan"),
        kode_corporate: Joi.string().optional().allow("", null).label("Corporate"),
        tgl_mulai: Joi.string().required().label("Tanggal Mulai"),
        tgl_selesai: Joi.string().optional().allow("", null).label("Tanggal Selesai"),
        jam_mulai: Joi.string().required().label("Jam Mulai"),
        jam_selesai: Joi.string().required().label("Jam Selesai"),
        jumlah_tamu: Joi.number().required().min(1).label("Jumlah Tamu (Pax)"),
        layout_setup: Joi.string().optional().valid("theater", "classroom", "u_shape", "boardroom", "banquet", "standing", "hollow_square", "custom").default("theater").label("Layout Setup"),
        tipe_sewa: Joi.string().optional().valid("per_jam", "half_day", "full_day", "custom_package").default("half_day").label("Tipe Sewa"),
        durasi_jam: Joi.number().optional().default(4).label("Durasi Jam"),
        tarif_sewa: Joi.number().optional().default(0).label("Tarif Sewa"),
        diskon: Joi.number().optional().default(0).label("Diskon"),
        pajak_persen: Joi.number().optional().default(10).label("Pajak (%)"),
        service_charge_persen: Joi.number().optional().default(0).label("Service Charge (%)"),
        deposit_paid: Joi.number().optional().default(0).label("Uang Muka (Deposit)"),
        contact_person: Joi.string().optional().allow("", null).label("PIC Lapangan"),
        contact_phone: Joi.string().optional().allow("", null).label("No HP PIC"),
        contact_email: Joi.string().optional().allow("", null).label("Email PIC"),
        setup_buffer_minutes: Joi.number().optional().default(30).label("Buffer Setup (Menit)"),
        teardown_buffer_minutes: Joi.number().optional().default(30).label("Buffer Teardown (Menit)"),
        catatan_khusus: Joi.string().optional().allow("", null).label("Catatan Khusus BEO"),
        items: Joi.array().items(
          Joi.object({
            item_type: Joi.string().valid("fnb", "equipment", "facility", "other").default("fnb"),
            item_name: Joi.string().required().label("Nama Item"),
            qty: Joi.number().required().min(1).label("Jumlah"),
            unit: Joi.string().default("pax").label("Satuan"),
            harga_satuan: Joi.number().required().label("Harga Satuan"),
            subtotal: Joi.number().optional().label("Subtotal"),
            catatan: Joi.string().optional().allow("", null),
          })
        ).optional().default([]).label("Rincian Item Tambahan"),
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

    const tglMulai = oPayload.tgl_mulai;
    const tglSelesai = oPayload.tgl_selesai || tglMulai;
    const jamMulai = oPayload.jam_mulai.slice(0, 5);
    const jamSelesai = oPayload.jam_selesai.slice(0, 5);

    // Hitung rincian biaya F&B / peralatan tambahan
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

    const tarifSewa = parseFloat(oPayload.tarif_sewa) || 0;
    const diskon = parseFloat(oPayload.diskon) || 0;
    const baseAmount = Math.max(0, tarifSewa + biayaTambahan - diskon);

    const pajakPersen = parseFloat(oPayload.pajak_persen) || 0;
    const serviceChargePersen = parseFloat(oPayload.service_charge_persen) || 0;

    const nominalServiceCharge = Math.round(baseAmount * (serviceChargePersen / 100));
    const nominalPajak = Math.round((baseAmount + nominalServiceCharge) * (pajakPersen / 100));
    const totalBiaya = baseAmount + nominalServiceCharge + nominalPajak;

    const depositPaid = Math.min(totalBiaya, Math.max(0, parseFloat(oPayload.deposit_paid) || 0));
    const sisaTagihan = Math.max(0, totalBiaya - depositPaid);

    let statusPembayaran = "unpaid";
    if (depositPaid >= totalBiaya && totalBiaya > 0) {
      statusPembayaran = "paid";
    } else if (depositPaid > 0) {
      statusPembayaran = "deposit";
    }

    const statusEvent = oPayload.status_event || (depositPaid > 0 ? "confirmed" : "tentative");

    let createdEventCode = "";

    await DB.transaction(async (trx) => {
      // 1. Conflict check inside transaction (lock or check)
      const existingConflict = await trx("trx_reservasi_event")
        .where("kode_ruang_event", oPayload.kode_ruang_event)
        .where("is_active", 1)
        .whereIn("status_event", ["tentative", "confirmed", "in_progress"])
        .whereRaw("tgl_mulai <= ?", [tglSelesai])
        .whereRaw("tgl_selesai >= ?", [tglMulai])
        .select("kode_reservasi_event", "nama_event", "jam_mulai", "jam_selesai", "setup_buffer_minutes", "teardown_buffer_minutes");

      const setupBuffer = parseInt(oPayload.setup_buffer_minutes, 10) || 30;
      const teardownBuffer = parseInt(oPayload.teardown_buffer_minutes, 10) || 30;
      const newStart = new Date(`${tglMulai}T${jamMulai}:00`).getTime() - setupBuffer * 60000;
      const newEnd = new Date(`${tglSelesai}T${jamSelesai}:00`).getTime() + teardownBuffer * 60000;

      for (const ex of existingConflict) {
        const exStart = new Date(`${String(ex.tgl_mulai).slice(0, 10)}T${String(ex.jam_mulai).slice(0, 5)}:00`).getTime() - (parseInt(ex.setup_buffer_minutes, 10) || 30) * 60000;
        const exEnd = new Date(`${String(ex.tgl_selesai).slice(0, 10)}T${String(ex.jam_selesai).slice(0, 5)}:00`).getTime() + (parseInt(ex.teardown_buffer_minutes, 10) || 30) * 60000;

        if (newStart < exEnd && newEnd > exStart) {
          throw new Error(`Bentrok jadwal: Ruangan telah terpesan untuk '${ex.nama_event}' (${ex.kode_reservasi_event})`);
        }
      }

      // 2. Generate unique sequence
      createdEventCode = await generateSequence("FMT-RESEVENT", trx);

      const headerData = {
        kode_reservasi_event: createdEventCode,
        nama_event: oPayload.nama_event,
        kode_ruang_event: oPayload.kode_ruang_event,
        kode_cabang: kodeCabang,
        kode_tamu: oPayload.kode_tamu,
        kode_corporate: oPayload.kode_corporate || null,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
        jam_mulai: `${jamMulai}:00`,
        jam_selesai: `${jamSelesai}:00`,
        jumlah_tamu: parseInt(oPayload.jumlah_tamu, 10),
        layout_setup: oPayload.layout_setup || "theater",
        tipe_sewa: oPayload.tipe_sewa || "half_day",
        durasi_jam: parseFloat(oPayload.durasi_jam) || 4,
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
        status_event: statusEvent,
        contact_person: oPayload.contact_person || null,
        contact_phone: oPayload.contact_phone || null,
        contact_email: oPayload.contact_email || null,
        setup_buffer_minutes: setupBuffer,
        teardown_buffer_minutes: teardownBuffer,
        catatan_khusus: oPayload.catatan_khusus || null,
        created_by: req.auth?.user_id || 1,
        created_at: formatDateSystem(),
        updated_at: formatDateSystem(),
        is_active: 1,
      };

      await trx("trx_reservasi_event").insert(headerData);

      // 3. Insert items if any
      if (parsedItems.length > 0) {
        const itemRows = parsedItems.map((item) => ({
          kode_reservasi_event: createdEventCode,
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

      // 4. Audit trail
      await ChangesLog(
        {
          description: `Tambah Pemesanan Ruang Event: ${oPayload.nama_event}`,
          tableName: "trx_reservasi_event",
          referenceCode: createdEventCode,
          action: "CREATE",
          dataBefore: null,
          dataAfter: { ...headerData, items: parsedItems },
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Pemesanan ruang event berhasil dibuat dengan kode ${createdEventCode}`,
      datetime: formatDateSystem(),
      data: {
        kode_reservasi_event: createdEventCode,
        total_biaya: totalBiaya,
        deposit_paid: depositPaid,
        sisa_tagihan: sisaTagihan,
        status_event: statusEvent,
      },
    });
  } catch (error) {
    console.error("Error in event_create.js:", error);
    return res.status(500).json({
      status: status.GAGAL,
      message: error.message || "Gagal membuat pemesanan ruang event",
      datetime: formatDateSystem(),
    });
  }
});

export default router;
