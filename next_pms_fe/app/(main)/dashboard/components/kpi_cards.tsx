/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file kpi_cards.tsx
 * @description 4 Kartu KPI Utama Finansial & Hunian (Occupancy %, ADR, RevPAR, Total Revenue)
 *              dengan perbandingan Month-To-Date (MTD), Hari ini, dan tren vs bulan sebelumnya.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { Skeleton } from 'primereact/skeleton';
import { formatCurrency } from '@/lib/tools/generalTools';
import { DashboardKpiResponse } from './interfaces';

interface KpiCardsProps {
  data: DashboardKpiResponse | null;
  loading: boolean;
}

const renderDeltaBadge = (delta: number | null | undefined, isCurrency = false) => {
  if (delta === null || delta === undefined) {
    return <span className="text-xs text-500 font-medium">Bulan baru</span>;
  }
  const isPositive = delta > 0;
  const isZero = delta === 0;

  const colorClass = isZero
    ? 'text-500 bg-gray-100'
    : isPositive
    ? 'text-green-700 bg-green-100'
    : 'text-red-700 bg-red-100';

  const icon = isZero ? 'pi-minus' : isPositive ? 'pi-arrow-up' : 'pi-arrow-down';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`inline-flex align-items-center gap-1 px-2 py-1 border-round text-xs font-bold ${colorClass}`}>
      <i className={`pi ${icon} text-xs`}></i>
      {sign}
      {delta}% vs bln lalu
    </span>
  );
};

export const KpiCards: React.FC<KpiCardsProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-12 sm:col-6 lg:col-3">
            <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1">
              <Skeleton width="60%" className="mb-2" />
              <Skeleton width="80%" height="2.5rem" className="mb-3" />
              <Skeleton width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const { today, mtd, change_vs_prev_mtd } = data;

  return (
    <div className="grid mb-4">
      {/* 1. OCCUPANCY RATE */}
      <div className="col-12 sm:col-6 lg:col-3">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-start mb-2">
              <span className="text-xs font-bold text-color-secondary uppercase tracking-wider">
                Occupancy Rate (MTD)
              </span>
              <div className="w-2rem h-2rem border-round bg-blue-100 flex align-items-center justify-content-center">
                <i className="pi pi-chart-bar text-blue-700 text-sm"></i>
              </div>
            </div>
            <div className="flex align-items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-900">{mtd.occupancy_pct}%</span>
              <span className="text-xs text-500 font-medium">
                Hari ini: <strong className="text-900">{today.occupancy_pct}%</strong>
              </span>
            </div>
          </div>

          <div className="pt-2 border-top-1 surface-border flex align-items-center justify-content-between flex-wrap gap-2">
            {renderDeltaBadge(change_vs_prev_mtd.occupancy_pct)}
            <span className="text-xs text-500">
              {mtd.rooms_sold} / {mtd.rooms_available} terjual
            </span>
          </div>
        </div>
      </div>

      {/* 2. AVERAGE DAILY RATE (ADR) */}
      <div className="col-12 sm:col-6 lg:col-3">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-start mb-2">
              <span className="text-xs font-bold text-color-secondary uppercase tracking-wider">
                Average Daily Rate (ADR)
              </span>
              <div className="w-2rem h-2rem border-round bg-teal-100 flex align-items-center justify-content-center">
                <i className="pi pi-tag text-teal-700 text-sm"></i>
              </div>
            </div>
            <div className="flex flex-column mb-2">
              <span className="text-2xl font-bold text-900">{formatCurrency(mtd.adr)}</span>
              <span className="text-xs text-500 font-medium mt-1">
                Hari ini: <strong className="text-900">{formatCurrency(today.adr)}</strong>
              </span>
            </div>
          </div>

          <div className="pt-2 border-top-1 surface-border flex align-items-center justify-content-between flex-wrap gap-2">
            {renderDeltaBadge(change_vs_prev_mtd.adr)}
            <span className="text-xs text-500">Rata-rata per kamar</span>
          </div>
        </div>
      </div>

      {/* 3. RevPAR */}
      <div className="col-12 sm:col-6 lg:col-3">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-start mb-2">
              <span className="text-xs font-bold text-color-secondary uppercase tracking-wider">
                RevPAR (MTD)
              </span>
              <div className="w-2rem h-2rem border-round bg-indigo-100 flex align-items-center justify-content-center">
                <i className="pi pi-percentage text-indigo-700 text-sm"></i>
              </div>
            </div>
            <div className="flex flex-column mb-2">
              <span className="text-2xl font-bold text-900">{formatCurrency(mtd.revpar)}</span>
              <span className="text-xs text-500 font-medium mt-1">
                Hari ini: <strong className="text-900">{formatCurrency(today.revpar)}</strong>
              </span>
            </div>
          </div>

          <div className="pt-2 border-top-1 surface-border flex align-items-center justify-content-between flex-wrap gap-2">
            {renderDeltaBadge(change_vs_prev_mtd.revpar)}
            <span className="text-xs text-500">Pendapatan / kapasitas</span>
          </div>
        </div>
      </div>

      {/* 4. TOTAL REVENUE */}
      <div className="col-12 sm:col-6 lg:col-3">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-start mb-2">
              <span className="text-xs font-bold text-color-secondary uppercase tracking-wider">
                Total Revenue (MTD)
              </span>
              <div className="w-2rem h-2rem border-round bg-green-100 flex align-items-center justify-content-center">
                <i className="pi pi-wallet text-green-700 text-sm"></i>
              </div>
            </div>
            <div className="flex flex-column mb-2">
              <span className="text-2xl font-bold text-green-700">{formatCurrency(mtd.total_revenue)}</span>
              <span className="text-xs text-500 font-medium mt-1">
                Hari ini: <strong className="text-900">{formatCurrency(today.total_revenue)}</strong>
              </span>
            </div>
          </div>

          <div className="pt-2 border-top-1 surface-border flex align-items-center justify-content-between flex-wrap gap-2">
            {renderDeltaBadge(change_vs_prev_mtd.total_revenue)}
            <span className="text-xs text-500">
              Kas: {formatCurrency(mtd.payment_collected)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
