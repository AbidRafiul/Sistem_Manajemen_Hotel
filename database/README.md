# Panduan Arsitektur & Operasional Database (Sistem Manajemen Hotel)

Dokumen ini menjelaskan struktur pengorganisasian berkas basis data, urutan eksekusi setup, serta konvensi yang berlaku di lingkungan **PT Marstech Global**.

---

## 1. Struktur Folder `database/`

```
database/
├── README.md                                          # Dokumentasi ini
├── schema/                                            # Struktur DDL dasar (tabel & relasi utama)
│   ├── essential.sql                                  # Skema bawaan template Standard PT Marstech Global
│   ├── 01_schema_migration.sql                       # Skema hirarki multi-branch (companies, org_nodes, user_scope_assignments)
│   └── proposal_align_collation_utf8mb4_unicode_ci.sql # Proposal penyeragaman collation (Draft / Non-aktif)
├── migrations/                                        # Skrip DDL inkremental per-fitur
│   ├── knex_migration_baseline_proposal.js            # Proposal baseline knex migration (Draft / Non-aktif)
│   ├── migration_checkout_inspection.sql              # Modul inspeksi kamar saat checkout
│   ├── migration_housekeeping_stayover.sql            # Modul housekeeping stayover & task request
│   ├── migration_master_shift.sql                     # Modul shift jam kerja operasional
│   ├── migration_night_audit.sql                      # Modul audit malam & auto-charge posting
│   ├── migration_shift_kasir_sesi.sql                 # Modul sesi buka/tutup kasir
│   ├── update_master_tamu.sql                         # Ekstensi profil data tamu (CRM & Identitas)
│   └── update_trx_payment_columns.sql                 # Tambahan kolom bank & jenis kartu pembayaran
├── seeds/                                             # Data awal statis & master data
│   └── 02_data_seeder.sql                             # Seeder SQL awal hirarki dan master data
└── legacy/                                            # Skrip lawas, duplikat, dan arsip historis
    ├── production_railway_update.sql                  # Skrip monolitik manual lama
    ├── production_update_migration_seeder.sql         # Duplikat 100% dari production_railway_update.sql
    ├── seeder_sidebar_navigation.sql                  # Seeder SQL navigasi manual DBeaver lama
    ├── update_navigation_front_office.sql             # Skrip parsial lama rute /front_office
    ├── update_navigation_master_shift.sql             # Skrip parsial lama rute /master_shift
    ├── update_navigation_master_tamu.sql              # Skrip parsial lama rute /master_tamu
    ├── seed_navigation.js                             # Runner script lama (duplikat)
    ├── run_seed_navigation.js                         # Runner script lama (duplikat)
    └── run_seed_front_office_nav.js                   # Runner script lama (duplikat)
```

---

## 2. Urutan Inisialisasi Database (Setup Pipeline)

Untuk menyiapkan database dari kondisi kosong (*fresh install*):

1. **Langkah 1 (Import Baseline Skema):**
   Import `database/schema/essential.sql` ke database MySQL (Collation target: `utf8mb4_unicode_ci`).
2. **Langkah 2 (Import Skema Multi-Branch Hirarki):**
   Import `database/schema/01_schema_migration.sql` untuk membuat tabel hirarki (`companies`, `org_nodes`, `user_scope_assignments`).
3. **Langkah 3 (Eksekusi Otomatis Seeder & Migrasi Fitur):**
   Masuk ke folder `express_pms_be/` dan jalankan:
   ```bash
   npm run seed:all
   ```
   Skrip `scripts/run_all_seeds.js` akan menjalankan rangkaian seeder dan pembaruan skema secara berurutan:
   - `seeds/migration_batch3_seeder.js` (Pembaruan skema revisi reservasi & amenity)
   - `seeds/superadmin.js` (Memastikan akun superadmin siap)
   - `seeds/navigation_master_setup.js` (Menyinkronkan navigasi menu seluruh role)
   - `seeds/master_data_seeder.js` (Master hotel, tipe kamar, tarif, dan demo data)
   - `seeds/seed_master_wilayah.js` (Data wilayah)
   - `seeds/multi_branch_hierarchy_migration.js` (Scope permissions per role & cabang)

---

## 3. Sumber Kebenaran Navigasi (Single Source of Truth)

- **File Utama:** `express_pms_be/seeds/navigation_master_setup.js`
- Seluruh penambahan rute menu baru (`/front_office`, `/reservasi_dashboard`, `/master_shift`, dll.) **WAJIB** ditambahkan ke berkas JS ini.
- Skrip-skrip SQL lama (`update_navigation_*.sql`) dan runner script yang sebelumnya tercecer telah diarsipkan ke folder `database/legacy/` untuk menghindari inkonsistensi data antar-lingkungan pengembangan.

---

## 4. Script NPM Database yang Terverifikasi

Dijalankan dari dalam direktori `express_pms_be`:

| Perintah | Deskripsi |
|---|---|
| `npm run seed:all` | Menjalankan seluruh seeder dan setup master data secara berurutan. |
| `npm run seed:nav` | Menyinkronkan kembali menu navigasi di tabel `mst_navigation` untuk seluruh role. |
| `npm run seed:master` | Menjalankan master data seeder (hotel, kamar, fasilitas, paket harga). |
| `npm run seed:migration` | Menjalankan batch 3 migration seeder. |
| `npm run seed` | Menjalankan seeder Knex default (`knex seed:run`). |
