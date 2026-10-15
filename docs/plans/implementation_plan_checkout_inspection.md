# Implementation Plan: Fleksibilitas Cek Kamar Checkout & Catatan Interaktif Housekeeping (Room Inspection, Direct Checkout, & Interactive Notes Checklist)

## 1. Ringkasan Eksekutif & Konteks Kebutuhan
Dalam operasional perhotelan profesional bertaraf bintang (SOP Front Office & Housekeeping):
1. **Room Check saat Checkout (Dual-Path Checkout)**:
   - Praktik standar untuk memeriksa **konsumsi minibar**, **kehilangan/kerusakan linen atau fasilitas kamar**, serta **barang tamu yang tertinggal (Lost & Found)** sebelum deposit dikembalikan dan tamu meninggalkan lobi hotel.
   - Namun, **fleksibilitas operasional adalah kunci**: kasir Front Office harus memiliki **pilihan eksplisit** untuk:
     - **Opsi A: Checkout Langsung (Tanpa Inspeksi / Direct / Express Checkout)**: Tamu VIP / kamar standar tanpa minibar / tamu terburu-buru mengejar pesawat. Kasir langsung memproses pelunasan, kamar beralih ke `vacant dirty`, dan tugas pembersihan rutin pasca-checkout otomatis dibuat.
     - **Opsi B: Checkout dengan Cek Kamar (Room Check by Housekeeping)**: Kasir memanggil Housekeeping (task prioritas URGENT). Housekeeping memeriksa kamar dan melaporkan: Kamar Clear, Ada Tambahan Biaya (Minibar / Kerusakan), dan/atau Barang Tertinggal (Lost & Found). Tagihan minibar/denda otomatis terposting ke Folio tamu dan memperbarui saldo tagihan secara instan.
2. **Tombol Detail & Catatan Interaktif FO (Interactive Checklist) di Room Status Board**:
   - Di Room Status Board Housekeeping (`/housekeeping/room_status_board`), ditambahkan **Tombol "Detail"** (pop-up dialog).
   - Catatan khusus yang diberikan oleh Front Office atau tamu (contoh: *"Ganti sprei"*, *"Tambah handuk mandi"*, *"Bersihkan kamar mandi"*, *"Isi ulang air mineral"*, dll.) ditampilkan dalam bentuk **Checklist Interaktif**.
   - Petugas Housekeeping dapat **mencentang (ceklis)** setiap instruksi saat dikerjakan di lapangan. Hal ini menjamin dan membuktikan bahwa Housekeeping **benar-benar melihat, membaca, dan menyelesaikan setiap catatan khusus dari FO** sebelum tugas diselesaikan.

---

## 2. Diagram Alur Kerja Sistem Terintegrasi

