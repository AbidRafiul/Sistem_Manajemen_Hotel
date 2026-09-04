# Prompt: Agent Fullstack Developer — Menu Reservasi > Reservasi Baru

## Role

Kamu adalah fullstack developer yang bekerja di proyek PMS Hotel yang **sudah berjalan** (bukan proyek baru). Tugasmu adalah menambahkan satu menu utama baru: **Reservasi**, dengan satu sub-menu: **Reservasi Baru** (fitur check-in walk-in — tamu datang langsung tanpa reservasi sebelumnya via OTA).

Prinsip utama: **kamu menyesuaikan diri ke proyek yang ada, proyek tidak menyesuaikan diri ke gaya kodingmu.** Setiap keputusan struktur, penamaan, dan pola kode harus mengikuti apa yang sudah ada, bukan preferensimu.

## Tech stack

- Frontend: Next.js + PrimeReact
- Backend: Express.js
- Database: MySQL

## Tahap 0 — WAJIB sebelum menulis satu baris kode pun

Jangan mulai implementasi sebelum menyelesaikan seluruh checklist ini. Setelah selesai, **laporkan dulu temuanmu** (ringkasan di bawah) sebelum lanjut ke tahap coding.

1. **Baca README backend secara penuh** — pahami struktur folder, pola arsitektur (controller/service/repository atau pola lain), konvensi penamaan file, format response API, error handling, dan cara routing didaftarkan.
2. **Baca README frontend secara penuh** — pahami struktur folder Next.js yang dipakai (app router/pages router), konvensi penamaan komponen, state management yang dipakai, dan cara halaman baru biasanya didaftarkan.
3. **Temukan implementasi auth/RBAC yang sudah ada** — cari middleware/guard yang mengecek role di backend, dan mekanisme proteksi route/komponen di frontend. Jangan bikin mekanisme RBAC baru; gunakan yang sudah ada apa adanya.
4. **Baca struktur tabel `mst_navigation`** dan **contoh isi seed-nya** (kolom `menu` berformat JSON per `role`). Pahami persis skema JSON yang dipakai (nested/flat, field apa saja: label, path/route, icon, urutan, dsb) sebelum menambahkan entri baru. Menu **tidak boleh** ditulis hardcode di kode frontend (misalnya array menu di komponen sidebar) — harus datang dari data ini.
5. **Cari modul/fitur lain yang sudah ada** (idealnya yang polanya mirip — misalnya modul master lain) sebagai referensi pola: nama file, penempatan route, penamaan endpoint, cara validasi input, cara transaksi database ditulis.
6. **Pelajari komponen layout/section yang sudah ada di frontend** (page wrapper, card, spacing/grid yang dipakai di halaman lain). Catat token spacing (margin/padding) dan struktur section yang berlaku, supaya halaman baru konsisten persis — bukan reka-reka baru.

Setelah 6 poin ini selesai dibaca, **tuliskan ringkasan** (bukan asumsi, harus berdasarkan yang benar-benar dibaca):
- Pola struktur backend yang ditemukan
- Pola struktur frontend yang ditemukan
- Mekanisme RBAC yang ditemukan (nama middleware/hook, cara pakainya)
- Skema JSON `mst_navigation` yang ditemukan
- Komponen layout/spacing yang akan dipakai ulang

## Tahap 1 — Referensi skema database (verifikasi ulang ke migration/schema aktual di repo, jangan asumsi dari sini)

Tabel yang relevan untuk fitur ini (nama bisa sedikit beda, cek ulang ke schema asli di repo):

- `mst_guest` — pencarian tamu (index pada `id_number`, `phone`) & pembuatan tamu baru
- `mst_kamar`, `mst_tipe_kamar` — ketersediaan kamar (`occupancy_status`, `housekeeping_status`)
- `mst_paket_harga`, `mst_rate_plan_price` — rate plan & harga per tipe kamar
- `trx_reservation` — header reservasi (`booking_type='walk_in'`, `source_channel='walk_in'`, `status` bisa langsung `checked_in`)
- `trx_reservation_room` — kamar spesifik yang di-assign, rate per malam
- `trx_checkin` — event check-in (scan identitas, plat kendaraan, `early_checkin`)
- `trx_guest_document` — dokumen identitas yang diunggah
- `trx_folio`, `trx_folio_charge` — tagihan yang otomatis terbuka
- `trx_payment`, `trx_cashier_shift` — deposit/pembayaran, terikat ke shift kasir aktif
- `trx_room_status_log`, `trx_reservation_status_log` — audit trail
- `sys_format_penomoran` — generator nomor urut per tabel (prefix + counter, harus row-locked saat dipakai concurrent)
- `mst_navigation` — penyimpanan menu (JSON per role)

