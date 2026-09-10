/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file housekeeping_helper.js
 * @description Helper untuk manajemen staf housekeeping dan auto-assignment PIC
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-09-10
 * @version 1.0.0
 */

/**
 * Mencari petugas housekeeping yang paling senggang (beban tugas aktif paling sedikit)
 * @param {string} [kode_cabang]
 * @param {import("knex").Knex} db
 * @returns {Promise<{ id: number, fullname: string, username: string, role: string, active_tasks: number } | null>}
 */
export const findIdleHousekeeper = async (kode_cabang, db) => {
    // 1. Ambil semua user aktif dengan role housekeeping
    let housekeepers = await db('mst_user')
        .where('role', 'housekeeping')
        .where('status', '1')
        .select('id', 'fullname', 'username', 'role');

    // Fallback jika belum ada role housekeeping khusus
    if (housekeepers.length === 0) {
        housekeepers = await db('mst_user')
            .whereIn('role', ['cleaner', 'housekeeper'])
            .where('status', '1')
            .select('id', 'fullname', 'username', 'role');
    }

    if (housekeepers.length === 0) {
        return null;
    }

    // 2. Hitung jumlah task aktif (assigned, in_progress) yang sedang ditangani masing-masing petugas
    let taskQuery = db('trx_housekeeping_task')
        .whereIn('status', ['assigned', 'in_progress'])
        .where('is_active', 1)
        .whereNull('deleted_at');

    if (kode_cabang) {
        taskQuery.where('kode_cabang', kode_cabang);
    }

    const activeTasks = await taskQuery
        .groupBy('assigned_to')
        .select('assigned_to', db.raw('COUNT(*) as task_count'));

    const countMap = new Map();
    activeTasks.forEach(row => {
        if (row.assigned_to) {
            countMap.set(row.assigned_to, parseInt(row.task_count) || 0);
        }
    });

    // 3. Petakan beban kerja
    const mapped = housekeepers.map(h => ({
        id: h.id,
        fullname: h.fullname,
        username: h.username,
        role: h.role,
        active_tasks: countMap.get(h.id) || 0
    }));

    // 4. Urutkan dari beban paling sedikit (paling nganggur). Jika imbang, acak (random) agar adil
    mapped.sort((a, b) => {
        if (a.active_tasks !== b.active_tasks) {
            return a.active_tasks - b.active_tasks;
        }
        return Math.random() - 0.5;
    });

    return mapped[0] || null;
};

/**
 * Mengambil daftar staf housekeeping beserta jumlah tugas aktif dan rekomendasi auto-assign
 * @param {string} [kode_cabang]
 * @param {import("knex").Knex} db
 * @returns {Promise<{ staff: Array<{ id: number, fullname: string, username: string, role: string, active_tasks: number, is_idle: boolean }>, recommended: Object | null }>}
 */
export const getHousekeepingStaffList = async (kode_cabang, db) => {
    let housekeepers = await db('mst_user')
        .where('role', 'housekeeping')
        .where('status', '1')
        .select('id', 'fullname', 'username', 'role');

    if (housekeepers.length === 0) {
        housekeepers = await db('mst_user')
            .whereIn('role', ['cleaner', 'housekeeper'])
            .where('status', '1')
            .select('id', 'fullname', 'username', 'role');
    }

    let taskQuery = db('trx_housekeeping_task')
        .whereIn('status', ['assigned', 'in_progress'])
        .where('is_active', 1)
        .whereNull('deleted_at');

    if (kode_cabang) {
        taskQuery.where('kode_cabang', kode_cabang);
    }

    const activeTasks = await taskQuery
        .groupBy('assigned_to')
        .select('assigned_to', db.raw('COUNT(*) as task_count'));

    const countMap = new Map();
    activeTasks.forEach(row => {
        if (row.assigned_to) {
            countMap.set(row.assigned_to, parseInt(row.task_count) || 0);
        }
    });

    const staff = housekeepers.map(h => {
        const count = countMap.get(h.id) || 0;
        return {
            id: h.id,
            fullname: h.fullname,
            username: h.username,
            role: h.role,
            active_tasks: count,
            is_idle: count === 0
        };
    });

    // Urutkan staf berdasarkan beban kerja terkecil
    staff.sort((a, b) => a.active_tasks - b.active_tasks);

    // Rekomendasi adalah staf yang paling sedikit tugasnya (paling nganggur)
    const minTasks = staff.length > 0 ? staff[0].active_tasks : 0;
    const idleCandidates = staff.filter(s => s.active_tasks === minTasks);
    const recommended = idleCandidates.length > 0
        ? idleCandidates[Math.floor(Math.random() * idleCandidates.length)]
        : (staff[0] || null);

    return {
        staff,
        recommended
    };
};
