-- ===================================================================================
-- SKRIP MIGRASI DATABASE PRODUKSI & LOCAL:
-- MODUL PEMESANAN RUANG EVENT (BANQUET EVENT ORDER / BEO) & MONITORING JADWAL
-- 
-- Target Database : Railway MySQL 8.0+ / Local (pms_hotel / hotel_pms)
-- Sifat Eksekusi  : 100% IDEMPOTEN & AMAN (Dapat dijalankan berulang kali tanpa error)
-- File            : database/queries/08_create_event_booking_and_monitoring_tables.sql
-- 
-- Alternatif Instan via Terminal:
-- cd express_pms_be && node --env-file=.env scripts/run_event_migration.mjs
-- ===================================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------------
-- [BAGIAN 1] PASTIKAN TABEL `trx_reservasi_event` TERSEDIA DENGAN STRUKTUR BASELINE
-- -----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trx_reservasi_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_reservasi_event` varchar(255) NOT NULL,
  `kode_ruang_event` varchar(255) NOT NULL,
  `kode_cabang` varchar(255) NOT NULL,
  `kode_tamu` varchar(255) NOT NULL,
  `kode_corporate` varchar(255) DEFAULT NULL,
  `kode_reservasi_kamar` varchar(255) DEFAULT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `jumlah_tamu` int NOT NULL,
  `status_event` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_reservasi_event` (`kode_reservasi_event`),
  KEY `fk_tre_ruang` (`kode_ruang_event`),
  KEY `fk_tre_cabang` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Selaraskan collation tabel trx_reservasi_event ke utf8mb4_0900_ai_ci
ALTER TABLE `trx_reservasi_event` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------------
-- [BAGIAN 2] PENAMBAHAN KOLOM-KOLOM OPERASIONAL BEO PADA `trx_reservasi_event`
-- -----------------------------------------------------------------------------------

-- 2.1 Kolom `nama_event` (Judul / Nama Acara)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'nama_event');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `nama_event` VARCHAR(255) NOT NULL DEFAULT "Agenda Acara Hotel" AFTER `kode_reservasi_event`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.2 Kolom `layout_setup` (Tata letak: theater, classroom, u_shape, boardroom, banquet, standing, hollow_square, custom)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'layout_setup');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_reservasi_event` ADD COLUMN `layout_setup` ENUM('theater','classroom','u_shape','boardroom','banquet','standing','hollow_square','custom') NOT NULL DEFAULT 'theater' AFTER `jumlah_tamu`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.3 Kolom `tipe_sewa` (Skema tarif: per_jam, half_day, full_day, custom_package)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'tipe_sewa');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_reservasi_event` ADD COLUMN `tipe_sewa` ENUM('per_jam','half_day','full_day','custom_package') NOT NULL DEFAULT 'half_day' AFTER `layout_setup`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.4 Kolom `durasi_jam`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'durasi_jam');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `durasi_jam` DECIMAL(5,2) NULL DEFAULT 4.00 AFTER `tipe_sewa`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.5 Kolom `tarif_sewa` (Harga dasar ruangan)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'tarif_sewa');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `tarif_sewa` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `durasi_jam`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.6 Kolom `biaya_tambahan` (Total rincian F&B & peralatan)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'biaya_tambahan');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `biaya_tambahan` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `tarif_sewa`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.7 Kolom `diskon`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'diskon');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `diskon` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `biaya_tambahan`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.8 Kolom `pajak_persen` & `nominal_pajak`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'pajak_persen');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `pajak_persen` DECIMAL(5,2) NOT NULL DEFAULT 10.00 AFTER `diskon`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'nominal_pajak');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `nominal_pajak` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `pajak_persen`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.9 Kolom `service_charge_persen` & `nominal_service_charge`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'service_charge_persen');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `service_charge_persen` DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER `nominal_pajak`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'nominal_service_charge');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `nominal_service_charge` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `service_charge_persen`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.10 Kolom `total_biaya` (Grand total)
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'total_biaya');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `total_biaya` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `nominal_service_charge`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.11 Kolom `deposit_paid` & `sisa_tagihan`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'deposit_paid');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `deposit_paid` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `total_biaya`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'sisa_tagihan');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `sisa_tagihan` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `deposit_paid`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.12 Kolom `status_pembayaran`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'status_pembayaran');
SET @stmt_sql := IF(@col_exists = 0, "ALTER TABLE `trx_reservasi_event` ADD COLUMN `status_pembayaran` ENUM('unpaid','deposit','paid','refunded') NOT NULL DEFAULT 'unpaid' AFTER `sisa_tagihan`", 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.13 Kolom PIC Lapangan: `contact_person`, `contact_phone`, `contact_email`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'contact_person');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `contact_person` VARCHAR(150) NULL AFTER `status_pembayaran`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'contact_phone');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `contact_phone` VARCHAR(50) NULL AFTER `contact_person`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'contact_email');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `contact_email` VARCHAR(100) NULL AFTER `contact_phone`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.14 Kolom Buffer Waktu Operasional: `setup_buffer_minutes` & `teardown_buffer_minutes`
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'setup_buffer_minutes');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `setup_buffer_minutes` INT NOT NULL DEFAULT 30 AFTER `contact_email`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'teardown_buffer_minutes');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `teardown_buffer_minutes` INT NOT NULL DEFAULT 30 AFTER `setup_buffer_minutes`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.15 Kolom Instruksi Catatan Khusus & Alasan Batal
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'catatan_khusus');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `catatan_khusus` TEXT NULL AFTER `teardown_buffer_minutes`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trx_reservasi_event' AND COLUMN_NAME = 'catatan_batal');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `trx_reservasi_event` ADD COLUMN `catatan_batal` TEXT NULL AFTER `catatan_khusus`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;


