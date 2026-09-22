/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file multi_branch_hierarchy_migration.js
 * @description Seeder migrasi Multi-Branch Enterprise Hierarchy.
 *              Menjalankan pembuatan tabel companies, org_nodes, user_scope_assignments,
 *              menambahkan kolom company_id & default_branch_id, serta inisialisasi data
 *              secara IDEMPOTENT (aman dijalankan berulang).
 *
 * @author Antigravity
 * @created 2026-09-22
 * @version 1.0.0
 */

import { formatDateSystem } from "../routes/v1/components/tools/date_tools.js";

export async function seed(knex) {
  const dNow = formatDateSystem();

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Multi-Branch Enterprise Hierarchy Migration Seeder      ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // 1. CREATE TABLE companies
  console.log("\n[1/6] Memeriksa tabel `companies`...");
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`companies\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`code\` VARCHAR(50) NOT NULL,
      \`name\` VARCHAR(200) NOT NULL,
      \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_company_code\` (\`code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("  ✅ Tabel `companies` siap.");

  // 2. CREATE TABLE org_nodes
  console.log("\n[2/6] Memeriksa tabel `org_nodes`...");
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`org_nodes\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`company_id\` BIGINT UNSIGNED NOT NULL,
      \`parent_id\` BIGINT UNSIGNED NULL,
      \`node_type\` ENUM('company', 'region', 'branch_group', 'branch') NOT NULL DEFAULT 'region',
      \`code\` VARCHAR(50) NOT NULL,
      \`name\` VARCHAR(150) NOT NULL,
      \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_org_node_code\` (\`company_id\`, \`code\`),
      KEY \`idx_org_nodes_parent\` (\`parent_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("  ✅ Tabel `org_nodes` siap.");

  // 3. CREATE TABLE user_scope_assignments
  console.log("\n[3/6] Memeriksa tabel `user_scope_assignments`...");
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`user_scope_assignments\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`user_id\` BIGINT NOT NULL,
      \`scope_type\` ENUM('company', 'org_node', 'branch') NOT NULL,
      \`scope_id\` BIGINT UNSIGNED NOT NULL,
      \`access_mode\` ENUM('view', 'manage', 'operate') NOT NULL DEFAULT 'operate',
      \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_user_scope_user\` (\`user_id\`),
      KEY \`idx_user_scope_type_id\` (\`scope_type\`, \`scope_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("  ✅ Tabel `user_scope_assignments` siap.");

  // 4. ALTER TABLE mst_cabang
  console.log("\n[4/6] Memeriksa kolom `company_id` & `org_node_id` pada `mst_cabang`...");
  const cabangCols = await knex.raw(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang'
  `);
  const cabangColNames = cabangCols[0].map((c) => c.COLUMN_NAME);

  if (!cabangColNames.includes("company_id")) {
    await knex.raw(
      "ALTER TABLE `mst_cabang` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `id`"
    );
    console.log("  ✅ Kolom `company_id` ditambahkan ke `mst_cabang`.");
  }
  if (!cabangColNames.includes("org_node_id")) {
    await knex.raw(
      "ALTER TABLE `mst_cabang` ADD COLUMN `org_node_id` BIGINT UNSIGNED NULL AFTER `company_id`"
    );
    console.log("  ✅ Kolom `org_node_id` ditambahkan ke `mst_cabang`.");
  }

  // 5. ALTER TABLE mst_user
  console.log("\n[5/6] Memeriksa kolom enterprise pada `mst_user`...");
  const userCols = await knex.raw(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user'
  `);
  const userColNames = userCols[0].map((c) => c.COLUMN_NAME);

  if (!userColNames.includes("company_id")) {
    await knex.raw(
      "ALTER TABLE `mst_user` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `role`"
    );
    console.log("  ✅ Kolom `company_id` ditambahkan ke `mst_user`.");
  }
  if (!userColNames.includes("default_branch_id")) {
    await knex.raw(
      "ALTER TABLE `mst_user` ADD COLUMN `default_branch_id` BIGINT UNSIGNED NULL AFTER `company_id`"
    );
    console.log("  ✅ Kolom `default_branch_id` ditambahkan ke `mst_user`.");
  }
  if (!userColNames.includes("can_switch_branch")) {
    await knex.raw(
      "ALTER TABLE `mst_user` ADD COLUMN `can_switch_branch` TINYINT(1) NOT NULL DEFAULT 0 AFTER `default_branch_id`"
    );
    console.log("  ✅ Kolom `can_switch_branch` ditambahkan ke `mst_user`.");
  }

  // 6. SEED INITIAL DATA
  console.log("\n[6/6] Menyiapkan Initial Data (Company, Org Node, Scopes)...");

  // 6.1 Company Default
  const existingCompany = await knex("companies").where("code", "CMP001").first();
  let companyId = existingCompany ? existingCompany.id : null;
  if (!existingCompany) {
    const [insertedId] = await knex("companies").insert({
      code: "CMP001",
      name: "Grand Marstech Hotel & Resort",
      status: "active",
      created_at: dNow,
    });
    companyId = insertedId;
    console.log(`  ✅ Perusahaan default dibuat dengan ID: ${companyId}`);
  } else {
    console.log(`  ⏭️ Perusahaan default sudah ada (ID: ${companyId})`);
  }

  // 6.2 Org Node Default (Region Jawa Timur)
  const existingOrgNode = await knex("org_nodes")
    .where("company_id", companyId)
    .where("code", "REG-JATIM")
    .first();
  let orgNodeId = existingOrgNode ? existingOrgNode.id : null;
  if (!existingOrgNode) {
    const [insertedNodeId] = await knex("org_nodes").insert({
      company_id: companyId,
      parent_id: null,
      node_type: "region",
      code: "REG-JATIM",
      name: "Wilayah Jawa Timur",
      status: "active",
      created_at: dNow,
    });
    orgNodeId = insertedNodeId;
    console.log(`  ✅ Region default dibuat dengan ID: ${orgNodeId}`);
  } else {
    console.log(`  ⏭️ Region default sudah ada (ID: ${orgNodeId})`);
  }

  // 6.3 Hubungkan cabang ke company & org node
  await knex("mst_cabang")
    .whereNull("company_id")
    .orWhere("company_id", 0)
    .update({ company_id: companyId, org_node_id: orgNodeId });
  console.log("  ✅ Cabang eksisting disinkronisasi ke Company & Region.");

  // Dapatkan cabang utama (CAB0001) sebagai default fallback
  const firstCabang = await knex("mst_cabang").orderBy("id", "asc").first();
  const defaultBranchId = firstCabang ? firstCabang.id : 1;

  // 6.4 Seeding User Scope Assignments
  const allUsers = await knex("mst_user").select("id", "username", "role");
  for (const u of allUsers) {
    const roleLower = (u.role || "").toLowerCase();
    const isManagerOrAdmin = ["superadmin", "admin", "master"].includes(roleLower);

    // Update mst_user
    await knex("mst_user")
      .where("id", u.id)
      .update({
        company_id: companyId,
        default_branch_id: defaultBranchId,
        can_switch_branch: isManagerOrAdmin ? 1 : 0,
      });

    // Check assignment
    const existingAssign = await knex("user_scope_assignments")
      .where("user_id", u.id)
      .first();

    if (!existingAssign) {
      if (isManagerOrAdmin) {
        // Manager / Admin: Scope Company
        await knex("user_scope_assignments").insert({
          user_id: u.id,
          scope_type: "company",
          scope_id: companyId,
          access_mode: "manage",
          is_default: 1,
          created_at: dNow,
        });
        console.log(`  ✅ User ${u.username} (${u.role}) diberikan scope COMPANY (All Branches).`);
      } else {
        // Staff Operasional (kasir, housekeeping, receptionist, dll): Scope Branch
        await knex("user_scope_assignments").insert({
          user_id: u.id,
          scope_type: "branch",
          scope_id: defaultBranchId,
          access_mode: "operate",
          is_default: 1,
          created_at: dNow,
        });
        console.log(`  ✅ User ${u.username} (${u.role}) diberikan scope BRANCH (ID: ${defaultBranchId}).`);
      }
    }
  }

  console.log("\n================================================================");
  console.log("  🎉 MIGRASI MULTI-BRANCH ENTERPRISE HIERARCHY SELESAI!");
  console.log("================================================================\n");
}
