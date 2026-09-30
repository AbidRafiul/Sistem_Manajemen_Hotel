-- ====================================================================
-- PEMBARUAN DATABASE: SISTEM MASTER SHIFT KASIR (PMS HOTEL)
-- File: migration_master_shift.sql
-- Sifat: 100% IDEMPOTENT (Aman dijalankan berulang kali)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Buat Tabel `mst_shift` jika belum ada
CREATE TABLE IF NOT EXISTS `mst_shift` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `kode_cabang` VARCHAR(50) NOT NULL,
  `kode_shift` VARCHAR(50) NOT NULL,
  `nama_shift` VARCHAR(100) NOT NULL,
  `waktu_mulai` TIME NOT NULL,
  `waktu_selesai` TIME NOT NULL,
  `default_opening_cash` DECIMAL(14,2) NOT NULL DEFAULT 1000000.00,
  `is_night_audit` TINYINT(1) NOT NULL DEFAULT 0,
  `urutan` INT NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_by` INT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` INT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_kode_shift` (`kode_shift`),
  KEY `fk_shift_cabang` (`kode_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Pastikan Sequence `FMT-MSTSHIFT` ada di tabel `sys_format_penomoran`
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`, `updated_at`)
VALUES ('FMT-MSTSHIFT', 'mst_shift', 'SFT', 4, 6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `is_active` = 1;

-- 3. Seeding Shift Standar untuk Cabang CAB0001 (Grand Marstech Batu)
INSERT INTO `mst_shift` (`kode_cabang`, `kode_shift`, `nama_shift`, `waktu_mulai`, `waktu_selesai`, `default_opening_cash`, `is_night_audit`, `urutan`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('CAB0001', 'SFT-B001', 'Shift 1 – Pagi (Morning)', '07:00:00', '15:00:00', 1000000.00, 0, 1, 1, NOW(), NOW()),
  ('CAB0001', 'SFT-B002', 'Shift 2 – Sore (Evening)', '15:00:00', '23:00:00', 1000000.00, 0, 2, 1, NOW(), NOW()),
  ('CAB0001', 'SFT-B003', 'Shift 3 – Malam (Night Audit)', '23:00:00', '07:00:00', 1000000.00, 1, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `nama_shift` = VALUES(`nama_shift`),
  `waktu_mulai` = VALUES(`waktu_mulai`),
  `waktu_selesai` = VALUES(`waktu_selesai`),
  `default_opening_cash` = VALUES(`default_opening_cash`),
  `is_night_audit` = VALUES(`is_night_audit`),
  `urutan` = VALUES(`urutan`);

-- 4. Seeding Shift Standar untuk Cabang CAB0002 (Marstech City Resort)
INSERT INTO `mst_shift` (`kode_cabang`, `kode_shift`, `nama_shift`, `waktu_mulai`, `waktu_selesai`, `default_opening_cash`, `is_night_audit`, `urutan`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('CAB0002', 'SFT-C001', 'Shift 1 – Pagi (Morning)', '07:00:00', '15:00:00', 1000000.00, 0, 1, 1, NOW(), NOW()),
  ('CAB0002', 'SFT-C002', 'Shift 2 – Sore (Evening)', '15:00:00', '23:00:00', 1000000.00, 0, 2, 1, NOW(), NOW()),
  ('CAB0002', 'SFT-C003', 'Shift 3 – Malam (Night Audit)', '23:00:00', '07:00:00', 1000000.00, 1, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `nama_shift` = VALUES(`nama_shift`),
  `waktu_mulai` = VALUES(`waktu_mulai`),
  `waktu_selesai` = VALUES(`waktu_selesai`),
  `default_opening_cash` = VALUES(`default_opening_cash`),
  `is_night_audit` = VALUES(`is_night_audit`),
  `urutan` = VALUES(`urutan`);

SET FOREIGN_KEY_CHECKS = 1;
