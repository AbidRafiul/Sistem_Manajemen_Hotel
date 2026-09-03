/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file pricing_helper.js
 * @description Helper functions for calculating room rates
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-03
 * @version 1.0.0
 */
import { formatDateSystem } from "./date_tools.js";
import { Logging } from "./servertool.js";

/**
 * Menghitung harga akhir kamar berdasarkan master data dan override
 * @param {Object} params 
 * @param {string} params.kode_tipe_kamar - Kode Tipe Kamar
 * @param {string} params.kode_rate_plan - Kode Paket Harga (Rate Plan)
 * @param {string} [params.kode_season] - Kode Season (Opsional)
 * @param {Date|string} params.tanggal - Tanggal menginap aktual
 * @param {Object} trx - Knex transaction object (WAJIB)
 * @returns {Promise<{price: number, source: string, breakdown: any, kode_harga_price?: string}>}
 */
export const hitungHargaKamar = async ({ kode_tipe_kamar, kode_rate_plan, kode_season, tanggal }, trx) => {
  if (!trx) {
    throw new Error("hitungHargaKamar membutuhkan instance transaction (trx)");
  }

  const targetDate = tanggal
    ? formatDateSystem(tanggal, "yyyy-MM-dd")
    : formatDateSystem(new Date(), "yyyy-MM-dd");

  let seasonToUse = kode_season || null;

  // 1. Dapatkan detail tipe kamar
  const tkData = await trx("mst_tipe_kamar")
    .where("kode_tipe_kamar", kode_tipe_kamar)
    .whereNull("deleted_at")
    .select("harga_default", "kode_cabang")
    .first();

  if (!tkData) {
    throw new Error(`Tipe kamar ${kode_tipe_kamar} tidak ditemukan`);
  }

  const hargaDefault = parseFloat(tkData.harga_default || 0);

  // 2. Dapatkan detail rate plan
  const rpData = await trx("mst_paket_harga")
    .where("kode_paket_harga", kode_rate_plan)
    .whereNull("deleted_at")
    .select("tipe_markup", "nilai_markup")
    .first();

  if (!rpData) {
    throw new Error(`Rate plan ${kode_rate_plan} tidak ditemukan`);
  }

  // 3. Auto-detect season jika tidak dikirim
  if (!seasonToUse) {
    const activeSeasons = await trx("mst_musim")
      .where("kode_cabang", tkData.kode_cabang)
      .where("is_active", 1)
      .whereNull("deleted_at")
      .where("tanggal_mulai", "<=", targetDate)
      .andWhere(function () {
        this.where("tanggal_selesai", ">=", targetDate).orWhereNull("tanggal_selesai");
      })
      .orderBy("tanggal_mulai", "desc");

    if (activeSeasons && activeSeasons.length > 0) {
      // Jika terjadi overlap (ada lebih dari 1 record yang valid di tanggal ini)
      if (activeSeasons.length > 1) {
        Logging(
          new Error("Overlap Season Detect"),
          {
            file: "pricing_helper.js",
            func: "hitungHargaKamar",
            message: `Terdapat ${activeSeasons.length} season aktif yang overlap pada tanggal ${targetDate} untuk cabang ${tkData.kode_cabang}. Menggunakan season dengan tanggal_mulai terbaru: ${activeSeasons[0].kode_musim}`,
            seasons: activeSeasons.map(s => s.kode_musim)
          }
        );
      }
      seasonToUse = activeSeasons[0].kode_musim;
    }
  }

  // 4. Cek mst_rate_plan_price untuk override
  const overrideQuery = trx("mst_rate_plan_price")
    .where("kode_tipe_kamar", kode_tipe_kamar)
    .where("kode_rate_plan", kode_rate_plan)
    .where("is_active", 1)
    .whereNull("deleted_at")
    .where("valid_from", "<=", targetDate)
    .andWhere(function () {
      this.where("valid_to", ">=", targetDate).orWhereNull("valid_to");
    });

  if (seasonToUse) {
    overrideQuery.where("kode_season", seasonToUse);
  } else {
    overrideQuery.whereNull("kode_season");
  }

  const overrideData = await overrideQuery.first();

  if (overrideData) {
    return {
      price: parseFloat(overrideData.price),
      source: "override",
      kode_harga_price: overrideData.kode_harga_price,
      breakdown: {
        season_used: seasonToUse,
        original_request: { kode_tipe_kamar, kode_rate_plan, tanggal: targetDate }
      }
    };
  }

  // 5. Kalau tidak ada override, hitung dari master
  const nilaiMarkup = parseFloat(rpData.nilai_markup || 0);
  const tipeMarkup = rpData.tipe_markup;

  let computedPrice = hargaDefault;
  if (tipeMarkup === "nominal") {
    computedPrice += nilaiMarkup;
  } else if (tipeMarkup === "persen") {
    computedPrice += (hargaDefault * nilaiMarkup) / 100;
  }

  return {
    price: computedPrice,
    source: "computed",
    breakdown: {
      season_used: seasonToUse,
      harga_default: hargaDefault,
      tipe_markup: tipeMarkup,
      nilai_markup: nilaiMarkup,
    },
  };
};
