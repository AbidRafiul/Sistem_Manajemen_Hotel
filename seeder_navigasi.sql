-- ============================================================================
-- SEEDER & UPDATE NAVIGASI MENU HOTEL PMS (PRODUCTION / DBEAVER)
-- ============================================================================
-- Proyek    : Sistem Manajemen Hotel PMS
-- Database  : MySQL 8.x (Kompatibel dengan Railway & Localhost)
-- Collation : utf8mb4_unicode_ci
-- Tanggal   : 2026-09-18
--
-- Petunjuk Penggunaan di DBeaver:
-- 1. Buka DBeaver dan sambungkan ke koneksi database Production.
-- 2. Buka tab SQL Editor baru (Ctrl + ]).
-- 3. Paste seluruh script ini ke editor.
-- 4. Tekan Alt + X untuk menjalankan seluruh script sekaligus (Execute SQL Script).
-- ============================================================================

SET @NOW = NOW();

-- ----------------------------------------------------------------------------
-- 1. PASTIKAN TABEL mst_navigation TERSEDIA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mst_navigation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `menu` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. PASTIKAN TABEL user_navigation TERSEDIA (JIKA DIGUNAKAN SISTEM)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_navigation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_code` VARCHAR(50) NOT NULL,
  `menu` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tz` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_user_navigation_user_code` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. SIAPKAN VARIABLE JSON MENU LENGKAP HOTEL PMS
--    Mencakup seluruh modul:
--    - Utama (Dashboard)
--    - MASTER & SETUP CABANG (Master Hotel, Kamar & Fasilitas, Ruang Event, Harga & Season, Master Tamu, Konfigurasi Sistem)
--    - Kasir (Shift Kasir)
--    - Reservasi (Dashboard Reservasi, Walk-In, Booking, Kedatangan, Tamu Menginap, Checkout)
--    - Housekeeping (Room Status Board)
--    - Contoh & Template
-- ----------------------------------------------------------------------------
SET @MENU_JSON = '[{"label":"Utama","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"MASTER & SETUP CABANG","icon":"pi pi-fw pi-cog","items":[{"label":"Data Master Hotel","icon":"pi pi-fw pi-building","items":[{"label":"Master Cabang","icon":"pi pi-fw pi-building","to":"/master_cabang"},{"label":"Master Gedung","icon":"pi pi-fw pi-th-large","to":"/master_gedung"},{"label":"Master Lantai","icon":"pi pi-fw pi-bars","to":"/master_lantai"},{"label":"Corporate / Travel Agent","icon":"pi pi-fw pi-briefcase","to":"/master_corporate"},{"label":"Pajak & Service Charge","icon":"pi pi-fw pi-percentage","to":"/master_pajak"},{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}]},{"label":"Kamar & Fasilitas","icon":"pi pi-fw pi-home","items":[{"label":"Tipe Kamar","icon":"pi pi-fw pi-tag","to":"/master_tipe_kamar"},{"label":"Master Kamar","icon":"pi pi-fw pi-home","to":"/master_kamar"},{"label":"Bed Type","icon":"pi pi-fw pi-inbox","to":"/master_bed_type"},{"label":"Fasilitas & Amenity","icon":"pi pi-fw pi-star","to":"/master_amenity"},{"label":"Master Fasilitas","icon":"pi pi-fw pi-verified","to":"/master_fasilitas"}]},{"label":"Ruang Event","icon":"pi pi-fw pi-ticket","items":[{"label":"Tipe Ruang Event","icon":"pi pi-fw pi-tags","to":"/master_tipe_ruang_event"},{"label":"Master Ruang Event","icon":"pi pi-fw pi-ticket","to":"/master_ruang_event"},{"label":"Harga Ruang Event","icon":"pi pi-fw pi-money-bill","to":"/master_harga_ruang_event"}]},{"label":"Harga & Season","icon":"pi pi-fw pi-dollar","items":[{"label":"Rate Plan (Paket Harga)","icon":"pi pi-fw pi-dollar","to":"/master_rate_plan"},{"label":"Master Harga Kamar","icon":"pi pi-fw pi-money-bill","to":"/master_rate_plan_price"},{"label":"Season & Pricing","icon":"pi pi-fw pi-calendar","to":"/master_season"}]},{"label":"Master Tamu","icon":"pi pi-fw pi-users","items":[{"label":"Data Tamu","icon":"pi pi-fw pi-user","to":"/master_tamu"},{"label":"Dashboard Tamu","icon":"pi pi-fw pi-chart-bar","to":"/master_tamu/dashboard"}]},{"label":"Konfigurasi Sistem","icon":"pi pi-fw pi-sliders-h","items":[{"label":"User & Role Management","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Master Navigasi","icon":"pi pi-fw pi-sitemap","to":"/setup/navigation"},{"label":"Konfigurasi Perusahaan","icon":"pi pi-fw pi-sliders-h","to":"/setup/config"}]}]},{"label":"Kasir","icon":"pi pi-fw pi-wallet","items":[{"label":"Shift Kasir","icon":"pi pi-fw pi-clock","to":"/kasir_shift"}]},{"label":"Reservasi","icon":"pi pi-fw pi-calendar-plus","items":[{"label":"Dashboard Reservasi","icon":"pi pi-fw pi-th-large","to":"/reservasi_dashboard"},{"label":"Walk-In Check-in","icon":"pi pi-fw pi-user-plus","to":"/reservasi_baru"},{"label":"Booking Reservasi","icon":"pi pi-fw pi-calendar","to":"/reservasi_booking"},{"label":"Kedatangan (Arrivals)","icon":"pi pi-fw pi-sign-in","to":"/reservasi_checkin"},{"label":"Tamu Menginap","icon":"pi pi-fw pi-users","to":"/tamu_menginap"},{"label":"Checkout","icon":"pi pi-fw pi-sign-out","to":"/checkout"}]},{"label":"Housekeeping","icon":"pi pi-fw pi-refresh","items":[{"label":"Room Status Board","icon":"pi pi-fw pi-th-large","to":"/housekeeping/room_status_board"}]},{"label":"Contoh & Template","icon":"pi pi-fw pi-bookmark","items":[{"label":"Contoh Form Upload","icon":"pi pi-fw pi-upload","to":"/contoh_form_upload"},{"label":"Contoh Laporan","icon":"pi pi-fw pi-file","to":"/contoh_laporan"},{"label":"Contoh Popup","icon":"pi pi-fw pi-window-maximize","to":"/contoh_popup"},{"label":"Contoh Tabview","icon":"pi pi-fw pi-folder","to":"/contoh_tabview"},{"label":"Contoh Trx Cetak Nota","icon":"pi pi-fw pi-print","to":"/contoh_trx_cetak_nota"}]}]';

-- ----------------------------------------------------------------------------
-- 4. INSERT / UPDATE MASTER NAVIGASI SELURUH ROLE (mst_navigation)
--    Aman dan Idempoten: Menghapus role eksisting terlebih dahulu lalu insert ulang
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. SINKRONISASI USER NAVIGATION (user_navigation)
--    Perbarui cache menu semua user agar perubahan menu langsung tampil di sidebar
-- ----------------------------------------------------------------------------
UPDATE `user_navigation` 
SET `menu` = @MENU_JSON, `updated_at` = @NOW;

-- ----------------------------------------------------------------------------
-- 6. VERIFIKASI HASIL EKSEKUSI
-- ----------------------------------------------------------------------------
SELECT 
  `id`, 
  `role`, 
  `updated_at`,
  LENGTH(`menu`) AS menu_bytes
FROM `mst_navigation`
ORDER BY `id` ASC;
