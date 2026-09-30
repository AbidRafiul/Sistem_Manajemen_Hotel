-- ====================================================================
-- PEMBARUAN DATABASE PRODUCTION (RAILWAY MYSQL / DBEAVER)
-- Proyek       : Sistem Manajemen Hotel (PMS) Multi-Branch Enterprise
-- File         : production_railway_update.sql
-- Kompatibilitas: MySQL 8.0+ / MariaDB 10.5+ / Railway / DBeaver
-- Sifat Skrip  : 100% IDEMPOTENT (Aman dijalankan berulang kali tanpa duplikasi/error)
--
-- CARA MENJALANKAN DI DBEAVER:
-- 1. Buka DBeaver dan hubungkan ke database Railway Production Anda.
-- 2. Buka SQL Editor baru (Ctrl + ] atau Menu -> SQL Editor).
-- 3. Copy seluruh isi skrip ini dan paste ke SQL Editor DBeaver.
-- 4. Pilih "Execute SQL Script" (tombol Alt + X atau icon play dengan kertas bertumpuk).
-- 5. Tunggu 2-5 detik hingga status execution selesai (Success).
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- -------------------------------------------------------------
-- [BAGIAN 1] PEMBUATAN TABEL BARU (IF NOT EXISTS)
-- -------------------------------------------------------------

-- 1.1 Tabel companies (Holding / Induk Perusahaan Hotel)
CREATE TABLE IF NOT EXISTS `companies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_company_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Tabel org_nodes (Master Wilayah / Regional Management)
CREATE TABLE IF NOT EXISTS `org_nodes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `parent_id` BIGINT UNSIGNED NULL,
  `node_type` ENUM('company', 'region', 'branch_group', 'branch') NOT NULL DEFAULT 'region',
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_node_code` (`company_id`, `code`),
  KEY `idx_org_nodes_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Tabel user_scope_assignments (Penugasan Akses Multi-Cabang & Wilayah User)
