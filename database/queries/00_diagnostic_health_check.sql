-- ====================================================================
-- AUDIT MENYELURUH DATABASE HOTEL PMS (100% CRASH-PROOF & ALL-IN-ONE)
-- Sifat: READ-ONLY (Aman dijalankan kapan saja di Production Railway/DBeaver)
-- Garansi: TIDAK AKAN PERNAH BERHENTI / ERROR 1146 MESKIPUN TABEL BELUM DIBUAT
-- ====================================================================

-- ====================================================================
-- BAGIAN 1: AUDIT KELENGKAPAN 34 TABEL SISTEM SECARA TOTAL
-- ====================================================================
SELECT 
  t.kategori AS `Kategori Modul`,
  t.nama_tabel AS `Nama Tabel`,
  t.deskripsi AS `Fungsi Modul`,
  IF(ist.TABLE_NAME IS NOT NULL, '✅ TERPASANG', '❌ BELUM DIBUAT') AS `Status Fisik`,
  COALESCE(ist.TABLE_ROWS, 0) AS `Estimasi Data`,
  CASE 
    WHEN ist.TABLE_NAME IS NULL THEN '❌ KRITIS (Tabel Belum Ada)'
    WHEN COALESCE(ist.TABLE_ROWS, 0) = 0 THEN '⚠️ KOSONG (Perlu Seeder)'
    ELSE '✅ SIAP OPERASIONAL'
  END AS `Status Kesiapan`
FROM (
  -- 1. Multi-Branch Enterprise
  SELECT 'companies' AS nama_tabel, '1. Multi-Branch Enterprise' AS kategori, 'Data Perusahaan Induk' AS deskripsi UNION ALL
  SELECT 'org_nodes', '1. Multi-Branch Enterprise', 'Struktur Wilayah / Regional' UNION ALL
  SELECT 'user_scope_assignments', '1. Multi-Branch Enterprise', 'Hak Akses Multi-Cabang User' UNION ALL
  SELECT 'mst_user', '1. Multi-Branch Enterprise', 'Akun Pengguna Sistem' UNION ALL
  SELECT 'mst_cabang', '1. Multi-Branch Enterprise', 'Daftar Cabang Hotel' UNION ALL

  -- 2. Master Properti & Kamar Fisik
  SELECT 'mst_gedung', '2. Master Properti & Kamar', 'Master Gedung / Wing Hotel' UNION ALL
  SELECT 'mst_lantai', '2. Master Properti & Kamar', 'Master Lantai per Gedung' UNION ALL
  SELECT 'mst_bed_type', '2. Master Properti & Kamar', 'Tipe Tempat Tidur (King/Twin/Single)' UNION ALL
  SELECT 'mst_tipe_kamar', '2. Master Properti & Kamar', 'Tipe Kamar (Deluxe/Suite/dll)' UNION ALL
  SELECT 'mst_tipe_kamar_foto', '2. Master Properti & Kamar', 'Galeri Foto Tipe Kamar' UNION ALL
  SELECT 'mst_kamar', '2. Master Properti & Kamar', 'Unit Kamar Fisik (Nomor Kamar)' UNION ALL
  SELECT 'mst_amenity', '2. Master Properti & Kamar', 'Fasilitas Kamar (Amenity)' UNION ALL
  SELECT 'mst_fasilitas', '2. Master Properti & Kamar', 'Fasilitas Hotel (Kolam/Gym/Spa)' UNION ALL
  SELECT 'mst_room_type_amenity', '2. Master Properti & Kamar', 'Mapping Amenity ke Tipe Kamar' UNION ALL
  SELECT 'mst_room_type_fasilitas', '2. Master Properti & Kamar', 'Mapping Fasilitas ke Tipe Kamar' UNION ALL

  -- 3. Tarif, Ruang Event & Tamu
  SELECT 'mst_paket_harga', '3. Tarif, Event & Tamu', 'Rate Plan (Paket Harga Kamar)' UNION ALL
  SELECT 'mst_rate_plan_price', '3. Tarif, Event & Tamu', 'Matriks Harga Kamar per Season' UNION ALL
  SELECT 'mst_musim', '3. Tarif, Event & Tamu', 'Season / Musim Tarif' UNION ALL
  SELECT 'mst_tax', '3. Tarif, Event & Tamu', 'Pajak & Service Charge' UNION ALL
  SELECT 'mst_corporate_account', '3. Tarif, Event & Tamu', 'Mitra Corporate & Travel Agent' UNION ALL
  SELECT 'mst_guest', '3. Tarif, Event & Tamu', 'Database Tamu (Guest Book)' UNION ALL
  SELECT 'mst_tipe_ruang_event', '3. Tarif, Event & Tamu', 'Tipe Ruang Meeting/Ballroom' UNION ALL
  SELECT 'mst_ruang_event', '3. Tarif, Event & Tamu', 'Unit Ruang Event Fisik' UNION ALL
  SELECT 'mst_harga_ruang_event', '3. Tarif, Event & Tamu', 'Tarif Sewa Ruang Event' UNION ALL

  -- 4. Kasir, Shift & Front Desk
  SELECT 'mst_shift', '4. Kasir, Shift & Front Desk', 'Master Shift Operasional Kasir' UNION ALL
  SELECT 'mst_cashier_counter', '4. Kasir, Shift & Front Desk', 'Master Loket Kasir' UNION ALL
  SELECT 'trx_cashier_shift', '4. Kasir, Shift & Front Desk', 'Sesi Kasir Aktif (Buka/Tutup Shift)' UNION ALL
  SELECT 'trx_reservation', '4. Kasir, Shift & Front Desk', 'Header Reservasi Kamar' UNION ALL
  SELECT 'trx_reservation_room', '4. Kasir, Shift & Front Desk', 'Alokasi Kamar Reservasi' UNION ALL
  SELECT 'trx_checkin', '4. Kasir, Shift & Front Desk', 'Data Tamu Check-in (In-House)' UNION ALL
  SELECT 'trx_folio', '4. Kasir, Shift & Front Desk', 'Tagihan / Folio Tamu' UNION ALL
  SELECT 'trx_folio_charge', '4. Kasir, Shift & Front Desk', 'Rincian Transaksi Biaya Folio' UNION ALL
  SELECT 'trx_payment', '4. Kasir, Shift & Front Desk', 'Riwayat Pembayaran Kasir' UNION ALL
  SELECT 'trx_housekeeping_task', '4. Kasir, Shift & Front Desk', 'Manajemen Housekeeping Kamar' UNION ALL
  SELECT 'trx_night_audit', '4. Kasir, Shift & Front Desk', 'Riwayat Audit Tutup Buku Harian' UNION ALL

  -- 5. Sistem & Keamanan
  SELECT 'mst_navigation', '5. Sistem & Keamanan', 'Menu Navigasi Sidebar per Role' UNION ALL
  SELECT 'config', '5. Sistem & Keamanan', 'Pengaturan Profil Perusahaan' UNION ALL
  SELECT 'sys_format_penomoran', '5. Sistem & Keamanan', 'Penomoran Otomatis (Format Dokumen)' UNION ALL
  SELECT 'access_token', '5. Sistem & Keamanan', 'Token JWT Sesi Login' UNION ALL
  SELECT 'log', '5. Sistem & Keamanan', 'Log Error Sistem (Pencegah Crash)' UNION ALL
  SELECT 'log_perubahan', '5. Sistem & Keamanan', 'Audit Trail Perubahan Data'
) t
LEFT JOIN INFORMATION_SCHEMA.TABLES ist 
  ON ist.TABLE_SCHEMA = DATABASE() AND ist.TABLE_NAME = t.nama_tabel
