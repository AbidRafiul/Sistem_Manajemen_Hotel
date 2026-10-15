/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file business_date_helper.js
 * @description Helper manajemen Business Date per properti (cabang), bukan tanggal kalender server.
 *              Business Date hanya boleh maju tepat 1 hari setelah Night Audit berstatus COMPLETED.
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "./date_tools.js";

/**
 * Format string tanggal atau objek Date menjadi format standar YYYY-MM-DD.
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export const formatYmd = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    const m = dateVal.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  return formatDateSystem(dateVal, "yyyy-MM-dd");
};

/**
 * Mengambil Business Date aktif untuk cabang tertentu.
 * Jika belum ada, otomatis diinisialisasi berdasarkan tanggal hari ini atau konfigurasi default.
 * @param {string} kodeCabang 
 * @param {import("knex").Knex} trx 
 * @returns {Promise<{current_business_date: string, is_locked: boolean, last_audit_id: string|null}>}
 */
export const getCurrentBusinessDate = async (kodeCabang, trx = DB) => {
  if (!kodeCabang) {
    throw new Error("getCurrentBusinessDate membutuhkan kodeCabang");
  }

  let row = await trx("sys_business_date")
    .where("kode_cabang", kodeCabang)
    .first();

  if (!row) {
    // Inisialisasi awal
    const defaultDate = formatDateSystem(new Date(), "yyyy-MM-dd");
    await trx("sys_business_date").insert({
      kode_cabang: kodeCabang,
      current_business_date: defaultDate,
      is_locked: 0,
      created_at: formatDateSystem()
    }).onConflict("kode_cabang").ignore();

    row = await trx("sys_business_date")
      .where("kode_cabang", kodeCabang)
      .first();
  }

  const ymd = formatYmd(row.current_business_date);

  return {
    current_business_date: ymd,
    is_locked: Boolean(row.is_locked),
    last_audit_id: row.last_audit_id || null
  };
};

/**
 * Mengunci Business Date saat Night Audit mulai berjalan.
 * Mencegah transaksi posting kamar baru / perubahan audit bersamaan.
 * @param {string} kodeCabang 
 * @param {string} auditCode 
 * @param {import("knex").Knex} trx 
 */
export const lockBusinessDate = async (kodeCabang, auditCode, trx = DB) => {
  await trx("sys_business_date")
    .where("kode_cabang", kodeCabang)
    .update({
      is_locked: 1,
      last_audit_id: auditCode,
      updated_at: formatDateSystem()
    });
};

/**
 * Membuka kembali kunci Business Date (misal saat audit selesai atau gagal).
 * @param {string} kodeCabang 
 * @param {import("knex").Knex} trx 
 */
export const unlockBusinessDate = async (kodeCabang, trx = DB) => {
  await trx("sys_business_date")
    .where("kode_cabang", kodeCabang)
    .update({
      is_locked: 0,
      updated_at: formatDateSystem()
    });
};

/**
 * Memajukan Business Date tepat 1 hari setelah Night Audit sukses (Rollover).
 * @param {string} kodeCabang 
 * @param {string} currentYmd - Tanggal aktif yang baru saja diaudit
 * @param {string} auditCode 
 * @param {import("knex").Knex} trx 
 * @returns {Promise<string>} Next business date (YYYY-MM-DD)
 */
export const advanceBusinessDate = async (kodeCabang, currentYmd, auditCode, trx = DB) => {
  const currentDate = new Date(`${currentYmd}T00:00:00Z`);
  const nextDateObj = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const nextYmd = nextDateObj.toISOString().split("T")[0];

  await trx("sys_business_date")
    .where("kode_cabang", kodeCabang)
    .update({
      current_business_date: nextYmd,
      is_locked: 0,
      last_audit_id: auditCode,
      updated_at: formatDateSystem()
    });

  return nextYmd;
};

/**
 * Mengembalikan Business Date ke tanggal sebelumnya saat proses Reopen Audit disetujui Manager.
 * @param {string} kodeCabang 
 * @param {string} targetYmd 
 * @param {import("knex").Knex} trx 
 */
export const rollbackBusinessDate = async (kodeCabang, targetYmd, trx = DB) => {
  await trx("sys_business_date")
    .where("kode_cabang", kodeCabang)
    .update({
      current_business_date: targetYmd,
      is_locked: 0,
      updated_at: formatDateSystem()
    });
};