-- -----------------------------------------------------------------------------------
-- [BAGIAN 3] PEMBUATAN TABEL `trx_reservasi_event_item` (F&B & Peralatan Tambahan)
-- -----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trx_reservasi_event_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode_reservasi_event` varchar(255) NOT NULL,
  `item_type` enum('fnb','equipment','facility','other') NOT NULL DEFAULT 'fnb',
  `item_name` varchar(255) NOT NULL,
  `qty` int NOT NULL DEFAULT 1,
  `unit` varchar(50) NOT NULL DEFAULT 'pax',
  `harga_satuan` decimal(18,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(18,2) NOT NULL DEFAULT 0.00,
  `catatan` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_rei_event` (`kode_reservasi_event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `trx_reservasi_event_item` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;


-- -----------------------------------------------------------------------------------
-- [BAGIAN 4] FORMAT PENOMORAN OTOMATIS `FMT-RESEVENT` DI `sys_format_penomoran`
-- -----------------------------------------------------------------------------------
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`, `updated_at`)
SELECT 'FMT-RESEVENT', 'trx_reservasi_event', 'EVT', 5, 2, 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `sys_format_penomoran` WHERE `kode_format` = 'FMT-RESEVENT'
);


-- -----------------------------------------------------------------------------------
-- [BAGIAN 5] SEED SAMPLE DATA AWAL UNTUK TESTING OPERASIONAL BEO & MONITORING
-- -----------------------------------------------------------------------------------
-- Pastikan ada ruang event dan data sample jika tabel masih kosong
INSERT INTO `trx_reservasi_event` (
  `kode_reservasi_event`, `nama_event`, `kode_ruang_event`, `kode_cabang`, 
  `kode_tamu`, `kode_corporate`, `tgl_mulai`, `tgl_selesai`, `jam_mulai`, `jam_selesai`, 
  `jumlah_tamu`, `layout_setup`, `tipe_sewa`, `durasi_jam`, `tarif_sewa`, `biaya_tambahan`, 
  `diskon`, `pajak_persen`, `nominal_pajak`, `service_charge_persen`, `nominal_service_charge`, 
  `total_biaya`, `deposit_paid`, `sisa_tagihan`, `status_pembayaran`, `status_event`, 
  `contact_person`, `contact_phone`, `contact_email`, `catatan_khusus`, `created_at`, `updated_at`, `is_active`
)
SELECT 
  'EVT00001', 'Seminar Transformasi Digital AI 2026', 
  COALESCE((SELECT kode_ruang_event FROM mst_ruang_event LIMIT 1), 'RUA0001'), 
  COALESCE((SELECT kode_cabang FROM mst_cabang LIMIT 1), 'CAB0001'),
  COALESCE((SELECT kode_tamu FROM mst_guest LIMIT 1), 'GST0001'),
  (SELECT kode_corporate FROM mst_corporate_account LIMIT 1),
  CURDATE(), CURDATE(), '09:00:00', '13:00:00', 50, 'theater', 'half_day', 4.00,
  3500000.00, 1500000.00, 0.00, 10.00, 500000.00, 0.00, 0.00, 5500000.00, 2000000.00, 3500000.00,
  'deposit', 'confirmed', 'Budi Santoso', '081234567890', 'budi.santoso@corp.com',
  'Setting proyektor 5000 lumens, sound system 4 mic wireless, coffee break jam 10:00.', NOW(), NOW(), 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `trx_reservasi_event` WHERE `kode_reservasi_event` = 'EVT00001'
);

-- Item Tambahan Sample
INSERT INTO `trx_reservasi_event_item` (
  `kode_reservasi_event`, `item_type`, `item_name`, `qty`, `unit`, `harga_satuan`, `subtotal`, `catatan`, `created_at`, `is_active`
)
SELECT 'EVT00001', 'fnb', 'Coffee Break Premium (2 Snack + Kopi/Teh)', 50, 'pax', 25000.00, 1250000.00, 'Sajikan pukul 10:00 WIB', NOW(), 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `trx_reservasi_event_item` WHERE `kode_reservasi_event` = 'EVT00001' AND `item_name` LIKE 'Coffee Break%');

INSERT INTO `trx_reservasi_event_item` (
  `kode_reservasi_event`, `item_type`, `item_name`, `qty`, `unit`, `harga_satuan`, `subtotal`, `catatan`, `created_at`, `is_active`
)
SELECT 'EVT00001', 'equipment', 'Wireless Microphone Extra Set (2 Unit)', 1, 'set', 250000.00, 250000.00, 'Audio visual technician on standby', NOW(), 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `trx_reservasi_event_item` WHERE `kode_reservasi_event` = 'EVT00001' AND `item_name` LIKE 'Wireless Micro%');

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------------
-- [BAGIAN 6] VERIFIKASI STATUS TABEL & KOLOM MODUL EVENT
-- -----------------------------------------------------------------------------------
SELECT 
  'trx_reservasi_event' AS `Tabel`,
  COUNT(*) AS `Total Kolom`,
  TABLE_COLLATION AS `Collation`
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = 'trx_reservasi_event'
GROUP BY TABLE_COLLATION;

SELECT 
  'trx_reservasi_event_item' AS `Tabel`,
  COUNT(*) AS `Total Kolom`,
  TABLE_COLLATION AS `Collation`
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = 'trx_reservasi_event_item'
GROUP BY TABLE_COLLATION;
