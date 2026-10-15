/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file dashboard_header.tsx
 * @description Header toolbar Dashboard Utama: nama hotel, status business date, indikator branch, dan aksi cepat
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';

interface DashboardHeaderProps {
  hotelName: string;
  kodeCabang: string;
  businessDate: string;
  userRole?: string;
  loading: boolean;
  onRefresh: () => void;
  hasAuditAlert?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  hotelName,
  kodeCabang,
  businessDate,
  userRole,
  loading,
  onRefresh,
  hasAuditAlert,
}) => {
  const router = useRouter();

  const formattedDate = businessDate
    ? new Date(businessDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  return (
    <div className="surface-card p-4 border-round-xl shadow-1 border-1 surface-border mb-4">
      <div className="flex flex-column lg:flex-row justify-content-between align-items-start lg:align-items-center gap-3">
        <div>
          <div className="flex align-items-center gap-2 flex-wrap">
            <i className="pi pi-chart-line text-primary text-2xl"></i>
            <h1 className="text-2xl font-bold text-900 m-0">Dashboard Manajemen Hotel</h1>
            {userRole && (
              <Tag
                value={userRole.toUpperCase().replace('_', ' ')}
                severity="info"
                className="font-medium text-xs ml-1"
              />
            )}
          </div>
          <p className="text-sm text-color-secondary mt-1 mb-0">
            Ringkasan performa finansial, indikator hunian, dan status operasional properti.
          </p>
        </div>

        <div className="flex align-items-center gap-2 flex-wrap w-full lg:w-auto justify-content-start lg:justify-content-end">
          {/* Active Branch Info */}
          <div className="flex align-items-center gap-2 bg-white px-3 py-2 border-round-lg border-1 surface-border shadow-none">
            <i className="pi pi-building text-primary font-bold"></i>
            <span className="text-sm font-bold text-900">
              {kodeCabang ? `${kodeCabang} - ${hotelName || 'Properti'}` : 'Pilih Cabang'}
            </span>
          </div>

          {/* Business Date Pill */}
          <div
            className={`flex align-items-center gap-2 px-3 py-2 border-round-lg border-1 ${
              hasAuditAlert
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            <i className={`pi ${hasAuditAlert ? 'pi-exclamation-triangle' : 'pi-calendar'} font-bold`}></i>
            <div className="flex flex-column">
              <span className="text-xs uppercase font-semibold text-500 line-height-1">Business Date</span>
              <span className="text-xs font-bold line-height-2 mt-1">{formattedDate}</span>
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            icon="pi pi-refresh"
            className="p-button-outlined p-button-sm"
            onClick={onRefresh}
            tooltip="Muat ulang seluruh metrik dashboard"
            tooltipOptions={{ position: 'top' }}
            loading={loading}
          />

          {/* Quick Shortcuts */}
          <Button
            label="Front Office"
            icon="pi pi-desktop"
            className="p-button-sm p-button-outlined font-semibold"
            onClick={() => router.push('/front_office')}
          />
          <Button
            label="Housekeeping"
            icon="pi pi-home"
            className="p-button-sm p-button-outlined font-semibold"
            onClick={() => router.push('/housekeeping/room_status_board')}
          />
        </div>
      </div>
    </div>
  );
};
