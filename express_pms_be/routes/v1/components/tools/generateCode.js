import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "./date_tools.js";

/**
 * Helper untuk menggenerate kode berurutan (sequence) otomatis
 * dengan prefix. Menggunakan sys_format_penomoran.
 * 
 * @param {string} kode_penomoran - Contoh: FMT-SHIFT, FMT-GEDUNG
 * @param {object} trx - Instance transaksi Knex
 * @returns {Promise<string>} Kode yang sudah digenerate (contoh: SFT0001)
 */
export const generateSequence = async (kode_penomoran, trx = DB) => {
    // Lock row untuk mencegah race condition
    let record = await trx("sys_format_penomoran")
        .where("kode_format", kode_penomoran)
        .forUpdate()
        .first();

    if (!record) {
        // Jika belum ada, kita auto-init formatnya
        let prefix = kode_penomoran.replace("FMT-", "");
        // Ambil maksimal 3-4 huruf pertama sebagai prefix default
        prefix = prefix.length > 3 ? prefix.substring(0, 3) : prefix;
        
        const nama_tabel = kode_penomoran.replace("FMT-", "mst_").toLowerCase();
        
        record = {
            kode_format: kode_penomoran,
            nama_tabel: nama_tabel,
            prefix: prefix,
            panjang_digit: 4,
            nomor_terakhir: 0,
            is_active: 1,
            created_at: formatDateSystem()
        };
        
        await trx("sys_format_penomoran").insert(record);
    }

    const nextNumber = parseInt(record.nomor_terakhir || 0, 10) + 1;
    
    // Update nomor terakhir ke database
    await trx("sys_format_penomoran")
        .where("kode_format", kode_penomoran)
        .update({ 
            nomor_terakhir: nextNumber,
            updated_at: formatDateSystem()
        });
    
    // Bentuk string dengan padding 0
    const paddedNumber = String(nextNumber).padStart(record.panjang_digit, '0');
    return `${record.prefix}${paddedNumber}`;
};
