/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file ruang_event_fasilitas_assign.js
 * @description Endpoint assign fasilitas ke master ruang event
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-26
 * @contributors - Fadil
 * @lastModified Fadil (2026-08-26)
 * @version 1.0.1
 */
import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
const router = express.Router();
router.post("/", async (req, res) => {
  const oPayload = req.body;
  const username = req?.auth?.username || "";
  try {
    const cValidation = await validatePayload(
      { 
        kode_ruang_event: Joi.string().required().label("Kode Ruang Event"),
        kode_fasilitas: Joi.array().items(Joi.string()).label("Fasilitas") 
      },
      { "string.base": "{#label} harus berupa teks", "any.required": "{#label} wajib diisi", "array.base": "{#label} harus berupa array" },
      oPayload, { allowUnknown: true }
    );
    if (cValidation) return res.status(422).json({ status: status.BAD_REQUEST, message: cValidation, datetime: formatDateSystem() });
    
    await DB.transaction(async (trx) => {
      // Delete existing
      await trx("mst_ruang_event_fasilitas").where("kode_ruang_event", oPayload.kode_ruang_event).del();
      
      // Insert new
      if (oPayload.kode_fasilitas && oPayload.kode_fasilitas.length > 0) {
        const insertData = oPayload.kode_fasilitas.map(f => ({
          kode_ruang_event: oPayload.kode_ruang_event,
          kode_fasilitas: f,
          created_at: formatDateSystem(),
          created_by: req.auth?.user_id || 1
        }));
        await trx("mst_ruang_event_fasilitas").insert(insertData);
      }
    });
    return res.status(200).json({ status: status.SUKSES, message: "Fasilitas berhasil disimpan ke Ruang Event", datetime: formatDateSystem() });
  } catch (error) {
    const oResult = { status: status.BAD_REQUEST, message: "Sistem sedang maintenance harap tunggu sebentar", datetime: formatDateSystem() };
    Logging(error, { file: "master/ruang_event_fasilitas/ruang_event_fasilitas_assign.js", func: "assign", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});
export default router;
