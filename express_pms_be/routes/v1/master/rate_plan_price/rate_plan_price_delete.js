/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_plan_price_delete.js
 * @description Endpoint delete master rate plan price
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-27
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-27)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import DB from "../../../../core/config/knex.js";
import { Logging, ChangesLog } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  try {
    if (
      !oPayload.kode_harga_price ||
      !Array.isArray(oPayload.kode_harga_price) ||
      oPayload.kode_harga_price.length === 0
    ) {
      return res
        .status(400)
        .json({
          status: status.BAD_REQUEST,
          message: "Parameter kode_harga_price (array) diperlukan",
          datetime: formatDateSystem(),
        });
    }

    await DB.transaction(async (trx) => {
      for (const code of oPayload.kode_harga_price) {
        const existingData = await trx("mst_rate_plan_price")
          .where("kode_harga_price", code)
          .first();
        if (existingData) {
          const oData = {
            is_active: 0,
            deleted_at: formatDateSystem(),
            deleted_by: req.auth?.user_id || 1,
          };
          await trx("mst_rate_plan_price").where("kode_harga_price", code).update(oData);
          await ChangesLog(
            {
              description: "Hapus Master Harga Kamar",
              tableName: "mst_rate_plan_price",
              referenceCode: code,
              action: "DELETE",
              dataBefore: existingData,
              dataAfter: { ...existingData, ...oData },
              user: username,
              tz: oPayload.tz || "UTC",
            },
            trx
          );
        }
      }
    });

    return res
      .status(200)
      .json({
        status: status.SUKSES,
        message: "Data Master Harga Kamar berhasil dihapus",
        datetime: formatDateSystem(),
      });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/rate_plan_price/rate_plan_price_delete.js",
      func: "delete",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});
export default router;
