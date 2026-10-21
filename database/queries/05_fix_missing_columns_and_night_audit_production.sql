-- ===================================================================================
-- SKRIP PERBAIKAN KOMPREHENSIF PRODUKSI:
-- 1. FIX FRONT OFFICE TAMU MENGINAP (Unknown column 't_hk.notes')
-- 2. FIX HOUSEKEEPING ROOM STATUS BOARD (Kolom-kolom inspeksi & task housekeeping)
-- 3. FIX NIGHT AUDIT & DAILY ROLLOVER (Status 500 karena kolom metrik audit & tabel audit)
-- 
-- Target Database : Railway MySQL / Produksi (pms_hotel)
-- Sifat Eksekusi  : 100% IDEMPOTEN & AMAN (Bisa dijalankan berulang tanpa error)
-- File            : database/queries/05_fix_missing_columns_and_night_audit_production.sql
-- ===================================================================================

-- -----------------------------------------------------------------------------------
-- [BAGIAN 1] PERBAIKAN TABEL `trx_housekeeping_task`
-- Menambahkan kolom catatan, inspeksi kamar checkout, relasi reservasi, & tracking waktu
-- -----------------------------------------------------------------------------------

-- 1.1 Update ENUM status agar mendukung status 'canceled'
ALTER TABLE `trx_housekeeping_task` 
MODIFY COLUMN `status` ENUM('assigned','in_progress','finished','supervisor_approved','canceled') NOT NULL DEFAULT 'assigned';

-- 1.2 Kolom `notes` (Catatan interaktif housekeeping)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'notes');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `notes` TEXT NULL AFTER `priority`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.3 Kolom `checklist` (Checklist item kebersihan kamar)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'checklist');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `checklist` JSON NULL AFTER `notes`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.4 Kolom `inspection_result` (Hasil inspeksi checkout)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'inspection_result');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_housekeeping_task` ADD COLUMN `inspection_result` ENUM('pending', 'clear', 'with_charges') NOT NULL DEFAULT 'pending' AFTER `status`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.5 Kolom `inspection_details` (Rincian temuan kerusakan / minibar checkout)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'inspection_details');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `inspection_details` JSON NULL AFTER `inspection_result`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.6 Kolom `kode_reservasi_room` (Relasi kamar tamu aktif untuk stayover/checkout)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'kode_reservasi_room');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `kode_reservasi_room` VARCHAR(50) NULL AFTER `inspection_details`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.7 Kolom `request_source` (Asal permintaan: FO, Guest, HK, Checkout)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'request_source');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_housekeeping_task` ADD COLUMN `request_source` ENUM('front_office','guest_request','housekeeping','checkout') NOT NULL DEFAULT 'guest_request' AFTER `kode_reservasi_room`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.8 Kolom `cancel_reason` (Alasan pembatalan tugas HK)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'cancel_reason');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `cancel_reason` VARCHAR(255) NULL AFTER `request_source`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.9 Kolom `started_at` & `finished_at` (Durasi pengerjaan kebersihan)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'started_at');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `started_at` DATETIME NULL AFTER `cancel_reason`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND COLUMN_NAME = 'finished_at');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD COLUMN `finished_at` DATETIME NULL AFTER `started_at`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 1.10 Indeks performa pencarian status kamar & reservasi
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND INDEX_NAME = 'idx_hk_kamar_status');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD INDEX `idx_hk_kamar_status` (`kode_kamar`, `status`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task' AND INDEX_NAME = 'idx_hk_res_room');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_housekeeping_task` ADD INDEX `idx_hk_res_room` (`kode_reservasi_room`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;


-- -----------------------------------------------------------------------------------
-- [BAGIAN 2] PERBAIKAN TABEL `trx_checkout`
-- Menambahkan status inspeksi kamar checkout, link task inspeksi, & shift kasir
-- -----------------------------------------------------------------------------------

-- 2.1 Kolom `inspection_status`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'inspection_status');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_checkout` ADD COLUMN `inspection_status` ENUM('skipped', 'inspected_clear', 'inspected_with_charges') NOT NULL DEFAULT 'skipped' AFTER `late_checkout`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.2 Kolom `kode_inspection_task`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'kode_inspection_task');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `kode_inspection_task` VARCHAR(50) NULL AFTER `inspection_status`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.3 Kolom `kode_cashier_shift`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'kode_cashier_shift');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `kode_cashier_shift` VARCHAR(50) NULL AFTER `grand_total`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.4 Kolom `guest_count`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND COLUMN_NAME = 'guest_count');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_checkout` ADD COLUMN `guest_count` INT NOT NULL DEFAULT 1 AFTER `kode_cashier_shift`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 2.5 Indeks pendukung checkout
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout' AND INDEX_NAME = 'idx_checkout_shift');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `trx_checkout` ADD INDEX `idx_checkout_shift` (`kode_cashier_shift`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;