```
========================================================================================
ALUR 1: CHECKOUT FLEKSIBEL (FRONT OFFICE)
========================================================================================
                   +----------------------------------+
                   |   Tamu Datang ke Kasir FO        |
                   |   (Status Kamar: Occupied)       |
                   +-----------------+----------------+
                                     |
               +---------------------+---------------------+
               |                                           |
    [PILIHAN 1: CHECKOUT LANGSUNG]               [PILIHAN 2: DENGAN INSPEKSI]
    (Express / Tanpa Cek Kamar)                  (Standar Hotel / Room Check)
               |                                           |
               v                                           v
    +-----------------------+                    +-----------------------+
    | Kasir FO Cek Saldo    |                    | Kasir Klik "Minta     |
    | & Proses Pelunasan    |                    | Cek Kamar" (Urgent)   |
    +-----------+-----------+                    +-----------+-----------+
                |                                            |
                |                                            v
                |                                +-----------------------+
                |                                | Task HK: 'inspection' |
                |                                | Kamar: 'inspection'   |
                |                                +-----------+-----------+
                |                                            |
                |                                            v
                |                                +-----------------------+
                |                                | HK Input Cek Kamar:   |
                |                                | 1. Minibar            |
                |                                | 2. Kerusakan/Denda    |
                |                                | 3. Lost & Found       |
                |                                +-----------+-----------+
                |                                            |
                |                          +-----------------+-----------------+
                |                          |                                   |
                |                    [Kamar Clear]                     [Ada Temuan]
                |                          |                                   |
                |                          v                                   v
                |                  +---------------+                   +---------------+
                |                  | Status: CLEAR |                   | Auto-Post     |
                |                  +-------+-------+                   | Folio Charge  |
                |                          |                           | & Alert L&F   |
                |                          |                           +-------+-------+
                |                          |                                   |
                |                          +-----------------+-----------------+
                |                                            |
                |                                            v
                |                                +-----------------------+
                |                                | Rekonsiliasi Tagihan  |
                |                                | & Pelunasan Kasir FO  |
                |                                +-----------+-----------+
                |                                            |
                +---------------------+----------------------+
                                      |
                                      v
                        +----------------------------+
                        | Finalisasi Checkout:       |
                        | - Kamar -> Vacant Dirty    |
                        | - Auto-Task: Cleaning      |
                        | - Invoice Final Terbit     |
                        | - Folio Ditutup (Closed)   |
                        +----------------------------+

========================================================================================
ALUR 2: POP-UP DETAIL & CATATAN INTERAKTIF FO (HOUSEKEEPING ROOM BOARD)
========================================================================================
    [Room Status Board] ---> Klik Tombol "Detail" (Ikon Checklist)
                                     |
                                     v
                  +--------------------------------------+
                  | Dialog Detail Tugas & Kamar:         |
                  | - Info Kamar, Tipe, Status, PIC      |
                  | - Catatan Umum FO / Tamu             |
                  | - Checklist Interaktif:              |
                  |   [x] Ganti sprei & sarung bantal    |  <-- HK mencentang langsung
                  |   [x] Tambah handuk mandi            |  <-- Menampilkan waktu & nama HK
                  |   [ ] Bersihkan kamar mandi          |  <-- Progress bar terupdate
                  +------------------+-------------------+
                                     |
                                     v
                  [Auto-Save Checklist ke DB & Real-time Sync]
```

---

## 3. Desain Skema Database & Migrasi

Migrasi SQL terstruktur (`migration_checkout_inspection.sql`):

### A. Tabel `trx_checkout`
Menambahkan kolom riwayat inspeksi untuk audit akuntabilitas FO:
```sql
ALTER TABLE trx_checkout
ADD COLUMN inspection_status ENUM('skipped', 'inspected_clear', 'inspected_with_charges') 
    NOT NULL DEFAULT 'skipped' 
    AFTER late_checkout,
ADD COLUMN kode_inspection_task VARCHAR(50) NULL 
    AFTER inspection_status;
```

### B. Tabel `trx_housekeeping_task`
Menambahkan kolom checklist interaktif dan hasil inspeksi:
```sql
ALTER TABLE trx_housekeeping_task
ADD COLUMN checklist JSON NULL 
    AFTER notes,
ADD COLUMN inspection_result ENUM('pending', 'clear', 'with_charges') 
    NOT NULL DEFAULT 'pending' 
    AFTER status,
ADD COLUMN inspection_details JSON NULL 
    AFTER inspection_result;
```

**Struktur Data JSON `checklist`**:
```json
[
  {
    "id": 1,
    "task": "Ganti sprei & sarung bantal",
    "checked": true,
    "checked_at": "2026-10-06 11:15:00",
    "checked_by": "Budi Santoso"
  },
  {
    "id": 2,
    "task": "Tambah handuk mandi",
    "checked": false,
    "checked_at": null,
    "checked_by": null
  }
]
```

### C. Pemanfaatan Tabel Finansial & Inventaris Eksisting
1. `trx_folio_charge`:
   - `charge_type`: `'minibar'` untuk konsumsi kulkas minibar.
   - `charge_type`: `'penalty'` untuk denda kerusakan fasilitas/linen.
   - `ref_source_type`: `'checkout_inspection'`.
   - `kode_ref_source`: kode task `trx_housekeeping_task`.