CREATE TABLE IF NOT EXISTS `user_scope_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `scope_type` ENUM('company', 'org_node', 'branch') NOT NULL,
  `scope_id` BIGINT UNSIGNED NOT NULL,
  `access_mode` ENUM('view', 'manage', 'operate') NOT NULL DEFAULT 'operate',
  `is_default` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_scope_user` (`user_id`),
  KEY `idx_user_scope_type_id` (`scope_type`, `scope_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- [BAGIAN 2] ALTER TABLE PADA TABEL EKSISTING (IDEMPOTENT CHECK)
-- -------------------------------------------------------------

-- 2.1 Tambahkan kolom `company_id` pada mst_cabang jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME = 'company_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_cabang` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.2 Tambahkan kolom `org_node_id` (Relasi Wilayah) pada mst_cabang jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_cabang' AND COLUMN_NAME = 'org_node_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_cabang` ADD COLUMN `org_node_id` BIGINT UNSIGNED NULL AFTER `company_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.3 Tambahkan kolom `company_id` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'company_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `company_id` BIGINT UNSIGNED NULL DEFAULT 1 AFTER `role`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.4 Tambahkan kolom `default_branch_id` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'default_branch_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `default_branch_id` BIGINT UNSIGNED NULL AFTER `company_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.5 Tambahkan kolom `org_node_id` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'org_node_id');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `org_node_id` BIGINT UNSIGNED NULL AFTER `default_branch_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;

-- 2.6 Tambahkan kolom `can_switch_branch` pada mst_user jika belum ada
SET @col_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_user' AND COLUMN_NAME = 'can_switch_branch');
SET @stmt_sql := IF(@col_exists = 0, 'ALTER TABLE `mst_user` ADD COLUMN `can_switch_branch` TINYINT NOT NULL DEFAULT 0 AFTER `org_node_id`', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql;
EXECUTE exec_stmt;
DEALLOCATE PREPARE exec_stmt;


-- -------------------------------------------------------------
-- [BAGIAN 3] SEEDING MASTER DATA (PERUSAHAAN & WILAYAH REGIONAL)
-- -------------------------------------------------------------

-- 3.1 Data Perusahaan Default (Grand Marstech Hotel & Resort)
INSERT INTO `companies` (`id`, `code`, `name`, `status`, `created_at`, `updated_at`) 
VALUES (1, 'CMP001', 'Grand Marstech Hotel & Resort', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `updated_at` = NOW();

-- 3.2 Data Master Wilayah / Regional (org_nodes)
INSERT INTO `org_nodes` (`id`, `company_id`, `parent_id`, `node_type`, `code`, `name`, `status`, `created_at`, `updated_at`) 
VALUES 
  (1, 1, NULL, 'region', 'REG-JATIM', 'Wilayah Jawa Timur', 'active', NOW(), NOW()),
  (2, 1, NULL, 'region', 'REG-JATENG', 'Wilayah Jawa Tengah & D.I. Yogyakarta', 'active', NOW(), NOW()),
  (3, 1, NULL, 'region', 'REG-BALI', 'Wilayah Bali & Nusa Tenggara', 'active', NOW(), NOW()),
  (4, 1, NULL, 'region', 'REG-JABAR', 'Wilayah Jawa Barat & Banten', 'active', NOW(), NOW()),
  (5, 1, NULL, 'region', 'REG-DKI', 'Wilayah DKI Jakarta & Sekitarnya', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `updated_at` = NOW();


-- -------------------------------------------------------------
-- [BAGIAN 4] SINKRONISASI CABANG KE WILAYAH & COMPANY
-- -------------------------------------------------------------

-- 4.1 Pastikan Cabang Utama CAB0001 & CAB0002 terhubung ke Company 1 dan Wilayah Jawa Timur (id: 1)
UPDATE `mst_cabang` 
SET 
  `company_id` = 1,
  `org_node_id` = 1
WHERE `kode_cabang` IN ('CAB0001', 'CAB0002');

-- 4.2 Untuk cabang lain yang company_id atau org_node_id-nya masih kosong, set default ke Company 1 & Wilayah 1
UPDATE `mst_cabang` 
SET `company_id` = 1 
WHERE `company_id` IS NULL OR `company_id` = 0;

UPDATE `mst_cabang` 
SET `org_node_id` = 1 
WHERE `org_node_id` IS NULL OR `org_node_id` = 0;


-- -------------------------------------------------------------
-- [BAGIAN 5] SINKRONISASI USER, PENUGASAN CABANG & PERMISSIONS
-- -------------------------------------------------------------

-- 5.1 Set company_id = 1 untuk seluruh user yang belum memiliki company_id
UPDATE `mst_user` 
SET `company_id` = 1 
WHERE `company_id` IS NULL OR `company_id` = 0;

-- 5.2 Set default_branch_id ke cabang pertama (id terkecil) jika masih kosong
SET @first_branch_id := (SELECT `id` FROM `mst_cabang` WHERE `is_active` = 1 AND `deleted_at` IS NULL ORDER BY `id` ASC LIMIT 1);
UPDATE `mst_user` 
SET `default_branch_id` = IFNULL(@first_branch_id, 1) 
WHERE `default_branch_id` IS NULL OR `default_branch_id` = 0;

-- 5.3 Sinkronkan org_node_id user otomatis dari cabang default-nya
UPDATE `mst_user` u
JOIN `mst_cabang` c ON u.`default_branch_id` = c.`id`
SET u.`org_node_id` = c.`org_node_id`
WHERE (u.`org_node_id` IS NULL OR u.`org_node_id` = 0) AND c.`org_node_id` IS NOT NULL;

-- 5.4 Berikan wewenang switch cabang (can_switch_branch = 1) untuk role Management & Global
UPDATE `mst_user` 
SET `can_switch_branch` = 1 
WHERE LOWER(TRIM(`role`)) IN (
  'superadmin', 
  'admin', 
  'master', 
  'corporate_manager', 
  'regional_manager', 
  'auditor', 
  'director', 
  'owner'
);

-- 5.5 Staf operasional cabang (frontdesk, kasir, housekeeping, receptionist, branch_manager) default di 1 cabang
UPDATE `mst_user` 
SET `can_switch_branch` = 0 
WHERE LOWER(TRIM(`role`)) IN (
  'frontdesk', 
  'kasir', 
  'housekeeping', 
  'receptionist', 
  'branch_manager', 
  'staff', 
  'employee'
);

-- 5.6 Inisialisasi Scope Assignment untuk user yang belum memiliki assignment
-- A. User Corporate / Superadmin -> Scope Company
INSERT INTO `user_scope_assignments` (`user_id`, `scope_type`, `scope_id`, `access_mode`, `is_default`, `created_at`)
SELECT u.`id`, 'company', 1, 'manage', 1, NOW()
FROM `mst_user` u
WHERE LOWER(TRIM(u.`role`)) IN ('superadmin', 'admin', 'master', 'corporate_manager')
  AND NOT EXISTS (
    SELECT 1 FROM `user_scope_assignments` a WHERE a.`user_id` = u.`id`
  );

-- B. User Regional -> Scope Org Node (Wilayah)
INSERT INTO `user_scope_assignments` (`user_id`, `scope_type`, `scope_id`, `access_mode`, `is_default`, `created_at`)
SELECT u.`id`, 'org_node', IFNULL(u.`org_node_id`, 1), 'manage', 1, NOW()
FROM `mst_user` u
WHERE LOWER(TRIM(u.`role`)) IN ('regional_manager', 'kepala_wilayah')
  AND NOT EXISTS (
    SELECT 1 FROM `user_scope_assignments` a WHERE a.`user_id` = u.`id`
  );

-- C. User Branch / Kasir / Frontdesk / Housekeeping -> Scope Branch
INSERT INTO `user_scope_assignments` (`user_id`, `scope_type`, `scope_id`, `access_mode`, `is_default`, `created_at`)
SELECT u.`id`, 'branch', u.`default_branch_id`, 'operate', 1, NOW()
FROM `mst_user` u
WHERE LOWER(TRIM(u.`role`)) NOT IN ('superadmin', 'admin', 'master', 'corporate_manager', 'regional_manager', 'kepala_wilayah')
  AND u.`default_branch_id` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `user_scope_assignments` a WHERE a.`user_id` = u.`id`
  );


-- -------------------------------------------------------------
-- [BAGIAN 6] DATA INTEGRITY MULTI-BRANCH (PREVENT DATA LEAKAGE)
-- -------------------------------------------------------------
-- Pastikan tidak ada data master hotel yang kode_cabang-nya NULL/kosong
-- agar tidak hilang saat branch scoping aktif
SET @default_branch_code := (SELECT `kode_cabang` FROM `mst_cabang` ORDER BY `id` ASC LIMIT 1);
SET @default_branch_code := IFNULL(@default_branch_code, 'CAB0001');

UPDATE `mst_gedung` 
SET `kode_cabang` = @default_branch_code 
WHERE `kode_cabang` IS NULL OR TRIM(`kode_cabang`) = '';

UPDATE `mst_tipe_kamar` 
SET `kode_cabang` = @default_branch_code 
WHERE `kode_cabang` IS NULL OR TRIM(`kode_cabang`) = '';

UPDATE `mst_kamar` 
SET `kode_cabang` = @default_branch_code 
WHERE `kode_cabang` IS NULL OR TRIM(`kode_cabang`) = '';


-- -------------------------------------------------------------
-- [BAGIAN 7] SINKRONISASI NAVIGASI MENU (mst_navigation)
-- -------------------------------------------------------------
-- Tambahkan menu "Master Wilayah" (/master_wilayah) ke navigasi seluruh role

SET @hotel_menu_json := '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Wilayah","icon":"pi pi-fw pi-map","to":"/master_wilayah"},{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]}]';

-- Update / Insert untuk role superadmin & admin
INSERT INTO `mst_navigation` (`role`, `menu`, `tz`, `created_at`, `updated_at`)
VALUES 
  ('superadmin', @hotel_menu_json, 'UTC', NOW(), NOW()),
  ('admin', @hotel_menu_json, 'UTC', NOW(), NOW()),
  ('master', @hotel_menu_json, 'UTC', NOW(), NOW()),
  ('corporate_manager', @hotel_menu_json, 'UTC', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `menu` = VALUES(`menu`),
  `updated_at` = NOW();


-- -------------------------------------------------------------
-- [BAGIAN 8] VERIFIKASI HASIL EKSEKUSI
-- -------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- Cek Status Tabel Baru
SELECT 'companies' AS nama_tabel, COUNT(*) AS jumlah_data FROM `companies`
UNION ALL
SELECT 'org_nodes' AS nama_tabel, COUNT(*) AS jumlah_data FROM `org_nodes`
UNION ALL
SELECT 'user_scope_assignments' AS nama_tabel, COUNT(*) AS jumlah_data FROM `user_scope_assignments`;

-- Cek Status Kolom Baru di mst_cabang
SELECT `id`, `kode_cabang`, `nama_hotel`, `company_id`, `org_node_id` 
FROM `mst_cabang` 
WHERE `deleted_at` IS NULL 
ORDER BY `id` ASC 
LIMIT 5;

-- Cek Status Kolom Baru di mst_user
SELECT `id`, `username`, `role`, `default_branch_id`, `org_node_id`, `can_switch_branch` 
FROM `mst_user` 
ORDER BY `id` ASC 
LIMIT 10;
