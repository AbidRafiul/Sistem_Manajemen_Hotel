/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file trend_chart.tsx
 * @description Komponen grafik tren historis performa hotel (Occupancy % & Total Revenue)
 *              menggunakan Chart.js & PrimeReact Chart dengan dual Y-axis.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React, { useState } from 'react';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import { formatCurrency } from '@/lib/tools/generalTools';
import { DashboardTrendResponse } from './interfaces';

interface TrendChartProps {
  data: DashboardTrendResponse | null;
  loading: boolean;
  selectedDays: number;
  onDaysChange: (days: number) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  loading,
  selectedDays,
  onDaysChange,
}) => {
  if (loading || !data) {
    return (
      <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <Skeleton width="40%" height="1.5rem" />
          <Skeleton width="10rem" height="2rem" />
        </div>
        <Skeleton width="100%" height="20rem" className="border-round-lg" />
      </div>
    );
  }

  const { daily_trend, summary } = data;

  const labels = daily_trend.map((d) => {
    const parts = d.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const occupancyData = daily_trend.map((d) => d.occupancy_pct);
  const revenueData = daily_trend.map((d) => d.total_revenue);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Occupancy Rate (%)',
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        yAxisID: 'y1',
        data: occupancyData,
      },
      {
        type: 'bar',
        label: 'Total Revenue (Rp)',
        backgroundColor: 'rgba(16, 185, 129, 0.4)',
        borderColor: '#10B981',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y',
        data: revenueData,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: '#495057',
          usePointStyle: true,
          font: { weight: 'bold', size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataset.yAxisID === 'y1') {
              return ` Okupansi: ${context.parsed.y}%`;
            }
            return ` Revenue: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6c757d', font: { size: 11 } },
        grid: { color: '#ebedef' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: '#6c757d',
          font: { size: 11 },
          callback: (value: any) => {
            if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}jt`;
            if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}rb`;
            return `Rp ${value}`;
          },
        },
        grid: { color: '#ebedef' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        ticks: {
          color: '#3B82F6',
          font: { size: 11 },
          callback: (value: any) => `${value}%`,
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
      {/* Header with period toggle & summary */}
      <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 mb-3">
        <div>
          <div className="flex align-items-center gap-2">
            <i className="pi pi-chart-line text-primary text-xl"></i>
            <h2 className="text-lg font-bold text-900 m-0">Tren Kinerja Harian</h2>
          </div>
          <span className="text-xs text-500 font-medium">
            Korelasi tingkat hunian kamar terhadap total pendapatan harian
          </span>
        </div>

        <div className="flex align-items-center gap-1 flex-wrap">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              label={`${days} Hari`}
              className={`p-button-sm ${
                selectedDays === days ? 'p-button-primary' : 'p-button-outlined p-button-secondary'
              } text-xs font-semibold`}
              onClick={() => onDaysChange(days)}
            />
          ))}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid mb-3">
        <div className="col-12 sm:col-4">
          <div className="bg-blue-50 border-round-lg p-2 border-1 border-blue-100 flex align-items-center gap-2">
            <i className="pi pi-percentage text-blue-700 text-lg"></i>
            <div>
              <span className="text-xs text-600 block">Rata-rata Okupansi</span>
              <strong className="text-sm text-blue-900">{summary.avg_occupancy_pct}%</strong>
            </div>
          </div>
        </div>
        <div className="col-12 sm:col-4">
          <div className="bg-teal-50 border-round-lg p-2 border-1 border-teal-100 flex align-items-center gap-2">
            <i className="pi pi-tag text-teal-700 text-lg"></i>
            <div>
              <span className="text-xs text-600 block">Rata-rata ADR</span>
              <strong className="text-sm text-teal-900">{formatCurrency(summary.avg_adr)}</strong>
            </div>
          </div>
        </div>
        <div className="col-12 sm:col-4">
          <div className="bg-green-50 border-round-lg p-2 border-1 border-green-100 flex align-items-center gap-2">
            <i className="pi pi-wallet text-green-700 text-lg"></i>
            <div>
              <span className="text-xs text-600 block">Total Revenue Periode</span>
              <strong className="text-sm text-green-900">{formatCurrency(summary.total_revenue)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height: '320px', position: 'relative' }}>
        <Chart type="bar" data={chartData} options={chartOptions} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};
