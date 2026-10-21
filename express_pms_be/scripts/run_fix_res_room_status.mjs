import DB from '../core/config/knex.js';

async function run() {
  console.log('--- Memperbaiki status trx_reservation_room ---');
  try {
    await DB.raw("ALTER TABLE `trx_reservation_room` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'booked'");
    console.log('SUCCESS: Kolom status pada trx_reservation_room berhasil diubah menjadi VARCHAR(50)');
    process.exit(0);
  } catch (err) {
    console.error('Gagal alter table:', err);
    process.exit(1);
  }
}

run();
