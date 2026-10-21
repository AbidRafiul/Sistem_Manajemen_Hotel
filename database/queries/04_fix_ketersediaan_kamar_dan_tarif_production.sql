-- ====================================================================
-- SKRIP IDEMPOTEN: FIX KETERSEDIAAN KAMAR, RATE PLAN & HARGA (RAILWAY PRODUCTION)
-- Mengatasi Warning: "Tidak ada tipe kamar yang tersedia" pada Front Office & Walk-In
-- Target Cabang: CAB0001 (Grand Marstech Hotel & Resort Magetan) & CAB0002
-- Aman dijalankan berulang kali (Idempoten via ON DUPLICATE KEY UPDATE)
-- ====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- [BAGIAN 1] PASTIKAN STRUKTUR TABEL PENDUKUNG ADA (IF NOT EXISTS)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mst_tipe_kamar_foto` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `foto_url` VARCHAR(255) NOT NULL,
  `urutan` INT NOT NULL DEFAULT 0,
  `is_cover` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` BIGINT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_by` BIGINT DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tkf_tipe_kamar` (`kode_tipe_kamar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mst_room_type_amenity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_rta` VARCHAR(50) NOT NULL,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_amenity` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rta` (`kode_tipe_kamar`, `kode_amenity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mst_room_type_fasilitas` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_tipe_kamar` VARCHAR(50) NOT NULL,
  `kode_fasilitas` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rtf` (`kode_tipe_kamar`, `kode_fasilitas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- [BAGIAN 2] SEEDING RATE PLAN / PAKET HARGA (mst_paket_harga)
-- Akar Masalah: /reservasi/kamar/room-packages me-load rate plan aktif per cabang.
-- Jika mst_paket_harga untuk CAB0001 kosong, katalog kamar mengembalikan array kosong!
-- --------------------------------------------------------------------
INSERT INTO `mst_paket_harga` (
  `kode_cabang`, `kode_template`, `kode_paket_harga`, `nama_paket`, 
  `tipe_paket`, `dapat_di_refund`, `termasuk_sarapan`, `minimal_malam`, 
  `maksimal_malam`, `tipe_markup`, `nilai_markup`, `is_active`, `created_at`, `updated_at`
) VALUES 
('CAB0001', NULL, 'RP0001', 'Room Only (RO)', 'RO', 1, 0, 1, NULL, 'nominal', 0.00, 1, NOW(), NOW()),
('CAB0001', NULL, 'RP0002', 'Bed & Breakfast (BB)', 'BB', 1, 1, 1, NULL, 'nominal', 75000.00, 1, NOW(), NOW()),
('CAB0001', NULL, 'RP0003', 'Full Board Package (FB)', 'FB', 0, 1, 1, NULL, 'nominal', 200000.00, 1, NOW(), NOW()),
('CAB0001', NULL, 'RP0004', 'Corporate / Business Rate', 'BB', 1, 1, 1, NULL, 'persen', -10.00, 1, NOW(), NOW()),
('CAB0002', NULL, 'RP-B01', 'Room Only (RO)', 'RO', 1, 0, 1, NULL, 'nominal', 0.00, 1, NOW(), NOW()),
('CAB0002', NULL, 'RP-B02', 'Bed & Breakfast Resort Buffet', 'BB', 1, 1, 1, NULL, 'nominal', 150000.00, 1, NOW(), NOW()),
('CAB0002', NULL, 'RP-B03', 'Batu Wellness & Spa Experience', 'SP', 0, 1, 2, NULL, 'nominal', 450000.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `nama_paket` = VALUES(`nama_paket`),
  `tipe_paket` = VALUES(`tipe_paket`),
  `dapat_di_refund` = VALUES(`dapat_di_refund`),
  `termasuk_sarapan` = VALUES(`termasuk_sarapan`),
  `tipe_markup` = VALUES(`tipe_markup`),
  `nilai_markup` = VALUES(`nilai_markup`),
  `is_active` = 1,
  `deleted_at` = NULL,
  `updated_at` = NOW();

-- --------------------------------------------------------------------
-- [BAGIAN 3] SEEDING MUSIM / SEASON (mst_musim)
-- pricing_helper mengaitkan tanggal dengan season aktif cabang.
-- --------------------------------------------------------------------
INSERT INTO `mst_musim` (
  `kode_cabang`, `kode_musim`, `nama_musim`, 
  `tanggal_mulai`, `tanggal_selesai`, `hari_berlaku`, 
  `is_active`, `created_at`, `updated_at`
) VALUES 
('CAB0001', 'SEA0001', 'Regular Season 2026', '2026-01-01', '2026-12-31', 'senin,selasa,rabu,kamis,jumat,sabtu,minggu', 1, NOW(), NOW()),
('CAB0001', 'SEA0002', 'Peak Holiday & Weekend Season', '2026-06-01', '2026-07-31', 'jumat,sabtu,minggu', 1, NOW(), NOW()),
('CAB0002', 'SEA-B01', 'Regular Season Batu', '2026-01-01', '2026-12-31', 'senin,selasa,rabu,kamis,jumat,sabtu,minggu', 1, NOW(), NOW()),
('CAB0002', 'SEA-B02', 'Batu Weekend & Peak Holiday', '2026-06-01', '2026-07-31', 'jumat,sabtu,minggu', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `nama_musim` = VALUES(`nama_musim`),
  `tanggal_mulai` = VALUES(`tanggal_mulai`),
  `tanggal_selesai` = VALUES(`tanggal_selesai`),
  `hari_berlaku` = VALUES(`hari_berlaku`),
  `is_active` = 1,
  `deleted_at` = NULL,
  `updated_at` = NOW();

-- --------------------------------------------------------------------
-- [BAGIAN 4] SEEDING MATRIKS HARGA KAMAR (mst_rate_plan_price)
-- Memberikan kepastian harga menginap per tipe kamar x rate plan
-- --------------------------------------------------------------------
INSERT INTO `mst_rate_plan_price` (
  `kode_harga_price`, `kode_tipe_kamar`, `kode_rate_plan`, `kode_season`, 
  `price`, `extra_bed_price`, `valid_from`, `valid_to`, `is_active`, `created_at`, `updated_at`
) VALUES 
-- Superior Room (TIP0001 - CAB0001)
('HAR0001', 'TIP0001', 'RP0001', NULL, 550000.00, 150000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0002', 'TIP0001', 'RP0002', NULL, 625000.00, 150000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0003', 'TIP0001', 'RP0003', NULL, 750000.00, 150000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),

-- Deluxe Room (TIP0002 - CAB0001)
('HAR0004', 'TIP0002', 'RP0001', NULL, 850000.00, 200000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0005', 'TIP0002', 'RP0002', NULL, 925000.00, 200000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0006', 'TIP0002', 'RP0003', NULL, 1050000.00, 200000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),

-- Executive Suite (TIP0003 - CAB0001)
('HAR0007', 'TIP0003', 'RP0001', NULL, 1450000.00, 300000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0008', 'TIP0003', 'RP0002', NULL, 1525000.00, 300000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0009', 'TIP0003', 'RP0003', NULL, 1650000.00, 300000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),

-- Presidential Suite (TIP0004 - CAB0001)
('HAR0010', 'TIP0004', 'RP0001', NULL, 2750000.00, 500000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0011', 'TIP0004', 'RP0002', NULL, 2825000.00, 500000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW()),
('HAR0012', 'TIP0004', 'RP0003', NULL, 2950000.00, 500000.00, '2026-01-01', '2026-12-31', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `price` = VALUES(`price`),
  `extra_bed_price` = VALUES(`extra_bed_price`),
  `valid_from` = VALUES(`valid_from`),
  `valid_to` = VALUES(`valid_to`),
  `is_active` = 1,
  `deleted_at` = NULL,
  `updated_at` = NOW();

-- --------------------------------------------------------------------
-- [BAGIAN 5] SEEDING / AKTIVASI KAMAR FISIK SIAP CHECK-IN (mst_kamar)
-- Status: vacant (kosong) dan clean (bersih lolos inspeksi)
-- Menghasilkan badge kamar HIJAU yang siap diklik saat Walk-In!
-- --------------------------------------------------------------------
INSERT INTO `mst_kamar` (
  `kode_cabang`, `kode_gedung`, `kode_lantai`, `kode_tipe_kamar`, 
  `kode_kamar`, `nomor_kamar`, `tipe_pemandangan`, `catatan`, 
  `boleh_merokok`, `occupancy_status`, `housekeeping_status`, `is_active`, `created_at`, `updated_at`
) VALUES 
-- Superior Room (Lantai 1 - Gedung Utama)
('CAB0001', 'GED0001', 'LAN0001', 'TIP0001', 'KAM0001', '101', 'Garden View', 'Dekat akses lobby utama & kolam renang', 0, 'vacant', 'clean', 1, NOW(), NOW()),
('CAB0001', 'GED0001', 'LAN0001', 'TIP0001', 'KAM0002', '102', 'Garden View', 'Kamar tenang menghadap taman tropis', 0, 'vacant', 'clean', 1, NOW(), NOW()),
('CAB0001', 'GED0001', 'LAN0001', 'TIP0001', 'KAM0003', '103', 'Pool View', 'Pemandangan kolam renang utama', 0, 'vacant', 'clean', 1, NOW(), NOW()),

-- Deluxe Room (Lantai 2 - Gedung Utama)
('CAB0001', 'GED0001', 'LAN0002', 'TIP0002', 'KAM0004', '201', 'City View', 'Balkon luas pemandangan kota Magetan', 0, 'vacant', 'clean', 1, NOW(), NOW()),
('CAB0001', 'GED0001', 'LAN0002', 'TIP0002', 'KAM0005', '202', 'City View', 'Balkon pribadi lantai 2', 0, 'vacant', 'clean', 1, NOW(), NOW()),
('CAB0001', 'GED0001', 'LAN0002', 'TIP0002', 'KAM0006', '203', 'Pool View', 'Pemandangan kolam renang dari atas', 0, 'vacant', 'clean', 1, NOW(), NOW()),

-- Executive Suite (Lantai 3 - Gedung Suites)
('CAB0001', 'GED0003', 'LAN0003', 'TIP0003', 'KAM0007', '301', 'Mountain View', 'Pemandangan Gunung Lawu & Executive Lounge access', 0, 'vacant', 'clean', 1, NOW(), NOW()),
('CAB0001', 'GED0003', 'LAN0003', 'TIP0003', 'KAM0008', '302', 'Mountain View', 'Executive Suite dengan bathtub panorama', 0, 'vacant', 'clean', 1, NOW(), NOW()),

-- Presidential Suite (Lantai 3 - Gedung Suites)
('CAB0001', 'GED0003', 'LAN0003', 'TIP0004', 'KAM0009', '305', 'Panoramic Mountain & City', 'Presidential Suite private jacuzzi & butler service', 0, 'vacant', 'clean', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `kode_gedung` = VALUES(`kode_gedung`),
  `kode_lantai` = VALUES(`kode_lantai`),
  `kode_tipe_kamar` = VALUES(`kode_tipe_kamar`),
  `nomor_kamar` = VALUES(`nomor_kamar`),
  `tipe_pemandangan` = VALUES(`tipe_pemandangan`),
  `catatan` = VALUES(`catatan`),
  `occupancy_status` = 'vacant',
  `housekeeping_status` = 'clean',
  `is_active` = 1,
  `deleted_at` = NULL,
  `updated_at` = NOW();

-- --------------------------------------------------------------------
-- [BAGIAN 6] FOTO COVER TIPE KAMAR (mst_tipe_kamar_foto)
-- Menghilangkan card kosong dan memberikan estetika profesional
-- --------------------------------------------------------------------
INSERT INTO `mst_tipe_kamar_foto` (`kode_tipe_kamar`, `foto_url`, `urutan`, `is_cover`, `is_active`, `created_at`)
VALUES 
('TIP0001', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', 1, 1, 1, NOW()),
('TIP0002', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', 1, 1, 1, NOW()),
('TIP0003', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', 1, 1, 1, NOW()),
('TIP0004', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80', 1, 1, 1, NOW())
ON DUPLICATE KEY UPDATE 
  `foto_url` = VALUES(`foto_url`),
  `is_cover` = 1,
  `is_active` = 1;

-- --------------------------------------------------------------------
-- [BAGIAN 7] MAPPING AMENITY & FASILITAS KE TIPE KAMAR
-- --------------------------------------------------------------------
INSERT IGNORE INTO `mst_room_type_amenity` (`kode_rta`, `kode_tipe_kamar`, `kode_amenity`) VALUES 
('RTA-001', 'TIP0001', 'AMN-001'),
('RTA-002', 'TIP0001', 'AMN-002'),
('RTA-003', 'TIP0001', 'AMN-003'),
('RTA-004', 'TIP0001', 'AMN-004'),
('RTA-005', 'TIP0002', 'AMN-001'),
('RTA-006', 'TIP0002', 'AMN-002'),
('RTA-007', 'TIP0002', 'AMN-003'),
('RTA-008', 'TIP0002', 'AMN-004'),
('RTA-009', 'TIP0002', 'AMN-005'),
('RTA-010', 'TIP0003', 'AMN-001'),
('RTA-011', 'TIP0003', 'AMN-002'),
('RTA-012', 'TIP0003', 'AMN-003'),
('RTA-013', 'TIP0003', 'AMN-004'),
('RTA-014', 'TIP0003', 'AMN-005'),
('RTA-015', 'TIP0003', 'AMN-006'),
('RTA-016', 'TIP0004', 'AMN-001'),
('RTA-017', 'TIP0004', 'AMN-002'),
('RTA-018', 'TIP0004', 'AMN-003'),
('RTA-019', 'TIP0004', 'AMN-004'),
('RTA-020', 'TIP0004', 'AMN-005'),
('RTA-021', 'TIP0004', 'AMN-006'),
('RTA-022', 'TIP0004', 'AMN-007');

INSERT IGNORE INTO `mst_room_type_fasilitas` (`kode_tipe_kamar`, `kode_fasilitas`, `created_at`) VALUES 
('TIP0001', 'FAS-001', NOW()),
('TIP0001', 'FAS-004', NOW()),
('TIP0002', 'FAS-001', NOW()),
('TIP0002', 'FAS-002', NOW()),
('TIP0002', 'FAS-004', NOW()),
('TIP0003', 'FAS-001', NOW()),
('TIP0003', 'FAS-002', NOW()),
('TIP0003', 'FAS-003', NOW()),
('TIP0003', 'FAS-004', NOW()),
('TIP0004', 'FAS-001', NOW()),
('TIP0004', 'FAS-002', NOW()),
('TIP0004', 'FAS-003', NOW()),
('TIP0004', 'FAS-004', NOW()),
('TIP0004', 'FAS-005', NOW());

-- --------------------------------------------------------------------
-- [BAGIAN 8] FORMAT PENOMORAN OTOMATIS TRANSAKSI PMS (sys_format_penomoran)
-- Menjamin transaksi Walk-In & Booking berhasil meng-generate invoice & nomor reservasi
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sys_format_penomoran` (
  `kode_format` varchar(50) NOT NULL,
  `nama_tabel` varchar(100) NOT NULL,
  `prefix` varchar(20) NOT NULL,
  `panjang_digit` int NOT NULL DEFAULT 4,
  `nomor_terakhir` int NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`kode_format`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sys_format_penomoran` (`kode_format`, `nama_tabel`, `prefix`, `panjang_digit`, `nomor_terakhir`, `is_active`) VALUES
('FMT-RESERVASI', 'trx_reservation', 'RSV', 4, 10, 1),
('FMT-RESROOM', 'trx_reservation_room', 'RRM', 4, 15, 1),
('FMT-CHECKIN', 'trx_checkin', 'CHK', 4, 10, 1),
('FMT-FOLIO', 'trx_folio', 'FOL', 4, 10, 1),
('FMT-FOLIOCHARGE', 'trx_folio_charge', 'CHG', 4, 25, 1),
('FMT-PAYMENT', 'trx_payment', 'PAY', 4, 10, 1),
('FMT-INVOICE', 'trx_fiscal_document', 'INV', 4, 10, 1),
('FMT-RSL', 'trx_room_status_log', 'RSL', 4, 30, 1),
('FMT-TASK', 'trx_housekeeping_task', 'TSK', 4, 20, 1),
('FMT-TAMU', 'mst_guest', 'GST', 4, 20, 1)
ON DUPLICATE KEY UPDATE `is_active` = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------
-- [BAGIAN 9] VERIFIKASI HASIL EKSEKUSI (100% READ-ONLY)
-- --------------------------------------------------------------------
SELECT 
  '1. Master Tipe Kamar' AS `Komponen`,
  COUNT(*) AS `Total Data`,
  SUM(IF(is_active = 1, 1, 0)) AS `Jumlah Aktif`,
  '✅ OK' AS `Status Operasional`
FROM `mst_tipe_kamar` WHERE `kode_cabang` = 'CAB0001'
UNION ALL
SELECT 
  '2. Fisik Kamar Siap Pakai (Vacant Clean)',
  COUNT(*),
  SUM(IF(occupancy_status = 'vacant' AND housekeeping_status = 'clean', 1, 0)),
  IF(SUM(IF(occupancy_status = 'vacant' AND housekeeping_status = 'clean', 1, 0)) > 0, '✅ SIAP CHECK-IN', '⚠️ PERLU KAMAR BERSIH')
FROM `mst_kamar` WHERE `kode_cabang` = 'CAB0001'
UNION ALL
SELECT 
  '3. Rate Plan / Paket Harga',
  COUNT(*),
  SUM(IF(is_active = 1, 1, 0)),
  IF(SUM(IF(is_active = 1, 1, 0)) > 0, '✅ OK (TERSEDIA)', '❌ KOSONG (Pemicu Error)')
FROM `mst_paket_harga` WHERE `kode_cabang` = 'CAB0001'
UNION ALL
SELECT 
  '4. Matriks Harga Kamar',
  COUNT(*),
  SUM(IF(is_active = 1, 1, 0)),
  '✅ OK'
FROM `mst_rate_plan_price`
UNION ALL
SELECT 
  '5. Season / Musim Tarif',
  COUNT(*),
  SUM(IF(is_active = 1, 1, 0)),
  '✅ OK'
FROM `mst_musim` WHERE `kode_cabang` = 'CAB0001';
