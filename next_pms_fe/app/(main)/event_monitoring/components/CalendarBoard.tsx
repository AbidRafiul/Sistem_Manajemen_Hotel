'use client';

import React from 'react';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { formatCurrency } from '@/lib/tools/generalTools';

interface CalendarBoardProps {
    events: any[];
    onSelectEvent: (eventCode: string) => void;
}

export const CalendarBoard: React.FC<CalendarBoardProps> = ({ events, onSelectEvent }) => {
    // Group events by date_start
    const grouped = events.reduce((acc: any, ev: any) => {
        const dateKey = ev.date_start || 'Tanggal Lain';
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(ev);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort();

    if (sortedDates.length === 0) {
        return (
            <div className="surface-0 p-5 border-round shadow-1 text-center text-500">
                <i className="pi pi-calendar-times text-4xl mb-2 text-400"></i>
                <p className="m-0 font-medium">Tidak ada agenda event yang terjadwal dalam 30 hari ke depan.</p>
            </div>
        );
    }

    return (
        <div className="surface-0 border-round shadow-1 p-3">
            <div className="flex justify-content-between align-items-center mb-3">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-calendar text-primary text-xl"></i>
                    <div>
                        <h4 className="m-0 font-bold text-900">Agenda Kalender Event (30 Hari Mendatang)</h4>
                        <span className="text-xs text-500">Daftar reservasi ruang pertemuan dan function hall terjadwal</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-column gap-3">
                {sortedDates.map((dateStr) => (
                    <div key={dateStr} className="border-1 border-200 border-round p-3 surface-50">
                        <div className="flex align-items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-primary text-white font-bold text-xs border-round">
                                <i className="pi pi-calendar mr-1"></i>
                                {dateStr}
                            </span>
                            <span className="text-xs text-600 font-medium">
                                ({grouped[dateStr].length} Agenda Acara)
                            </span>
                        </div>

                        <div className="grid">
                            {grouped[dateStr].map((ev: any) => {
                                let severity: 'warning' | 'info' | 'success' | 'danger' | null = 'info';
                                if (ev.status_event === 'tentative') severity = 'warning';
                                if (ev.status_event === 'in_progress' || ev.status_event === 'completed') severity = 'success';
                                if (ev.status_event === 'cancelled') severity = 'danger';

                                return (
                                    <div key={ev.id} className="col-12 md:col-6 lg:col-4">
                                        <div
                                            className="surface-0 border-round p-3 shadow-1 h-full flex flex-column justify-content-between hover:shadow-2 transition-duration-200 cursor-pointer border-left-3 border-primary"
                                            onClick={() => onSelectEvent(ev.id)}
                                        >
                                            <div>
                                                <div className="flex justify-content-between align-items-start mb-2">
                                                    <span className="font-bold text-sm text-900">{ev.nama_event}</span>
                                                    <Tag value={ev.status_event?.toUpperCase()} severity={severity} className="text-xs" />
                                                </div>
                                                <div className="text-xs text-600 mb-1">
                                                    <i className="pi pi-building text-primary mr-1"></i>
                                                    <b>{ev.nama_ruang}</b>
                                                </div>
                                                <div className="text-xs text-600 mb-1">
                                                    <i className="pi pi-clock mr-1"></i>
                                                    {ev.time_start} - {ev.time_end}
                                                </div>
                                                <div className="text-xs text-600 mb-1">
                                                    <i className="pi pi-user mr-1"></i>
                                                    {ev.organizer}
                                                </div>
                                                <div className="text-xs text-500 mb-2">
                                                    <i className="pi pi-users mr-1"></i>
                                                    {ev.jumlah_tamu} Pax ({ev.layout_setup?.toUpperCase()})
                                                </div>
                                            </div>

                                            <div className="flex justify-content-between align-items-center border-top-1 border-200 pt-2 mt-2">
                                                <span className="font-bold text-xs text-primary">{formatCurrency(ev.total_biaya || 0)}</span>
                                                <Button
                                                    icon="pi pi-external-link"
                                                    label="BEO"
                                                    className="p-button-xs p-button-text p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectEvent(ev.id);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
