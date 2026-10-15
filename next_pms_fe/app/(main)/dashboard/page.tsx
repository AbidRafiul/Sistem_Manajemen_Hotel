/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file dashboard/page.tsx
 * @description Halaman utama Dashboard Manajemen PMS Hotel (Eksekutif, Analitik, & Operasional)
 *              Mengintegrasikan:
 *              - Fase 1: KPI Bisnis, Ringkasan Operasional Hari Ini, dan Alert Kepatuhan.
 *              - Fase 2: Grafik Tren Historis, Komposisi Pendapatan, Segmen Pasar,
 *                        Proyeksi On-The-Books 14 Hari, dan Agenda Event Mendatang.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.1.0
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';

import {
  apiDashboardAlerts,
  apiDashboardForecast,
  apiDashboardKpi,
  apiDashboardRevenueBreakdown,
  apiDashboardSegment,
  apiDashboardToday,
  apiDashboardTrend,
  apiDashboardUpcomingEvents,
} from './components/endpoints';
import {
  DashboardAlertsResponse,
  DashboardForecastResponse,
  DashboardKpiResponse,
  DashboardRevenueBreakdownResponse,
  DashboardSegmentResponse,
  DashboardTodayResponse,
  DashboardTrendResponse,
  DashboardUpcomingEventsResponse,
} from './components/interfaces';
import { DashboardHeader } from './components/dashboard_header';
import { KpiCards } from './components/kpi_cards';
import { TodaySnapshot } from './components/today_snapshot';
import { AlertPanel } from './components/alert_panel';
import { TrendChart } from './components/trend_chart';
import { RevenueBreakdown } from './components/revenue_breakdown';
import { SegmentChart } from './components/segment_chart';
import { ForecastChart } from './components/forecast_chart';
import { UpcomingEvents } from './components/upcoming_events';

