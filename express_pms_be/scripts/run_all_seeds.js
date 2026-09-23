/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file run_all_seeds.js
 * @description Script otomatis untuk menjalankan migrasi & seluruh seeder secara berurutan.
 *              Sangat cocok dijalankan di Railway Production atau saat inisialisasi lokal:
 *              node scripts/run_all_seeds.js (atau npm run seed:all)
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-17
 * @version 1.0.0
 */

import "dotenv/config";
import knex from "knex";
import knexConfig from "../knexfile.js";

const currentEnv = process.env.NODE_ENV || "development";
const config = knexConfig[currentEnv] || knexConfig.default;
const db = knex(config);

async function runAll() {
  console.log("================================================================");
  console.log("  🚀 Memulai Setup Database & Seeding Hotel PMS (Railway / Local)");
  console.log("================================================================\n");

  try {
    // 1. Jalankan Migrasi DDL (ALTER TABLE & CREATE TABLE)
    console.log("▶ [LANGKAH 1/4] Menjalankan Migrasi Skema Database...");
    const { seed: seedMigration } = await import("../seeds/migration_batch3_seeder.js");
    await seedMigration(db);

    // 2. Jalankan User Superadmin
    console.log("\n▶ [LANGKAH 2/4] Memeriksa & Menyiapkan Akun Superadmin...");
    const { seed: seedSuperadmin } = await import("../seeds/superadmin.js");
    await seedSuperadmin(db);
    console.log("  ✅ Akun Superadmin siap (superadmin@admin.com / Superadmin321!)");

    // 3. Jalankan Navigasi Menu
    console.log("\n▶ [LANGKAH 3/4] Menyiapkan Navigasi Menu Seluruh Role...");
    const { seed: seedNav } = await import("../seeds/navigation_master_setup.js");
    await seedNav(db);
    console.log("  ✅ Navigasi menu tersinkronisasi untuk seluruh role dan user");

    // 4. Jalankan Master Data & Demo Transaksi Seluruh Menu
    console.log("\n▶ [LANGKAH 4/5] Memuat Master Data & Demo Transaksi Seluruh Halaman...");
    const { seed: seedMaster } = await import("../seeds/master_data_seeder.js");
    await seedMaster(db);

    // 5. Jalankan Master Wilayah (Regions)
    console.log("\n▶ [LANGKAH 5/6] Memuat Data Master Wilayah (Regions)...");
    const { seed: seedWilayah } = await import("../seeds/seed_master_wilayah.js");
    await seedWilayah(db);

    // 6. Jalankan Multi-Branch Enterprise Hierarchy & User Scopes
    console.log("\n▶ [LANGKAH 6/6] Menyiapkan Multi-Branch Enterprise Hierarchy & User Scope Permissions...");
    const { seed: seedHierarchy } = await import("../seeds/multi_branch_hierarchy_migration.js");
    await seedHierarchy(db);

    console.log("================================================================");
    console.log("  🎉 SETUP DATABASE SELESAI!");
    console.log("  Semua menu, master data, multi-branch scope, dan transaksi demo siap.");
    console.log("================================================================\n");

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ GAGAL MENJALANKAN SEEDER:", error);
    await db.destroy();
    process.exit(1);
  }
}

runAll();
