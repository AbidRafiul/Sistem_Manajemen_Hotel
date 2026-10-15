PRD — Night Audit & Posting Biaya Kamar Harian
Versi 1.0 · Draft untuk review · Modul: PMS Hotel (Front Office & Billing)
1. Ringkasan
Saat ini seluruh biaya kamar (jumlah malam × tarif) dibebankan di muka saat check-in. Tabel trx_night_audit sudah ada, tetapi belum ada endpoint maupun proses yang menggunakannya. Dokumen ini mendefinisikan fitur Night Audit sesuai praktik PMS standar: menutup business date hari berjalan, memposting biaya kamar (dan pajak/service) per malam ke folio tamu in-house, melakukan verifikasi, menghasilkan laporan, lalu memajukan business date.
2. Latar Belakang & Masalah
#
Masalah saat ini
Dampak
1
Seluruh biaya kamar dibebankan saat check-in
Pendapatan diakui di muka, bukan per malam; laporan pendapatan harian tidak akurat
2
Tidak ada konsep business date
Transaksi setelah tengah malam tercatat di tanggal yang salah
3
Tidak ada proses penutupan hari
Tidak ada kontrol, rekonsiliasi, maupun jejak audit harian
4
Early check-out / perpanjangan / pindah kamar rumit
Harus refund atau tagih manual, rawan salah
5
Tabel trx_night_audit tanpa endpoint
Struktur data tidak terpakai
3. Tujuan & Non-Tujuan
Tujuan
• Posting biaya kamar, pajak, dan service charge satu kali per malam per reservasi in-house.
• Pendapatan diakui pada business date yang benar.
• Proses night audit idempotent, dapat dilacak, dan dapat dilanjutkan bila gagal di tengah jalan.
• Menyediakan laporan harian standar (Daily Revenue, Trial Balance, Occupancy, No-Show, dll.).
• Mengubah alur check-in: tidak lagi membebankan seluruh biaya kamar di muka; yang diambil adalah deposit/jaminan sesuai kebijakan.
Non-Tujuan (fase ini)
• Integrasi akuntansi/ERP otomatis (hanya disiapkan export).
• Channel manager dan revenue management.
• Multi-property dalam satu audit run.
4. Pengguna & Peran
Peran
Kebutuhan
Night Auditor
Menjalankan, memantau, dan menyelesaikan night audit
Front Office Manager
Review exception, override, membuka kembali hari
Finance/Accounting
Laporan pendapatan harian, rekonsiliasi kas dan piutang
General Manager
Ringkasan harian (okupansi, ADR, RevPAR, pendapatan)
Admin Sistem
Konfigurasi jadwal, tarif pajak, hak akses
5. Konsep Kunci
• Business Date: tanggal operasional hotel, bukan tanggal kalender. Tetap pada tanggal yang sama sampai night audit selesai (misal audit dijalankan 02:00, transaksi tetap bertanggal kemarin). Disimpan sebagai satu nilai global per properti dan hanya maju lewat night audit.
• Folio: tagihan per reservasi/tamu; berisi charge (kamar, pajak, F&B, laundry, dll.) dan payment.
• Room Charge Posting: pembuatan baris charge kamar pada folio untuk satu malam.
• Rollover: perpindahan business date dari D ke D+1.
• Audit Run: satu eksekusi night audit untuk satu business date (satu record di trx_night_audit).
6. Alur Night Audit (Best Practice)
1. Pre-audit check (blocking vs warning):
    ◦ Semua reservasi arrival hari ini sudah check-in atau ditandai No-Show.
    ◦ Semua reservasi departure hari ini sudah check-out atau diberi keputusan (stay-over / late check-out).
    ◦ Tidak ada folio check-out dengan saldo belum nol (kecuali dialihkan ke city ledger/piutang).
    ◦ Tidak ada shift kasir yang masih terbuka.
    ◦ Tidak ada audit run lain yang sedang berjalan untuk properti yang sama.
    ◦ Status kamar konsisten (tidak ada kamar occupied tanpa reservasi in-house).