const DashboardPage: React.FC = () => {
  const toast = useRef<Toast>(null);
  const { data: session } = useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [trendDays, setTrendDays] = useState<number>(30);
  const [trendLoading, setTrendLoading] = useState<boolean>(false);

  // Data states
  const [kpiData, setKpiData] = useState<DashboardKpiResponse | null>(null);
  const [todayData, setTodayData] = useState<DashboardTodayResponse | null>(null);
  const [alertsData, setAlertsData] = useState<DashboardAlertsResponse | null>(null);
  const [trendData, setTrendData] = useState<DashboardTrendResponse | null>(null);
  const [revBreakdownData, setRevBreakdownData] = useState<DashboardRevenueBreakdownResponse | null>(null);
  const [segmentData, setSegmentData] = useState<DashboardSegmentResponse | null>(null);
  const [forecastData, setForecastData] = useState<DashboardForecastResponse | null>(null);
  const [eventsData, setEventsData] = useState<DashboardUpcomingEventsResponse | null>(null);

  const activeCabang = session?.user?.active_kode_cabang || '';
  const activeBranchName = session?.user?.active_branch_name || '';
  const userRole = (session?.user?.role || '').toLowerCase();

  // Load all dashboard metrics via parallel requests (Promise.allSettled)
  const fetchDashboardData = useCallback(async (cabangCode: string, daysForTrend = trendDays) => {
    if (!cabangCode) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const payload = { kode_cabang: cabangCode };

      const [
        kpiRes,
        todayRes,
        alertsRes,
        trendRes,
        revRes,
        segRes,
        fcRes,
        evRes,
      ] = await Promise.allSettled([
        postData(apiDashboardKpi, payload),
        postData(apiDashboardToday, payload),
        postData(apiDashboardAlerts, payload),
        postData(apiDashboardTrend, { ...payload, days: daysForTrend }),
        postData(apiDashboardRevenueBreakdown, payload),
        postData(apiDashboardSegment, payload),
        postData(apiDashboardForecast, { ...payload, days: 14 }),
        postData(apiDashboardUpcomingEvents, { ...payload, days: 7 }),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value?.data?.data) {
        setKpiData(kpiRes.value.data.data);
      }
      if (todayRes.status === 'fulfilled' && todayRes.value?.data?.data) {
        setTodayData(todayRes.value.data.data);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value?.data?.data) {
        setAlertsData(alertsRes.value.data.data);
      }
      if (trendRes.status === 'fulfilled' && trendRes.value?.data?.data) {
        setTrendData(trendRes.value.data.data);
      }
      if (revRes.status === 'fulfilled' && revRes.value?.data?.data) {
        setRevBreakdownData(revRes.value.data.data);
      }
      if (segRes.status === 'fulfilled' && segRes.value?.data?.data) {
        setSegmentData(segRes.value.data.data);
      }
      if (fcRes.status === 'fulfilled' && fcRes.value?.data?.data) {
        setForecastData(fcRes.value.data.data);
      }
      if (evRes.status === 'fulfilled' && evRes.value?.data?.data) {
        setEventsData(evRes.value.data.data);
      }
    } catch (err: any) {
      showError(toast, err?.message || 'Terjadi kesalahan sistem saat memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  // Handle changing trend days (7, 14, 30) independently
  const handleTrendDaysChange = async (days: number) => {
    setTrendDays(days);
    if (!activeCabang) return;

    setTrendLoading(true);
    try {
      const res = await postData(apiDashboardTrend, {
        kode_cabang: activeCabang,
        days,
      });
      if (res?.data?.data) {
        setTrendData(res.data.data);
      }
    } catch (err: any) {
      console.error('Gagal memuat tren:', err);
    } finally {
      setTrendLoading(false);
    }
  };

  // Fetch when branch context changes
  useEffect(() => {
    if (activeCabang) {
      fetchDashboardData(activeCabang);
    }
  }, [activeCabang, fetchDashboardData]);

  // Periodic light auto-refresh for alerts every 5 minutes
  useEffect(() => {
    if (!activeCabang) return;

    const intervalId = setInterval(() => {
      postData(apiDashboardAlerts, { kode_cabang: activeCabang })
        .then((res) => {
          if (res?.data?.data) {
            setAlertsData(res.data.data);
          }
        })
        .catch(() => {
          // Silent catch for background refresh
        });
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [activeCabang]);

  const businessDate =
    kpiData?.business_date || todayData?.business_date || alertsData?.business_date || '';
  const hotelDisplayName =
    kpiData?.nama_hotel || todayData?.nama_hotel || activeBranchName;
  const hasAuditAlert = Boolean(
    alertsData?.alerts?.some((a) => a.id === 'audit_lagging' || a.id === 'audit_failed')
  );

  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12">
        {/* 1. Header Toolbar */}
        <DashboardHeader
          hotelName={hotelDisplayName}
          kodeCabang={activeCabang}
          businessDate={businessDate}
          userRole={userRole}
          loading={loading}
          onRefresh={() => fetchDashboardData(activeCabang)}
          hasAuditAlert={hasAuditAlert}
        />

        {/* 2. Critical Operational Alerts (Positioned prominently on top) */}
        <AlertPanel data={alertsData} loading={loading} />

        {/* 3. Core Business KPI Cards (Occupancy %, ADR, RevPAR, Revenue) */}
        <KpiCards data={kpiData} loading={loading} />

        {/* 4. Real-Time Operational Pulse Today (Arrivals, Departures, In-House, Readiness) */}
        <TodaySnapshot data={todayData} loading={loading} />

        {/* 5. Historical Trend Chart (Occupancy % & Total Revenue Dual Axis) */}
        <TrendChart
          data={trendData}
          loading={loading || trendLoading}
          selectedDays={trendDays}
          onDaysChange={handleTrendDaysChange}
        />

        {/* 6. Revenue Breakdown (By Service Charge Type & Payment Method) */}
        <RevenueBreakdown data={revBreakdownData} loading={loading} />

        {/* 7. Market & Guest Segmentation (Channel, Booking Type, Top Room Types) */}
        <SegmentChart data={segmentData} loading={loading} />

        {/* 8. On-The-Books 14-Day Forward Forecast */}
        <ForecastChart data={forecastData} loading={loading} />

        {/* 9. Upcoming Meetings & Events Agenda (7 Days) */}
        <UpcomingEvents data={eventsData} loading={loading} />
      </div>
    </div>
  );
};

export default DashboardPage;