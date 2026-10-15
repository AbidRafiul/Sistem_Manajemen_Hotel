-- Migration: Cek Kamar Checkout & Catatan Interaktif Housekeeping
-- Database: hotel_pms (MySQL)

-- 1. Tambah kolom pada trx_housekeeping_task jika belum ada
ALTER TABLE trx_housekeeping_task
ADD COLUMN checklist JSON NULL AFTER notes,
ADD COLUMN inspection_result ENUM('pending', 'clear', 'with_charges') NOT NULL DEFAULT 'pending' AFTER status,
ADD COLUMN inspection_details JSON NULL AFTER inspection_result;

-- 2. Tambah kolom pada trx_checkout jika belum ada
ALTER TABLE trx_checkout
ADD COLUMN inspection_status ENUM('skipped', 'inspected_clear', 'inspected_with_charges') NOT NULL DEFAULT 'skipped' AFTER late_checkout,
ADD COLUMN kode_inspection_task VARCHAR(50) NULL AFTER inspection_status;
