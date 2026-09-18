-- ==============================================================================
-- SCRIPT MIGRASI & SEEDER FASILITAS, AMENITY & NAVIGASI (PRODUCTION / RAILWAY)
-- ==============================================================================
-- Proyek    : Sistem Manajemen Hotel PMS
-- Database  : MySQL 8.x (Railway & DBeaver Ready)
-- Collation : utf8mb4_unicode_ci
-- Tanggal   : 2026-09-18
--
-- Petunjuk di DBeaver:
-- 1. Buka DBeaver dan sambungkan ke koneksi database Production (Railway).
-- 2. Buka tab SQL Editor baru (Ctrl + ]).
-- 3. Paste seluruh isi script ini.
-- 4. Tekan Alt + X (Execute Script) untuk menjalankan seluruh blok secara berurutan.
-- ==============================================================================

SET @NOW = NOW();
SET @dbname = DATABASE();

-- ------------------------------------------------------------------------------
-- 1. SKEMA: Tambah kolom 'harga' pada mst_amenity & mst_fasilitas (jika belum ada)
-- ------------------------------------------------------------------------------

-- 1a. Kolom harga di mst_amenity
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'mst_amenity' AND COLUMN_NAME = 'harga';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `mst_amenity` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `icon`', 
  'SELECT "Kolom harga pada mst_amenity sudah ada" AS status'
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
  'ALTER TABLE `mst_fasilitas` ADD COLUMN `harga` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `name`', 
  'SELECT "Kolom harga pada mst_fasilitas sudah ada" AS status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2. SKEMA: Tabel mst_tipe_kamar_foto (Galeri Foto Tipe Kamar)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. SKEMA: Tabel mst_navigation & user_navigation
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mst_navigation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `menu` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_navigation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_code` VARCHAR(50) NOT NULL,
  `menu` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tz` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_user_navigation_user_code` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mst_room_type_fasilitas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_rtf` VARCHAR(50) DEFAULT NULL,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_fasilitas` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_rtf_tipe_fasilitas` (`kode_tipe_kamar`, `kode_fasilitas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mst_room_type_amenity` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_rta` VARCHAR(50) DEFAULT NULL,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_amenity` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_rta_tipe_amenity` (`kode_tipe_kamar`, `kode_amenity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. DATA: Format Penomoran Sistem (sys_format_penomoran)
-- ------------------------------------------------------------------------------
INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`, `created_at`, `updated_at`)
VALUES 
  ('FMT-FASILITAS', 'mst_fasilitas', 'FAS', 4, 20, 1, @NOW, @NOW),
  ('FMT-AMENITY',   'mst_amenity',   'AME', 4, 20, 1, @NOW, @NOW),
  ('FMT-RTA',       'mst_room_type_amenity', 'RTA', 4, 53, 1, @NOW, @NOW)
ON DUPLICATE KEY UPDATE 
  `nomor_terakhir` = GREATEST(`nomor_terakhir`, VALUES(`nomor_terakhir`)),
  `is_active` = 1,
  `updated_at` = @NOW;

-- ------------------------------------------------------------------------------
-- 5. DATA: Master Fasilitas Hotel (20 Item Lengkap Gratis & Berbayar)
-- ------------------------------------------------------------------------------
INSERT INTO `mst_fasilitas` (`kode_fasilitas`, `kode_cabang`, `name`, `harga`, `is_active`, `created_at`, `updated_at`)
VALUES
  ('FAS-001', 'CAB0001', 'Kolam Renang Infinity (Pool)',            0.00, 1, @NOW, @NOW),
  ('FAS-002', 'CAB0001', 'Fitness Center & Gym',                    0.00, 1, @NOW, @NOW),
  ('FAS-003', 'CAB0001', 'Spa & Traditional Massage',          175000.00, 1, @NOW, @NOW),
  ('FAS-004', 'CAB0001', 'Restoran Kayu Manis & Coffee Bar',        0.00, 1, @NOW, @NOW),
  ('FAS-005', 'CAB0001', 'Antar-Jemput Bandara / Stasiun',     150000.00, 1, @NOW, @NOW),
  ('FAS-006', 'CAB0001', 'Express Laundry & Dry Clean',         45000.00, 1, @NOW, @NOW),
  ('FAS-007', 'CAB0001', 'Room Service 24 Jam',                  35000.00, 1, @NOW, @NOW),
  ('FAS-008', 'CAB0001', 'Sarapan Pagi (Breakfast Buffet)',      85000.00, 1, @NOW, @NOW),
  ('FAS-009', 'CAB0001', 'Extra Bed / Tempat Tidur Tambahan',  125000.00, 1, @NOW, @NOW),
  ('FAS-010', 'CAB0001', 'Late Checkout (s.d. 18:00)',          200000.00, 1, @NOW, @NOW),
  ('FAS-011', 'CAB0001', 'Early Check-In (mulai 06:00)',        150000.00, 1, @NOW, @NOW),
  ('FAS-012', 'CAB0001', 'Sewa Sepeda (per hari)',               50000.00, 1, @NOW, @NOW),
  ('FAS-013', 'CAB0001', 'Paket Romantic Honeymoon Setup',      350000.00, 1, @NOW, @NOW),
  ('FAS-014', 'CAB0001', 'Paket Birthday Surprise Setup',       250000.00, 1, @NOW, @NOW),
  ('FAS-015', 'CAB0001', 'Kids Playground & Activity',               0.00, 1, @NOW, @NOW),
  ('FAS-016', 'CAB0001', 'Business Center & Meeting Room',      500000.00, 1, @NOW, @NOW),
  ('FAS-017', 'CAB0001', 'Valet Parking',                        25000.00, 1, @NOW, @NOW),
  ('FAS-018', 'CAB0001', 'Concierge & Tour Arrangement',             0.00, 1, @NOW, @NOW),
  ('FAS-019', 'CAB0001', 'Baby Crib / Box Bayi',                 75000.00, 1, @NOW, @NOW),
  ('FAS-020', 'CAB0001', 'Pet-Friendly Room Surcharge',         100000.00, 1, @NOW, @NOW)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `harga` = VALUES(`harga`),
  `is_active` = 1,
  `updated_at` = @NOW;

-- ------------------------------------------------------------------------------
-- 6. DATA: Master Amenity Kamar (20 Item Lengkap Gratis & Berbayar)
-- ------------------------------------------------------------------------------
INSERT INTO `mst_amenity` (`kode_amenity`, `name`, `icon`, `harga`, `is_active`, `created_at`, `updated_at`)
VALUES
  ('AMN-001', 'Free High-Speed WiFi',              'pi pi-wifi',       0.00, 1, @NOW, @NOW),
  ('AMN-002', 'Air Conditioning (AC)',              'pi pi-box',        0.00, 1, @NOW, @NOW),
  ('AMN-003', 'Smart LED TV 43 Inch',              'pi pi-desktop',    0.00, 1, @NOW, @NOW),
  ('AMN-004', 'Coffee & Tea Maker',                'pi pi-coffee',     0.00, 1, @NOW, @NOW),
  ('AMN-005', 'Safe Deposit Box',                  'pi pi-lock',       0.00, 1, @NOW, @NOW),
  ('AMN-006', 'Minibar Stocked',                   'pi pi-wallet',  50000.00, 1, @NOW, @NOW),
  ('AMN-007', 'Bathrobe & Slippers Premium',       'pi pi-heart',   25000.00, 1, @NOW, @NOW),
  ('AMN-008', 'Hair Dryer',                        'pi pi-bolt',       0.00, 1, @NOW, @NOW),
  ('AMN-009', 'Iron & Ironing Board',              'pi pi-wrench',     0.00, 1, @NOW, @NOW),
  ('AMN-010', 'Rain Shower & Bathtub',             'pi pi-sun',        0.00, 1, @NOW, @NOW),
  ('AMN-011', 'Balcony / Teras Privat',            'pi pi-home',       0.00, 1, @NOW, @NOW),
  ('AMN-012', 'Nespresso Coffee Machine',          'pi pi-star',    35000.00, 1, @NOW, @NOW),
  ('AMN-013', 'Bluetooth Speaker JBL',             'pi pi-volume-up',  0.00, 1, @NOW, @NOW),
  ('AMN-014', 'Toiletries Premium (L''Occitane)',   'pi pi-gift',       0.00, 1, @NOW, @NOW),
  ('AMN-015', 'Working Desk & Ergonomic Chair',    'pi pi-briefcase',  0.00, 1, @NOW, @NOW),
  ('AMN-016', 'Pillow Menu (6 Jenis)',             'pi pi-th-large',   0.00, 1, @NOW, @NOW),
  ('AMN-017', 'Blackout Curtain',                  'pi pi-eye-slash',  0.00, 1, @NOW, @NOW),
  ('AMN-018', 'USB Charging Ports (Bedside)',      'pi pi-bolt',       0.00, 1, @NOW, @NOW),
  ('AMN-019', 'Kimono / Yukata Bathrobe',          'pi pi-user',    15000.00, 1, @NOW, @NOW),
  ('AMN-020', 'Welcome Fruit Basket',              'pi pi-apple-alt',  0.00, 1, @NOW, @NOW)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `icon` = VALUES(`icon`),
  `harga` = VALUES(`harga`),
  `is_active` = 1,
  `updated_at` = @NOW;

-- ------------------------------------------------------------------------------
-- 7. DATA: Relasi Fasilitas & Amenity per Tipe Kamar
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `mst_room_type_fasilitas` (`kode_tipe_kamar`, `kode_fasilitas`, `created_at`) VALUES
  ('TIP0001', 'FAS-001', @NOW), ('TIP0001', 'FAS-002', @NOW), ('TIP0001', 'FAS-015', @NOW), ('TIP0001', 'FAS-018', @NOW),
  ('TIP0002', 'FAS-001', @NOW), ('TIP0002', 'FAS-002', @NOW), ('TIP0002', 'FAS-004', @NOW), ('TIP0002', 'FAS-008', @NOW), ('TIP0002', 'FAS-015', @NOW), ('TIP0002', 'FAS-017', @NOW), ('TIP0002', 'FAS-018', @NOW),
  ('TIP0003', 'FAS-001', @NOW), ('TIP0003', 'FAS-002', @NOW), ('TIP0003', 'FAS-003', @NOW), ('TIP0003', 'FAS-004', @NOW), ('TIP0003', 'FAS-005', @NOW), ('TIP0003', 'FAS-008', @NOW), ('TIP0003', 'FAS-016', @NOW), ('TIP0003', 'FAS-017', @NOW), ('TIP0003', 'FAS-018', @NOW),
  ('TIP0004', 'FAS-001', @NOW), ('TIP0004', 'FAS-002', @NOW), ('TIP0004', 'FAS-003', @NOW), ('TIP0004', 'FAS-004', @NOW), ('TIP0004', 'FAS-005', @NOW), ('TIP0004', 'FAS-006', @NOW), ('TIP0004', 'FAS-007', @NOW), ('TIP0004', 'FAS-008', @NOW), ('TIP0004', 'FAS-009', @NOW), ('TIP0004', 'FAS-010', @NOW), ('TIP0004', 'FAS-011', @NOW), ('TIP0004', 'FAS-012', @NOW), ('TIP0004', 'FAS-013', @NOW), ('TIP0004', 'FAS-014', @NOW), ('TIP0004', 'FAS-015', @NOW), ('TIP0004', 'FAS-016', @NOW), ('TIP0004', 'FAS-017', @NOW), ('TIP0004', 'FAS-018', @NOW), ('TIP0004', 'FAS-019', @NOW), ('TIP0004', 'FAS-020', @NOW);

INSERT IGNORE INTO `mst_room_type_amenity` (`kode_rta`, `kode_tipe_kamar`, `kode_amenity`) VALUES
  ('RTA0001', 'TIP0001', 'AMN-001'), ('RTA0002', 'TIP0001', 'AMN-002'), ('RTA0003', 'TIP0001', 'AMN-003'), ('RTA0004', 'TIP0001', 'AMN-004'), ('RTA0005', 'TIP0001', 'AMN-005'), ('RTA0016', 'TIP0001', 'AMN-008'), ('RTA0017', 'TIP0001', 'AMN-018'),
  ('RTA0006', 'TIP0002', 'AMN-001'), ('RTA0007', 'TIP0002', 'AMN-002'), ('RTA0008', 'TIP0002', 'AMN-003'), ('RTA0009', 'TIP0002', 'AMN-004'), ('RTA0010', 'TIP0002', 'AMN-005'), ('RTA0018', 'TIP0002', 'AMN-006'), ('RTA0019', 'TIP0002', 'AMN-008'), ('RTA0020', 'TIP0002', 'AMN-009'), ('RTA0021', 'TIP0002', 'AMN-010'), ('RTA0022', 'TIP0002', 'AMN-017'),
  ('RTA0011', 'TIP0003', 'AMN-001'), ('RTA0012', 'TIP0003', 'AMN-002'), ('RTA0013', 'TIP0003', 'AMN-005'), ('RTA0014', 'TIP0003', 'AMN-006'), ('RTA0015', 'TIP0003', 'AMN-007'), ('RTA0023', 'TIP0003', 'AMN-003'), ('RTA0024', 'TIP0003', 'AMN-004'), ('RTA0025', 'TIP0003', 'AMN-008'), ('RTA0026', 'TIP0003', 'AMN-010'), ('RTA0027', 'TIP0003', 'AMN-011'), ('RTA0028', 'TIP0003', 'AMN-012'), ('RTA0029', 'TIP0003', 'AMN-014'), ('RTA0030', 'TIP0003', 'AMN-015'), ('RTA0031', 'TIP0003', 'AMN-016'), ('RTA0032', 'TIP0003', 'AMN-017'), ('RTA0033', 'TIP0003', 'AMN-018'),
  ('RTA0034', 'TIP0004', 'AMN-001'), ('RTA0035', 'TIP0004', 'AMN-002'), ('RTA0036', 'TIP0004', 'AMN-003'), ('RTA0037', 'TIP0004', 'AMN-004'), ('RTA0038', 'TIP0004', 'AMN-005'), ('RTA0039', 'TIP0004', 'AMN-006'), ('RTA0040', 'TIP0004', 'AMN-007'), ('RTA0041', 'TIP0004', 'AMN-008'), ('RTA0042', 'TIP0004', 'AMN-009'), ('RTA0043', 'TIP0004', 'AMN-010'), ('RTA0044', 'TIP0004', 'AMN-011'), ('RTA0045', 'TIP0004', 'AMN-012'), ('RTA0046', 'TIP0004', 'AMN-013'), ('RTA0047', 'TIP0004', 'AMN-014'), ('RTA0048', 'TIP0004', 'AMN-015'), ('RTA0049', 'TIP0004', 'AMN-016'), ('RTA0050', 'TIP0004', 'AMN-017'), ('RTA0051', 'TIP0004', 'AMN-018'), ('RTA0052', 'TIP0004', 'AMN-019'), ('RTA0053', 'TIP0004', 'AMN-020');

-- ------------------------------------------------------------------------------
-- 8. DATA: Navigasi Master Menu Lengkap (mst_navigation)
-- ------------------------------------------------------------------------------
SET @MENU_JSON = '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Contoh & Template","icon":"pi pi-fw pi-bookmark","items":[{"label":"Contoh Form Upload","icon":"pi pi-fw pi-upload","to":"/contoh_form_upload"},{"label":"Contoh Laporan","icon":"pi pi-fw pi-file","to":"/contoh_laporan"},{"label":"Contoh Popup","icon":"pi pi-fw pi-window-maximize","to":"/contoh_popup"},{"label":"Contoh Tabview","icon":"pi pi-fw pi-folder","to":"/contoh_tabview"},{"label":"Contoh Trx Cetak Nota","icon":"pi pi-fw pi-print","to":"/contoh_trx_cetak_nota"}]}]';

DELETE FROM `mst_navigation` 
WHERE LOWER(`role`) IN ('superadmin', 'admin', 'master', 'frontdesk', 'receptionist', 'kasir', 'housekeeping');

INSERT INTO `mst_navigation` (`role`, `menu`, `tz`, `created_at`, `updated_at`)
VALUES
  ('superadmin',   @MENU_JSON, 'UTC', @NOW, @NOW),
  ('admin',        @MENU_JSON, 'UTC', @NOW, @NOW),
  ('master',       @MENU_JSON, 'UTC', @NOW, @NOW),
  ('frontdesk',    @MENU_JSON, 'UTC', @NOW, @NOW),
  ('receptionist', @MENU_JSON, 'UTC', @NOW, @NOW),
  ('kasir',        @MENU_JSON, 'UTC', @NOW, @NOW),
  ('housekeeping', @MENU_JSON, 'UTC', @NOW, @NOW);

-- ------------------------------------------------------------------------------
-- 9. SINKRONISASI: Perbarui user_navigation seluruh user agar menu langsung aktif
-- ------------------------------------------------------------------------------
UPDATE `user_navigation` 
SET `menu` = @MENU_JSON, `updated_at` = @NOW;

SELECT 'SELESAI! Seluruh skema, data fasilitas (20), amenity (20), relasi kamar, dan navigasi menu telah berhasil diperbarui di Railway.' AS status;
