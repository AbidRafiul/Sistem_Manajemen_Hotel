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
 * Menghitung ketersediaan tipe kamar
 * @param {Object} payload
 * @param {string} payload.kode_cabang
 * @param {string} payload.kode_tipe_kamar
 * @param {Date|string} payload.check_in_date
 * @param {Date|string} payload.check_out_date
 * @param {import("knex").Knex} trx
 * @returns {Promise<{total: number, terpakai: number, available_count: number, terpakai_kamar_ids: string[]}>}
 */
export const hitungKetersediaanTipeKamar = async (payload, trx) => {
    const { kode_cabang, kode_tipe_kamar, check_in_date, check_out_date } = payload;
    
    const cin = new Date(check_in_date);
    const cout = new Date(check_out_date);
    
    const checkinDateStr = formatDateSystem(cin, "yyyy-MM-dd");
    const checkoutDateStr = formatDateSystem(cout, "yyyy-MM-dd");

    // Total kamar aktif (tidak termasuk blocked)
    const totalKamarResult = await trx('mst_kamar')
        .where('kode_tipe_kamar', kode_tipe_kamar)
        .where('kode_cabang', kode_cabang)
        .where('is_active', 1)
        .where('occupancy_status', '!=', 'blocked')
        .whereNull('deleted_at')
        .count('* as total');
    
    const total = parseInt(totalKamarResult[0].total) || 0;

    // Kamar yang terpakai / overlap
    const terpakaiResult = await trx('trx_reservation_room as rr')
        .join('trx_reservation as r', 'rr.kode_reservation', 'r.kode_reservasi')
        .where('rr.kode_tipe_kamar', kode_tipe_kamar)
        .whereIn('rr.status', ['booked', 'assigned', 'checked_in'])
        .whereIn('r.status', ['reserved', 'confirmed', 'checked_in'])
        .where('r.check_in_date', '<', checkoutDateStr)
        .where('r.check_out_date', '>', checkinDateStr)
        .select('rr.kode_kamar');

    const terpakai_kamar_ids = [];
    terpakaiResult.forEach(row => {
        if (row.kode_kamar) {
            terpakai_kamar_ids.push(row.kode_kamar);
        }
    });

    const terpakai = terpakaiResult.length; // Counting the reserved rooms
    const available_count = Math.max(0, total - terpakai);

    return {
        total,
        terpakai,
        available_count,
        terpakai_kamar_ids
    };
};
