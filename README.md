# Sistem Manajemen Hotel (Grand Marstech Hotel & Resort Enterprise PMS)

Sistem Informasi Manajemen Hotel (*Property Management System* / PMS) berbasis arsitektur multi-cabang (*multi-branch hierarchy*) yang dibangun di atas standar template **PT Marstech Global**.

Sistem ini mengelola seluruh siklus operasional perhotelan mulai dari reservasi, *front office* (check-in/check-out), penugasan kamar & *housekeeping*, audit malam (*night audit* & *room charge posting*), manajemen shift kasir, kas masuk/keluar, pelaporan keuangan, hingga tata kelola hak akses berbasis hirarki cabang (Headquarters, Regional, dan Unit Hotel).

---

## 1. Arsitektur Teknologi

Aplikasi ini menggunakan pola **Fullstack Decoupled Monorepo** dengan *Backend-for-Frontend* (BFF):

| Lapisan | Komponen | Deskripsi & Versi |
|:---|:---|:---|
| **Backend** | `express_pms_be/` | Node.js (ESM), Express.js v4.21, Knex.js v3.1 (Query Builder), JWT (`jose`), Joi v17, Multer. |
| **Frontend** | `next_pms_fe/` | Next.js 15 (App Router), TypeScript, PrimeReact v10.9, PrimeFlex v3.3, NextAuth v5, Formik. |
| **Database** | MySQL / MariaDB | Collation: `utf8mb4_unicode_ci`, Multi-tenant connection manager, Audit trail log perubahan. |
| **BFF Proxy** | Next.js API Routes | `/api/interceptor*` meneruskan panggilan aman dari client ke backend dengan injeksi bearer token. |

---

## 2. Struktur Direktori Utama

```
manajemen_pms_hotel/
├── express_pms_be/                     # Layanan Backend Express.js (Port 8000)
│   ├── app.js                          # Konfigurasi middleware, CORS, dan router v1
│   ├── server.js                       # Entry point aplikasi backend
│   ├── core/config/                    # Knex DatabaseManager (Multi-tenant & connection pool)
│   ├── middleware/                     # Token validation, context middleware, secure headers
│   ├── routes/v1/                      # Endpoint modular v1 (Auth, Setup, Front Office, Housekeeping, dll.)
│   ├── scripts/                        # Runner script otomasi (run_all_seeds.js, sync_admin_all_branches.js)
│   ├── seeds/                          # Seeder master data, navigasi menu, dan akun superadmin
│   └── README.md                       # Panduan arsitektur backend & variabel environment
├── next_pms_fe/                        # Aplikasi Web Frontend Next.js (Port 3000)
│   ├── app/(main)/                     # Halaman utama terproteksi (Dashboard, Front Office, Setup, dll.)
│   ├── app/api/interceptor*/           # BFF Proxy handler untuk komunikasi aman ke backend
│   ├── layout/                         # Komponen tata letak (Sidebar dinamis, Topbar, Menu navigation)
│   ├── lib/axios/                      # Client helper HTTP (postData, formData, fileDownload)
│   ├── lib/tools/                      # Utility frontend (authTools, dateTools, encryptTools)
│   └── README_FE.md                    # Panduan konvensi frontend & variabel environment
├── database/                           # Sentralisasi Berkas Basis Data & Skrip SQL
│   ├── schema/                         # DDL dasar: essential.sql & 01_schema_migration.sql
│   ├── migrations/                     # Skrip DDL inkremental modul fitur hotel
│   ├── seeds/                          # Master seeder SQL
│   ├── legacy/                         # Arsip skrip historis dan runner lama
│   └── README.md                       # Panduan urutan instalasi & setup pipeline basis data
├── docs/                               # Dokumentasi Teknis & Spesifikasi Sistem
│   ├── MULTI_BRANCH_HIERARCHY_ARCHITECTURE.md # Arsitektur hirarki organisasi & scope otoritas cabang
│   ├── STANDARD_DEVIATIONS.md          # Analisis formal gap spesifikasi template vs implementasi
│   ├── PASSWORD_HARDENING_OPTIONS.md   # Kajian teknis opsi penguatan hashing kata sandi
│   ├── plans/                          # Rencana implementasi teknis per modul fitur
│   ├── prd/                            # Dokumen kebutuhan produk (Product Requirement Document)
│   └── mockups/                        # Mockup alur antarmuka pengguna
└── API STANDART.postman_collection.json # Koleksi pengujian API standar Postman
```

---

## 3. Prasyarat Sistem

- **Node.js**: Versi `>= 20.x` (LTS)
- **NPM**: Versi `>= 10.x`
- **Database**: MySQL Server versi `>= 8.0` atau MariaDB `>= 10.6`
- **Charset / Collation**: `utf8mb4` / `utf8mb4_unicode_ci`

---

## 4. Panduan Menjalankan Aplikasi (Local Development)

