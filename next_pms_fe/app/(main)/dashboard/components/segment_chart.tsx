/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file segment_chart.tsx
 * @description Komponen visual segmentasi pasar: Saluran Pemesanan (OTA vs Direct),
 *              Profil Tipe Booking (Individual/Group/Corporate), dan Top 5 Tipe Kamar terlaris.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { Skeleton } from 'primereact/skeleton';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { formatCurrency } from '@/lib/tools/generalTools';
import { DashboardSegmentResponse } from './interfaces';

interface SegmentChartProps {
  data: DashboardSegmentResponse | null;
  loading: boolean;
}

export const SegmentChart: React.FC<SegmentChartProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid mb-4">
        <div className="col-12 lg:col-6">
          <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full">
            <Skeleton width="40%" height="1.5rem" className="mb-3" />
            <Skeleton width="100%" height="12rem" className="border-round-lg" />
          </div>
        </div>
        <div className="col-12 lg:col-6">
          <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full">
            <Skeleton width="40%" height="1.5rem" className="mb-3" />
            <Skeleton width="100%" height="12rem" className="border-round-lg" />
          </div>
        </div>
      </div>
    );
  }

  const { by_source_channel, by_booking_type, top_room_types } = data;

  return (
    <div className="grid mb-4">
      {/* 1. Saluran Pemesanan (Source Channel) */}
      <div className="col-12 lg:col-6">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-center mb-3">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-globe text-primary text-xl"></i>
                <h2 className="text-lg font-bold text-900 m-0">Saluran Pemesanan (Channel)</h2>
              </div>
              <span className="text-xs text-500 font-medium">Berdasarkan Reservasi</span>
            </div>

            {by_source_channel.length === 0 ? (
              <div className="text-center py-4 text-500 text-sm">Belum ada data channel reservasi.</div>
            ) : (
              <div className="flex flex-column gap-3">
                {by_source_channel.slice(0, 5).map((ch, idx) => (
                  <div key={idx}>
                    <div className="flex justify-content-between align-items-center text-xs mb-1">
                      <span className="font-semibold text-800">{ch.label}</span>
                      <span className="text-700">
                        <strong>{ch.count}</strong> reservasi ({ch.percentage}%)
                      </span>
                    </div>
                    <ProgressBar value={ch.percentage} showValue={false} style={{ height: '6px' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Segment Tipe Booking Summary */}
          <div className="pt-3 mt-3 border-top-1 surface-border">
            <span className="text-xs font-bold text-500 uppercase block mb-2">Tipe Booking:</span>
            <div className="flex align-items-center gap-2 flex-wrap">
              {by_booking_type.map((bt, idx) => (
                <Tag
                  key={idx}
                  value={`${bt.label}: ${bt.count}`}
                  severity={idx === 0 ? 'success' : 'info'}
                  className="text-xs font-normal"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top 5 Tipe Kamar Paling Laku */}
      <div className="col-12 lg:col-6">
        <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
          <div>
            <div className="flex justify-content-between align-items-center mb-3">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-star text-yellow-600 text-xl"></i>
                <h2 className="text-lg font-bold text-900 m-0">Top Tipe Kamar Terlaris</h2>
              </div>
              <span className="text-xs text-500 font-medium">Peringkat Pendapatan Kamar</span>
            </div>

            {top_room_types.length === 0 ? (
              <div className="text-center py-4 text-500 text-sm">Belum ada data transaksi kamar.</div>
            ) : (
              <div className="flex flex-column gap-2">
                {top_room_types.map((rt, idx) => (
                  <div
                    key={idx}
                    className="p-2 border-round-lg border-1 surface-border bg-gray-50 flex justify-content-between align-items-center text-xs"
                  >
                    <div className="flex align-items-center gap-2">
                      <span className="w-1.5rem h-1.5rem border-round-circle bg-primary-100 text-primary font-bold flex align-items-center justify-content-center">
                        {idx + 1}
                      </span>
                      <div>
                        <strong className="text-900 block">{rt.nama_tipe}</strong>
                        <span className="text-500">
                          {rt.total_bookings} pesanan &bull; {rt.total_nights} malam
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="text-green-700 block">{formatCurrency(rt.total_revenue)}</strong>
                      <span className="text-500 text-xxs font-medium">Omzet Kamar</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
