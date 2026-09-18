/**
 * @copyright (c) 2026 PT Marstech Global
 * @file stay_history.js
 * @description Endpoint riwayat menginap tamu dari tabel transaksi
 */
import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";
  const { kode_tamu, id } = oPayload;

  if (!kode_tamu && !id) {
    return res.status(400).json({
      status: status.BAD_REQUEST,
      message: "Kode Tamu atau ID wajib diisi",
      datetime: formatDateSystem(),
    });
  }

  try {
    let guestCode = kode_tamu;
    if (!guestCode && id) {
      const g = await DB("mst_guest").select("kode_tamu").where("id", id).first();
      guestCode = g?.kode_tamu;
    }

    if (!guestCode) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Data tamu tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    const history = await DB("trx_reservation as r")
      .join("trx_reservation_room as rr", "r.kode_reservasi", "rr.kode_reservation")
      .leftJoin("mst_tipe_kamar as tk", "rr.kode_tipe_kamar", "tk.kode_tipe_kamar")
      .leftJoin("mst_kamar as km", "rr.kode_kamar", "km.kode_kamar")
      .leftJoin("trx_checkin as ci", "rr.kode_reservasi_room", "ci.kode_reservation_room")
      .leftJoin("trx_checkout as co", "rr.kode_reservasi_room", "co.kode_reservation_room")
      .leftJoin("trx_folio as f", "r.kode_reservasi", "f.kode_reservation")
      .where("r.kode_guest", guestCode)
      .whereNull("r.deleted_at")
      .select(
        "r.id as reservation_id",
        "r.kode_reservasi",
        "r.booking_type",
        "r.source_channel",
        "r.check_in_date",
        "r.check_out_date",
        "r.status as reservation_status",
        "rr.kode_reservasi_room",
        "rr.kode_tipe_kamar",
        "tk.nama_tipe as room_type_name",
        "rr.kode_kamar",
        "km.nama_kamar as room_name",
        "rr.rate_per_night",
        "rr.nights",
        "ci.checkin_at",
        "co.checkout_at",
        "f.kode_folio",
        "f.grand_total as folio_amount",
        "f.status as folio_status"
      )
      .orderBy("r.check_in_date", "desc");

    // Compute summary stats
    const totalStay = history.filter(h => ["checked_in", "checked_out"].includes(h.reservation_status)).length;
    const totalNights = history.reduce((sum, h) => sum + (h.nights || 0), 0);
    const totalSpending = history.reduce((sum, h) => sum + Number(h.folio_amount || 0), 0);
    const avgAdr = totalNights > 0 ? (totalSpending / totalNights) : 0;

    return res.status(200).json({
      status: status.SUKSES,
      message: "Riwayat menginap berhasil dimuat",
      datetime: formatDateSystem(),
      data: {
        summary: {
          total_stay: totalStay,
          total_nights: totalNights,
          total_spending: totalSpending,
          avg_adr: avgAdr
        },
        history
      }
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat memuat riwayat menginap",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/stay_history.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
