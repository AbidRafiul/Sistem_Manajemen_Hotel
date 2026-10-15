/* global process */
/**
 * Script khusus untuk menyinkronkan menu navigasi Front Office Desk (/front_office)
 * ke tabel mst_navigation untuk seluruh role di database PMS.
 *
 * Jalankan dengan: node scripts/run_seed_front_office_nav.js
 */

import "dotenv/config";
import knex from "knex";
import knexConfig from "../knexfile.js";

const currentEnv = process.env.NODE_ENV || "development";
const config = knexConfig[currentEnv] || knexConfig.default;
const db = knex(config);

async function runSeed() {
  console.log("================================================================");
  console.log("  🚀 Menjalankan Seeder Front Office Desk (/front_office)...");
  console.log("================================================================\n");

  try {
    const { seed } = await import("../seeds/navigation_master_setup.js");
    await seed(db);

    console.log("  ✅ Berhasil menyinkronkan menu navigasi di tabel `mst_navigation`");
    console.log("  ✅ Halaman '/front_office' telah aktif untuk seluruh role di database.");
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
