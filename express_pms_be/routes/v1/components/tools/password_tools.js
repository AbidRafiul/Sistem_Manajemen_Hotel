/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file password_tools.js
 * @description Utilitas hashing dan verifikasi password modern (Bcrypt) dengan lazy migration untuk legacy HMAC-SHA512
 * @author Senior Backend & Security Engineer
 * @created 2026-10-15
 * @version 1.0.0
 */

import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

// Dummy hash valid untuk proteksi timing-attack saat user tidak ditemukan
const DUMMY_HASH = "$2b$12$e8r0qF9M5Hvx7yWJ7O9aXe6v1uDk8P9Y8sF0o1a2b3c4d5e6f7g8h";

/**
 * Menghasilkan hash HMAC-SHA512 legacy (untuk backward compatibility).
 */
const legacyHmacSha512 = (text, secret) => {
  return crypto.createHmac("sha512", secret).update(text).digest("hex");
};

/**
 * Membandingkan dua string hex secara timing-safe.
 */
const timingSafeEquals = (a, b) => {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

/**
 * Melakukan hash password plain text menggunakan Bcrypt (salt rounds 12).
 * @param {string} plainPassword 
 * @returns {Promise<string>}
 */
export const hashPassword = async (plainPassword) => {
  if (!plainPassword || typeof plainPassword !== "string") {
    throw new Error("Password harus berupa string non-kosong.");
  }
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Memverifikasi password plain text terhadap stored hash di database.
 * Mendukung hash Bcrypt ($2a$, $2b$, $2y$) dan legacy HMAC-SHA512 (128 hex chars).
 * @param {string} plainPassword - Password dari request login
 * @param {string} storedHash - Hash yang tersimpan di tabel mst_user
 * @param {string} userCode - user_code untuk salt legacy HMAC-SHA512
 * @returns {Promise<{ isMatch: boolean, needsRehash: boolean }>}
 */
export const verifyPassword = async (plainPassword, storedHash, userCode = "") => {
  if (!plainPassword || !storedHash) {
    return { isMatch: false, needsRehash: false };
  }

  // 1. Cek apakah storedHash merupakan Bcrypt hash ($2a$, $2b$, $2y$)
  const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash);

  if (isBcrypt) {
    const isMatch = await bcrypt.compare(plainPassword, storedHash);
    return { isMatch, needsRehash: false };
  }

  // 2. Cek apakah storedHash merupakan format legacy HMAC-SHA512 (128 karakter hex)
  const isLegacyHex = /^[0-9a-fA-F]{128}$/.test(storedHash);

  if (isLegacyHex) {
    const userKey = process.env.USER_KEY || "";
    const userSecret = process.env.USER_SECRET || "";
    const legacyInput = userKey + userCode + plainPassword;
    const computedLegacyHash = legacyHmacSha512(legacyInput, userSecret);

    const isMatch = timingSafeEquals(computedLegacyHash, storedHash);
    // Jika password benar dengan algoritma legacy, tandai needsRehash = true untuk lazy migration
    return { isMatch, needsRehash: isMatch };
  }

  // Format hash tidak dikenali
  return { isMatch: false, needsRehash: false };
};

/**
 * Menjalankan verifikasi password dummy untuk memastikan waktu respons
 * identik saat username tidak ditemukan (mencegah user enumeration via timing attack).
 * @param {string} plainPassword 
 * @returns {Promise<void>}
 */
export const dummyVerifyPassword = async (plainPassword) => {
  try {
    await bcrypt.compare(plainPassword || "dummy", DUMMY_HASH);
  } catch {
    // Abaikan error pada dummy hash
  }
};

export default {
  hashPassword,
  verifyPassword,
  dummyVerifyPassword,
};
