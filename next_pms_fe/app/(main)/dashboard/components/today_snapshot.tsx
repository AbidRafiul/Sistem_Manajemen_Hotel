/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file today_snapshot.tsx
 * @description Ringkasan operasional hari ini: Kedatangan (Arrivals), Keberangkatan (Departures),
 *              Tamu Menginap (In-House), dan Kesiapan Fisik Kamar (Clean/Dirty/OOO) dengan link aksi langsung.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { DashboardTodayResponse } from './interfaces';

interface TodaySnapshotProps {
  data: DashboardTodayResponse | null;
  loading: boolean;
}

export const TodaySnapshot: React.FC<TodaySnapshotProps> = ({ data, loading }) => {
  const router = useRouter();

  if (loading || !data) {
    return (
      <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
        <Skeleton width="40%" height="1.5rem" className="mb-3" />
        <div className="grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-12 sm:col-6 lg:col-3">
              <Skeleton width="100%" height="8rem" className="border-round-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { arrivals, departures, in_house, rooms } = data;

  return (
    <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
      <div className="flex justify-content-between align-items-center mb-3">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-compass text-primary text-xl"></i>
          <h2 className="text-lg font-bold text-900 m-0">Ringkasan Operasional Hari Ini</h2>
        </div>
        <span className="text-xs text-500 font-medium">Snapshot Real-Time Business Date</span>
      </div>

      <div className="grid">
        {/* 1. ARRIVALS */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="p-3 border-round-xl border-1 surface-border bg-gray-50 h-full flex flex-column justify-content-between hover:surface-hover transition-colors transition-duration-150">
            <div>
              <div className="flex justify-content-between align-items-start mb-2">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Kedatangan (Arrivals)
                </span>
                <div className="w-2rem h-2rem border-round bg-teal-100 flex align-items-center justify-content-center">
                  <i className="pi pi-sign-in text-teal-700 text-sm"></i>
                </div>
              </div>
              <div className="flex align-items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-teal-900">{arrivals.expected}</span>
                <span className="text-xs text-500">reservasi total</span>
              </div>
              <div className="flex flex-column gap-1 text-xs text-700">
                <div className="flex justify-content-between">
                  <span>Sudah Tiba:</span>
                  <strong className="text-green-700">{arrivals.arrived}</strong>
                </div>
                <div className="flex justify-content-between">
                  <span>Belum Check-In:</span>
                  <strong className="text-orange-700">{arrivals.pending} ({arrivals.guests_pending} tamu)</strong>
                </div>
              </div>
            </div>

            <Button
              label="Proses Check-In"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="p-button-text p-button-sm p-0 text-xs font-bold text-teal-700 mt-3 align-self-start"
              onClick={() => router.push('/reservasi_checkin')}
            />
          </div>
        </div>

        {/* 2. DEPARTURES */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="p-3 border-round-xl border-1 surface-border bg-gray-50 h-full flex flex-column justify-content-between hover:surface-hover transition-colors transition-duration-150">
            <div>
              <div className="flex justify-content-between align-items-start mb-2">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  Keberangkatan (Departures)
                </span>
                <div className="w-2rem h-2rem border-round bg-blue-100 flex align-items-center justify-content-center">
                  <i className="pi pi-sign-out text-blue-700 text-sm"></i>
                </div>
              </div>
              <div className="flex align-items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-blue-900">{departures.expected}</span>
                <span className="text-xs text-500">reservasi total</span>
              </div>
              <div className="flex flex-column gap-1 text-xs text-700">
                <div className="flex justify-content-between">
                  <span>Sudah Checkout:</span>
                  <strong className="text-green-700">{departures.departed}</strong>
                </div>
                <div className="flex justify-content-between">
                  <span>Belum Checkout:</span>
                  <strong className="text-blue-700">{departures.pending} ({departures.guests_pending} tamu)</strong>
                </div>
              </div>
            </div>

            <Button
              label="Kasir Checkout"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="p-button-text p-button-sm p-0 text-xs font-bold text-blue-700 mt-3 align-self-start"
              onClick={() => router.push('/checkout')}
            />
          </div>
        </div>

        {/* 3. IN-HOUSE */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="p-3 border-round-xl border-1 surface-border bg-gray-50 h-full flex flex-column justify-content-between hover:surface-hover transition-colors transition-duration-150">
            <div>
              <div className="flex justify-content-between align-items-start mb-2">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Tamu Menginap (In-House)
                </span>
                <div className="w-2rem h-2rem border-round bg-indigo-100 flex align-items-center justify-content-center">
                  <i className="pi pi-users text-indigo-700 text-sm"></i>
                </div>
              </div>
              <div className="flex align-items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-indigo-900">{in_house.rooms}</span>
                <span className="text-xs text-500">kamar aktif terisi</span>
              </div>
              <div className="flex flex-column gap-1 text-xs text-700">
                <div className="flex justify-content-between">
                  <span>Total Tamu (Pax):</span>
                  <strong className="text-indigo-800">{in_house.guests} orang</strong>
                </div>
                <div className="flex justify-content-between">
                  <span>Kapasitas Terpakai:</span>
                  <strong className="text-700">
                    {rooms.available > 0 ? Math.round((in_house.rooms / rooms.available) * 100) : 0}%
                  </strong>
                </div>
              </div>
            </div>

            <Button
              label="Daftar Tamu In-House"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="p-button-text p-button-sm p-0 text-xs font-bold text-indigo-700 mt-3 align-self-start"
              onClick={() => router.push('/tamu_menginap')}
            />
          </div>
        </div>

        {/* 4. ROOM READINESS */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="p-3 border-round-xl border-1 surface-border bg-gray-50 h-full flex flex-column justify-content-between hover:surface-hover transition-colors transition-duration-150">
            <div>
              <div className="flex justify-content-between align-items-start mb-2">
                <span className="text-xs font-bold text-green-800 uppercase tracking-wider">
                  Kesiapan Kamar (Readiness)
                </span>
                <div className="w-2rem h-2rem border-round bg-green-100 flex align-items-center justify-content-center">
                  <i className="pi pi-home text-green-700 text-sm"></i>
                </div>
              </div>
              <div className="flex align-items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-green-900">{rooms.vacant_clean}</span>
                <span className="text-xs text-500">kamar siap jual</span>
              </div>
              <div className="flex flex-column gap-1 text-xs text-700">
                <div className="flex justify-content-between">
                  <span>Perlu Dibersihkan:</span>
                  <strong className="text-orange-700">{rooms.vacant_dirty}</strong>
                </div>
                <div className="flex justify-content-between">
                  <span>Perawatan / OOO:</span>
                  <strong className="text-red-700">{rooms.ooo}</strong>
                </div>
              </div>
            </div>

            <Button
              label="Board Housekeeping"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="p-button-text p-button-sm p-0 text-xs font-bold text-green-700 mt-3 align-self-start"
              onClick={() => router.push('/housekeeping/room_status_board')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
