# Rencana Implementasi: Master Shift Kasir Terintegrasi & Standardisasi Sesi Operasional PMS Hotel

**Tanggal:** 30 September 2026  
**Status:** Menunggu Persetujuan / Siap Dieksekusi  
**Tujuan:**  
Membangun dan mengintegrasikan entitas **Master Shift Kasir (`mst_shift`)** ke dalam sistem Property Management System (PMS) Hotel, sehingga:
1. Setiap cabang hotel dapat mengonfigurasi jadwal shift sendiri (nama shift, jam mulai, jam selesai, default uang modal kas / *float cash*, serta penanda *Night Audit*).
2. Menggantikan opsi sesi kasir yang saat ini masih di-*hardcode* di halaman Buka Shift (`kasir_shift`).
3. Menjaga arsitektur kasir hotel tetap bersih dan modular (*Separation of Concerns*) dengan memisahkan:
   - **Master Cashier Counter** (`mst_cashier_counter`): Titik/laci kasir fisik (workstation).
   - **Master User** (`mst_user`): Akun staf yang bertugas (kasir / front office).
   - **Master Shift** (`mst_shift`): Jadwal sesi kerja operasional hotel.
   - **Transaksi Shift Kasir** (`trx_cashier_shift`): Sesi kerja aktif yang menghubungkan ketiganya.

---

## 1. Analisis Kebutuhan & Kondisi Eksisting

### 1.1. Kondisi Saat Ini vs Target Baru

