/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file upcoming_events.tsx
 * @description Komponen agenda acara dan penggunaan ruang pertemuan / event 7 hari ke depan
 *              (Meeting room, Ballroom, Function hall) beserta penyelenggara dan status acara.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { DashboardUpcomingEventsResponse } from './interfaces';

interface UpcomingEventsProps {
  data: DashboardUpcomingEventsResponse | null;
  loading: boolean;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
        <Skeleton width="40%" height="1.5rem" className="mb-3" />
        <Skeleton width="100%" height="8rem" className="border-round-lg" />
      </div>
    );
  }

  const { events, total_events } = data;

  const getStatusSeverity = (st: string): 'success' | 'info' | 'warning' | 'danger' => {
    const s = st.toLowerCase();
    if (s === 'confirmed' || s === 'selesai' || s === 'done') return 'success';
    if (s === 'ongoing' || s === 'berlangsung') return 'info';
    if (s === 'tentative' || s === 'booked' || s === 'pending') return 'warning';
    return 'info';
  };

  return (
    <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
      <div className="flex justify-content-between align-items-center mb-3">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-calendar text-primary text-xl"></i>
          <h2 className="text-lg font-bold text-900 m-0">Agenda Ruang Event & Meeting (7 Hari ke Depan)</h2>
          <Tag value={`${total_events} Acara`} severity="info" className="ml-1" />
        </div>
        <span className="text-xs text-500 font-medium">Berdasarkan Reservasi Event Aktif</span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 border-round-lg border-1 surface-border text-500 text-xs">
          <i className="pi pi-calendar-times text-3xl mb-2 text-400 block"></i>
          Tidak ada reservasi ruang pertemuan atau event yang dijadwalkan dalam 7 hari ke depan.
        </div>
      ) : (
        <div className="grid">
          {events.map((ev, idx) => (
            <div key={idx} className="col-12 sm:col-6 lg:col-4">
              <div className="p-3 border-round-lg border-1 surface-border bg-gray-50 h-full flex flex-column justify-content-between">
                <div>
                  <div className="flex justify-content-between align-items-start gap-2 mb-2">
                    <strong className="text-sm text-900">{ev.nama_ruang}</strong>
                    <Tag value={ev.status_event.toUpperCase()} severity={getStatusSeverity(ev.status_event)} className="text-xxs" />
                  </div>
                  <div className="text-xs text-700 flex flex-column gap-1">
                    <div>
                      <i className="pi pi-calendar mr-1 text-primary text-xs"></i>
                      <span>{ev.tgl_mulai} {ev.tgl_mulai !== ev.tgl_selesai ? ` s/d ${ev.tgl_selesai}` : ''}</span>
                    </div>
                    <div>
                      <i className="pi pi-clock mr-1 text-primary text-xs"></i>
                      <span>{ev.jam_mulai} - {ev.jam_selesai} WIB</span>
                    </div>
                    <div>
                      <i className="pi pi-users mr-1 text-primary text-xs"></i>
                      <span>{ev.jumlah_tamu} pax peserta</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-top-1 surface-border text-xs text-600">
                  <span className="text-500 block text-xxs">Penyelenggara:</span>
                  <strong className="text-800">{ev.organizer}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