## Tahap 2 — Alur bisnis yang harus diikuti persis

Urutan interaksi resepsionis (**urutan tampilan form**, bukan urutan tulis ke database):

1. Tamu datang, belum ada reservasi apa pun.
2. Resepsionis minta identitas dulu → sistem search tamu by nomor identitas/HP; kalau tidak ketemu, isi form tambah cepat (nama, jenis & nomor identitas, HP).
3. Baru setelah itu tanya tipe kamar yang diinginkan → sistem cek ketersediaan kamar real-time (vacant + clean).
4. Konfirmasi kamar & rate ke tamu.
5. **Satu kali submit** → backend memproses semuanya dalam **satu transaksi database atomic**: buat/pakai guest, buat `trx_reservation` dengan status langsung `checked_in`, buat `trx_reservation_room`, buat `trx_checkin`, simpan dokumen identitas, update status kamar jadi `occupied` + catat ke `trx_room_status_log`, buka `trx_folio` + `trx_folio_charge` untuk charge kamar, dan `trx_payment` kalau ada deposit. Kalau satu langkah gagal, semua rollback — tidak boleh ada data setengah jadi.
6. Tidak ada tahap status `reserved`/`confirmed` untuk walk-in — langsung `checked_in` di satu transaksi yang sama.

## Tahap 3 — Scope pengerjaan (batasi hanya ini)

1. **Navigasi menu**: tambahkan entri "Reservasi" (menu utama) → "Reservasi Baru" (sub-menu) ke `mst_navigation`, sesuai role yang berhak (front office/resepsionis, dan role lain yang relevan sesuai RBAC proyek). Implementasikan lewat seed/migration mengikuti pola yang sudah ada untuk tabel ini — **jangan hardcode di komponen sidebar frontend**.
2. **Backend endpoint** (ikuti pola arsitektur yang ditemukan di Tahap 0, termasuk format response dan error handling yang konsisten dengan endpoint lain):
   - Cari tamu (by nomor identitas/HP)
   - Cek ketersediaan kamar (by tipe kamar & tanggal)
   - Submit reservasi walk-in (transaksi atomic seperti Tahap 2 poin 5)
   - Semua endpoint baru wajib dilindungi middleware RBAC yang sudah ada, bukan buat pengecekan role manual baru
3. **Frontend halaman**: satu halaman "Reservasi Baru" dengan komponen PrimeReact, mengikuti struktur route Next.js yang berlaku di proyek. Form: cari/tambah tamu → pilih tipe & kamar → konfirmasi rate → input deposit (opsional) → submit.

## Batasan keras — JANGAN

- Jangan hardcode menu navigasi di kode frontend dalam bentuk apa pun (array statis, konstanta, dsb) — semua harus berasal dari `mst_navigation`.
- Jangan memperkenalkan pola struktur kode (folder, penamaan, arsitektur) yang berbeda dari yang sudah ditetapkan di README atau modul lain yang sudah ada.
- Jangan mulai menulis kode sebelum menyelesaikan seluruh checklist Tahap 0 dan melaporkan ringkasannya.
- Jangan mengubah margin, padding, atau struktur section pada komponen/layout yang sudah ada — termasuk saat membuat halaman baru, pakai ulang komponen layout yang sudah ada, jangan buat token spacing baru.
- Jangan menyentuh atau memodifikasi fitur/modul lain yang tidak berkaitan langsung dengan Reservasi Baru.
- Jangan buat mekanisme auth/RBAC baru — pakai yang sudah ada apa adanya.

## Definition of done

- [ ] Ringkasan Tahap 0 sudah dilaporkan sebelum coding dimulai
- [ ] Menu "Reservasi > Reservasi Baru" muncul di navigasi sesuai role, tersimpan sebagai data di `mst_navigation`, bukan hardcode
- [ ] Search tamu & tambah tamu baru berfungsi
- [ ] Ketersediaan kamar akurat real-time, kamar penuh ditolak dengan jelas
- [ ] Submit membuat seluruh record terkait dalam satu transaksi atomic; gagal di tengah jalan = rollback total
- [ ] Nomor urut (`sys_format_penomoran`) aman dari duplikasi saat dua user submit bersamaan
- [ ] Endpoint baru dilindungi RBAC yang sudah ada
- [ ] Tampilan frontend konsisten dengan spacing/section/komponen yang sudah ada, tidak ada penyesuaian visual baru di luar yang diperlukan
- [ ] Tidak ada file/struktur di luar pola yang sudah ditetapkan proyek
