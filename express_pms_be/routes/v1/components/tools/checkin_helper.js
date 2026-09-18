/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file checkin_helper.js
 * @description Helper functions for check-in process
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-04
 * @version 1.0.0
 */
import { formatDateSystem } from "./date_tools.js";
import { generateSequence } from "./generateCode.js";

/**
 * Memproses check-in untuk sebuah room di reservasi, termasuk assign kamar (jika belum),
 * insert checkin, buka folio, dan charge kamar awal.
 * 
 * @param {Object} params
 * @param {string} params.kode_reservasi_room - ID kamar di reservasi
 * @param {Object} params.trx - Instance Knex transaction (WAJIB)
 * @param {string|number} params.userId - User ID yang melakukan check-in
 * @param {string} [params.kode_kamar_manual] - Jika ada, akan pakai kamar ini. Jika tidak, auto-assign.
 * @returns {Promise<Object>}
 */
export const processCheckIn = async ({ kode_reservasi_room, trx, userId, kode_kamar_manual }) => {
    if (!trx) throw new Error("processCheckIn membutuhkan instance transaction (trx)");

    const tNow = formatDateSystem();

    // 1. Ambil data reservasi room
    const resRoom = await trx("trx_reservation_room as rr")
        .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
        .select(
            "rr.*",
            "r.kode_cabang",
            "r.check_in_date",
            "r.check_out_date"
        )
        .where("rr.kode_reservasi_room", kode_reservasi_room)
        .first();

    if (!resRoom) {
        throw new Error("Data reservasi kamar tidak ditemukan");
    }

    if (resRoom.status === 'checked_in') {
        throw new Error("Kamar ini sudah di-check-in sebelumnya");
    }

    // 2. Assign & Row-Lock Kamar
    let kamarAvailable;
    if (kode_kamar_manual) {
        kamarAvailable = await trx("mst_kamar")
            .where("kode_kamar", kode_kamar_manual)
            .where("kode_tipe_kamar", resRoom.kode_tipe_kamar)
            .where("occupancy_status", "vacant")
            .where("housekeeping_status", "clean")
            .where("is_active", 1)
            .whereNull("deleted_at")
            .forUpdate()
            .first();
    } else {
        kamarAvailable = await trx("mst_kamar")
            .where("kode_tipe_kamar", resRoom.kode_tipe_kamar)
            .where("kode_cabang", resRoom.kode_cabang) // Asumsi kamar per cabang
            .where("occupancy_status", "vacant")
            .where("housekeeping_status", "clean")
            .where("is_active", 1)
            .whereNull("deleted_at")
            .forUpdate()
            .first();
    }

    if (!kamarAvailable) {
        throw new Error("Kamar sudah tidak tersedia atau belum bersih. Silakan tunggu atau pilih kamar lain.");
    }

    const assignedKamar = kamarAvailable.kode_kamar;
    const computedNights = resRoom.nights;
    const ratePerNight = parseFloat(resRoom.rate_per_night || 0);
    const totalRoomCharge = ratePerNight * computedNights;

    // 3. Generate IDs
    const noCheckin = await generateSequence("FMT-CHECKIN", trx);
    const noFolioCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
    
    if (!noCheckin || !noFolioCharge) {
        throw new Error("Gagal membuat nomor transaksi check-in");
    }

    // 4. Update trx_reservation_room
    await trx("trx_reservation_room")
        .where("kode_reservasi_room", kode_reservasi_room)
        .update({
            kode_kamar: assignedKamar,
            status: "checked_in",
            updated_by: userId,
            updated_at: tNow
        });

    // 5. Update trx_reservation (jika belum checked_in)
    await trx("trx_reservation")
        .where("kode_reservasi", resRoom.kode_reservation)
        .update({
            status: "checked_in",
            updated_by: userId,
            updated_at: tNow
        });

    // 6. Insert trx_checkin
    await trx("trx_checkin").insert({
        kode_checkin: noCheckin,
        kode_reservation_room: kode_reservasi_room,
        early_checkin: 0,
        checkin_by: userId,
        checkin_at: tNow,
        created_by: userId,
        created_at: tNow
    });

    // 7. Cek / Buat trx_folio (Satu reservasi multi-kamar menggunakan satu folio gabungan)
    let targetFolio = await trx("trx_folio")
        .where("kode_reservation", resRoom.kode_reservation)
        .where("status", "open")
        .first();

    const activeTaxes = await trx("mst_tax")
        .where("kode_cabang", resRoom.kode_cabang)
        .where("is_active", 1)
        .whereNull("deleted_at");

    let folioCode;
    if (!targetFolio) {
        const noFolio = await generateSequence("FMT-FOLIO", trx);
        if (!noFolio) throw new Error("Gagal membuat nomor transaksi folio");

        let taxAmount = 0;
        let serviceChargeAmount = 0;
        activeTaxes.forEach((t) => {
            const pct = parseFloat(t.percentage) || 0;
            const nominal = Math.round(totalRoomCharge * (pct / 100));
            if (t.tax_type === "service_charge") serviceChargeAmount += nominal;
            else taxAmount += nominal;
        });

        const initialGrandTotal = totalRoomCharge + taxAmount + serviceChargeAmount;

        await trx("trx_folio").insert({
            kode_cabang: resRoom.kode_cabang,
            kode_folio: noFolio,
            kode_reservation: resRoom.kode_reservation,
            folio_owner_type: "guest",
            status: "open",
            subtotal: totalRoomCharge,
            tax_amount: taxAmount,
            service_charge_amount: serviceChargeAmount,
            grand_total: initialGrandTotal,
            created_by: userId,
            created_at: tNow
        });
        folioCode = noFolio;
    } else {
        folioCode = targetFolio.kode_folio;
        const existingRoomCharge = await trx("trx_folio_charge")
            .where("kode_folio", folioCode)
            .where("ref_source_type", "trx_reservation_room")
            .where("kode_ref_source", kode_reservasi_room)
            .where("is_active", 1)
            .first();

        // Hanya tambahkan ke subtotal folio jika charge kamar ini BELUM PERNAH dimasukkan sebelumnya
        if (!existingRoomCharge) {
            const newSubtotal = parseFloat(targetFolio.subtotal || 0) + totalRoomCharge;
            let taxAmount = 0;
            let serviceChargeAmount = 0;
            activeTaxes.forEach((t) => {
                const pct = parseFloat(t.percentage) || 0;
                const nominal = Math.round(newSubtotal * (pct / 100));
                if (t.tax_type === "service_charge") serviceChargeAmount += nominal;
                else taxAmount += nominal;
            });
            const newGrandTotal = newSubtotal + taxAmount + serviceChargeAmount;

            await trx("trx_folio")
                .where("kode_folio", folioCode)
                .update({
                    subtotal: newSubtotal,
                    tax_amount: taxAmount,
                    service_charge_amount: serviceChargeAmount,
                    grand_total: newGrandTotal,
                    updated_by: userId,
                    updated_at: tNow
                });
        }
    }

    // 8. Insert atau Update trx_folio_charge
    const existingRoomCharge = await trx("trx_folio_charge")
        .where("kode_folio", folioCode)
        .where("ref_source_type", "trx_reservation_room")
        .where("kode_ref_source", kode_reservasi_room)
        .where("is_active", 1)
        .first();

    if (!existingRoomCharge) {
        await trx("trx_folio_charge").insert({
            kode_folio_charge: noFolioCharge,
            kode_folio: folioCode,
            charge_type: "room",
            description: `Room Charge (${computedNights} night/s) - Kamar ${kamarAvailable.nomor_kamar || assignedKamar}`,
            qty: computedNights,
            unit_price: ratePerNight,
            amount: totalRoomCharge,
            ref_source_type: "trx_reservation_room",
            kode_ref_source: kode_reservasi_room,
            posted_by: userId,
            posted_at: tNow,
            created_by: userId,
            created_at: tNow,
            is_active: 1
        });
    } else {
        await trx("trx_folio_charge")
            .where("id", existingRoomCharge.id)
            .update({
                description: `Room Charge (${computedNights} night/s) - Kamar ${kamarAvailable.nomor_kamar || assignedKamar}`,
                posted_by: userId,
                posted_at: tNow
            });
    }

    // 9. Update Kamar (occupancy_status)
    await trx("mst_kamar")
        .where("kode_kamar", assignedKamar)
        .update({
            occupancy_status: "occupied",
            updated_at: tNow,
            updated_by: userId
        });

    return {
        kode_checkin: noCheckin,
        kode_folio: folioCode,
        kode_kamar_assigned: assignedKamar,
        nights: computedNights,
        total_charge: totalRoomCharge
    };
};
