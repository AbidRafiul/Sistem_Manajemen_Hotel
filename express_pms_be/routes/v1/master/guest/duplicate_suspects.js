/**
 * @copyright (c) 2026 PT Marstech Global
 * @file duplicate_suspects.js
 * @description Endpoint daftar suspek duplikat untuk direview
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
  const kode_cabang = oPayload.kode_cabang;

  try {
    // Group by id_number or phone where count > 1
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

    const duplicatePhones = await DB("mst_guest")
      .select("phone")
      .whereNull("deleted_at")
      .andWhere("is_merged", 0)
      .whereNotNull("phone")
      .where("phone", "!=", "")
      .modify(qb => {
        if (kode_cabang) qb.where("kode_cabang", kode_cabang);
      })
      .groupBy("phone")
      .havingRaw("COUNT(id) > 1");

    const idList = duplicateIds.map(i => i.id_number);
    const phoneList = duplicatePhones.map(p => p.phone);

    const suspects = await DB("mst_guest")
      .whereNull("deleted_at")
      .andWhere("is_merged", 0)
      .andWhere(function() {
        if (idList.length > 0) this.whereIn("id_number", idList);
        if (phoneList.length > 0) this.orWhereIn("phone", phoneList);
      })
      .orderBy("id_number", "asc")
      .orderBy("phone", "asc");

    // Group pairs
    const groupsMap = new Map();
    for (const g of suspects) {
      const key = g.id_number ? `ID:${g.id_number}` : `PH:${g.phone}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { key, reason: g.id_number ? "Nomor ID Sama" : "Nomor Telepon Sama", profiles: [] });
      }
      groupsMap.get(key).profiles.push(g);
    }

    const groups = Array.from(groupsMap.values()).filter(grp => grp.profiles.length > 1);

    return res.status(200).json({
      status: status.SUKSES,
      message: `Ditemukan ${groups.length} grup suspek duplikat`,
      datetime: formatDateSystem(),
      data: groups,
      total_groups: groups.length
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat mencari suspek duplikat",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/duplicate_suspects.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
