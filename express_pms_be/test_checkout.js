import axios from 'axios';
import knex from 'knex';

const db = knex({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'hotel_pms'
  }
});

const API_URL = 'http://localhost:8000/api/v1';
let token = '';

async function run() {
  try {
    const timestamp = new Date().toISOString();
    console.log("1. Login...");
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: 'superadmin@admin.com',
      password: 'Superadmin321!',
      remember_me: '0'
    }, {
      headers: { 'x-timestamp': timestamp }
    });
    token = loginRes.data.data.access_token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.headers.common['x-timestamp'] = timestamp;

    console.log("2. Setup Mock Data Reservasi & Folio...");
    const cabang = await db('mst_cabang').first();
    let kamar = await db('mst_kamar').where('occupancy_status', 'vacant').first();
    
    // Create Mock Reservation
    const kodeRes = 'RES-MOCK-001';
    const kodeResRoom = 'RES-ROOM-MOCK-001';
    const kodeFolio = 'FOL-MOCK-001';
    const kodeTamu = 'GST001';
    
    // Clean up if exist
    await db('trx_checkout').where('kode_reservation_room', kodeResRoom).delete();
    await db('trx_housekeeping_task').where('kode_kamar', 'KAM0002').delete();
    await db('trx_payment').where('kode_folio', kodeFolio).delete();
    await db('trx_reservation_room').where('kode_reservasi_room', kodeResRoom).delete();
    await db('trx_folio').where('kode_folio', kodeFolio).delete();
    await db('trx_reservation').where('kode_reservasi', kodeRes).delete();
    
    // Insert/update guest
    const checkGuest = await db('mst_guest').where('kode_tamu', kodeTamu).first();
    if (!checkGuest) {
        await db('mst_guest').insert({
            kode_cabang: cabang.kode_cabang,
            kode_tamu: kodeTamu,
            full_name: 'Mock Guest',
            id_type: 'ktp',
            id_number: '1234567890',
            phone: '08123456789'
        });
    }

    await db('trx_reservation').insert({
        kode_cabang: cabang.kode_cabang,
        kode_reservasi: kodeRes,
        booking_type: 'individual',
        kode_guest: kodeTamu,
        check_in_date: new Date(),
        check_out_date: new Date(),
        status: 'checked_in'
    });

    const ratePlan = await db('mst_paket_harga').first();
    const validRatePlan = ratePlan ? ratePlan.kode_paket_harga : 'MOCK-RATE';
    
    await db('trx_reservation_room').insert({
        kode_reservasi_room: kodeResRoom,
        kode_reservation: kodeRes,
        kode_tipe_kamar: kamar.kode_tipe_kamar,
        kode_rate_plan: validRatePlan,
        rate_per_night: 500000,
        nights: 1,
        kode_kamar: kamar.kode_kamar,
        status: 'checked_in'
    });

    await db('trx_folio').insert({
        kode_folio: kodeFolio,
        kode_cabang: cabang.kode_cabang,
        kode_reservation: kodeRes,
        folio_owner_type: 'guest',
        subtotal: 500000,
        status: 'open'
    });

    await db('mst_kamar').where('kode_kamar', kamar.kode_kamar).update({
        occupancy_status: 'occupied',
        housekeeping_status: 'clean'
    });

    console.log("3. Buka Shift Kasir...");
    const counter = await db('mst_cashier_counter').where('kode_cabang', cabang.kode_cabang).first();
    if (!counter) {
        await db('mst_cashier_counter').insert({
            kode_counter: 'CTR02',
            kode_cabang: cabang.kode_cabang,
            name: 'Loket Test',
            is_active: 1
        });
    }
    
    let cashierShift = '';
    const existingShift = await db('trx_cashier_shift').where('status', 'open').first();
    if (existingShift) {
        cashierShift = existingShift.kode_cashier_shift;
        console.log(`Menggunakan shift kasir aktif: ${cashierShift}`);
    } else {
        const openShiftRes = await axios.post(`${API_URL}/kasir/shift-open`, {
            kode_cabang: cabang.kode_cabang,
            kode_cashier_counter: counter ? counter.kode_counter : 'CTR02',
            opening_cash: 500000
        }, { headers: { 'x-timestamp': new Date().toISOString() }});
        cashierShift = openShiftRes.data.data.kode_cashier_shift;
        console.log(`Shift dibuka: ${cashierShift}`);
    }

    console.log("4. Coba Checkout Tanpa Payment Tambahan (Seharusnya Gagal)...");
    try {
        await axios.post(`${API_URL}/reservasi/checkout/checkout-submit`, {
            kode_reservasi_room: kodeResRoom
        }, { headers: { 'x-timestamp': new Date().toISOString() }});
        console.log("ERROR: Checkout seharusnya gagal karena outstanding > 0");
    } catch (error) {
        console.log(`Berhasil ditolak dengan pesan: ${error.response?.data?.message || error.message}`);
        
        const msg = error.response?.data?.message || "";
        const match = msg.match(/Rp\s*([\d\.,]+)/);
        let sisaBayar = 0;
        if (match) {
            sisaBayar = parseFloat(match[1]);
        } else {
            sisaBayar = 500000; // default jika gagal parse, misal karena taks belum ada
        }
        
        console.log(`5. Coba Checkout Dengan Payment Tambahan: Rp ${sisaBayar}...`);
        const checkoutRes = await axios.post(`${API_URL}/reservasi/checkout/checkout-submit`, {
            kode_reservasi_room: kodeResRoom,
            payment: [
                {
                    payment_method: 'cash',
                    amount: sisaBayar,
                    kode_cashier_shift: cashierShift,
                    reference_no: 'Lunas'
                }
            ]
        }, { headers: { 'x-timestamp': new Date().toISOString() }});
        
        console.log("Berhasil Checkout!");
        console.log(checkoutRes.data);
    }
    
    console.log("6. Pengecekan DB (mst_kamar dan housekeeping task)...");
    const k = await db('mst_kamar').where('kode_kamar', kamar.kode_kamar).first();
    console.log(`Status Kamar: ${k.occupancy_status} / ${k.housekeeping_status}`);
    
    const hk = await db('trx_housekeeping_task').where('kode_kamar', kamar.kode_kamar).orderBy('id', 'desc').first();
    if (hk) {
        console.log(`Housekeeping task terbuat: ${hk.kode_housekeeping_task}, type: ${hk.task_type}, status: ${hk.status}`);
    } else {
        console.log("ERROR: Task housekeeping tidak terbuat!");
    }

  } catch (error) {
    console.error("Terjadi error utama:", error.response?.data || error.message);
  } finally {
    db.destroy();
  }
}

run();
