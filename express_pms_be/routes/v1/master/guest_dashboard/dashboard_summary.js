/**
 * @copyright (c) 2026 PT Marstech Global
 * @file dashboard_summary.js
 * @description Endpoint kartu ringkasan dashboard tamu
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
  const { kode_cabang } = oPayload;

  try {
    const baseQuery = () => DB("mst_guest").whereNull("deleted_at").andWhere("is_merged", 0).modify(qb => {
      if (kode_cabang) qb.where("kode_cabang", kode_cabang);
    });

    // 1. Total Guest Profiles
    const totalCount = await baseQuery().count("id as count").first();

    // 2. New Guests This Month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const startOfMonthStr = formatDateSystem(startOfMonth, "yyyy-MM-dd HH:mm:ss");
    const newCount = await baseQuery()
      .where("created_at", ">=", startOfMonthStr)
      .count("id as count")
      .first();

    // 3. Repeat Guest Ratio
    const repeatCount = await baseQuery().where("total_stay", ">", 1).count("id as count").first();
    const totalInt = parseInt(totalCount?.count || 0);
    const repeatInt = parseInt(repeatCount?.count || 0);
    const repeatRatio = totalInt > 0 ? ((repeatInt / totalInt) * 100).toFixed(1) : 0;

    // 4. In-House Guests Currently
    const inHouseQuery = DB("trx_checkin as ci")
      .join("trx_reservation_room as rr", "ci.kode_reservation_room", "rr.kode_reservasi_room")
      .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
      .where("r.status", "checked_in")
      .whereNull("r.deleted_at");

    if (kode_cabang) inHouseQuery.where("r.kode_cabang", kode_cabang);
    const inHouseCount = await inHouseQuery.countDistinct("r.kode_guest as count").first();

    // 5. Incomplete Profile Count (< 60%)
    const incompleteCount = await baseQuery().where("completeness_score", "<", 60).count("id as count").first();

    // 6. Duplicate Suspect Count
    const duplicateIds = await DB("mst_guest")
      .select("id_number")
      .whereNull("deleted_at")
      .andWhere("is_merged", 0)
      .whereNotNull("id_number")
      .where("id_number", "!=", "")
      .modify(qb => {
        if (kode_cabang) qb.where("kode_cabang", kode_cabang);
      })
      .groupBy("id_number")
      .havingRaw("COUNT(id) > 1");

    return res.status(200).json({
      status: status.SUKSES,
      message: "Ringkasan dashboard tamu dimuat",
      datetime: formatDateSystem(),
      data: {
        total_guests: totalInt,
        new_guests_this_month: parseInt(newCount?.count || 0),
        repeat_guest_ratio: parseFloat(repeatRatio),
        repeat_guests_count: repeatInt,
        in_house_guests: parseInt(inHouseCount?.count || 0),
        incomplete_profiles: parseInt(incompleteCount?.count || 0),
        duplicate_suspects: duplicateIds.length
      }
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: error.message || "Terjadi kesalahan saat memuat ringkasan dashboard tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest_dashboard/dashboard_summary.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