-- -----------------------------------------------------------------------------------
-- [BAGIAN 3] TABEL DAN STRUKTUR NIGHT AUDIT & DAILY ROLLOVER
-- -----------------------------------------------------------------------------------

-- 3.1 Tabel `sys_business_date` (Tanggal Operasional Hotel per Cabang)
CREATE TABLE IF NOT EXISTS `sys_business_date` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `current_business_date` DATE NOT NULL,
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `last_audit_id` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sys_business_date_cabang` (`kode_cabang`),
  CONSTRAINT `fk_sys_business_date_cabang` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inisialisasi Tanggal Operasional untuk seluruh Cabang Aktif jika belum terdaftar
INSERT INTO `sys_business_date` (`kode_cabang`, `current_business_date`, `is_locked`, `created_at`)
SELECT c.`kode_cabang`, CURDATE(), 0, NOW()
FROM `mst_cabang` c
WHERE c.`is_active` = 1 AND c.`deleted_at` IS NULL
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- 3.2 Tabel `trx_night_audit_item` (Rincian posting audit harian per kamar)
CREATE TABLE IF NOT EXISTS `trx_night_audit_item` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_night_audit` VARCHAR(50) NOT NULL,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `business_date` DATE NOT NULL,
  `kode_reservation` VARCHAR(50) NOT NULL,
  `kode_reservasi_room` VARCHAR(50) NOT NULL,
  `kode_kamar` VARCHAR(50) NULL,
  `rate_applied` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `service_charge_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('POSTED', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'POSTED',
  `error_message` TEXT NULL,
  `kode_folio_charge` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nai_audit` (`kode_night_audit`),
  KEY `idx_nai_status` (`status`),
  KEY `idx_nai_res_date` (`kode_reservation`, `business_date`),
  KEY `idx_nai_room_date` (`kode_reservasi_room`, `business_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 Penyesuaian Kolom pada `trx_night_audit`
-- Perbarui ENUM status
ALTER TABLE `trx_night_audit` 
MODIFY COLUMN `status` ENUM('pending', 'running', 'completed', 'completed_with_exceptions', 'failed', 'reopened') NOT NULL DEFAULT 'running';

-- Kolom `triggered_by`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'triggered_by');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `triggered_by` ENUM('manual','scheduled') NOT NULL DEFAULT 'manual' AFTER `run_by`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `total_in_house`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_in_house');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_in_house` INT NOT NULL DEFAULT 0 AFTER `triggered_by`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `total_posted`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_posted');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_posted` INT NOT NULL DEFAULT 0 AFTER `total_in_house`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `total_failed`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_failed');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_failed` INT NOT NULL DEFAULT 0 AFTER `total_posted`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `total_room_revenue`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_room_revenue');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_room_revenue` DECIMAL(16,2) NOT NULL DEFAULT 0.00 AFTER `total_failed`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `total_tax`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_tax');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_tax` DECIMAL(16,2) NOT NULL DEFAULT 0.00 AFTER `total_room_revenue`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `total_service`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_service');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_service` DECIMAL(16,2) NOT NULL DEFAULT 0.00 AFTER `total_tax`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `total_no_show`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'total_no_show');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `total_no_show` INT NOT NULL DEFAULT 0 AFTER `total_service`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `warnings_acknowledged`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'warnings_acknowledged');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `warnings_acknowledged` JSON NULL AFTER `total_no_show`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `idempotency_key`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'idempotency_key');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `idempotency_key` VARCHAR(100) NULL AFTER `warnings_acknowledged`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- Kolom `report_snapshots`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit' AND COLUMN_NAME = 'report_snapshots');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_night_audit` ADD COLUMN `report_snapshots` LONGTEXT NULL AFTER `idempotency_key`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 3.4 Kolom pendukung Night Audit pada `trx_folio_charge`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'business_date');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `business_date` DATE NULL AFTER `amount`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'source');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `source` ENUM('NIGHT_AUDIT', 'MANUAL', 'CHECKIN', 'CHECKIN_LEGACY', 'ADJUSTMENT') NOT NULL DEFAULT 'MANUAL' AFTER `business_date`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'kode_night_audit');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `kode_night_audit` VARCHAR(50) NULL AFTER `source`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'reversal_of_id');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `reversal_of_id` BIGINT UNSIGNED NULL AFTER `kode_night_audit`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND COLUMN_NAME = 'reversal_reason');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_folio_charge` ADD COLUMN `reversal_reason` TEXT NULL AFTER `reversal_of_id`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_folio_charge' AND INDEX_NAME = 'idx_fc_idempotent');
SET @stmt_sql := IF(@idx_exists = 0, "ALTER TABLE `trx_folio_charge` ADD INDEX `idx_fc_idempotent` (`kode_folio`, `kode_ref_source`, `business_date`, `charge_type`, `source`)", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

-- 3.5 Kolom pendukung proteksi audit pada `trx_reservation` & `trx_reservation_room`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservation' AND COLUMN_NAME = 'is_charged_upfront');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_reservation` ADD COLUMN `is_charged_upfront` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservation_room' AND COLUMN_NAME = 'is_charged_upfront');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_reservation_room` ADD COLUMN `is_charged_upfront` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;


