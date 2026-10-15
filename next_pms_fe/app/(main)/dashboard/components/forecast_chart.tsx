/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file forecast_chart.tsx
 * @description Komponen grafik proyeksi On-The-Books 14 hari ke depan:
 *              Perkiraan tingkat hunian (Occupancy %), perkiraan kedatangan & keberangkatan tamu.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { formatCurrency } from '@/lib/tools/generalTools';
import { DashboardForecastResponse } from './interfaces';

interface ForecastChartProps {
  data: DashboardForecastResponse | null;
  loading: boolean;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
        <Skeleton width="40%" height="1.5rem" className="mb-3" />
        <Skeleton width="100%" height="18rem" className="border-round-lg" />
      </div>
    );
  }

  const { daily_forecast, summary, forecast_days } = data;

  const labels = daily_forecast.map((d) => {
    const parts = d.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const occupancyData = daily_forecast.map((d) => d.occupancy_pct);
  const arrivalsData = daily_forecast.map((d) => d.expected_arrivals);
  const departuresData = daily_forecast.map((d) => d.expected_departures);

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Proyeksi Okupansi (%)',
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        yAxisID: 'y1',
        data: occupancyData,
      },
      {
        type: 'bar',
        label: 'Kedatangan (Arrivals)',
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        yAxisID: 'y',
        data: arrivalsData,
        borderRadius: 4,
      },
      {
        type: 'bar',
        label: 'Keberangkatan (Departures)',
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        yAxisID: 'y',
        data: departuresData,
        borderRadius: 4,
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
          afterBody: (context: any) => {
            const index = context[0]?.dataIndex;
            if (index !== undefined && daily_forecast[index]) {
              const pt = daily_forecast[index];
              return `Kamar Terisi: ${pt.booked_rooms} unit\nEst. Revenue: ${formatCurrency(pt.projected_revenue)}`;
            }
            return '';
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
        ticks: { color: '#6c757d', font: { size: 11 }, precision: 0 },
        grid: { color: '#ebedef' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        ticks: {
          color: '#8B5CF6',
          font: { size: 11 },
          callback: (value: any) => `${value}%`,
        },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
      <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 mb-3">
        <div>
          <div className="flex align-items-center gap-2">
            <i className="pi pi-forward text-primary text-xl"></i>
            <h2 className="text-lg font-bold text-900 m-0">
              Proyeksi On-The-Books ({forecast_days} Hari ke Depan)
            </h2>
          </div>
          <span className="text-xs text-500 font-medium">
            Perkiraan beban operasional dan keterisian kamar berdasarkan reservasi tercatat
          </span>
        </div>

        <div className="flex align-items-center gap-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 border-round border-1 border-indigo-200">
            Rata-rata Okupansi: {summary.avg_projected_occupancy_pct}%
          </span>
          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 border-round border-1 border-green-200">
            Est. Revenue: {formatCurrency(summary.total_projected_revenue)}
          </span>
        </div>
      </div>

      <div style={{ height: '300px', position: 'relative' }}>
        <Chart type="bar" data={chartData} options={chartOptions} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};
