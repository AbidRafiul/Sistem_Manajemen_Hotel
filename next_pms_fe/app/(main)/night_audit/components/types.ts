/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file types.ts
 * @description Type definitions untuk modul Night Audit
 * @author Antigravity
 * @created 2026-10-09
 * @version 1.0.0
 */

export interface CheckItem {
  type: string;
  title: string;
  message: string;
  entity_ids: string[];
  details?: any[];
}

export interface PreCheckResult {
  can_proceed: boolean;
  business_date: string;
  has_blockers: boolean;
  has_warnings: boolean;
  blockers: CheckItem[];
  warnings: CheckItem[];
  counts: {
    blockers: number;
    warnings: number;
  };
}

export interface NightAuditStatus {
  kode_cabang: string;
  current_business_date: string;
  is_locked: boolean;
  is_running: boolean;
  active_run: NightAuditRun | null;
  last_audit: NightAuditRun | null;
}

export interface NightAuditRun {
  id: number;
  kode_night_audit: string;
  kode_cabang: string;
  business_date: string;
  status: 'pending' | 'running' | 'completed' | 'completed_with_exceptions' | 'failed' | 'reopened';
  total_in_house: number;
  total_posted: number;
  total_failed: number;
  total_room_revenue: number | string;
  total_tax: number | string;
  total_service: number | string;
  started_at: string;
  completed_at?: string | null;
  room_charge_posted: number;
  business_date_updated: number;
  daily_report_generated: number;
  transaction_locked: number;
  report_snapshots?: string | any;
  warnings_acknowledged?: number;
  idempotency_key?: string;
  reopen_reason?: string | null;
  reopened_at?: string | null;
  reopened_by?: number | null;
}

export interface NightAuditItem {
  id: number;
  kode_night_audit: string;
  business_date: string;
  kode_reservation: string;
  kode_reservasi_room: string;
  kode_kamar: string;
  nomor_kamar?: string;
  guest_name?: string;
  nama_tipe_kamar?: string;
  rate_applied: number | string;
  tax_amount: number | string;
  service_charge_amount: number | string;
  status: 'POSTED' | 'FAILED' | 'SKIPPED';
  error_message?: string | null;
  created_at: string;
}

export interface DailyRevenueReport {
  title: string;
  business_date: string;
  kpi: {
    total_rooms: number;
    rooms_in_house: number;
    occupancy_rate_percent: number;
    total_room_revenue: number;
    total_tax: number;
    total_service: number;
    total_gross_revenue: number;
    adr: number;
    revpar: number;
  };
  revenue_by_room_type: Array<{
    tipe_kamar: string;
    rooms_occupied: number;
    revenue: number;
  }>;
}

export interface TrialBalanceReport {
  title: string;
  business_date: string;
  ledger_summary: {
    total_room_charges_debit: number;
    total_tax_service_debit: number;
    total_other_charges_debit: number;
    total_debit: number;
    total_guest_payments_credit: number;
    total_deposit_credit: number;
    total_credit: number;
    out_of_balance_amount: number;
    is_balanced: boolean;
  };
}
