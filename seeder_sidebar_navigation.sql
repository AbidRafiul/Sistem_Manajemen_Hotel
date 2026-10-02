-- ====================================================================
-- SEEDER NAVIGASI SIDEBAR MENU LENGKAP (RAILWAY PRODUCTION / DBEAVER)
-- Proyek       : Sistem Manajemen Hotel (PMS) Multi-Branch Enterprise
-- File         : seeder_sidebar_navigation.sql
-- Kompatibilitas: MySQL 8.0+ / MariaDB 10.5+ / Railway / DBeaver
-- Sifat Skrip  : 100% IDEMPOTENT (Aman dijalankan berulang kali tanpa duplikasi)
--
-- PANDUAN EKSEKUSI DI DBEAVER:
-- 1. Buka DBeaver dan pastikan terhubung ke database Production (misal: 'railway').
-- 2. Buka SQL Editor (Ctrl + ] atau Menu -> SQL Editor -> New SQL Script).
-- 3. Copy seluruh isi file ini, lalu paste ke SQL Editor DBeaver.
-- 4. Jalankan sebagai SQL Script (Tekan Alt + X).
-- 5. Refresh halaman web frontend aplikasi Hotel PMS. Sidebar langsung terupdate!
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- -------------------------------------------------------------
-- [LANGKAH 1] PASTIKAN TABEL `mst_navigation` TERSEDIA
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mst_navigation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `menu` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` DATETIME DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- [LANGKAH 2] BERSIHKAN DATA DUPLIKAT SEBELUMNYA (JIKA ADA)
-- -------------------------------------------------------------
-- Menghapus entri duplikat lama dan mempertahankan ID terbaru
DELETE n1 FROM `mst_navigation` n1
JOIN `mst_navigation` n2 
  ON LOWER(TRIM(n1.`role`)) = LOWER(TRIM(n2.`role`)) AND n1.`id` < n2.`id`;

-- -------------------------------------------------------------
-- [LANGKAH 3] PASTIKAN UNIQUE KEY PADA KOLOM `role` TERPASANG
-- -------------------------------------------------------------
-- Mencegah terjadinya duplikasi data menu saat skrip dijalankan ulang
SET @idx_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_navigation' AND INDEX_NAME = 'uq_navigation_role');
SET @stmt_sql := IF(@idx_exists = 0, 'ALTER TABLE `mst_navigation` ADD UNIQUE KEY `uq_navigation_role` (`role`)', 'SELECT 1');
PREPARE exec_stmt FROM @stmt_sql; EXECUTE exec_stmt; DEALLOCATE PREPARE exec_stmt;


-- -------------------------------------------------------------
-- [LANGKAH 4] DEFINISI STRUKTUR MENU JSON UNTUK SETIAP ROLE
-- -------------------------------------------------------------

-- 4.1 Menu Superadmin, Admin, dan Master (Full Akses Enterprise)
SET @menu_superadmin := '[
  {
    "label": "Utama",
    "items": [
      { "label": "Dashboard", "icon": "pi pi-fw pi-home", "to": "/dashboard" }
    ]
  },
  {
    "label": "MASTER & SETUP CABANG",
    "icon": "pi pi-fw pi-cog",
    "items": [
      {
        "label": "Data Master Hotel",
        "icon": "pi pi-fw pi-building",
        "items": [
          { "label": "Master Wilayah", "icon": "pi pi-fw pi-map", "to": "/master_wilayah" },
          { "label": "Master Cabang", "icon": "pi pi-fw pi-building", "to": "/master_cabang" },
          { "label": "Master Gedung", "icon": "pi pi-fw pi-th-large", "to": "/master_gedung" },
          { "label": "Master Lantai", "icon": "pi pi-fw pi-bars", "to": "/master_lantai" },
          { "label": "Corporate / Travel Agent", "icon": "pi pi-fw pi-briefcase", "to": "/master_corporate" },
          { "label": "Pajak & Service Charge", "icon": "pi pi-fw pi-percentage", "to": "/master_pajak" },
          { "label": "Master Cashier Counter", "icon": "pi pi-fw pi-desktop", "to": "/master_cashier_counter" },
          { "label": "Master Shift Kasir", "icon": "pi pi-fw pi-clock", "to": "/master_shift" }
        ]
      },
      {
        "label": "Kamar & Fasilitas",
        "icon": "pi pi-fw pi-home",
        "items": [
          { "label": "Tipe Kamar", "icon": "pi pi-fw pi-tag", "to": "/master_tipe_kamar" },
          { "label": "Master Kamar", "icon": "pi pi-fw pi-home", "to": "/master_kamar" },
          { "label": "Bed Type", "icon": "pi pi-fw pi-inbox", "to": "/master_bed_type" },
          { "label": "Fasilitas & Amenity", "icon": "pi pi-fw pi-star", "to": "/master_amenity" },
          { "label": "Master Fasilitas", "icon": "pi pi-fw pi-verified", "to": "/master_fasilitas" }
        ]
      },
      {
        "label": "Ruang Event",
        "icon": "pi pi-fw pi-ticket",
        "items": [
          { "label": "Tipe Ruang Event", "icon": "pi pi-fw pi-tags", "to": "/master_tipe_ruang_event" },
          { "label": "Master Ruang Event", "icon": "pi pi-fw pi-ticket", "to": "/master_ruang_event" },
          { "label": "Harga Ruang Event", "icon": "pi pi-fw pi-money-bill", "to": "/master_harga_ruang_event" }
        ]
      },
      {
        "label": "Harga & Season",
        "icon": "pi pi-fw pi-dollar",
        "items": [
          { "label": "Rate Plan (Paket Harga)", "icon": "pi pi-fw pi-dollar", "to": "/master_rate_plan" },
          { "label": "Master Harga Kamar", "icon": "pi pi-fw pi-money-bill", "to": "/master_rate_plan_price" },
          { "label": "Season & Pricing", "icon": "pi pi-fw pi-calendar", "to": "/master_season" }
        ]
      },
      {
        "label": "Master Tamu",
        "icon": "pi pi-fw pi-users",
        "items": [
          { "label": "Data Tamu", "icon": "pi pi-fw pi-user", "to": "/master_tamu" },
          { "label": "Dashboard Tamu", "icon": "pi pi-fw pi-chart-bar", "to": "/master_tamu/dashboard" }
        ]
      },
      {
        "label": "Konfigurasi Sistem",
        "icon": "pi pi-fw pi-sliders-h",
        "items": [
          { "label": "User & Role Management", "icon": "pi pi-fw pi-users", "to": "/setup/users" },
          { "label": "Master Navigasi", "icon": "pi pi-fw pi-sitemap", "to": "/setup/navigation" },
          { "label": "Konfigurasi Perusahaan", "icon": "pi pi-fw pi-sliders-h", "to": "/setup/config" }
        ]
      }
    ]
  },
  {
    "label": "Kasir",
    "icon": "pi pi-fw pi-wallet",
    "items": [
      { "label": "Shift Kasir", "icon": "pi pi-fw pi-clock", "to": "/kasir_shift" }
    ]
  },
  {
    "label": "Reservasi",
    "icon": "pi pi-fw pi-calendar-plus",
    "items": [
      { "label": "Dashboard Reservasi", "icon": "pi pi-fw pi-th-large", "to": "/reservasi_dashboard" },
      { "label": "Walk-In Check-in", "icon": "pi pi-fw pi-user-plus", "to": "/reservasi_baru" },
      { "label": "Booking Reservasi", "icon": "pi pi-fw pi-calendar", "to": "/reservasi_booking" },
      { "label": "Kedatangan (Arrivals)", "icon": "pi pi-fw pi-sign-in", "to": "/reservasi_checkin" },
      { "label": "Tamu Menginap", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" },
      { "label": "Checkout", "icon": "pi pi-fw pi-sign-out", "to": "/checkout" }
    ]
  },
  {
    "label": "Housekeeping",
    "icon": "pi pi-fw pi-refresh",
    "items": [
      { "label": "Room Status Board", "icon": "pi pi-fw pi-th-large", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Contoh & Template",
    "icon": "pi pi-fw pi-bookmark",
    "items": [
      { "label": "Contoh Form Upload", "icon": "pi pi-fw pi-upload", "to": "/contoh_form_upload" },
      { "label": "Contoh Laporan", "icon": "pi pi-fw pi-file", "to": "/contoh_laporan" },
      { "label": "Contoh Popup", "icon": "pi pi-fw pi-window-maximize", "to": "/contoh_popup" },
      { "label": "Contoh Tabview", "icon": "pi pi-fw pi-folder", "to": "/contoh_tabview" },
      { "label": "Contoh Trx Cetak Nota", "icon": "pi pi-fw pi-print", "to": "/contoh_trx_cetak_nota" }
    ]
  }
]';

-- 4.2 Menu Corporate Manager (Monitoring Multi-Properti & Wilayah)
SET @menu_corp := '[
  {
    "label": "Utama",
    "items": [
      { "label": "Dashboard", "icon": "pi pi-fw pi-home", "to": "/dashboard" }
    ]
  },
  {
    "label": "Operasional Group",
    "icon": "pi pi-fw pi-globe",
    "items": [
      { "label": "Dashboard Reservasi", "icon": "pi pi-fw pi-th-large", "to": "/reservasi_dashboard" },
      { "label": "Tamu Menginap (In-House)", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" },
      { "label": "Room Status Board", "icon": "pi pi-fw pi-refresh", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Master Tamu",
    "icon": "pi pi-fw pi-users",
    "items": [
      { "label": "Data Tamu", "icon": "pi pi-fw pi-user", "to": "/master_tamu" },
      { "label": "Dashboard Tamu", "icon": "pi pi-fw pi-chart-bar", "to": "/master_tamu/dashboard" }
    ]
  },
  {
    "label": "Master Data Hotel",
    "icon": "pi pi-fw pi-building",
    "items": [
      { "label": "Master Wilayah", "icon": "pi pi-fw pi-map", "to": "/master_wilayah" },
      { "label": "Master Cabang", "icon": "pi pi-fw pi-building", "to": "/master_cabang" },
      { "label": "Master Gedung", "icon": "pi pi-fw pi-th-large", "to": "/master_gedung" },
      { "label": "Master Kamar", "icon": "pi pi-fw pi-home", "to": "/master_kamar" },
      { "label": "Rate Plan", "icon": "pi pi-fw pi-dollar", "to": "/master_rate_plan" },
      { "label": "Season & Pricing", "icon": "pi pi-fw pi-calendar", "to": "/master_season" }
    ]
  }
]';

-- 4.3 Menu Regional Manager (Monitoring Regional / Wilayah)
SET @menu_reg := '[
  {
    "label": "Utama",
    "items": [
      { "label": "Dashboard", "icon": "pi pi-fw pi-home", "to": "/dashboard" }
    ]
  },
  {
    "label": "Monitoring Wilayah",
    "icon": "pi pi-fw pi-map",
    "items": [
      { "label": "Dashboard Reservasi", "icon": "pi pi-fw pi-th-large", "to": "/reservasi_dashboard" },
      { "label": "Tamu Menginap (In-House)", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" },
      { "label": "Room Status Board", "icon": "pi pi-fw pi-refresh", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Master Tamu",
    "icon": "pi pi-fw pi-users",
    "items": [
      { "label": "Data Tamu", "icon": "pi pi-fw pi-user", "to": "/master_tamu" },
      { "label": "Dashboard Tamu", "icon": "pi pi-fw pi-chart-bar", "to": "/master_tamu/dashboard" }
    ]
  },
  {
    "label": "Informasi Properti",
    "icon": "pi pi-fw pi-building",
    "items": [
      { "label": "Master Wilayah", "icon": "pi pi-fw pi-map", "to": "/master_wilayah" },
      { "label": "Master Gedung", "icon": "pi pi-fw pi-th-large", "to": "/master_gedung" },
      { "label": "Master Kamar", "icon": "pi pi-fw pi-home", "to": "/master_kamar" }
    ]
  }
]';

-- 4.4 Menu Branch Manager (General Manager / Kepala Cabang)
SET @menu_bm := '[
  {
    "label": "Utama",
    "items": [
      { "label": "Dashboard", "icon": "pi pi-fw pi-home", "to": "/dashboard" }
    ]
  },
  {
    "label": "Reservasi",
    "icon": "pi pi-fw pi-calendar-plus",
    "items": [
      { "label": "Dashboard Reservasi", "icon": "pi pi-fw pi-th-large", "to": "/reservasi_dashboard" },
      { "label": "Walk-In Check-in", "icon": "pi pi-fw pi-user-plus", "to": "/reservasi_baru" },
      { "label": "Booking Reservasi", "icon": "pi pi-fw pi-calendar", "to": "/reservasi_booking" },
      { "label": "Kedatangan (Arrivals)", "icon": "pi pi-fw pi-sign-in", "to": "/reservasi_checkin" },
      { "label": "Tamu Menginap", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" },
      { "label": "Checkout", "icon": "pi pi-fw pi-sign-out", "to": "/checkout" }
    ]
  },
  {
    "label": "Kasir",
    "icon": "pi pi-fw pi-wallet",
    "items": [
      { "label": "Shift Kasir", "icon": "pi pi-fw pi-clock", "to": "/kasir_shift" }
    ]
  },
  {
    "label": "Housekeeping",
    "icon": "pi pi-fw pi-refresh",
    "items": [
      { "label": "Room Status Board", "icon": "pi pi-fw pi-th-large", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Master Tamu",
    "icon": "pi pi-fw pi-users",
    "items": [
      { "label": "Data Tamu", "icon": "pi pi-fw pi-user", "to": "/master_tamu" },
      { "label": "Dashboard Tamu", "icon": "pi pi-fw pi-chart-bar", "to": "/master_tamu/dashboard" }
    ]
  },
  {
    "label": "Setup & Master Cabang",
    "icon": "pi pi-fw pi-cog",
    "items": [
      { "label": "Master Gedung", "icon": "pi pi-fw pi-th-large", "to": "/master_gedung" },
      { "label": "Master Lantai", "icon": "pi pi-fw pi-bars", "to": "/master_lantai" },
      { "label": "Tipe Kamar", "icon": "pi pi-fw pi-tag", "to": "/master_tipe_kamar" },
      { "label": "Master Kamar", "icon": "pi pi-fw pi-home", "to": "/master_kamar" },
      { "label": "Fasilitas Hotel", "icon": "pi pi-fw pi-verified", "to": "/master_fasilitas" },
      { "label": "Rate Plan", "icon": "pi pi-fw pi-dollar", "to": "/master_rate_plan" },
      { "label": "Season & Pricing", "icon": "pi pi-fw pi-calendar", "to": "/master_season" },
      { "label": "Cashier Counter", "icon": "pi pi-fw pi-desktop", "to": "/master_cashier_counter" },
      { "label": "Corporate / OTA", "icon": "pi pi-fw pi-briefcase", "to": "/master_corporate" },
      { "label": "Master Shift Kasir", "icon": "pi pi-fw pi-clock", "to": "/master_shift" }
    ]
  }
]';

-- 4.5 Menu Frontdesk & Receptionist
SET @menu_fo := '[
  {
    "label": "Utama",
    "items": [
      { "label": "Dashboard", "icon": "pi pi-fw pi-home", "to": "/dashboard" }
    ]
  },
  {
    "label": "Reservasi",
    "icon": "pi pi-fw pi-calendar-plus",
    "items": [
      { "label": "Dashboard Reservasi", "icon": "pi pi-fw pi-th-large", "to": "/reservasi_dashboard" },
      { "label": "Walk-In Check-in", "icon": "pi pi-fw pi-user-plus", "to": "/reservasi_baru" },
      { "label": "Booking Reservasi", "icon": "pi pi-fw pi-calendar", "to": "/reservasi_booking" },
      { "label": "Kedatangan (Arrivals)", "icon": "pi pi-fw pi-sign-in", "to": "/reservasi_checkin" },
      { "label": "Tamu Menginap", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" }
    ]
  },
  {
    "label": "Housekeeping",
    "icon": "pi pi-fw pi-refresh",
    "items": [
      { "label": "Room Status Board", "icon": "pi pi-fw pi-th-large", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Master Tamu",
    "icon": "pi pi-fw pi-users",
    "items": [
      { "label": "Data Tamu", "icon": "pi pi-fw pi-user", "to": "/master_tamu" },
      { "label": "Dashboard Tamu", "icon": "pi pi-fw pi-chart-bar", "to": "/master_tamu/dashboard" }
    ]
  }
]';

SET @menu_rec := '[
  {
    "label": "Reservasi",
    "icon": "pi pi-fw pi-calendar-plus",
    "items": [
      { "label": "Walk-In Check-in", "icon": "pi pi-fw pi-user-plus", "to": "/reservasi_baru" },
      { "label": "Booking Reservasi", "icon": "pi pi-fw pi-calendar", "to": "/reservasi_booking" },
      { "label": "Kedatangan (Arrivals)", "icon": "pi pi-fw pi-sign-in", "to": "/reservasi_checkin" },
      { "label": "Tamu Menginap", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" }
    ]
  },
  {
    "label": "Housekeeping",
    "icon": "pi pi-fw pi-refresh",
    "items": [
      { "label": "Room Status Board", "icon": "pi pi-fw pi-th-large", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Master Tamu",
    "icon": "pi pi-fw pi-users",
    "items": [
      { "label": "Data Tamu", "icon": "pi pi-fw pi-user", "to": "/master_tamu" }
    ]
  }
]';

-- 4.6 Menu Kasir (Operasional Kasir & Shift)
SET @menu_kasir := '[
  {
    "label": "Kasir",
    "icon": "pi pi-fw pi-wallet",
    "items": [
      { "label": "Shift Kasir", "icon": "pi pi-fw pi-clock", "to": "/kasir_shift" }
    ]
  },
  {
    "label": "Operasional Kasir",
    "icon": "pi pi-fw pi-money-bill",
    "items": [
      { "label": "Tamu Menginap (Folio)", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" },
      { "label": "Checkout & Tagihan", "icon": "pi pi-fw pi-sign-out", "to": "/checkout" }
    ]
  }
]';

-- 4.7 Menu Housekeeping
SET @menu_hk := '[
  {
    "label": "Housekeeping",
    "icon": "pi pi-fw pi-refresh",
    "items": [
      { "label": "Room Status Board", "icon": "pi pi-fw pi-th-large", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Kamar",
    "icon": "pi pi-fw pi-home",
    "items": [
      { "label": "Daftar Kamar", "icon": "pi pi-fw pi-home", "to": "/master_kamar" }
    ]
  }
]';

-- 4.8 Menu Auditor
SET @menu_auditor := '[
  {
    "label": "Utama",
    "items": [
      { "label": "Dashboard", "icon": "pi pi-fw pi-home", "to": "/dashboard" }
    ]
  },
  {
    "label": "Audit Transaksi",
    "icon": "pi pi-fw pi-check-circle",
    "items": [
      { "label": "Dashboard Reservasi", "icon": "pi pi-fw pi-th-large", "to": "/reservasi_dashboard" },
      { "label": "Tamu Menginap", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" },
      { "label": "Histori Checkout", "icon": "pi pi-fw pi-sign-out", "to": "/checkout" },
      { "label": "Log Shift Kasir", "icon": "pi pi-fw pi-clock", "to": "/kasir_shift" }
    ]
  },
  {
    "label": "Analisis CRM",
    "icon": "pi pi-fw pi-chart-line",
    "items": [
      { "label": "Dashboard Tamu", "icon": "pi pi-fw pi-chart-bar", "to": "/master_tamu/dashboard" }
    ]
  }
]';

-- 4.9 Menu Staff & Employee
SET @menu_staff := '[
  {
    "label": "Reservasi",
    "icon": "pi pi-fw pi-calendar-plus",
    "items": [
      { "label": "Walk-In Check-in", "icon": "pi pi-fw pi-user-plus", "to": "/reservasi_baru" },
      { "label": "Booking Reservasi", "icon": "pi pi-fw pi-calendar", "to": "/reservasi_booking" },
      { "label": "Kedatangan (Arrivals)", "icon": "pi pi-fw pi-sign-in", "to": "/reservasi_checkin" },
      { "label": "Tamu Menginap", "icon": "pi pi-fw pi-users", "to": "/tamu_menginap" }
    ]
  },
  {
    "label": "Housekeeping",
    "icon": "pi pi-fw pi-refresh",
    "items": [
      { "label": "Room Status Board", "icon": "pi pi-fw pi-th-large", "to": "/housekeeping/room_status_board" }
    ]
  },
  {
    "label": "Master Tamu",
    "icon": "pi pi-fw pi-users",
    "items": [
      { "label": "Data Tamu", "icon": "pi pi-fw pi-user", "to": "/master_tamu" }
    ]
  }
]';


-- -------------------------------------------------------------
-- [LANGKAH 5] SIMPAN & PERBARUI MENU KE TABEL `mst_navigation`
-- -------------------------------------------------------------
INSERT INTO `mst_navigation` (`role`, `menu`, `tz`, `created_at`, `updated_at`)
VALUES 
  ('superadmin', @menu_superadmin, 'UTC', NOW(), NOW()),
  ('admin', @menu_superadmin, 'UTC', NOW(), NOW()),
  ('master', @menu_superadmin, 'UTC', NOW(), NOW()),
  ('corporate_manager', @menu_corp, 'UTC', NOW(), NOW()),
  ('regional_manager', @menu_reg, 'UTC', NOW(), NOW()),
  ('branch_manager', @menu_bm, 'UTC', NOW(), NOW()),
  ('frontdesk', @menu_fo, 'UTC', NOW(), NOW()),
  ('receptionist', @menu_rec, 'UTC', NOW(), NOW()),
  ('kasir', @menu_kasir, 'UTC', NOW(), NOW()),
  ('housekeeping', @menu_hk, 'UTC', NOW(), NOW()),
  ('auditor', @menu_auditor, 'UTC', NOW(), NOW()),
  ('staff', @menu_staff, 'UTC', NOW(), NOW()),
  ('employee', @menu_staff, 'UTC', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `menu` = VALUES(`menu`),
  `updated_at` = NOW();


-- -------------------------------------------------------------
-- [LANGKAH 6] VERIFIKASI HASIL SEEDER SIDEBAR
-- -------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

SELECT 
  `id`, 
  `role`, 
  CHAR_LENGTH(`menu`) AS `panjang_karakter_menu`, 
  `updated_at`
FROM `mst_navigation`
ORDER BY `id` ASC;
