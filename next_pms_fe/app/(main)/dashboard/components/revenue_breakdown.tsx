/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file revenue_breakdown.tsx
 * @description Komponen visual komposisi pendapatan: Donut chart kategori charge
 *              (Kamar, F&B, Laundry, Spa, dsb.) dan metode pembayaran (Tunai, EDC, QRIS, Transfer).
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { formatCurrency } from '@/lib/tools/generalTools';
import { DashboardRevenueBreakdownResponse } from './interfaces';

interface RevenueBreakdownProps {
  data: DashboardRevenueBreakdownResponse | null;
  loading: boolean;
}

const PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export const RevenueBreakdown: React.FC<RevenueBreakdownProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid mb-4">
        <div className="col-12 lg:col-6">
          <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full">
            <Skeleton width="50%" height="1.5rem" className="mb-3" />
            <Skeleton width="100%" height="14rem" className="border-round-lg" />
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full">
            <Skeleton width="50%" height="1.5rem" className="mb-3" />
            <Skeleton width="100%" height="14rem" className="border-round-lg" />
          </div>
        </div>
      </div>
    );
  }

  const { by_charge_type, by_payment_method, total_revenue, total_payment_collected } = data;

  // 1. Chart Data Charge Type
  const chargeLabels = by_charge_type.map((c) => c.label);
  const chargeAmounts = by_charge_type.map((c) => c.amount);
  const chargeColors = by_charge_type.map((_, i) => PALETTE[i % PALETTE.length]);

  const chargeChartData = {
    labels: chargeLabels,
    datasets: [
      {
        data: chargeAmounts,
        backgroundColor: chargeColors,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // 2. Chart Data Payment Method
  const paymentLabels = by_payment_method.map((p) => p.label);
  const paymentAmounts = by_payment_method.map((p) => p.amount);
  const paymentColors = by_payment_method.map((_, i) => PALETTE[(i + 3) % PALETTE.length]);

  const paymentChartData = {
    labels: paymentLabels,
    datasets: [
      {
        data: paymentAmounts,
        backgroundColor: paymentColors,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const donutOptions = {
    maintainAspectRatio: false,
    aspectRatio: 1,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.parsed;
            return ` ${formatCurrency(val)}`;
          },
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="grid mb-4">
      {/* 1. Pendapatan per Kategori Layanan */}
      <div className="col-12 lg:col-6">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-center mb-3">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-th-large text-primary text-xl"></i>
                <h2 className="text-lg font-bold text-900 m-0">Komposisi Pendapatan</h2>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 border-round border-1 border-green-200">
                Total: {formatCurrency(total_revenue)}
              </span>
            </div>

            {by_charge_type.length === 0 ? (
              <div className="text-center py-5 text-500 text-sm">
                Belum ada transaksi pendapatan pada periode ini.
              </div>
            ) : (
              <div className="grid align-items-center">
                <div className="col-12 sm:col-5 flex justify-content-center">
                  <div style={{ width: '180px', height: '180px', position: 'relative' }}>
                    <Chart type="doughnut" data={chargeChartData} options={donutOptions} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
                <div className="col-12 sm:col-7">
                  <div className="flex flex-column gap-2 text-xs">
                    {by_charge_type.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-1">
                        <div className="flex align-items-center gap-2">
                          <span
                            className="w-1rem h-1rem border-round-circle flex-shrink-0"
                            style={{ backgroundColor: chargeColors[idx] }}
                          />
                          <span className="text-700 font-medium">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <strong className="text-900 block">{formatCurrency(item.amount)}</strong>
                          <span className="text-500 text-xxs font-medium">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Metode Pembayaran Diterima */}
      <div className="col-12 lg:col-6">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-center mb-3">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-credit-card text-teal-700 text-xl"></i>
                <h2 className="text-lg font-bold text-900 m-0">Metode Pembayaran</h2>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-1 border-round border-1 border-teal-200">
                Penerimaan: {formatCurrency(total_payment_collected)}
              </span>
            </div>

            {by_payment_method.length === 0 ? (
              <div className="text-center py-5 text-500 text-sm">
                Belum ada transaksi pembayaran pada periode ini.
              </div>
            ) : (
              <div className="grid align-items-center">
                <div className="col-12 sm:col-5 flex justify-content-center">
                  <div style={{ width: '180px', height: '180px', position: 'relative' }}>
                    <Chart type="doughnut" data={paymentChartData} options={donutOptions} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
                <div className="col-12 sm:col-7">
                  <div className="flex flex-column gap-2 text-xs">
                    {by_payment_method.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-1">
                        <div className="flex align-items-center gap-2">
                          <span
                            className="w-1rem h-1rem border-round-circle flex-shrink-0"
                            style={{ backgroundColor: paymentColors[idx] }}
                          />
                          <span className="text-700 font-medium">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <strong className="text-900 block">{formatCurrency(item.amount)}</strong>
                          <span className="text-500 text-xxs font-medium">{item.percentage}% ({item.payment_count} trx)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
