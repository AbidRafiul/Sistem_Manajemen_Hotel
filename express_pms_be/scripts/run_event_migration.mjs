import DB from '../core/config/knex.js';

async function run() {
  console.log('--- Memulai Migrasi Skema Event & BEO ---');

  // 1. Pastikan tabel `trx_reservasi_event` ada
  const hasEventTable = await DB.schema.hasTable('trx_reservasi_event');
  if (!hasEventTable) {
    console.log('Membuat tabel trx_reservasi_event...');
    await DB.schema.createTable('trx_reservasi_event', (table) => {
      table.bigIncrements('id').primary();
      table.string('kode_reservasi_event', 255).notNullable().unique();
      table.string('nama_event', 255).notNullable().defaultTo('Agenda Acara Hotel');
      table.string('kode_ruang_event', 255).notNullable();
      table.string('kode_cabang', 255).notNullable();
      table.string('kode_tamu', 255).notNullable();
      table.string('kode_corporate', 255).nullable();
      table.string('kode_reservasi_kamar', 255).nullable();
      table.date('tgl_mulai').notNullable();
      table.date('tgl_selesai').notNullable();
      table.time('jam_mulai').notNullable();
      table.time('jam_selesai').notNullable();
      table.integer('jumlah_tamu').notNullable();
      table.enu('layout_setup', ['theater', 'classroom', 'u_shape', 'boardroom', 'banquet', 'standing', 'hollow_square', 'custom']).notNullable().defaultTo('theater');
      table.enu('tipe_sewa', ['per_jam', 'half_day', 'full_day', 'custom_package']).notNullable().defaultTo('half_day');
      table.decimal('durasi_jam', 5, 2).nullable().defaultTo(4.00);
      table.decimal('tarif_sewa', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('biaya_tambahan', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('diskon', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('pajak_persen', 5, 2).notNullable().defaultTo(10.00);
      table.decimal('nominal_pajak', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('service_charge_persen', 5, 2).notNullable().defaultTo(0.00);
      table.decimal('nominal_service_charge', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('total_biaya', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('deposit_paid', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('sisa_tagihan', 18, 2).notNullable().defaultTo(0.00);
      table.enu('status_pembayaran', ['unpaid', 'deposit', 'paid', 'refunded']).notNullable().defaultTo('unpaid');
      table.string('status_event', 50).notNullable().defaultTo('tentative');
      table.string('contact_person', 150).nullable();
      table.string('contact_phone', 50).nullable();
      table.string('contact_email', 100).nullable();
      table.integer('setup_buffer_minutes').notNullable().defaultTo(30);
      table.integer('teardown_buffer_minutes').notNullable().defaultTo(30);
      table.text('catatan_khusus').nullable();
      table.text('catatan_batal').nullable();
      table.datetime('created_at').notNullable();
      table.string('created_by', 255).nullable();
      table.datetime('updated_at').notNullable();
      table.string('updated_by', 255).nullable();
      table.datetime('deleted_at').nullable();
      table.string('deleted_by', 255).nullable();
      table.tinyint('is_active', 1).defaultTo(1);
    });
    console.log('Tabel trx_reservasi_event berhasil dibuat.');
  } else {
    console.log('Tabel trx_reservasi_event sudah ada, memeriksa kolom yang hilang...');
    const currentCols = await DB('trx_reservasi_event').columnInfo();
    const colsToAdd = [
      { name: 'nama_event', fn: (t) => t.string('nama_event', 255).notNullable().defaultTo('Agenda Acara Hotel') },
      { name: 'layout_setup', fn: (t) => t.enu('layout_setup', ['theater', 'classroom', 'u_shape', 'boardroom', 'banquet', 'standing', 'hollow_square', 'custom']).notNullable().defaultTo('theater') },
      { name: 'tipe_sewa', fn: (t) => t.enu('tipe_sewa', ['per_jam', 'half_day', 'full_day', 'custom_package']).notNullable().defaultTo('half_day') },
      { name: 'durasi_jam', fn: (t) => t.decimal('durasi_jam', 5, 2).nullable().defaultTo(4.00) },
      { name: 'tarif_sewa', fn: (t) => t.decimal('tarif_sewa', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'biaya_tambahan', fn: (t) => t.decimal('biaya_tambahan', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'diskon', fn: (t) => t.decimal('diskon', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'pajak_persen', fn: (t) => t.decimal('pajak_persen', 5, 2).notNullable().defaultTo(10.00) },
      { name: 'nominal_pajak', fn: (t) => t.decimal('nominal_pajak', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'service_charge_persen', fn: (t) => t.decimal('service_charge_persen', 5, 2).notNullable().defaultTo(0.00) },
      { name: 'nominal_service_charge', fn: (t) => t.decimal('nominal_service_charge', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'total_biaya', fn: (t) => t.decimal('total_biaya', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'deposit_paid', fn: (t) => t.decimal('deposit_paid', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'sisa_tagihan', fn: (t) => t.decimal('sisa_tagihan', 18, 2).notNullable().defaultTo(0.00) },
      { name: 'status_pembayaran', fn: (t) => t.enu('status_pembayaran', ['unpaid', 'deposit', 'paid', 'refunded']).notNullable().defaultTo('unpaid') },
      { name: 'contact_person', fn: (t) => t.string('contact_person', 150).nullable() },
      { name: 'contact_phone', fn: (t) => t.string('contact_phone', 50).nullable() },
      { name: 'contact_email', fn: (t) => t.string('contact_email', 100).nullable() },
      { name: 'setup_buffer_minutes', fn: (t) => t.integer('setup_buffer_minutes').notNullable().defaultTo(30) },
      { name: 'teardown_buffer_minutes', fn: (t) => t.integer('teardown_buffer_minutes').notNullable().defaultTo(30) },
      { name: 'catatan_khusus', fn: (t) => t.text('catatan_khusus').nullable() },
      { name: 'catatan_batal', fn: (t) => t.text('catatan_batal').nullable() },
    ];

    for (const c of colsToAdd) {
      if (!currentCols[c.name]) {
        console.log(`Menambahkan kolom ${c.name} ke trx_reservasi_event...`);
        await DB.schema.alterTable('trx_reservasi_event', (t) => {
          c.fn(t);
        });
      }
    }
  }

  // 2. Pastikan tabel `trx_reservasi_event_item` ada
  const hasItemTable = await DB.schema.hasTable('trx_reservasi_event_item');
  if (!hasItemTable) {
    console.log('Membuat tabel trx_reservasi_event_item...');
    await DB.schema.createTable('trx_reservasi_event_item', (table) => {
      table.bigIncrements('id').primary();
      table.string('kode_reservasi_event', 255).notNullable().index('fk_rei_event');
      table.enu('item_type', ['fnb', 'equipment', 'facility', 'other']).notNullable().defaultTo('fnb');
      table.string('item_name', 255).notNullable();
      table.integer('qty').notNullable().defaultTo(1);
      table.string('unit', 50).notNullable().defaultTo('pax');
      table.decimal('harga_satuan', 18, 2).notNullable().defaultTo(0.00);
      table.decimal('subtotal', 18, 2).notNullable().defaultTo(0.00);
      table.string('catatan', 255).nullable();
      table.datetime('created_at').notNullable();
      table.string('created_by', 255).nullable();
      table.datetime('updated_at').nullable();
      table.string('updated_by', 255).nullable();
      table.tinyint('is_active', 1).defaultTo(1);
    });
    console.log('Tabel trx_reservasi_event_item berhasil dibuat.');
  }

  // 3. Pastikan format penomoran `FMT-RESEVENT` terdaftar di sys_format_penomoran
  const hasSysFormat = await DB.schema.hasTable('sys_format_penomoran');
  if (hasSysFormat) {
    const existingFormat = await DB('sys_format_penomoran').where('kode_format', 'FMT-RESEVENT').first();
    if (!existingFormat) {
      console.log('Mendaftarkan FMT-RESEVENT di sys_format_penomoran...');
      await DB('sys_format_penomoran').insert({
        kode_format: 'FMT-RESEVENT',
        nama_tabel: 'trx_reservasi_event',
        prefix: 'EVT',
        panjang_digit: 5,
        nomor_terakhir: 1,
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('FMT-RESEVENT berhasil didaftarkan.');
    }
  }

  // 4. Verifikasi final
  const finalCols = await DB('trx_reservasi_event').columnInfo();
  console.log('Daftar kolom final di trx_reservasi_event:', Object.keys(finalCols));
  console.log('--- Migrasi Skema Event & BEO Selesai dengan Sukses ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migrasi Gagal:', err);
  process.exit(1);
});
