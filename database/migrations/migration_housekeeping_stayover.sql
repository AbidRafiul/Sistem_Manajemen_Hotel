-- ====================================================================
-- MIGRASI IDEMPOTEN: Fitur Stayover / Make Up Room Cleaning
-- File: migration_housekeeping_stayover.sql
-- Compatibility: MySQL 8.0+
-- ====================================================================

-- 1. Tambah kolom `notes` pada `trx_housekeeping_task`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'notes');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `notes` TEXT NULL AFTER `cancel_reason`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2. Tambah kolom `kode_reservasi_room` pada `trx_housekeeping_task`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'kode_reservasi_room');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `kode_reservasi_room` VARCHAR(50) NULL AFTER `notes`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 3. Tambah kolom `request_source` pada `trx_housekeeping_task`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'request_source');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `request_source` ENUM(\'front_office\',\'guest_request\',\'housekeeping\',\'checkout\') NOT NULL DEFAULT \'guest_request\' AFTER `kode_reservasi_room`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 4. Indeks pendukung untuk performa pencarian task aktif berdasarkan kamar & reservasi
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND INDEX_NAME = 'idx_hk_kamar_status');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD INDEX `idx_hk_kamar_status` (`kode_kamar`, `status`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND INDEX_NAME = 'idx_hk_res_room');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD INDEX `idx_hk_res_room` (`kode_reservasi_room`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SELECT 'MIGRASI STAYOVER HOUSEKEEPING BERHASIL DIJALANKAN' as status;