-- -----------------------------------------------------------------------------------
-- [BAGIAN 4] PENOMORAN OTOMATIS (sys_format_penomoran)
-- Memastikan format nomor transaksi untuk Night Audit, Task HK, & Checkout aktif
-- -----------------------------------------------------------------------------------

INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`) VALUES
('FMT-NIGHTAUDIT', 'trx_night_audit', 'NA', 4, 0, 1, NOW()),
('FMT-TASK', 'trx_housekeeping_task', 'TSK', 4, 0, 1, NOW()),
('FMT-HKT', 'trx_housekeeping_task', 'TSK', 4, 0, 1, NOW()),
('FMT-CO', 'trx_checkout', 'CO', 4, 0, 1, NOW()),
('FMT-CHECKOUT', 'trx_checkout', 'CO', 4, 0, 1, NOW()),
('FMT-RSL', 'trx_room_status_log', 'RSL', 4, 0, 1, NOW())
ON DUPLICATE KEY UPDATE `is_active` = 1, `nama_tabel` = VALUES(`nama_tabel`);


-- -----------------------------------------------------------------------------------
-- [BAGIAN 5] VERIFIKASI HASIL EKSEKUSI
-- -----------------------------------------------------------------------------------

SELECT 
  'trx_housekeeping_task' AS table_name,
  SUM(CASE WHEN COLUMN_NAME = 'notes' THEN 1 ELSE 0 END) AS has_notes,
  SUM(CASE WHEN COLUMN_NAME = 'checklist' THEN 1 ELSE 0 END) AS has_checklist,
  SUM(CASE WHEN COLUMN_NAME = 'inspection_result' THEN 1 ELSE 0 END) AS has_inspection_result,
  SUM(CASE WHEN COLUMN_NAME = 'inspection_details' THEN 1 ELSE 0 END) AS has_inspection_details,
  SUM(CASE WHEN COLUMN_NAME = 'kode_reservasi_room' THEN 1 ELSE 0 END) AS has_kode_res_room,
  SUM(CASE WHEN COLUMN_NAME = 'request_source' THEN 1 ELSE 0 END) AS has_request_source
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_housekeeping_task'

UNION ALL

SELECT 
  'trx_night_audit' AS table_name,
  SUM(CASE WHEN COLUMN_NAME = 'total_in_house' THEN 1 ELSE 0 END) AS has_notes,
  SUM(CASE WHEN COLUMN_NAME = 'total_posted' THEN 1 ELSE 0 END) AS has_checklist,
  SUM(CASE WHEN COLUMN_NAME = 'total_room_revenue' THEN 1 ELSE 0 END) AS has_inspection_result,
  SUM(CASE WHEN COLUMN_NAME = 'triggered_by' THEN 1 ELSE 0 END) AS has_inspection_details,
  SUM(CASE WHEN COLUMN_NAME = 'idempotency_key' THEN 1 ELSE 0 END) AS has_kode_res_room,
  SUM(CASE WHEN COLUMN_NAME = 'report_snapshots' THEN 1 ELSE 0 END) AS has_request_source
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_night_audit'

UNION ALL

SELECT 
  'trx_checkout' AS table_name,
  SUM(CASE WHEN COLUMN_NAME = 'inspection_status' THEN 1 ELSE 0 END) AS has_notes,
  SUM(CASE WHEN COLUMN_NAME = 'kode_inspection_task' THEN 1 ELSE 0 END) AS has_checklist,
  SUM(CASE WHEN COLUMN_NAME = 'kode_cashier_shift' THEN 1 ELSE 0 END) AS has_inspection_result,
  SUM(CASE WHEN COLUMN_NAME = 'guest_count' THEN 1 ELSE 0 END) AS has_inspection_details,
  1 AS has_kode_res_room,
  1 AS has_request_source
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_checkout';
