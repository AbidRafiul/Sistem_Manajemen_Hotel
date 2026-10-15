/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file interfaces.ts
 * @description Tipe data TypeScript untuk komponen Dashboard Utama (Fase 1 & Fase 2)
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

export interface PeriodKpiData {
  from: string;
  to: string;
  days: number;
  rooms_sold: number;
  rooms_available: number;
  room_revenue: number;
  occupancy_pct: number;
  adr: number;
  revpar: number;
  total_revenue: number;
  payment_collected: number;
}

export interface KpiChangeData {
  occupancy_pct: number | null;
  adr: number | null;
  revpar: number | null;
  room_revenue: number | null;
  total_revenue: number | null;
}

export interface RoomInventoryData {
  total: number;
  available: number;
  occupied: number;
  vacant_clean: number;
  vacant_dirty: number;
  ooo: number;
}

export interface DashboardKpiResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  inventory: RoomInventoryData;
  today: PeriodKpiData;
  mtd: PeriodKpiData;
  prev_mtd: PeriodKpiData;
  change_vs_prev_mtd: KpiChangeData;
}

export interface DashboardTodayResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  arrivals: {
    expected: number;
    arrived: number;
    pending: number;
    guests_pending: number;
  };
  departures: {
    expected: number;
    departed: number;
    pending: number;
    guests_pending: number;
  };
  in_house: {
    rooms: number;
    guests: number;
  };
  rooms: RoomInventoryData;
}

export interface AlertItem {
  id: string;
  level: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  count: number;
  action_label: string;
  action_route: string;
  items?: any[];
}

export interface DashboardAlertsResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  total_alerts: number;
  danger_count: number;
  warning_count: number;
  info_count: number;
  alerts: AlertItem[];
}

// -------------------------------------------------------------
// Fase 2 Interfaces (Analitik & Proyeksi)
// -------------------------------------------------------------

export interface DailyTrendPoint {
  date: string;
  rooms_sold: number;
  rooms_available: number;
  occupancy_pct: number;
  adr: number;
  revpar: number;
  room_revenue: number;
  total_revenue: number;
}

export interface DashboardTrendResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  date_from: string;
  date_to: string;
  days: number;
  summary: {
    total_rooms_sold: number;
    total_room_revenue: number;
    total_revenue: number;
    avg_occupancy_pct: number;
    avg_adr: number;
    avg_revpar: number;
  };
  daily_trend: DailyTrendPoint[];
}

export interface ChargeTypeBreakdownItem {
  charge_type: string;
  label: string;
  item_count: number;
  amount: number;
  percentage: number;
}

export interface PaymentMethodBreakdownItem {
  payment_method: string;
  label: string;
  payment_count: number;
  amount: number;
  percentage: number;
}

export interface DashboardRevenueBreakdownResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  date_from: string;
  date_to: string;
  total_revenue: number;
  total_payment_collected: number;
  by_charge_type: ChargeTypeBreakdownItem[];
  by_payment_method: PaymentMethodBreakdownItem[];
}

export interface SegmentItem {
  channel?: string;
  booking_type?: string;
  label: string;
  count: number;
  total_guests: number;
  percentage: number;
}

export interface TopRoomTypeItem {
  kode_tipe_kamar: string;
  nama_tipe: string;
  total_bookings: number;
  total_nights: number;
  total_revenue: number;
}

export interface DashboardSegmentResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  date_from: string;
  date_to: string;
  by_source_channel: SegmentItem[];
  by_booking_type: SegmentItem[];
  top_room_types: TopRoomTypeItem[];
}

export interface DailyForecastPoint {
  date: string;
  booked_rooms: number;
  available_rooms: number;
  occupancy_pct: number;
  projected_revenue: number;
  projected_adr: number;
  expected_arrivals: number;
  expected_departures: number;
}

export interface DashboardForecastResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  forecast_days: number;
  start_date: string;
  end_date: string;
  summary: {
    total_booked_room_nights: number;
    total_projected_revenue: number;
    avg_projected_occupancy_pct: number;
  };
  daily_forecast: DailyForecastPoint[];
}

export interface UpcomingEventItem {
  kode_reservasi_event: string;
  kode_ruang_event: string;
  nama_ruang: string;
  tgl_mulai: string;
  tgl_selesai: string;
  jam_mulai: string;
  jam_selesai: string;
  jumlah_tamu: number;
  status_event: string;
  organizer: string;
}

export interface DashboardUpcomingEventsResponse {
  kode_cabang: string;
  nama_hotel: string;
  business_date: string;
  date_from: string;
  date_to: string;
  total_events: number;
  events: UpcomingEventItem[];
}
