import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  const hasPagination = oPayload.page !== undefined || oPayload.perPage !== undefined;
  const keyword = oPayload.keyword || "";
  const sortField = ["kode_cabang", "nama_hotel", "is_active", "created_at", "updated_at"].includes(
    oPayload.sortField
  )
    ? oPayload.sortField
    : "updated_at";
  const sortOrder = oPayload.sortOrder || "desc";

  try {
    const baseQuery = DB("mst_cabang as b")
      .whereNull("b.deleted_at")
      .modify((qb) => {
        if (keyword)
          qb.where(function () {
            this.whereRaw("LOWER(b.nama_hotel) LIKE ?", [`%${keyword.toLowerCase()}%`]).orWhereRaw(
              "LOWER(b.kode_cabang) LIKE ?",
              [`%${keyword.toLowerCase()}%`]
            );
          });
      });

    const selectFields = [
      "b.id",
      "b.kode_cabang",
      "b.nama_hotel as name",
      "b.alamat as address",
      "b.waktu_checkin as check_in_time",
      "b.waktu_checkout as check_out_time",
      "b.zona_waktu as timezone",
      "b.telepon",
      "b.is_active",
      "b.created_at",
      "b.updated_at",
    ];

    let vaData = [],
      totalRecords = 0;
    if (hasPagination) {
      const page = parseInt(oPayload.page) || 1,
        perPage = parseInt(oPayload.perPage) || 10;
      const count = await baseQuery.clone().count("b.kode_cabang as total").first();
      totalRecords = parseInt(count.total || 0);
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(sortField === "name" ? "b.nama_hotel" : `b.${sortField}`, sortOrder)
        .limit(perPage)
        .offset((page - 1) * perPage);
    } else {
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(sortField === "name" ? "b.nama_hotel" : `b.${sortField}`, sortOrder);
      totalRecords = vaData.length;
    }

    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data ditemukan",
        datetime: formatDateSystem(),
        data: vaData,
        total_data: totalRecords,
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/cabang/cabang_data.js",
      func: "get",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
