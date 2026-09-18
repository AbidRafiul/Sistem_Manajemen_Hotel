/* global process */
/**
 * Script khusus untuk menjalankan seeder navigasi (mst_navigation)
 * Menambahkan Dashboard Reservasi (/reservasi_dashboard) ke menu seluruh role.
 *
 * Jalankan dengan: node scripts/run_seed_navigation.js
 */

import "dotenv/config";
import knex from "knex";
import knexConfig from "../knexfile.js";

const currentEnv = process.env.NODE_ENV || "development";
const config = knexConfig[currentEnv] || knexConfig.default;
const db = knex(config);

async function runSeed() {
  console.log("================================================================");
  console.log("  🚀 Menjalankan Seeder Navigasi Menu Hotel PMS...");
  console.log("================================================================\n");

  try {
    const { seed } = await import("../seeds/navigation_master_setup.js");
    await seed(db);

    console.log("  ✅ Berhasil menyinkronkan menu navigasi di tabel `mst_navigation`");
    console.log("  ✅ Halaman '/reservasi_dashboard' telah aktif untuk seluruh role.");
    console.log("================================================================\n");

    await db.destroy();
    process.exit(0);
  } catch (err) {
    console.error("❌ Gagal menyinkronkan menu navigasi:", err);
    await db.destroy();
    process.exit(1);
  }
}

runSeed();
