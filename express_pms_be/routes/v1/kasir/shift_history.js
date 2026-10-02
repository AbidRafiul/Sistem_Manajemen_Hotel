/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file shift_history.js
 * @description Endpoint riwayat shift kasir (Closed & Open) dengan filter dan pagination
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-28
 * @version 1.0.0
 */
import express from "express";
import { status } from "../components/tools/general.js";
import DB from "../../../core/config/knex.js";
import { Logging } from "../components/tools/servertool.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body || {};
  const username = req?.auth?.username || "";

  try {
    const page = parseInt(oPayload.page, 10) || 1;
    const perPage = parseInt(oPayload.perPage, 10) || 10;
    const offset = (page - 1) * perPage;

    const baseQuery = DB("trx_cashier_shift as cs")
      .leftJoin("mst_cashier_counter as cc", "cs.kode_cashier_counter", "cc.kode_counter")
      .leftJoin("mst_shift as ms", function () {
        this.on(function () {
          this.on("cs.sesi", "=", "ms.kode_shift").orOn("cs.sesi", "=", "ms.nama_shift");
        }).andOn("cs.kode_cabang", "=", "ms.kode_cabang");
      })
      .leftJoin("mst_cabang as c", "cs.kode_cabang", "c.kode_cabang")
      .leftJoin("mst_user as u", "cs.user_id", "u.id")
      .modify((qb) => {
        if (oPayload.kode_cabang) {
          qb.where("cs.kode_cabang", oPayload.kode_cabang);
        }
        if (oPayload.user_id) {
          qb.where("cs.user_id", oPayload.user_id);
        }
        if (oPayload.status) {
          qb.where("cs.status", oPayload.status);
        }
        if (oPayload.sesi) {
          qb.where((w) => {
            w.where("cs.sesi", oPayload.sesi).orWhere("ms.kode_shift", oPayload.sesi);
          });
        }
        if (oPayload.tgl_mulai) {
          qb.where("cs.opened_at", ">=", `${oPayload.tgl_mulai} 00:00:00`);
        }
        if (oPayload.tgl_selesai) {
          qb.where("cs.opened_at", "<=", `${oPayload.tgl_selesai} 23:59:59`);
        }
        if (oPayload.search) {
          const s = `%${oPayload.search}%`;
          qb.where((w) => {
            w.where("cs.kode_cashier_shift", "like", s)
              .orWhere("u.fullname", "like", s)
              .orWhere("cc.name", "like", s)
              .orWhere("ms.nama_shift", "like", s);
          });
        }
      });

    // Total Count
    const totalRow = await baseQuery.clone().count("cs.id as total").first();
    const totalData = parseInt(totalRow?.total, 10) || 0;

    // Data query
    const rows = await baseQuery
      .clone()
      .select(
        "cs.id",
        "cs.kode_cashier_shift",
        "cs.kode_cabang",
        "cs.kode_cashier_counter",
        "cs.sesi",
        "ms.nama_shift",
        "ms.is_night_audit",
        "ms.waktu_mulai as shift_waktu_mulai",
        "ms.waktu_selesai as shift_waktu_selesai",
        "cs.user_id",
        "cs.opening_cash",
        "cs.closing_cash",
        "cs.system_cash",
        "cs.cash_difference",
        "cs.catatan_handover",
        "cs.status",
        "cs.opened_at",
        "cs.closed_at",
        "cc.name as nama_counter",
        "c.nama_hotel as cabang_name",
        "u.username as cashier_username",
        "u.fullname as cashier_name"
      )
      .orderBy("cs.opened_at", "desc")
      .limit(perPage)
      .offset(offset);

    // Dapatkan ringkasan cepat untuk tiap shift (checkins, checkouts, total payment)
    const shiftCodes = rows.map((r) => r.kode_cashier_shift);
    let checkinMap = {};
    let checkoutMap = {};
    let paymentMap = {};

    if (shiftCodes.length > 0) {
      const checkinCounts = await DB("trx_checkin")
        .select("kode_cashier_shift", DB.raw("COUNT(id) as count"), DB.raw("COALESCE(SUM(guest_count), 0) as pax"))
        .whereIn("kode_cashier_shift", shiftCodes)
        .whereNull("deleted_at")
        .groupBy("kode_cashier_shift");

      checkinCounts.forEach((c) => {
        checkinMap[c.kode_cashier_shift] = {
          count: parseInt(c.count, 10),
          pax: parseInt(c.pax, 10),
        };
      });

      const checkoutCounts = await DB("trx_checkout")
        .select("kode_cashier_shift", DB.raw("COUNT(id) as count"), DB.raw("COALESCE(SUM(guest_count), 0) as pax"))
        .whereIn("kode_cashier_shift", shiftCodes)
        .whereNull("deleted_at")
        .groupBy("kode_cashier_shift");

      checkoutCounts.forEach((c) => {
        checkoutMap[c.kode_cashier_shift] = {
          count: parseInt(c.count, 10),
          pax: parseInt(c.pax, 10),
        };
      });

      const paymentSums = await DB("trx_payment")
        .select(
          "kode_cashier_shift",
          DB.raw("COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash"),
          DB.raw("COALESCE(SUM(CASE WHEN payment_method != 'cash' THEN amount ELSE 0 END), 0) as non_cash"),
          DB.raw("COALESCE(SUM(amount), 0) as total")
        )
        .whereIn("kode_cashier_shift", shiftCodes)
        .groupBy("kode_cashier_shift");

      paymentSums.forEach((p) => {
        paymentMap[p.kode_cashier_shift] = {
          cash: parseFloat(p.cash),
          non_cash: parseFloat(p.non_cash),
          total: parseFloat(p.total),
        };
      });
    }

    const enrichedRows = rows.map((r) => {
      const sc = r.kode_cashier_shift;
      const ci = checkinMap[sc] || { count: 0, pax: 0 };
      const co = checkoutMap[sc] || { count: 0, pax: 0 };
      const pay = paymentMap[sc] || { cash: 0, non_cash: 0, total: 0 };

      return {
        ...r,
        opening_cash: parseFloat(r.opening_cash) || 0,
        closing_cash: r.closing_cash !== null ? parseFloat(r.closing_cash) : null,
        system_cash: r.system_cash !== null ? parseFloat(r.system_cash) : null,
        cash_difference: r.cash_difference !== null ? parseFloat(r.cash_difference) : null,
        total_checkin_kamar: ci.count,
        total_checkin_pax: ci.pax,
        total_checkout_kamar: co.count,
        total_checkout_pax: co.pax,
        total_cash_in: pay.cash,
        total_non_cash_in: pay.non_cash,
        total_payment_in: pay.total,
      };
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data riwayat shift kasir berhasil diambil",
      datetime: formatDateSystem(),
      data: enrichedRows,
      pagination: {
        page,
        perPage,
        totalData,
        totalPages: Math.ceil(totalData / perPage),
      },
    });
  } catch (error) {
    const errorDetails = error.stack || error.message;
    await Logging({
      Tgl: formatDateSystem(),
      ErrorDetails: errorDetails,
      Action: "GET SHIFT HISTORY",
      TableName: "trx_cashier_shift",
      file: "shift_history.js",
      username: username,
    });

    return res.status(500).json({
      status: status.GAGAL,
      message: "Terjadi kesalahan saat memuat riwayat shift kasir.",
      datetime: formatDateSystem(),
      data: [],
    });
  }
});

export default router;
