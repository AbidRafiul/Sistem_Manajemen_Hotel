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
export const processCheckIn = async ({ 
    kode_reservasi_room, 
    trx, 
    userId, 
    kode_kamar_manual, 
    kode_cashier_shift, 
    guest_count,
    is_early_checkin = false,
    apply_early_checkin_fee = false,
    early_checkin_amount = 150000
}) => {
    if (!trx) throw new Error("processCheckIn membutuhkan instance transaction (trx)");

    const tNow = formatDateSystem();

    // 1. Ambil data reservasi room
    const resRoom = await trx("trx_reservation_room as rr")
        .join("trx_reservation as r", "rr.kode_reservation", "r.kode_reservasi")
        .select(
            "rr.*",
            "r.kode_cabang",
            "r.check_in_date",
            "r.check_out_date",
            "r.guest_count as res_guest_count"
        )
        .where("rr.kode_reservasi_room", kode_reservasi_room)
        .first();

    if (!resRoom) {
        throw new Error("Data reservasi kamar tidak ditemukan");
    }

    if (resRoom.status === 'checked_in') {
        throw new Error("Kamar ini sudah di-check-in sebelumnya");
    }

    // Validasi Tanggal Check-In: Tidak boleh check-in sebelum hari kedatangan
    const todayStr = formatDateSystem(new Date(), "yyyy-MM-dd");
    const cinDateStr = formatDateSystem(new Date(resRoom.check_in_date), "yyyy-MM-dd");

    if (cinDateStr > todayStr) {
        throw new Error(`Jadwal check-in belum tiba. Reservasi ini dijadwalkan tiba pada tanggal ${formatDateSystem(new Date(resRoom.check_in_date), 'dd/MM/yyyy')}. Check-in hanya dapat diproses pada hari kedatangan.`);
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
    
    if (!noCheckin) {
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

    // 6. Resolusi Shift Kasir & Guest Count
    let shiftCode = kode_cashier_shift || null;
    if (!shiftCode && userId) {
        const activeShift = await trx("trx_cashier_shift")
            .where("user_id", userId)
            .where("status", "open")
            .orderBy("opened_at", "desc")
            .first();
        if (activeShift) {
            shiftCode = activeShift.kode_cashier_shift;
        }
    }

    const totalPax = guest_count ? parseInt(guest_count, 10) : (resRoom.res_guest_count ? parseInt(resRoom.res_guest_count, 10) : 1);

    // Insert trx_checkin
    await trx("trx_checkin").insert({
        kode_checkin: noCheckin,
        kode_reservation_room: kode_reservasi_room,
        early_checkin: is_early_checkin ? 1 : 0,
        kode_cashier_shift: shiftCode,
        guest_count: totalPax > 0 ? totalPax : 1,
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

    let folioCode;
    if (!targetFolio) {
        const noFolio = await generateSequence("FMT-FOLIO", trx);
        if (!noFolio) throw new Error("Gagal membuat nomor transaksi folio");

        await trx("trx_folio").insert({
            kode_cabang: resRoom.kode_cabang,
            kode_folio: noFolio,
            kode_reservation: resRoom.kode_reservation,
            folio_owner_type: "guest",
            status: "open",
            subtotal: 0.00,
            tax_amount: 0.00,
            service_charge_amount: 0.00,
            grand_total: 0.00,
            created_by: userId,
            created_at: tNow
        });
        folioCode = noFolio;
    } else {
        folioCode = targetFolio.kode_folio;
    }

    // 8. Posting Biaya Early Check-In ke Folio (jika opsi berbayar dipilih)
    let earlyFeeApplied = 0;
    if (is_early_checkin && apply_early_checkin_fee) {
        const earlyFee = Number(early_checkin_amount) > 0 ? Number(early_checkin_amount) : 150000;
        const noEarlyCharge = await generateSequence("FMT-FOLIOCHARGE", trx);
        if (!noEarlyCharge) throw new Error("Gagal membuat kode charge early check-in");

        const roomNomor = kamarAvailable.nomor_kamar ? `Kamar ${kamarAvailable.nomor_kamar}` : 'Kamar';
        await trx("trx_folio_charge").insert({
            kode_folio_charge: noEarlyCharge,
            kode_folio: folioCode,
            charge_type: "amenity",
            description: `Early Check-In Surcharge (${roomNomor})`,
            qty: 1,
            unit_price: earlyFee,
            amount: earlyFee,
            ref_source_type: "early_checkin",
            kode_ref_source: kode_reservasi_room,
            kode_cashier_shift: shiftCode,
            posted_by: userId,
            posted_at: tNow,
            created_by: userId,
            created_at: tNow,
            is_active: 1
        });

        // Update saldo folio
        await trx("trx_folio")
            .where("kode_folio", folioCode)
            .update({
                subtotal: trx.raw("subtotal + ?", [earlyFee]),
                grand_total: trx.raw("grand_total + ?", [earlyFee]),
                updated_by: userId,
                updated_at: tNow
            });

        earlyFeeApplied = earlyFee;
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
        total_charge: earlyFeeApplied,
        is_early_checkin: Boolean(is_early_checkin),
        early_checkin_fee: earlyFeeApplied
    };
};
