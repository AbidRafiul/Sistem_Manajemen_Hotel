
import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";

  const schema = Joi.object({
    kode_cabang: Joi.array().items(Joi.string()).min(1).required().label("Kode Cabang")
  }).unknown(true);

  const { error } = schema.validate(oPayload);
  if (error) {
    return res.status(400).json({ status: status.BAD_REQUEST, message: error.details[0].message, datetime: formatDateSystem() });
  }

  try {
    const existing = await DB("mst_cabang").whereIn("kode_cabang", oPayload.kode_cabang).whereNull("deleted_at");
    if (existing.length === 0) {
      return res.status(404).json({ status: status.BAD_REQUEST, message: "Data tidak ditemukan", datetime: formatDateSystem() });
    }

    await DB.transaction(async (trx) => {
      await trx("mst_cabang").whereIn("kode_cabang", oPayload.kode_cabang).update({
        deleted_at: formatDateSystem() });
    });

    return res.status(200).json({ status: status.SUKSES, message: "Data berhasil dihapus", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/cabang/cabang_delete.js", func: "post", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