2. `trx_minibar_consumption`:
   - Mencatat item, qty, unit_price, amount, `recorded_at_checkout = 1`, dan link `kode_folio_charge`.
3. `trx_lost_and_found`:
   - Mencatat barang tertinggal tamu dengan `kode_kamar`, `item_description`, `status = 'stored'`.

---

## 4. Desain Backend API (Express.js)

Sesuai aturan arsitektur PT Marstech Global: Versioned (`/api/v1/...`), 1 endpoint = 1 file.

### 1. `POST /api/v1/reservasi/checkout/request-inspection`
- **File**: `express_pms_be/routes/v1/reservasi/checkout/inspection_request.js`
- **Tujuan**: Front Office meminta cek kamar ke Housekeeping sebelum checkout.
- **Payload**:
  ```json
  {
    "kode_kamar": "KMR-101",
    "kode_reservasi_room": "RR-2026-0001",
    "kode_cabang": "CAB-001",
    "priority": "urgent",
    "assigned_to": 12,
    "notes": "Tamu sudah di lobi, mohon cek brankas & minibar",
    "checklist": [
      { "id": 1, "task": "Cek kulkas minibar", "checked": false },
      { "id": 2, "task": "Cek linen & handuk", "checked": false },
      { "id": 3, "task": "Cek brankas & lemari pakaian", "checked": false }
    ]
  }
  ```
- **Logika**:
  1. Validasi kamar sedang berstatus `occupied`.
  2. Idempotency guard: Cegah pembuatan task dobel jika sudah ada task inspeksi aktif.
  3. Ubah status kamar `mst_kamar.housekeeping_status = 'inspection'`.
  4. Insert ke `trx_housekeeping_task` (`task_type = 'inspection'`, `priority = 'urgent'`, `request_source = 'checkout'`).

### 2. `POST /api/v1/housekeeping/tasks/:id/checklist`
- **File**: `express_pms_be/routes/v1/housekeeping/task_checklist.js`
- **Tujuan**: Housekeeping mencentang / memperbarui status checklist catatan FO.
- **Payload**:
  ```json
  {
    "checklist": [
      { "id": 1, "task": "Ganti sprei & sarung bantal", "checked": true, "checked_at": "2026-10-06 11:20:00", "checked_by": "Budi" },
      { "id": 2, "task": "Tambah handuk mandi", "checked": true, "checked_at": "2026-10-06 11:22:00", "checked_by": "Budi" }
    ]
  }
  ```
- **Logika**:
  - Update kolom `checklist` pada `trx_housekeeping_task`.
  - Catat riwayat perubahan ke `ChangesLog`.

### 3. `POST /api/v1/housekeeping/tasks/:id/submit-inspection`
- **File**: `express_pms_be/routes/v1/housekeeping/task_submit_inspection.js`
- **Tujuan**: Housekeeping menginput temuan inspeksi checkout kamar (Clear, Minibar, Kerusakan, Lost & Found).
- **Payload**:
  ```json
  {
    "result": "clear" | "with_charges",
    "notes": "Minibar terpakai 2 kaleng",
    "minibar_items": [
      { "item_name": "Coca-Cola Can", "qty": 2, "unit_price": 25000 }
    ],
    "damaged_items": [
      { "item_name": "Handuk Noda Permanen", "qty": 1, "charge_amount": 75000, "notes": "Kena cat rambut" }
    ],
    "lost_and_found": {
      "item_description": "Charger iPhone 20W putih di nakas",
      "location": "Nakas samping tempat tidur"
    }
  }
  ```
- **Logika**:
  - Update task: `status = 'finished'`, `inspection_result`, dan `inspection_details`.
  - Auto-post charges ke `trx_folio_charge` & `trx_minibar_consumption`.
  - Simpan barang tertinggal ke `trx_lost_and_found`.
  - Recalculate billing via `calculateFolioBilling` agar subtotal, pajak, dan saldo akurat.

