/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file availability_helper.js
 * @description Helper for calculating room availability
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-08
 * @contributors - Fadil
 * @lastModified Fadil (2026-09-08)
 * @version 1.0.1
 */

import { formatDateSystem } from "./date_tools.js";

/**
 * Menghitung ketersediaan tipe kamar secara berkesinambungan dengan fisik kamar, housekeeping, dan reservasi
 * @param {Object} payload
 * @param {string} payload.kode_cabang
 * @param {string} payload.kode_tipe_kamar
 * @param {Date|string} payload.check_in_date
 * @param {Date|string} payload.check_out_date
 * @param {import("knex").Knex} trx
 * @returns {Promise<{total: number, terpakai: number, available_count: number, terpakai_kamar_ids: string[], available_rooms: Object[]}>}
 */
export const hitungKetersediaanTipeKamar = async (payload, trx) => {
    const { kode_cabang, kode_tipe_kamar, check_in_date, check_out_date } = payload;
    
    const cin = new Date(check_in_date);
    const cout = new Date(check_out_date);
    
    const checkinDateStr = formatDateSystem(cin, "yyyy-MM-dd");
    const checkoutDateStr = formatDateSystem(cout, "yyyy-MM-dd");
    const todayStr = formatDateSystem(new Date(), "yyyy-MM-dd");
    const isTodayOrPast = checkinDateStr <= todayStr;

    // 1. Ambil semua fisik kamar untuk tipe dan cabang ini
    const physicalRooms = await trx('mst_kamar')
        .where('kode_tipe_kamar', kode_tipe_kamar)
        .where('kode_cabang', kode_cabang)
        .where('is_active', 1)
        .whereNull('deleted_at')
        .select('kode_kamar', 'nomor_kamar', 'kode_tipe_kamar', 'tipe_pemandangan', 'occupancy_status', 'housekeeping_status');

    // Filter kamar yang tidak diblokir atau out of service
    const eligibleRooms = physicalRooms.filter(r => 
        r.occupancy_status !== 'blocked' && 
        r.housekeeping_status !== 'out_of_service' && 
        r.housekeeping_status !== 'maintenance'
    );
    const total = eligibleRooms.length;

    if (total === 0) {
        return {
            total: 0,
            terpakai: 0,
            available_count: 0,
            terpakai_kamar_ids: [],
            available_rooms: []
        };
    }

    const unavailableRoomIds = new Set();
    const physicalRoomCodes = new Set(physicalRooms.map(r => r.kode_kamar));

    // 2. Jika tanggal check-in adalah hari ini atau masa lalu:
    //    Kamar fisik WAJIB dalam kondisi:
    //    - occupancy_status === 'vacant'
    //    - housekeeping_status === 'clean'
    //    - Tidak sedang dalam pengerjaan housekeeping (assigned, in_progress, finished/inspection)
    if (isTodayOrPast) {
        eligibleRooms.forEach(r => {
            if (r.occupancy_status !== 'vacant' || r.housekeeping_status !== 'clean') {
                unavailableRoomIds.add(r.kode_kamar);
            }
        });

        const activeTasks = await trx('trx_housekeeping_task')
            .where('kode_cabang', kode_cabang)
            .whereIn('status', ['assigned', 'in_progress', 'finished'])
            .where('is_active', 1)
            .whereNull('deleted_at')
            .select('kode_kamar');

        activeTasks.forEach(t => {
            if (t.kode_kamar && physicalRoomCodes.has(t.kode_kamar)) {
                unavailableRoomIds.add(t.kode_kamar);
            }
        });
    }

    // 3. Cek reservasi yang overlap pada rentang tanggal
    const overlappingReservations = await trx('trx_reservation_room as rr')
        .join('trx_reservation as r', 'rr.kode_reservation', 'r.kode_reservasi')
        .where('rr.kode_tipe_kamar', kode_tipe_kamar)
        .where('r.kode_cabang', kode_cabang)
        .whereIn('rr.status', ['booked', 'assigned', 'checked_in'])
        .whereIn('r.status', ['reserved', 'confirmed', 'checked_in'])
        .where(function() {
            this.where(function() {
                this.where('r.check_in_date', '<', checkoutDateStr)
                    .andWhere('r.check_out_date', '>', checkinDateStr);
            });
            // Jika hari ini atau masa lalu, reservasi yang masih checked_in dianggap aktif menempati kamar
            if (isTodayOrPast) {
                this.orWhere(function() {
                    this.where('r.status', 'checked_in')
                        .orWhere('rr.status', 'checked_in');
                });
            }
        })
        .select('rr.kode_kamar', 'rr.kode_reservasi_room', 'r.status as res_status');

    let unassignedCount = 0;
    overlappingReservations.forEach(row => {
        if (row.kode_kamar) {
            unavailableRoomIds.add(row.kode_kamar);
        } else {
            unassignedCount++;
        }
    });

    // 4. Kamar fisik yang siap dan tidak bentrok
    let available_rooms = eligibleRooms.filter(k => !unavailableRoomIds.has(k.kode_kamar));

    // Kurangi kuota jika ada reservasi advance yang belum di-assign kamar fisiknya
    const available_count = Math.max(0, available_rooms.length - unassignedCount);

    if (available_rooms.length > available_count) {
        available_rooms = available_rooms.slice(0, available_count);
    }

    const terpakai = total - available_count;
    const terpakai_kamar_ids = Array.from(unavailableRoomIds);

    return {
        total,
        terpakai,
        available_count,
        terpakai_kamar_ids,
        available_rooms
    };
};
