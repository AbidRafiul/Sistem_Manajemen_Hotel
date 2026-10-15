/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file knex_migration_baseline_proposal.js
 * @description PROPOSAL ONLY / DRAFT BASELINE MIGRASI KNEX
 *              Contoh format migrasi Knex standar jika tim ingin mengadopsi
 *              fitur `knex migrate:latest` secara penuh.
 *              ⚠️ JANGAN DIJALANKAN KE DATABASE PRODUKSI / TESTING.
 * @author Tim Engineering Standard
 * @version 1.0.0
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Catatan: Ini adalah berkas rancangan (proposal) dan tidak untuk dieksekusi.
  // Jika diaktifkan, migrasi ini akan mencatat baseline skema database:
  /*
  const hasCompanies = await knex.schema.hasTable('companies');
  if (!hasCompanies) {
    await knex.schema.createTable('companies', (table) => {
      table.bigIncrements('id').unsigned().primary();
      table.string('code', 50).notNullable().unique();
      table.string('name', 200).notNullable();
      table.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
      table.timestamps(true, true);
    });
  }
  */
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Rollback logic (draft)
  /*
  await knex.schema.dropTableIfExists('companies');
  */
}