### 4. `POST /api/v1/reservasi/checkout/cancel-inspection`
- **File**: `express_pms_be/routes/v1/reservasi/checkout/inspection_cancel.js`
- **Tujuan**: Membatalkan/melewati inspeksi jika tamu terburu-buru (Express Override).

### 5. Update Endpoint Checkout Search & Submit
- `checkout_search.js`: Mengekspos informasi `active_inspection_task` (status, pic, findings, lost_and_found, charges).
- `checkout_submit.js`: Mendukung `inspection_mode: 'skipped' | 'with_inspection'` dan mencatat `inspection_status` serta `kode_inspection_task` ke `trx_checkout`.

### 6. Update Endpoint Housekeeping Board & Task Create
- `room_status_board.js` & `tasks_get.js`: Sertakan kolom `checklist` dan `inspection_result`.
- `task_create.js`: Menerima parameter `checklist` saat FO/tamu membuat tugas baru.

---

## 5. Desain Frontend UI/UX (Next.js + PrimeReact)

### A. Pop-Up Detail Tugas & Catatan Interaktif FO (`room_status_board`)
1. **Tombol "Detail" di Tabel**:
   - Di kolom Aksi pada `room_status_board/components/display/table.tsx`, ditambahkan tombol:
     `<Button label="Detail" icon="pi pi-list-check" size="small" outlined severity="info" onClick={() => openDetailDialog(rowData)} />`
   - Klik pada catatan singkat di tabel juga dapat langsung membuka pop-up ini.
2. **Komponen Pop-Up: `DialogDetailTask`**:
   - **Header**: Nomor Kamar, Tipe Kamar, Status Occupancy, Prioritas (Badge Merah URGENT jika checkout/urgent request).
   - **Informasi Tugas**: PIC Petugas, Waktu Mulai, Sumber Permintaan (`Front Office`, `Tamu`, `Checkout`).
   - **Checklist Interaktif Catatan FO**:
     - Progress Bar Visual: *"2 dari 3 instruksi selesai (66%)"*.
     - Daftar Item dengan Checkbox PrimeReact:
       - Klik checkbox langsung men-toggle centang.
       - Teks item yang selesai dicoret halus (*strikethrough*) dengan indikator hijau *"Dicentang oleh [Nama Staff] pada [Waktu]"*.
       - Terhubung langsung dengan API update checklist (auto-save real-time).
   - **Tindakan Cepat (Quick Actions)**:
     - Tombol *"Mulai Tugas"* / *"Selesaikan Tugas"*.
     - Jika tugas berupa *Checkout Inspection*, tombol *"Input Hasil Cek Kamar"* langsung tersedia di dalam dialog ini.

### B. Halaman Checkout (`next_pms_fe/app/(main)/checkout/page.tsx`)
1. **Opsi Pilihan Alur Checkout yang Jelas**:
   - Di dialog checkout, resepsionis memiliki 2 pilihan tombol utama:
     - 🟢 **"Checkout Langsung (Tanpa Cek Kamar)"**: Untuk tamu express/VIP/tanpa minibar.
     - 🔵 **"Minta Cek Kamar (Room Check)"**: Mengirim instruksi inspeksi urgent ke Housekeeping.
2. **Indikator Real-time Status Inspeksi**:
   - Menampilkan status live:
     - `Sedang Diperiksa HK (Petugas: Budi)` + Tombol Refresh + Tombol Batal/Bypass.
     - `Kamar Clear (Aman)`
     - `Ada Tambahan Biaya (+Rp 125.000)`
3. **Banner Peringatan Barang Tertinggal (Lost & Found)**:
   - Jika Housekeeping menemukan barang tertinggal tamu, muncul alert oranye tebal:
     > ⚠️ **PERHATIAN (LOST & FOUND):** Housekeeping menemukan barang tamu di kamar: **"Charger iPhone putih di nakas"**. Harap serahkan ke tamu sebelum keluar lobi!
