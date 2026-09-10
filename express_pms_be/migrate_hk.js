import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);

async function run() {
  try {
    await db.raw("ALTER TABLE `trx_housekeeping_task` ADD COLUMN `cancel_reason` VARCHAR(255) NULL");
    console.log("Added cancel_reason column.");
  } catch (e) {
    console.log(e.message);
  }
  
  try {
    await db.raw("ALTER TABLE `trx_housekeeping_task` MODIFY COLUMN `status` ENUM('assigned','in_progress','finished','supervisor_approved','canceled') NOT NULL DEFAULT 'assigned'");
    console.log("Updated status enum.");
  } catch (e) {
    console.log(e.message);
  }

  process.exit(0);
}

run();
