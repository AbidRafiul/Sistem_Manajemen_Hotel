/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file env_check.js
 * @description Validasi environment variable penting sebelum server Express berjalan
 * @author Senior Backend & Security Engineer
 * @created 2026-10-15
 * @version 1.0.1
 */

export const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const appDebug = process.env.APP_DEBUG === "true";

  const userSecret = process.env.USER_SECRET || "";
  const userKey = process.env.USER_KEY || "";
  const userPasKey = process.env.USER_PAS_KEY || "";

  const errors = [];
  const warnings = [];

  // 1. Validasi Variabel Wajib README
  const requiredVars = [
    { key: "ORIGIN", val: process.env.ORIGIN },
    { key: "DB_DBMS", val: process.env.DB_DBMS },
    { key: "DB_HOST", val: process.env.DB_HOST },
    { key: "DB_USERNAME", val: process.env.DB_USERNAME },
    { key: "DB_DATABASE", val: process.env.DB_DATABASE },
    { key: "USER_SECRET", val: userSecret },
    { key: "USER_KEY", val: userKey },
    { key: "USER_PAS_KEY", val: userPasKey },
  ];

  for (const { key, val } of requiredVars) {
    if (val === undefined || val === null || String(val).trim() === "") {
      errors.push(`Variabel environment wajib '${key}' belum didefinisikan.`);
    }
  }

  // 2. Validasi Panjang Secret (Ambang 32 karakter khusus production)
  // USER_SECRET: min 32 karakter di production
  if (userSecret && userSecret.length < 32) {
    const msg = `USER_SECRET terlalu pendek (${userSecret.length} karakter). Minimal 32 karakter dibutuhkan di production.`;
    if (isProduction) errors.push(msg);
    else warnings.push(msg);
  }

  // USER_KEY: min 32 karakter di production
  if (userKey && userKey.length < 32) {
    const msg = `USER_KEY terlalu pendek (${userKey.length} karakter). Minimal 32 karakter dibutuhkan di production.`;
    if (isProduction) errors.push(msg);
    else warnings.push(msg);
  }

  // USER_PAS_KEY: hanya divalidasi ada dan tidak kosong (tidak dikenakan ambang 32 karakter)

  // 3. Validasi APP_DEBUG di Production (Gagal start jika production + APP_DEBUG=true)
  if (isProduction && appDebug) {
    errors.push("Pelanggaran Keamanan: APP_DEBUG tidak boleh bernilai 'true' pada environment production!");
  }

  // Tampilkan peringatan jika dalam mode non-production
  if (!isProduction && warnings.length > 0) {
    console.warn("\n⚠️  [ENV SECURITY WARNING] ⚠️");
    warnings.forEach((w) => console.warn(` - ${w}`));
    console.warn("Harap perbarui secret di file .env dengan nilai acak minimal 32 karakter sebelum deployment production!\n");
  }

  // Jika production dan ada kesalahan, hentikan proses (gagal start)
  if (isProduction && errors.length > 0) {
    console.error("\n❌ [FATAL ENV ERROR - PRODUCTION SHUTDOWN] ❌");
    errors.forEach((err) => console.error(` - ${err}`));
    console.error("Server dihentikan demi menjaga keamanan data.\n");
    process.exit(1);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

export default validateEnvironment;
