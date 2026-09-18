-- ==============================================================================
-- SCRIPT MIGRASI & UPDATE DATA FASILITAS & NAVIGASI UNTUK PRODUCTION (RAILWAY)
-- ==============================================================================
-- Petunjuk di DBeaver:
-- 1. Buka script ini di DBeaver yang terhubung ke database Railway.
-- 2. Tekan Alt + X (Execute Script) atau jalankan per blok query (Ctrl + Enter).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SKEMA: Tambah kolom 'harga' pada mst_amenity & mst_fasilitas (jika belum ada)
-- ------------------------------------------------------------------------------
SET @dbname = DATABASE();

-- 1a. Kolom harga di mst_amenity
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `mst_amenity` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `icon`;', 
  'SELECT "Kolom harga pada mst_amenity sudah ada" AS status;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1b. Kolom harga di mst_fasilitas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'mst_fasilitas' AND COLUMN_NAME = 'harga';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `mst_fasilitas` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `name`;', 
  'SELECT "Kolom harga pada mst_fasilitas sudah ada" AS status;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2. SKEMA: Tabel mst_tipe_kamar_foto (Kompatibel dengan MySQL 8 Railway)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mst_tipe_kamar_foto` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `foto_url` VARCHAR(255) NOT NULL,
  `urutan` INT NOT NULL DEFAULT 0,
  `is_cover` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` BIGINT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_by` BIGINT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  KEY `idx_tkf_tipe_kamar` (`kode_tipe_kamar`)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 3. SKEMA: Tabel user_navigation (jika belum ada)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_navigation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_code` VARCHAR(50) NOT NULL,
  `menu` LONGTEXT,
  `tz` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_user_navigation_uniqueid` (`user_code`) USING BTREE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 4. DATA: Format Penomoran Sistem (sys_format_penomoran)
-- ------------------------------------------------------------------------------
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('FMT-FASILITAS', 'mst_fasilitas', 'FAS', 4, 3, 1, NOW(), NOW()),
  ('FMT-AMENITY',   'mst_amenity',   'AME', 4, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `is_active` = 1,
  `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 5. DATA: Amenity (mst_amenity)
-- ------------------------------------------------------------------------------
INSERT INTO `mst_amenity` (`kode_amenity`, `name`, `icon`, `harga`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('AMN-001', 'Free WiFi',           'pi pi-wifi',    0.00, 1, NOW(), NOW()),
  ('AMN-002', 'Air Conditioning',    'pi pi-box',     0.00, 1, NOW(), NOW()),
  ('AMN-003', 'Minibar',             'pi pi-wallet', 50000.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `icon` = VALUES(`icon`),
  `harga` = VALUES(`harga`),
  `is_active` = 1,
  `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 6. DATA: Fasilitas Hotel (mst_fasilitas)
-- ------------------------------------------------------------------------------
INSERT INTO `mst_fasilitas` (`kode_cabang`, `kode_fasilitas`, `name`, `harga`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('CAB0001', 'FAS-001', 'Kolam Renang',       0.00, 1, NOW(), NOW()),
  ('CAB0001', 'FAS-002', 'Gym & Fitness',      0.00, 1, NOW(), NOW()),
  ('CAB0001', 'FAS-003', 'Spa & Massage', 175000.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `harga` = VALUES(`harga`),
  `is_active` = 1,
  `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 7. DATA: Navigasi Master Menu (mst_navigation)
-- ------------------------------------------------------------------------------
-- Role: superadmin
INSERT INTO `mst_navigation` (`role`, `menu`, `tz`, `created_at`, `updated_at`)
VALUES ('superadmin', '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Contoh & Template","icon":"pi pi-fw pi-bookmark","items":[{"label":"Contoh Form Upload","icon":"pi pi-fw pi-upload","to":"/contoh_form_upload"},{"label":"Contoh Laporan","icon":"pi pi-fw pi-file","to":"/contoh_laporan"},{"label":"Contoh Popup","icon":"pi pi-fw pi-window-maximize","to":"/contoh_popup"},{"label":"Contoh Tabview","icon":"pi pi-fw pi-folder","to":"/contoh_tabview"},{"label":"Contoh Trx Cetak Nota","icon":"pi pi-fw pi-print","to":"/contoh_trx_cetak_nota"}]}]', 'UTC', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `menu` = VALUES(`menu`),
  `updated_at` = NOW();

-- Role: admin
INSERT INTO `mst_navigation` (`role`, `menu`, `tz`, `created_at`, `updated_at`)
VALUES ('admin', '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Contoh & Template","icon":"pi pi-fw pi-bookmark","items":[{"label":"Contoh Form Upload","icon":"pi pi-fw pi-upload","to":"/contoh_form_upload"},{"label":"Contoh Laporan","icon":"pi pi-fw pi-file","to":"/contoh_laporan"},{"label":"Contoh Popup","icon":"pi pi-fw pi-window-maximize","to":"/contoh_popup"},{"label":"Contoh Tabview","icon":"pi pi-fw pi-folder","to":"/contoh_tabview"},{"label":"Contoh Trx Cetak Nota","icon":"pi pi-fw pi-print","to":"/contoh_trx_cetak_nota"}]}]', 'UTC', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `menu` = VALUES(`menu`),
  `updated_at` = NOW();

-- Role: master
INSERT INTO `mst_navigation` (`role`, `menu`, `tz`, `created_at`, `updated_at`)
VALUES ('master', '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Contoh & Template","icon":"pi pi-fw pi-bookmark","items":[{"label":"Contoh Form Upload","icon":"pi pi-fw pi-upload","to":"/contoh_form_upload"},{"label":"Contoh Laporan","icon":"pi pi-fw pi-file","to":"/contoh_laporan"},{"label":"Contoh Popup","icon":"pi pi-fw pi-window-maximize","to":"/contoh_popup"},{"label":"Contoh Tabview","icon":"pi pi-fw pi-folder","to":"/contoh_tabview"},{"label":"Contoh Trx Cetak Nota","icon":"pi pi-fw pi-print","to":"/contoh_trx_cetak_nota"}]}]', 'UTC', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `menu` = VALUES(`menu`),
  `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 8. SINKRONISASI: Perbarui user_navigation seluruh user agar menu langsung aktif
-- ------------------------------------------------------------------------------
UPDATE `user_navigation` 
SET `menu` = '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Contoh & Template","icon":"pi pi-fw pi-bookmark","items":[{"label":"Contoh Form Upload","icon":"pi pi-fw pi-upload","to":"/contoh_form_upload"},{"label":"Contoh Laporan","icon":"pi pi-fw pi-file","to":"/contoh_laporan"},{"label":"Contoh Popup","icon":"pi pi-fw pi-window-maximize","to":"/contoh_popup"},{"label":"Contoh Tabview","icon":"pi pi-fw pi-folder","to":"/contoh_tabview"},{"label":"Contoh Trx Cetak Nota","icon":"pi pi-fw pi-print","to":"/contoh_trx_cetak_nota"}]}]', `updated_at` = NOW();

SELECT 'SELESAI! Seluruh skema, data fasilitas, dan navigasi menu telah berhasil diperbarui di Railway.' AS status;
