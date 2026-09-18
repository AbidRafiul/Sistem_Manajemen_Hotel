/**
 * @copyright (c) 2026 PT Marstech Global
 * @file check_duplicate.js
 * @description Endpoint deteksi kandidat duplikasi profil tamu
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
  const { kode_cabang, full_name, phone, id_number, birth_date, current_guest_id } = oPayload;

  if (!full_name && !phone && !id_number) {
    return res.status(200).json({
      status: status.SUKSES,
      message: "Data pencarian kosong",
      datetime: formatDateSystem(),
      data: { candidates: [], max_confidence: 0 }
    });
  }

  try {
    const candidates = [];
    const idMap = new Map();

    // 1. Cek Exact ID Number Match
    if (id_number && id_number.trim()) {
      const matchId = await DB("mst_guest")
        .whereNull("deleted_at")
        .andWhere("is_merged", 0)
        .andWhere(function() {
          if (kode_cabang) this.where("kode_cabang", kode_cabang);
        })
        .andWhere("id_number", id_number.trim())
        .modify(qb => {
          if (current_guest_id) qb.whereNot("kode_tamu", current_guest_id).whereNot("id", current_guest_id);
        })
        .select("id", "kode_tamu", "full_name", "phone", "id_number", "birth_date", "nationality", "created_at");

      for (const item of matchId) {
        if (!idMap.has(item.kode_tamu)) {
          const cand = {
            ...item,
            confidence_score: 100,
            confidence_level: "PASTI",
            match_reason: "Nomor ID / Identitas sama persis"
          };
          candidates.push(cand);
          idMap.set(item.kode_tamu, cand);
        }
      }
    }

    // 2. Cek Phone Match
    if (phone && phone.trim()) {
      const matchPhone = await DB("mst_guest")
        .whereNull("deleted_at")
        .andWhere("is_merged", 0)
        .andWhere(function() {
          if (kode_cabang) this.where("kode_cabang", kode_cabang);
        })
        .andWhere("phone", phone.trim())
        .modify(qb => {
          if (current_guest_id) qb.whereNot("kode_tamu", current_guest_id).whereNot("id", current_guest_id);
        })
        .select("id", "kode_tamu", "full_name", "phone", "id_number", "birth_date", "nationality", "created_at");

      for (const item of matchPhone) {
        if (!idMap.has(item.kode_tamu)) {
          const isNameSimilar = full_name && item.full_name.toLowerCase().includes(full_name.trim().toLowerCase());
          const score = isNameSimilar ? 90 : 80;
          const cand = {
            ...item,
            confidence_score: score,
            confidence_level: "KUAT",
            match_reason: isNameSimilar ? "Nama & Nomor Telepon cocok" : "Nomor Telepon sama persis"
          };
          candidates.push(cand);
          idMap.set(item.kode_tamu, cand);
        }
      }
    }

    // 3. Cek Similar Name + Birth Date or Name Only
    if (full_name && full_name.trim().length >= 3) {
      const cleanName = full_name.trim().toLowerCase();
      const matchName = await DB("mst_guest")
        .whereNull("deleted_at")
        .andWhere("is_merged", 0)
        .andWhere(function() {
          if (kode_cabang) this.where("kode_cabang", kode_cabang);
        })
        .whereRaw("LOWER(full_name) LIKE ?", [`%${cleanName}%`])
        .modify(qb => {
          if (current_guest_id) qb.whereNot("kode_tamu", current_guest_id).whereNot("id", current_guest_id);
        })
        .select("id", "kode_tamu", "full_name", "phone", "id_number", "birth_date", "nationality", "created_at")
        .limit(10);

      for (const item of matchName) {
        if (!idMap.has(item.kode_tamu)) {
          let score = 40;
          let reason = "Nama mirip";

          if (birth_date && item.birth_date && formatDateSystem(item.birth_date, "yyyy-MM-dd") === formatDateSystem(birth_date, "yyyy-MM-dd")) {
            score = 75;
            reason = "Nama mirip & Tanggal Lahir sama";
          }

          const cand = {
            ...item,
            confidence_score: score,
            confidence_level: score >= 70 ? "PERLU_REVIEW" : "RENDAH",
            match_reason: reason
          };
          candidates.push(cand);
          idMap.set(item.kode_tamu, cand);
        }
      }
    }

    // Sort by confidence_score descending
    candidates.sort((a, b) => b.confidence_score - a.confidence_score);
    const maxScore = candidates.length > 0 ? candidates[0].confidence_score : 0;

    return res.status(200).json({
      status: status.SUKSES,
      message: candidates.length > 0 ? `Ditemukan ${candidates.length} kandidat duplikat` : "Tidak ditemukan duplikat",
      datetime: formatDateSystem(),
      data: {
        candidates,
        max_confidence: maxScore,
        has_exact_duplicate: maxScore >= 85
      }
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Terjadi kesalahan saat memeriksa duplikat",
      datetime: formatDateSystem(),
    };
    Logging(error, {
      file: "master/guest/check_duplicate.js",
      func: "check",
      request: oPayload,
      response: oResult,
      user: username,
    });
    return res.status(500).json(oResult);
  }
});

export default router;