2. Lock: kunci business date; transaksi baru ditolak atau diarahkan ke business date berikutnya sesuai konfigurasi.
3. Post room & tax: untuk setiap reservasi berstatus in-house, posting charge kamar malam tersebut, lalu pajak dan service charge sesuai konfigurasi.
4. No-Show processing: reservasi arrival yang tidak datang diproses sesuai kebijakan (charge penalti satu malam, atau release tanpa biaya) dan inventori dilepas.
5. Posting biaya tetap lain (opsional): extra bed, resort fee, dan sejenisnya yang berulang per malam.
6. Rekonsiliasi & validasi: total charge yang diposting = jumlah baris folio; saldo per mata uang cocok; total kamar terjual sama dengan jumlah reservasi in-house.
7. Generate laporan dan simpan sebagai snapshot (tidak dihitung ulang saat dibuka kembali).
8. Rollover: business date naik satu hari, status audit menjadi COMPLETED.
9. Post-audit: update status kamar (Vacant Dirty untuk departure, Occupied Dirty untuk stay-over), siapkan housekeeping list, kirim notifikasi ringkasan.
7. Kebutuhan Fungsional
7.1 Pre-audit & eksekusi
• FR-01 Sistem menyediakan endpoint pre-audit check yang mengembalikan daftar blocker dan warning beserta tautan ke entitas terkait.
• FR-02 Audit tidak dapat dimulai bila ada blocker; warning dapat di-acknowledge oleh pengguna berwenang dengan catatan alasan.
• FR-03 Hanya satu audit run aktif per properti (mutex/lock di level database).
• FR-04 Audit hanya dapat dijalankan untuk business date saat ini, tidak boleh melompati hari.
• FR-05 Audit dapat dijalankan manual dan terjadwal (default 02:00, dapat dikonfigurasi). Mode terjadwal tetap berhenti bila ada blocker dan memberi notifikasi.
7.2 Posting biaya kamar
• FR-06 Posting dilakukan per reservasi per malam, mengambil tarif dari rate yang berlaku pada malam itu (mendukung tarif berbeda per malam, weekend, musiman, promo).
• FR-07 Posting idempotent: kunci unik (reservation_id, room_id, business_date, charge_type). Menjalankan ulang audit tidak menggandakan charge.
• FR-08 Pajak hotel dan service charge dihitung otomatis dari konfigurasi (persentase, urutan perhitungan, inklusif/eksklusif). Nilai tidak di-hardcode.
• FR-09 Reservasi berstatus in-house dengan departure date sama dengan business date tidak diposting malam berikutnya (malam terakhir adalah malam sebelum departure).
• FR-10 Day-use dan check-in/out di hari yang sama diposting sesuai kebijakan day-use (satu charge, atau persentase tarif).
• FR-11 Reservasi dengan complimentary/house-use diposting dengan nominal 0 atau charge lalu diimbangi komp, sehingga statistik okupansi tetap benar.
• FR-12 Kegagalan posting satu reservasi tidak menggagalkan seluruh run: kegagalan dicatat sebagai exception, proses lanjut, dan ringkasan akhir menampilkan daftar gagal untuk diperbaiki dan di-retry.
• FR-13 Seluruh posting satu reservasi bersifat atomik (transaksi database): kamar + pajak + service berhasil bersama atau gagal bersama.
7.3 Perubahan alur check-in & deposit
• FR-14 Saat check-in sistem tidak lagi membebankan seluruh nights × rate. Yang dilakukan: membuat folio, mengambil deposit/authorization sesuai kebijakan (default: tarif 1 malam + biaya insidental, dapat dikonfigurasi), dan mencatat jadwal tarif per malam (rate plan snapshot).
• FR-15 Pembayaran di muka oleh tamu (prepayment/OTA/voucher) tercatat sebagai payment/deposit pada folio, bukan sebagai charge kamar. Saat night audit memposting charge, deposit dialokasikan sesuai aturan.
• FR-16 Untuk reservasi dengan prepaid penuh (misal OTA), sistem tetap memposting per malam; payment dialokasikan otomatis sehingga saldo akhir tetap nol.
7.4 Perubahan selama menginap
• FR-17 Extend stay: malam tambahan diposting oleh audit berikutnya; tarif dapat ditetapkan ulang dan harus tervalidasi ketersediaan.
• FR-18 Early check-out: tidak ada refund otomatis; malam yang belum diposting tidak dibebankan. Kebijakan penalti early departure bersifat opsional dan dikonfigurasi.
• FR-19 Room move: charge malam berikutnya mengikuti kamar dan tarif baru; charge yang sudah diposting tidak diubah. Perubahan tarif tercatat di riwayat.
• FR-20 Koreksi/adjustment: charge yang sudah diposting tidak boleh di-edit atau dihapus; koreksi dilakukan lewat transaksi adjustment/reversal baru dengan alasan, user, dan waktu. Wajib persetujuan untuk nominal di atas ambang tertentu.
• FR-21 Transaksi setelah check-out di business date yang sudah ditutup diarahkan ke business date aktif dengan referensi ke tanggal asal.
7.5 Penutupan dan pembukaan kembali
• FR-22 Setelah COMPLETED, business date sebelumnya terkunci. Posting backdate dilarang.
• FR-23 Hanya peran tertentu (Manager) yang dapat membuka kembali audit terakhir, dengan alasan wajib. Hanya audit paling baru yang dapat dibuka; pembatalan memicu reversal posting yang tercatat penuh, bukan penghapusan data.
• FR-24 Seluruh langkah audit tercatat di log (siapa, kapan, hasil, durasi).
8. Spesifikasi API (usulan)
Semua endpoint memerlukan autentikasi dan otorisasi berbasis peran. Prefix contoh: /api/v1/night-audit.
Method
Endpoint
Fungsi
GET
/status
Business date aktif, status audit terakhir, apakah ada run berjalan
GET
/pre-check
Daftar blocker dan warning untuk business date aktif
POST
/start
Memulai audit (body: business_date, acknowledged_warnings[], idempotency_key)
GET
/runs/{id}
Status dan progres (per langkah, jumlah diposting, jumlah gagal)
POST
/runs/{id}/retry-failed
Ulang posting hanya untuk item gagal
POST
/runs/{id}/complete
Finalisasi dan rollover (bila tidak otomatis)
POST
/runs/{id}/reopen
Buka kembali audit terakhir (Manager, alasan wajib)
GET
/runs
Riwayat audit dengan filter tanggal dan status
GET
/runs/{id}/postings
Detail baris posting per reservasi
GET
/runs/{id}/reports/{type}
Laporan (daily-revenue, trial-balance, occupancy, no-show, dll.), format JSON/PDF/XLSX
POST
/no-show
Menandai reservasi sebagai no-show sebelum audit
Aturan respons: 409 Conflict bila ada run aktif atau business date tidak cocok; 422 bila ada blocker; 202 Accepted untuk /start bila diproses asinkron (disarankan background job dengan polling status).
9. Model Data (usulan)
Karena struktur trx_night_audit yang ada belum diketahui, bagian ini adalah kolom minimum yang diperlukan; sesuaikan dengan skema eksisting dan buat migrasi aditif.
trx_night_audit (satu baris per audit run)
• id, property_id, business_date, status (PENDING, RUNNING, COMPLETED_WITH_EXCEPTIONS, COMPLETED, FAILED, REOPENED)
• started_at, started_by, finished_at, triggered_by (MANUAL/SCHEDULED)
• total_in_house, total_posted, total_failed, total_room_revenue, total_tax, total_service, total_no_show
• warnings_acknowledged (JSON), notes, idempotency_key
• Unique: (property_id, business_date) untuk status non-batal
trx_night_audit_item (detail per reservasi, untuk retry dan jejak)
• audit_id, reservation_id, room_id, status (POSTED/FAILED/SKIPPED), error_message, folio_charge_id
Charge folio (tabel folio/charge eksisting)
• Tambah: business_date, source (NIGHT_AUDIT/MANUAL/CHECKIN), audit_id, reversal_of_id
• Unique: (reservation_id, room_id, business_date, charge_type) untuk source = NIGHT_AUDIT
sys_business_date (atau tabel konfigurasi properti)
• property_id, current_business_date, updated_at
Konfigurasi: tarif pajak, service charge, jadwal audit, kebijakan deposit, kebijakan no-show, ambang approval adjustment.
10. Laporan Wajib
Laporan
Isi
Daily Revenue / Manager Report
Pendapatan kamar, pajak, service, F&B, lain-lain; okupansi, ADR, RevPAR; MTD dan YTD
Trial Balance / Transaction Summary
Total debit dan kredit per kode departemen dan tipe payment; harus seimbang
In-House Guest List
Tamu menginap, kamar, tarif, saldo folio
Arrival / Departure / No-Show
Rekap pergerakan tamu hari itu
Room Status & Housekeeping
Status kamar setelah rollover
Exception Report
Posting gagal, adjustment, override, warning yang di-acknowledge
Deposit & City Ledger
Saldo deposit dan piutang
Laporan disimpan sebagai snapshot per audit run agar angka historis tidak berubah ketika tarif atau data master berubah.
11. Edge Case yang Harus Ditangani
• Audit dijalankan dua kali / double-click / dua auditor bersamaan.
• Server mati di tengah audit: harus bisa dilanjutkan dari item yang belum diposting (bukan mengulang dari awal).
• Check-in lewat tengah malam (00:00–06:00): reservasi masuk ke business date sebelumnya.
• Malam terakhir dan hari departure; reservasi 1 malam; day-use.
• Perubahan tarif di tengah masa menginap (weekend/musiman).
• Beda zona waktu dan perubahan jam server (gunakan timezone properti, simpan UTC).
• Pembulatan: aturan pembulatan konsisten (hindari selisih rupiah antara kamar + pajak + service dan total).
• Mata uang asing (jika ada): kurs dikunci pada saat posting.
• Reservasi group/master folio: charge dialihkan ke master account sesuai instruksi pembayaran.
• Reservasi lama yang sudah dibebankan di muka (lihat bagian 13).
12. Kebutuhan Non-Fungsional
• Performa: audit untuk 500 kamar in-house selesai < 5 menit; diproses batch dalam chunk (misal 50 reservasi).
• Keandalan: idempotent, resumable, transaksi atomik per reservasi.
• Keamanan: RBAC (Auditor jalankan, Manager reopen/override), semua aksi tercatat di audit log yang tidak dapat diubah.
• Observabilitas: log terstruktur per run, metrik durasi dan jumlah gagal, alert bila audit tidak selesai sampai jam batas (misal 04:00).
• Ketersediaan: UI tetap dapat membaca data selama audit berjalan; transaksi tulis ke business date terkunci ditolak dengan pesan jelas.
• Backup: snapshot/backup database otomatis sebelum rollover (praktik standar).
13. Migrasi dari Sistem Saat Ini
Tamu yang sedang in-house saat fitur dirilis sudah dibebankan penuh di muka. Agar tidak terjadi charge ganda:
1. Tambahkan flag charged_upfront = true pada reservasi lama (atau tandai charge eksisting dengan source = CHECKIN_LEGACY).
2. Night audit melewati posting kamar untuk reservasi berflag tersebut, tetapi tetap mencatatnya pada statistik okupansi dan menghasilkan alokasi pendapatan per malam (opsional, untuk laporan).
3. Jalankan skrip migrasi di luar jam operasional, dengan backup dan mode dry-run yang menampilkan reservasi terdampak.
4. Setelah semua reservasi lama check-out, flag dan logika legacy dapat dihapus.
5. Opsi lanjutan: konversi charge di muka menjadi deposit lalu mengalokasikan per malam. Lebih bersih secara akuntansi, tetapi risikonya lebih tinggi.
14. Kriteria Penerimaan
• Check-in tidak lagi membuat charge kamar sebesar seluruh masa menginap; folio memuat deposit sesuai kebijakan.
• Tamu 3 malam memiliki tepat 3 charge kamar, masing-masing pada business date yang benar, setelah 3 kali audit.
• Menjalankan audit dua kali untuk tanggal yang sama tidak menghasilkan charge ganda.
• Audit dengan blocker (misal arrival belum check-in/no-show) ditolak dengan daftar rinci.
• Jika posting satu reservasi gagal, reservasi lain tetap terposting dan bagian gagal dapat di-retry.
• Early check-out tidak menghasilkan charge pada malam setelahnya.
• Charge terposting tidak dapat diubah; hanya dapat dikoreksi lewat adjustment dengan jejak audit.
• Total pada Daily Revenue = total baris charge di folio pada business date tersebut (selisih 0).
• Business date maju tepat satu hari setelah audit COMPLETED.
• Hanya Manager yang dapat membuka kembali audit terakhir, dengan alasan tercatat.
• Reservasi lama (charged upfront) tidak terkena charge ganda.
15. Rencana Rilis
Fase
Cakupan
Fase 1 — Fondasi
Business date, status endpoint, pre-check, posting kamar + pajak + service, idempotency, rollover, perubahan check-in (deposit), migrasi reservasi lama
Fase 2 — Kontrol & Laporan
No-show processing, retry item gagal, exception report, Daily Revenue, Trial Balance, snapshot laporan, reopen audit
Fase 3 — Otomasi
Jadwal otomatis, notifikasi, biaya berulang lain, export akuntansi, dashboard KPI
16. Metrik Keberhasilan
• 100% hari operasional memiliki audit COMPLETED tanpa intervensi database manual.
• Selisih antara laporan pendapatan harian dan total folio = 0.
• Waktu eksekusi audit sesuai target non-fungsional.
• Jumlah adjustment akibat salah charge kamar turun dibanding sebelum fitur.
17. Pertanyaan Terbuka (perlu keputusan Anda)
1. Berapa nominal deposit saat check-in (1 malam, persentase, atau flat)? Apakah berbeda untuk OTA/corporate?
2. Kebijakan no-show: charge penalti 1 malam atau tanpa biaya?
3. Apakah pajak hotel dan service charge inklusif dalam tarif atau ditambahkan? Berapa persentase dan urutan perhitungannya?
4. Jam cut-off business date dan jam terjadwal audit (misal 02:00)?
5. Apakah ada property lebih dari satu, dan apakah ada channel manager/OTA yang perlu disinkronkan?
6. Apakah ada mata uang asing, group/master folio, atau city ledger?
7. Struktur aktual trx_night_audit dan tabel folio/charge saat ini (kirimkan skema agar bagian 9 dapat disesuaikan).
8. Berapa jumlah kamar (untuk menentukan kebutuhan performa)?