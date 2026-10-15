/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file env_check.js
 * @description Validasi environment variable penting sebelum server Express berjalan
 * @author Senior Backend & Security Engineer
 * @created 2026-10-15
 * @version 1.0.0
 */

export const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const appDebug = process.env.APP_DEBUG === "true";
  const devAuthBypass = process.env.DEV_AUTH_BYPASS === "true";

  const userSecret = process.env.USER_SECRET || "";
  const userKey = process.env.USER_KEY || "";
  const userPasKey = process.env.USER_PAS_KEY || "";

  const errors = [];
  const warnings = [];

  // 1. Validasi USER_SECRET (min 32 karakter)
  if (!userSecret) {
    errors.push("USER_SECRET wajib didefinisikan.");
  } else if (userSecret.length < 32) {
    const msg = `USER_SECRET terlalu pendek (${userSecret.length} karakter). Minimal 32 karakter dibutuhkan.`;
    if (isProduction) errors.push(msg);
    else warnings.push(msg);
  }

  // 2. Validasi USER_KEY (min 16 karakter)
  if (!userKey) {
    errors.push("USER_KEY wajib didefinisikan.");
  } else if (userKey.length < 16) {
    const msg = `USER_KEY terlalu pendek (${userKey.length} karakter). Minimal 16 karakter dibutuhkan.`;
    if (isProduction) errors.push(msg);
    else warnings.push(msg);
  }

  // 3. Validasi USER_PAS_KEY (min 16 karakter)
  if (!userPasKey) {
    errors.push("USER_PAS_KEY wajib didefinisikan.");
  } else if (userPasKey.length < 16) {
    const msg = `USER_PAS_KEY terlalu pendek (${userPasKey.length} karakter). Minimal 16 karakter dibutuhkan.`;
    if (isProduction) errors.push(msg);
    else warnings.push(msg);
  }

  // 4. Validasi APP_DEBUG di Production
  if (isProduction && appDebug) {
    errors.push("Pelanggaran Keamanan: APP_DEBUG tidak boleh bernilai 'true' pada environment production!");
  }

  // 5. Validasi DEV_AUTH_BYPASS di Production
  if (isProduction && devAuthBypass) {
    errors.push("Pelanggaran Keamanan: DEV_AUTH_BYPASS tidak boleh aktif pada environment production!");
  }

  // Tampilkan peringatan jika dalam mode non-production
  if (!isProduction) {
    if (warnings.length > 0) {
      console.warn("\n⚠️  [ENV SECURITY WARNING] ⚠️");
      warnings.forEach((w) => console.warn(` - ${w}`));
      console.warn("Segera perbarui secret di file .env sebelum melakukan deployment ke production!\n");
    }

    if (devAuthBypass) {
      console.warn(
        "\n🚨 [CRITICAL WARNING] DEV_AUTH_BYPASS is ENABLED in development mode! Authentication bypass is ACTIVE! Do NOT use in production! 🚨\n"
      );
    }
  }

  // Jika production dan ada kesalahan, hentikan proses
  if (isProduction && errors.length > 0) {
    console.error("\n❌ [FATAL ENV ERROR - PRODUCTION SHUTDOWN] ❌");
    errors.forEach((err) => console.error(` - ${err}`));
    console.error("Server dihentikan demi menjaga keamanan data.\n");
    process.exit(1);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

export default validateEnvironment;
