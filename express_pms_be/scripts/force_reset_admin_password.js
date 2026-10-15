/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file force_reset_admin_password.js
 * @description Skrip operasional opsional untuk mereset password akun admin/superadmin dengan Bcrypt
 * @usage node scripts/force_reset_admin_password.js <username> <new_password>
 * @author Senior Backend & Security Engineer
 * @created 2026-10-15
 * @version 1.0.0
 */

import "dotenv/config";
import DB from "../core/config/knex.js";
import { hashPassword } from "../routes/v1/components/tools/password_tools.js";
import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

const run = async () => {
  const args = process.argv.slice(2);
  const username = args[0] || process.env.RESET_USERNAME;
  const newPassword = args[1] || process.env.RESET_PASSWORD;

  if (!username || !newPassword) {
    console.error("Penggunaan: node scripts/force_reset_admin_password.js <username> <new_password>");
    console.error("Atau set RESET_USERNAME dan RESET_PASSWORD di environment variable.");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("Password minimal 8 karakter!");
    process.exit(1);
  }

  try {
    const user = await DB("mst_user")
      .where("username", username)
      .orWhere("user_code", username)
      .first();

    if (!user) {
      console.error(`User '${username}' tidak ditemukan di database.`);
      process.exit(1);
    }

    const hashedPassword = await hashPassword(newPassword);

    await DB("mst_user")
      .where("id", user.id)
      .update({
        password: hashedPassword,
        updated_at: formatDateSystem(),
      });

    console.log(`✅ Sukses: Password untuk user '${user.username}' (${user.user_code}, role: ${user.role}) berhasil diperbarui dengan Bcrypt hash.`);
  } catch (err) {
    console.error("Gagal mereset password:", err.message);
  } finally {
    await DB.destroy();
  }
};

run();
