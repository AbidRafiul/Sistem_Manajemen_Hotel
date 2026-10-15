import knex from 'knex';
import config from './knexfile.js';
import { seed } from './seeds/navigation_master_setup.js';

const db = knex(config.development);

async function run() {
  try {
    console.log("Running navigation seeder...");
    await seed(db);
    console.log("Navigation seeder executed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding navigation:", err);
    process.exit(1);
  }
}

run();