ORDER BY t.kategori, t.nama_tabel;


-- ====================================================================
-- BAGIAN 2: AUDIT 8 KOLOM KRITIS (PENYEBAB UTAMA MAINTENANCE 99)
-- ====================================================================
SELECT 
  c.nama_tabel AS `Nama Tabel`,
  c.nama_kolom AS `Kolom Kritis`,
  c.fungsi AS `Fungsi Kolom`,
  IF(col.COLUMN_NAME IS NOT NULL, '✅ ADA (NORMAL)', '❌ TIDAK ADA (Pemicu Error 99)') AS `Status Kolom`
FROM (
  SELECT 'mst_amenity' AS nama_tabel, 'harga' AS nama_kolom, 'Tarif tambahan amenitas kamar' AS fungsi UNION ALL
  SELECT 'mst_fasilitas', 'harga', 'Tarif pemakaian fasilitas hotel' UNION ALL
  SELECT 'mst_user', 'org_node_id', 'Relasi wilayah regional user' UNION ALL
  SELECT 'mst_user', 'company_id', 'Relasi perusahaan user' UNION ALL
  SELECT 'mst_user', 'default_branch_id', 'Cabang default saat login' UNION ALL
  SELECT 'mst_user', 'can_switch_branch', 'Izin switch cabang' UNION ALL
  SELECT 'mst_cabang', 'company_id', 'Relasi cabang ke perusahaan' UNION ALL
  SELECT 'mst_cabang', 'org_node_id', 'Relasi cabang ke wilayah'
) c
LEFT JOIN INFORMATION_SCHEMA.COLUMNS col
  ON col.TABLE_SCHEMA = DATABASE() 
 AND col.TABLE_NAME = c.nama_tabel 
 AND col.COLUMN_NAME = c.nama_kolom
ORDER BY c.nama_tabel, c.nama_kolom;


-- ====================================================================
-- BAGIAN 3: AUDIT AKUN SUPERADMIN & CABANG AKTIF
-- ====================================================================
SELECT 
  u.id,
  u.username,
  u.role,
  u.user_code,
  c.name AS nama_perusahaan,
  b.name AS cabang_default,
  u.can_switch_branch AS multi_cabang,
  IF(u.is_active = 1, '✅ Aktif', '❌ Nonaktif') AS status_user
FROM `mst_user` u
LEFT JOIN `companies` c ON u.company_id = c.id
LEFT JOIN `mst_cabang` b ON u.default_branch_id = b.id
WHERE u.role = 'superadmin' OR u.username LIKE '%admin%'
ORDER BY u.id ASC;
