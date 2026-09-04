import knex from 'knex';
import { generateSequence } from './routes/v1/components/tools/generateCode.js';

const db = knex({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'hotel_pms'
  }
});

function formatDateSystem() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function run() {
  try {
    const oPayload = {
      kode_reservasi_room: 'RES-ROOM-MOCK-001',
      payment: [
        {
            payment_method: 'cash',
            amount: 500000,
            kode_cashier_shift: 'SHI0001',
            reference_no: 'Lunas'
        }
      ]
    };
    const user_id = 1;

    let cUniqueCode = "";
    await db.transaction(async (trx) => {
      // 1. Ambil trx_reservation_room + trx_folio terkait
      const resRoom = await trx("trx_reservation_room")
        .where("kode_reservasi_room", oPayload.kode_reservasi_room)
        .first();

      if (!resRoom) throw new Error("Data kamar reservasi tidak ditemukan");

      const folio = await trx("trx_folio")
        .where("kode_reservation", resRoom.kode_reservation)
        .first();

      if (!folio) throw new Error("Data folio tidak ditemukan");

      // 2. Hitung ulang tax_amount dan service_charge_amount dari mst_tax
      const activeTaxes = await trx("mst_tax")
        .where("kode_cabang", folio.kode_cabang)
        .andWhere("is_active", 1);

      let totalTaxAmount = 0;
      let totalServiceCharge = 0;
      let calculatedSubtotal = parseFloat(folio.subtotal) || 0;

      activeTaxes.forEach(tax => {
          let nominal = 0;
          nominal = calculatedSubtotal * (parseFloat(tax.percentage) / 100);
          if (tax.tax_type === 'tax') totalTaxAmount += nominal;
          if (tax.tax_type === 'service_charge') totalServiceCharge += nominal;
      });

      const grandTotal = calculatedSubtotal + totalTaxAmount + totalServiceCharge;

      // 3. Hitung total yang sudah dibayar
      const currentPayments = await trx("trx_payment")
        .where("kode_folio", folio.kode_folio)
        .sum("amount as total_paid")
        .first();
      
      let totalPaid = parseFloat(currentPayments.total_paid || 0);

      // 4. Insert new payments
      if (oPayload.payment && oPayload.payment.length > 0) {
        for (const pay of oPayload.payment) {
           const payCode = await generateSequence("FMT-PAY", trx);
           await trx("trx_payment").insert({
               kode_payment: payCode,
               kode_folio: folio.kode_folio,
               payment_method: pay.payment_method,
               amount: pay.amount,
               reference_no: pay.reference_no,
               kode_cashier_shift: pay.kode_cashier_shift,
               received_by: user_id,
               paid_at: formatDateSystem(),
               created_by: user_id,
               created_at: formatDateSystem()
           });
           totalPaid += parseFloat(pay.amount);
        }
      }

      // 5. Hitung outstanding
      const outstanding = grandTotal - totalPaid;

      if (outstanding > 0 && folio.folio_owner_type === 'guest') {
          throw new Error(`Masih ada tagihan belum lunas: Rp ${outstanding}`);
      }

      // 6. Row-lock mst_kamar (.forUpdate())
      const mstKamar = await trx("mst_kamar")
        .where("kode_kamar", resRoom.kode_kamar)
        .forUpdate()
        .first();
        
      if (mstKamar) {
          const oldOccupancy = mstKamar.occupancy_status;
          await trx("mst_kamar")
            .where("kode_kamar", resRoom.kode_kamar)
            .update({
                occupancy_status: 'vacant',
                housekeeping_status: 'dirty',
                updated_at: formatDateSystem(),
                updated_by: user_id
            });

          const logCode = await generateSequence("FMT-RSL", trx);
          await trx("trx_room_status_log").insert({
              kode_room_status_log: logCode,
              kode_kamar: resRoom.kode_kamar,
              status_from: oldOccupancy,
              status_to: 'vacant',
              changed_by: user_id,
              changed_at: formatDateSystem()
          });
      }

      const hkTaskCode = await generateSequence("FMT-HKT", trx);
      await trx("trx_housekeeping_task").insert({
          kode_housekeeping_task: hkTaskCode,
          kode_cabang: folio.kode_cabang,
          kode_kamar: resRoom.kode_kamar,
          task_type: 'cleaning',
          priority: 'normal',
          status: 'assigned',
          created_by: user_id,
          created_at: formatDateSystem()
      });

      cUniqueCode = await generateSequence("FMT-CO", trx);
      await trx("trx_checkout").insert({
          kode_checkout: cUniqueCode,
          kode_reservation_room: oPayload.kode_reservasi_room,
          late_checkout: 0,
          grand_total: grandTotal,
          checkout_by: user_id,
          checkout_at: formatDateSystem(),
          created_by: user_id,
          created_at: formatDateSystem()
      });

      await trx("trx_reservation_room")
        .where("kode_reservasi_room", oPayload.kode_reservasi_room)
        .update({
            status: 'checked_out',
            updated_by: user_id,
            updated_at: formatDateSystem()
        });

      await trx("trx_folio")
        .where("kode_folio", folio.kode_folio)
        .update({
            status: 'closed',
            tax_amount: totalTaxAmount,
            service_charge_amount: totalServiceCharge,
            grand_total: grandTotal,
            closed_at: formatDateSystem(),
            updated_by: user_id,
            updated_at: formatDateSystem()
        });

      const allRoomsInRes = await trx("trx_reservation_room")
        .where("kode_reservation", resRoom.kode_reservation);
        
      const allCheckedOut = allRoomsInRes.every(r => r.status === 'checked_out' || r.kode_reservasi_room === resRoom.kode_reservasi_room); 
      
      if (allCheckedOut) {
          await trx("trx_reservation")
            .where("kode_reservasi", resRoom.kode_reservation)
            .update({
                status: 'checked_out',
                updated_at: formatDateSystem(),
                updated_by: user_id
            });
      }
    });
    console.log("SUCCESS:", cUniqueCode);
  } catch (error) {
    console.error("ERROR DETILE:", error);
  } finally {
    db.destroy();
  }
}

run();