4. **Auto-Recalculate Tagihan**:
   - Begitu Housekeeping submit minibar atau denda kerusakan, tabel tagihan dan nilai saldo sisa otomatis ter-update di layar kasir secara akurat.

### C. Pembuatan Tugas Stayover di Tamu Menginap (`dialog_request_housekeeping.tsx`)
- Saat FO membuat permintaan pembersihan, FO dapat memilih checklist template:
  - `[x] Ganti sprei & sarung bantal`
  - `[x] Ganti handuk & bath mat`
  - `[x] Bersihkan kamar mandi`
  - `[x] Isi ulang air mineral & amenities`
  - `[x] Sapu & pel lantai`
  - Kolom teks bebas untuk catatan tambahan.
- Seluruh checklist ini diteruskan ke `trx_housekeeping_task.checklist` dan langsung muncul sebagai checkbox interaktif di pop-up Detail Housekeeping!

---

## 6. Skenario & Guardrails Operasional

1. **Memastikan Housekeeping Benar-Benar Membaca & Mengerjakan Catatan**:
   - Dengan sistem checklist interaktif, supervisor atau kasir FO dapat memantau item apa saja yang sudah diceklis oleh petugas HK.
   - Saat petugas HK menekan tombol *"Complete"*, sistem dapat menampilkan konfirmasi jika masih ada catatan FO yang belum diceklis:
     *"Perhatian: Ada 1 catatan FO yang belum diceklis (Ganti sprei). Apakah Anda yakin sudah menyelesaikannya?"*
2. **Tamu Terburu-buru (Express Override)**:
   - Kasir dapat membatalkan atau melewati inspeksi kapan saja tanpa terkunci.
3. **Integritas Folio & Kasir**:
   - Seluruh tagihan minibar dan denda langsung tercatat dalam shift kasir aktif yang sedang melayani tamu.

---

## 7. Rencana Tahapan Eksekusi

| Tahap | Tindakan | Target Output |
|---|---|---|
| **Langkah 1** | Migrasi Database | File SQL `migration_checkout_inspection.sql` dijalankan di MySQL (`checklist`, `inspection_result`, `inspection_details`, `inspection_status`). |
| **Langkah 2** | Backend Endpoints | Buat `inspection_request.js`, `task_checklist.js`, `task_submit_inspection.js`, `inspection_cancel.js`. Update `task_create.js`, `checkout_search.js`, `checkout_submit.js`, `room_status_board.js`. |
| **Langkah 3** | Frontend Pop-Up Detail & Checklist | Buat `dialog_detail_task.tsx` dengan checklist interaktif, pasang tombol "Detail" di `table.tsx` Room Status Board. Update `dialog_request_housekeeping.tsx` dengan pilihan template checklist. |
| **Langkah 4** | Frontend Checkout Dual-Path | Update `checkout/page.tsx` dengan opsi alur (Langsung vs Cek Kamar), live status tracker, Lost & Found banner, dan auto-recalculate billing. |
| **Langkah 5** | Validasi & Pengujian | Automated integration test (Supertest) & verifikasi TypeScript (`npx tsc --noEmit`). |

---

## 8. Verifikasi & Kriteria Keberhasilan
- [ ] Tombol **"Detail"** tersedia di Room Status Board dan membuka pop-up detail kamar/tugas.
- [ ] Catatan FO (misal: "Ganti sprei") muncul sebagai **checklist interaktif** yang bisa diceklis oleh Housekeeping.
- [ ] Ceklis checklist tersimpan secara persisten ke database (`trx_housekeeping_task.checklist`).
- [ ] Kasir dapat memilih antara **Checkout Langsung** dan **Checkout dengan Cek Kamar**.
- [ ] Housekeeping dapat menginput temuan inspeksi (Clear, Minibar, Kerusakan, Lost & Found).
- [ ] Tagihan minibar dan kerusakan otomatis terposting ke Folio dan memperbarui sisa saldo tamu.
- [ ] Barang tertinggal memunculkan alert Lost & Found di kasir FO.
- [ ] 0 error pada kompilasi TypeScript (`next_pms_fe`).
