/**
 * Migration Script: Add Master Tamu columns & indexes to mst_guest
 * Standard additive migration (safe & reversible)
 */
import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);

export async function up() {
  console.log("Starting UP migration for mst_guest...");
  
  const columnsToAdd = [
    { name: 'title', type: 'VARCHAR(20) NULL' },
    { name: 'first_name', type: 'VARCHAR(100) NULL' },
    { name: 'last_name', type: 'VARCHAR(100) NULL' },
    { name: 'birth_date', type: 'DATE NULL' },
    { name: 'gender', type: "ENUM('L','P') NULL" },
    { name: 'identity_file_path', type: 'VARCHAR(255) NULL' },
    { name: 'passport_no', type: 'VARCHAR(50) NULL' },
    { name: 'passport_issuing_country', type: 'VARCHAR(50) NULL' },
    { name: 'passport_expiry', type: 'DATE NULL' },
    { name: 'visa_type', type: 'VARCHAR(50) NULL' },
    { name: 'visa_no', type: 'VARCHAR(50) NULL' },
    { name: 'arrival_date_indonesia', type: 'DATE NULL' },
    { name: 'purpose_of_visit', type: 'VARCHAR(100) NULL' },
    { name: 'guest_type', type: "ENUM('individual','corporate','travel_agent','group') NOT NULL DEFAULT 'individual'" },
    { name: 'vip_level', type: "ENUM('none','vip','vvip','owner') NOT NULL DEFAULT 'none'" },
    { name: 'blacklist_by', type: 'BIGINT UNSIGNED NULL' },
    { name: 'blacklist_at', type: 'DATETIME NULL' },
    { name: 'company_id', type: 'VARCHAR(50) NULL' },
    { name: 'loyalty_tier', type: 'VARCHAR(50) NULL' },
    { name: 'preferences', type: 'JSON NULL' },
    { name: 'internal_notes', type: 'TEXT NULL' },
    { name: 'consent_marketing', type: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'consent_at', type: 'DATETIME NULL' },
    { name: 'total_night', type: 'INT NOT NULL DEFAULT 0' },
    { name: 'avg_adr', type: 'DECIMAL(14,2) NOT NULL DEFAULT 0.00' },
    { name: 'last_stay_date', type: 'DATE NULL' },
    { name: 'source', type: "ENUM('front_office','manual_input','ota_import') NOT NULL DEFAULT 'manual_input'" },
    { name: 'completeness_score', type: 'INT NOT NULL DEFAULT 0' },
    { name: 'is_merged', type: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'merged_into_guest_id', type: 'VARCHAR(50) NULL' }
  ];

  for (const col of columnsToAdd) {
    const hasCol = await db.schema.hasColumn('mst_guest', col.name);
    if (!hasCol) {
      await db.raw(`ALTER TABLE \`mst_guest\` ADD COLUMN \`${col.name}\` ${col.type}`);
      console.log(`Added column ${col.name}`);
    } else {
      console.log(`Column ${col.name} already exists, skipping.`);
    }
  }

  // Add indexes safely
  const indexesToAdd = [
    { name: 'idx_guest_phone', column: 'phone' },
    { name: 'idx_guest_email', column: 'email' },
    { name: 'idx_guest_id_number', column: 'id_number' },
    { name: 'idx_guest_full_name', column: 'full_name' },
    { name: 'idx_guest_nationality', column: 'nationality' },
    { name: 'idx_guest_is_blacklist', column: 'is_blacklisted' },
    { name: 'idx_guest_last_stay_date', column: 'last_stay_date' }
  ];

  for (const idx of indexesToAdd) {
    try {
      await db.raw(`ALTER TABLE \`mst_guest\` ADD INDEX \`${idx.name}\` (\`${idx.column}\`)`);
      console.log(`Added index ${idx.name}`);
    } catch (err) {
      if (err.message.includes('Duplicate key name') || err.message.includes('already exists')) {
        console.log(`Index ${idx.name} already exists, skipping.`);
      } else {
        console.log(`Note on index ${idx.name}: ${err.message}`);
      }
    }
  }

  console.log("UP migration for mst_guest completed successfully.");
}

export async function down() {
  console.log("Starting DOWN migration for mst_guest...");
  
  const columnsToRemove = [
    'title', 'first_name', 'last_name', 'birth_date', 'gender',
    'identity_file_path', 'passport_no', 'passport_issuing_country',
    'passport_expiry', 'visa_type', 'visa_no', 'arrival_date_indonesia',
    'purpose_of_visit', 'guest_type', 'vip_level', 'blacklist_by',
    'blacklist_at', 'company_id', 'loyalty_tier', 'preferences',
    'internal_notes', 'consent_marketing', 'consent_at', 'total_night',
    'avg_adr', 'last_stay_date', 'source', 'completeness_score',
    'is_merged', 'merged_into_guest_id'
  ];

  for (const col of columnsToRemove) {
    const hasCol = await db.schema.hasColumn('mst_guest', col);
    if (hasCol) {
      await db.raw(`ALTER TABLE \`mst_guest\` DROP COLUMN \`${col}\``);
      console.log(`Dropped column ${col}`);
    }
  }

  const indexesToRemove = [
    'idx_guest_phone', 'idx_guest_email', 'idx_guest_id_number',
    'idx_guest_full_name', 'idx_guest_nationality',
    'idx_guest_is_blacklist', 'idx_guest_last_stay_date'
  ];

  for (const idx of indexesToRemove) {
    try {
      await db.raw(`ALTER TABLE \`mst_guest\` DROP INDEX \`${idx}\``);
      console.log(`Dropped index ${idx}`);
    } catch (err) {
      // Ignore if not exists
    }
  }

  console.log("DOWN migration for mst_guest completed successfully.");
}

if (process.argv[1].endsWith('migrate_master_tamu.js')) {
  const mode = process.argv[2] || 'up';
  if (mode === 'down') {
    down().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
  } else {
    up().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
  }
}