### Langkah 1: Persiapan Basis Data (Fresh Install)

1. Buat database kosong di MySQL:
   ```sql
   CREATE DATABASE hotel_pms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Import skema dasar dan hirarki:
   - Import `database/schema/essential.sql`
   - Import `database/schema/01_schema_migration.sql`
3. Detail selengkapnya mengenai urutan eksekusi dapat dibaca di [database/README.md](database/README.md).

### Langkah 2: Menjalankan Backend (`express_pms_be`)

1. Buka terminal dan masuk ke folder backend:
   ```bash
   cd express_pms_be
   ```
2. Salin environment file:
   ```bash
   cp .env.example .env
   ```
3. Sesuaikan parameter koneksi database (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) dan kunci keamanan di file `.env`.
4. Pasang dependensi:
   ```bash
   npm install
   ```
5. Jalankan rangkaian seeder otomatis (menyiapkan navigasi, akun superadmin, data wilayah, dan kamar):
   ```bash
   npm run seed:all
   ```
6. Jalankan dev server backend:
   ```bash
   npm run dev
   ```
   *Backend akan aktif di `http://127.0.0.1:8000` (atau port yang ditentukan di `APP_PORT`).*

### Langkah 3: Menjalankan Frontend (`next_pms_fe`)

1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd next_pms_fe
   ```
2. Salin environment file:
   ```bash
   cp .env.example .env
   ```
3. Pastikan kunci keamanan (`USER_KEY`, `USER_SECRET`, `USER_PAS_KEY`) di `.env` frontend sama dengan backend.
4. Pasang dependensi:
   ```bash
   npm install
   ```
5. Jalankan dev server frontend:
   ```bash
   npm run dev
   ```
   *Frontend akan aktif di `http://localhost:3000`.*

---

## 5. Kredensial Default (Development)

Setelah menjalankan `npm run seed:all`, akun default yang tersedia:

| Peran | Username / Email | Password Default | Cakupan Akses |
|:---|:---|:---|:---|
| **Superadmin (HQ)** | `superadmin@admin.com` | `Superadmin321!` | Seluruh Modul & Semua Cabang |
| **Admin Hotel** | `admin.hotel` | `Admin123!` | Cabang Hotel Unit Utama |
| **Front Office** | `fo.hotel` | `Fo12345!` | Operasional Front Office & Tamu |
| **Housekeeping** | `hk.hotel` | `Hk12345!` | Status Kamar & Stayover Service |

---

## 6. Pengujian & Validasi Kualitas (Testing & Linting)

### Backend Testing
Backend dilengkapi unit test Jest untuk memvalidasi algoritma hashing HMAC-SHA512, sanitasi input, middleware keamanan, dan manajemen koneksi database:
```bash
cd express_pms_be
npm test -- --testPathIgnorePatterns="app.test.js"
```

### Backend Linting
```bash
cd express_pms_be
npm run lint
```

---

## 7. Konvensi Pengembangan Wajib (Corporate Guidelines)

1. **Routing Backend**:
   - Wajib versioned (`/api/v1/...`).
   - Prinsip **Satu File = Satu Endpoint**.
   - Penamaan file endpoint menggunakan `snake_case` (misal: `kamar_list.js`, `kamar_create.js`).
2. **Format Respons API**:
   Seluruh endpoint wajib mengembalikan struktur JSON konsisten:
   ```json
   {
     "status": "00",
     "message": "Pesan status operasional",
     "datetime": "YYYY-MM-DD HH:mm:ss",
     "data": {}
   }
   ```
3. **Routing Frontend**:
   - Halaman utama diletakkan pada `app/(main)/`.
   - Menggunakan format direktori `snake_case` (contoh: `app/(main)/master_kamar/page.tsx`).
   - Tipe data global dideklarasikan di `types/`.
4. **Navigasi Dinamis**:
   Navigasi sidebar dimuat dari database (`mst_navigation` & `user_navigation`). Pengaturan menu dikelola secara terpusat melalui `seeds/navigation_master_setup.js`.

---

## 8. Status Pengembangan & Catatan Arsitektur (TODO / Notes)

- [ ] **Penyeragaman Collation Database**: Proposal DDL untuk menstandardisasi collation seluruh tabel lama ke `utf8mb4_unicode_ci` telah disiapkan di `database/schema/proposal_align_collation_utf8mb4_unicode_ci.sql` (menunggu jadwal maintenance migrasi data produksi).
- [ ] **Migrasi Knex Penuh**: Skrip migrasi terstruktur Knex telah disiapkan sebagai draft proposal di `database/migrations/knex_migration_baseline_proposal.js`.
- [ ] **CI/CD & Deployment Pipeline**: Standarisasi deployment staging/produksi (misal Railway atau Docker containerization) saat ini dikelola secara manual dan dalam proses penyusunan SOP otomatisasi.
