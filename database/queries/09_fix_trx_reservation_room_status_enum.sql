-- ============================================================================
-- Migrasi: 09_fix_trx_reservation_room_status_enum.sql
-- Deskripsi: Mengubah kolom status pada trx_reservation_room menjadi VARCHAR(50)
--            agar mendukung status 'cancelled' untuk pembatalan parsial kamar
-- Tanggal: 2026-10-20
-- ============================================================================

ALTER TABLE `trx_reservation_room` 
MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'booked';
