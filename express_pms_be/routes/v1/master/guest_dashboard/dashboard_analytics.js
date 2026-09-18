/**
 * @copyright (c) 2026 PT Marstech Global
 * @file dashboard_analytics.js
 * @description Endpoint grafik & tabel analitik dashboard tamu
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
  const { kode_cabang, type } = oPayload;

  try {
    const baseQuery = () => DB("mst_guest").whereNull("deleted_at").andWhere("is_merged", 0).modify(qb => {
      if (kode_cabang) qb.where("kode_cabang", kode_cabang);
    });

    let resultData = null;

    if (type === "origin") {
      const rawNationality = await baseQuery()
        .select(DB.raw("COALESCE(NULLIF(nationality, ''), 'Indonesia') as name"))
        .count("id as count")
        .groupByRaw("COALESCE(NULLIF(nationality, ''), 'Indonesia')")
        .orderBy("count", "desc");
      resultData = rawNationality;
    } else if (type === "segment") {
      const segments = await baseQuery()
        .select(DB.raw("COALESCE(guest_type, 'individual') as name"))
        .count("id as count")
        .groupByRaw("COALESCE(guest_type, 'individual')");
      resultData = segments;
    } else if (type === "source") {
      const sources = await baseQuery()
        .select(DB.raw("COALESCE(source, 'manual_input') as name"))
        .count("id as count")
        .groupByRaw("COALESCE(source, 'manual_input')");
      resultData = sources;
    } else if (type === "demographic") {
      const gender = await baseQuery()
        .select(DB.raw("COALESCE(gender, 'L') as name"))
        .count("id as count")
        .groupByRaw("COALESCE(gender, 'L')");
      resultData = gender;
    } else if (type === "top_spender") {
      const topSpenders = await baseQuery()
        .select("id", "kode_tamu", "full_name", "phone", "email", "guest_type", "total_stay", "total_spending", "last_stay_date")
        .orderBy("total_spending", "desc")
        .limit(20);
      resultData = topSpenders;
    } else if (type === "dormant") {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      const cutoffStr = formatDateSystem(twelveMonthsAgo, "yyyy-MM-dd");

      const dormantList = await baseQuery()
        .where("last_stay_date", "<=", cutoffStr)
        .select("id", "kode_tamu", "full_name", "phone", "email", "guest_type", "total_stay", "total_spending", "last_stay_date")
        .orderBy("last_stay_date", "asc")
        .limit(20);
      resultData = dormantList;
    } else if (type === "birthday") {
      const currentMonth = new Date().getMonth() + 1;
      const birthdayList = await baseQuery()
        .whereRaw("MONTH(birth_date) = ?", [currentMonth])
        .select("id", "kode_tamu", "full_name", "phone", "email", "birth_date", "vip_level")
        .orderByRaw("DAY(birth_date) ASC")
        .limit(30);
      resultData = birthdayList;
    } else if (type === "vip_arrival") {
      const todayStr = formatDateSystem(new Date(), "yyyy-MM-dd");
      const vipArrivals = await DB("trx_reservation as r")
        .join("mst_guest as g", "r.kode_guest", "g.kode_tamu")
        .where("g.is_vip", 1)
        .where("r.check_in_date", ">=", todayStr)
        .whereIn("r.status", ["reserved", "confirmed"])
        .whereNull("r.deleted_at")
        .modify(qb => {
          if (kode_cabang) qb.where("r.kode_cabang", kode_cabang);
        })
        .select("g.kode_tamu", "g.full_name", "g.vip_level", "g.phone", "r.kode_reservasi", "r.check_in_date", "r.check_out_date", "r.status")
        .orderBy("r.check_in_date", "asc")
        .limit(20);
      resultData = vipArrivals;
    } else {
      const origin = await baseQuery().select(DB.raw("COALESCE(NULLIF(nationality, ''), 'Indonesia') as name")).count("id as count").groupByRaw("COALESCE(NULLIF(nationality, ''), 'Indonesia')").orderBy("count", "desc").limit(5);
      const segment = await baseQuery().select(DB.raw("COALESCE(guest_type, 'individual') as name")).count("id as count").groupByRaw("COALESCE(guest_type, 'individual')");
      const topSpenders = await baseQuery().select("id", "kode_tamu", "full_name", "total_stay", "total_spending").orderBy("total_spending", "desc").limit(5);

      resultData = { origin, segment, topSpenders };
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: `Analitik ${type || 'overview'} dimuat`,
      datetime: formatDateSystem(),
      data: resultData
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: error.message || "Terjadi kesalahan saat memuat analitik dashboard tamu",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest_dashboard/dashboard_analytics.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