| Komponen | Kondisi Saat Ini | Target Implementasi Baru |
| :--- | :--- | :--- |
| **Pilihan Sesi Kasir** | Di-hardcode di [kasir_shift/page.tsx](file:///d:/COOLYEAGHH/MAGANG%20MARSHTECH/Project/Manajemen_Hotel/manajemen_pms_hotel/next_pms_fe/app/(main)/kasir_shift/page.tsx) (`pagi`, `sore`, `malam`) | Dinamis dari database `mst_shift` per cabang aktif |
| **Modal Awal Kas (*Opening Cash*)** | Diinput manual oleh kasir (default angka mentah Rp 1.000.000) | Terisi otomatis sesuai `default_opening_cash` dari master shift yang dipilih |
| **Jam Kerja Shift** | Keterangan statis (07:00-15:00, dst) | Ditentukan oleh manajemen per cabang (`waktu_mulai` & `waktu_selesai`) |
| **Night Audit Cutoff** | Belum ada penanda shift mana yang bertanggung jawab atas *Day End / Night Audit* | Ditandai dengan flag boolean `is_night_audit` |
| **Master Shift Menu** | Belum ada menu pengelolaan master shift di frontend maupun backend | Tersedia menu CRUD lengkap di `/master_shift` (Master & Setup Cabang) |
| **Master Cashier Counter** | Sudah ada di [master_cashier_counter](file:///d:/COOLYEAGHH/MAGANG%20MARSHTECH/Project/Manajemen_Hotel/manajemen_pms_hotel/next_pms_fe/app/(main)/master_cashier_counter/page.tsx) | Dipertahankan dan diintegrasikan mulus dengan Master Shift |

---

## 2. Rencana Arsitektur & Skema Database

### 2.1. Skrip Migrasi Idempoten (`migration_master_shift.sql`)

Akan dibuat skrip migrasi MySQL yang aman dijalankan berulang kali:
```sql
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
  KEY `fk_shift_cabang` (`kode_cabang`),
  CONSTRAINT `fk_shift_cabang` FOREIGN KEY (`kode_cabang`) REFERENCES `mst_cabang` (`kode_cabang`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2. Data Awal (Seeder Default Shifts)
Memasukkan 3 shift baku untuk cabang yang sudah ada (`CAB0001` dan `CAB0002`):
1. **SFT-PAGI**: *Shift 1 – Pagi (Morning)*, 07:00:00 – 15:00:00, Modal Rp 1.000.000, Night Audit: 0, Urutan: 1.
2. **SFT-SORE**: *Shift 2 – Sore (Evening)*, 15:00:00 – 23:00:00, Modal Rp 1.000.000, Night Audit: 0, Urutan: 2.
3. **SFT-MALAM**: *Shift 3 – Malam (Night Audit)*, 23:00:00 – 07:00:00, Modal Rp 1.000.000, Night Audit: 1, Urutan: 3.

---

## 3. Rencana Komponen Backend (`express_pms_be`)

### 3.1. Penambahan Endpoint Master Shift
Direktori baru: `routes/v1/master/shift/`:
1. `shift_data.js`: Endpoint `POST /master/shift/shift-data`
   - Filter berdasarkan `kode_cabang` aktif pengguna.
   - Pencarian `keyword` (nama shift / kode shift).
   - Pengurutan data (`urutan ASC`, `waktu_mulai ASC`).
   - Paginasi dan kalkulasi total data.
2. `shift_create.js`: Endpoint `POST /master/shift/shift-create`
   - Validasi payload via Joi: `kode_cabang`, `nama_shift`, `waktu_mulai`, `waktu_selesai`, `default_opening_cash`, `is_night_audit`, `urutan`.
   - Pembuatan kode otomatis via `generateSequence("FMT-SHIFT")`.
   - Pencatatan log perubahan audit (`ChangesLog`).
3. `shift_update.js`: Endpoint `POST /master/shift/shift-update`
   - Validasi data & update data shift aktif.
   - Pencatatan log perubahan sebelum & sesudah.
4. `shift_delete.js`: Endpoint `POST /master/shift/shift-delete`
   - Soft delete (`is_active = 0` / `deleted_at`).
5. `shift_dropdown.js`: Endpoint `POST /master/shift/shift-dropdown`
   - Mengambil daftar shift aktif khusus cabang tertentu untuk dikonsumsi form buka kasir.

### 3.2. Registrasi Routing & Tool Sequence
- Mendaftarkan endpoint shift di [express_pms_be/routes/v1/master/index.js](file:///d:/COOLYEAGHH/MAGANG%20MARSHTECH/Project/Manajemen_Hotel/manajemen_pms_hotel/express_pms_be/routes/v1/master/index.js).
- Mendaftarkan sequence `FMT-SHIFT` pada [generateCode.js](file:///d:/COOLYEAGHH/MAGANG%20MARSHTECH/Project/Manajemen_Hotel/manajemen_pms_hotel/express_pms_be/routes/v1/components/tools/generateCode.js).

### 3.3. Penyesuaian `shift_open.js`
- Menerima `kode_shift` atau `sesi` (tetap kompatibel ke belakang).
- Jika `kode_shift` dikirim, sistem memvalidasi eksistensi shift di `mst_shift` dan menyimpan referensinya.

---

## 4. Rencana Komponen Frontend (`next_pms_fe`)

### 4.1. Halaman Baru Master Shift (`app/(main)/master_shift/`)
Membangun modul standar CRUD lengkap sesuai pola *Intern Standart v2*:
1. `page.tsx`:
   - State management (Paginasi, sorting, keyword filter, session cabang).
   - Tombol Aksi: Tambah Shift, Refresh, Cetak Rekap (PDF/Excel).
2. `components/interfaces.ts`:
   - Tipe data TypeScript (`ShiftItem`, `State`, `FormValues`).
   - Konfigurasi header dan format tampilan jam & nominal uang.
3. `components/endpoints.ts`:
   - URL endpoint backend (`/master/shift/...`).
4. `components/display/table.tsx`:
   - Tabel data PrimeReact dengan badge status aktif, badge Night Audit, format jam kerja, dan tombol Edit/Hapus.
5. `components/display/form.tsx`:
   - Modal Formik interaktif:
     * Pilihan Cabang (Dropdown).
     * Nama Shift (InputText).
     * Jam Mulai & Jam Selesai (InputText format `HH:mm:ss` / Time input).
     * Standar Modal Awal Kas (InputNumber Rupiah).
     * Checkbox / Switch *Night Audit*.
     * Urutan Shift (InputNumber).
     * Status Aktif.
6. `components/display/print.tsx`:
   - Dialog cetak rekapan laporan master shift.

### 4.2. Integrasi ke Halaman Operasional Kasir (`app/(main)/kasir_shift/page.tsx`)
1. Mengganti konstanta hardcode `SESI_OPTIONS` dengan data dinamis dari `apiShiftDropdown`.
2. Saat kasir memilih sesi shift di dropdown:
   - Field `opening_cash` otomatis terisi dengan `default_opening_cash` dari master shift terkait.
   - Menampilkan badge info jam operasional shift (misal: `07:00 – 15:00`).
   - Menampilkan tag khusus jika shift tersebut bertugas sebagai *Night Audit*.
3. Fallback cerdas: Jika master shift belum diatur di suatu cabang, sistem tetap menyediakan opsi fallback (Pagi/Sore/Malam) agar kasir tidak terblokir bertransaksi.

### 4.3. Pembaruan Menu Navigasi
1. Menambahkan menu **Master Shift** pada daftar menu `mst_navigation` untuk role `superadmin` dan `branch_manager` di bawah grup **"MASTER & SETUP CABANG" -> "Setup & Master Cabang"** bersebelahan dengan **Master Cashier Counter**.

---

## 5. Rencana Tahapan Eksekusi (Step-by-Step)

```
[Tahap 1: Database]
   │── Buat & jalankan migration_master_shift.sql
   └── Seeding data shift awal (Pagi, Sore, Malam) untuk CAB0001 & CAB0002
   │
[Tahap 2: Backend API]
   │── Buat routes/v1/master/shift/ (data, create, update, delete, dropdown)
   │── Registrasi route di routes/v1/master/index.js
   └── Daftarkan FMT-SHIFT di generateCode.js
   │
[Tahap 3: Frontend Master Shift]
   │── Buat app/(main)/master_shift/ (page.tsx, components, interfaces, form, table)
   └── Daftarkan menu di mst_navigation
   │
[Tahap 4: Integrasi Kasir Shift]
   │── Update kasir_shift/page.tsx untuk load shift dropdown dinamis
   └── Auto-fill opening_cash saat shift dipilih & tampilkan indikator Night Audit
   │
[Tahap 5: Verifikasi & Uji Alur Lengkap]
   │── Uji CRUD Master Shift di frontend
   │── Uji buka shift kasir dengan shift baru dari master
   └── Pastikan riwayat dan handover berjalan sempurna
```

---

## 6. Rencana Pengujian & Validasi

1. **Pengujian Skema Database**: Memastikan tabel `mst_shift` terbentuk dengan indeks dan relasi foreign key yang benar.
2. **Pengujian Endpoint Backend**: Menguji pembuatan shift, validasi waktu (jam mulai & selesai), validasi cabang, dan dropdown.
3. **Pengujian UI Master Shift**:
   - Menambah shift baru (misal: "Shift Tengah / Middle Shift" 11:00 - 19:00).
   - Mengubah modal awal uang kas.
   - Menghapus / menonaktifkan shift.
4. **Pengujian Operasional Kasir**:
   - Membuka halaman `/kasir_shift`.
   - Mengklik **Buka Shift**: Memastikan dropdown menampilkan daftar shift dari master cabang terkait.
   - Memastikan nominal modal awal langsung terisi otomatis sesuai pengaturan master shift.
   - Melakukan transaksi penerimaan kasir, lalu melakukan **Tutup Shift** dan memeriksa perhitungan selisih kas.
