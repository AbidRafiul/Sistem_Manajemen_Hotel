'use client';

import React from 'react';

interface QuickStatusCardsProps {
    summary: {
        total_rooms: number;
        in_use_now: number;
        available_now: number;
        today_events_count: number;
        expected_guests_today: number;
    };
    businessDate: string;
}

export const QuickStatusCards: React.FC<QuickStatusCardsProps> = ({ summary, businessDate }) => {
    return (
        <div className="grid mb-4">
            {/* Card 1: Ruang Sedang Digunakan Saat Ini */}
            <div className="col-12 sm:col-6 lg:col-3">
                <div className="card shadow-1 p-3 border-round surface-0 border-left-3 border-orange-500">
                    <div className="flex justify-content-between mb-2">
                        <div>
                            <span className="block text-500 font-medium text-xs mb-1 uppercase tracking-wider">
                                Ruang Terpakai Sekarang
                            </span>
                            <div className="text-900 font-bold text-2xl">
                                {summary.in_use_now} <span className="text-sm font-normal text-500">/ {summary.total_rooms} Ruang</span>
                            </div>
                        </div>
                        <div
                            className="flex align-items-center justify-content-center bg-orange-100 border-round"
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                            <i className="pi pi-users text-orange-600 text-xl"></i>
                        </div>
                    </div>
                    <span className="text-orange-600 text-xs font-semibold">
                        <i className="pi pi-clock mr-1"></i>
                        Sedang Berlangsung
                    </span>
                </div>
            </div>

            {/* Card 2: Total Agenda Acara Hari Ini */}
            <div className="col-12 sm:col-6 lg:col-3">
                <div className="card shadow-1 p-3 border-round surface-0 border-left-3 border-primary">
                    <div className="flex justify-content-between mb-2">
                        <div>
                            <span className="block text-500 font-medium text-xs mb-1 uppercase tracking-wider">
                                Agenda Hari Ini
                            </span>
                            <div className="text-900 font-bold text-2xl">
                                {summary.today_events_count} <span className="text-sm font-normal text-500">Acara</span>
                            </div>
                        </div>
                        <div
                            className="flex align-items-center justify-content-center bg-blue-100 border-round"
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                            <i className="pi pi-calendar text-blue-600 text-xl"></i>
                        </div>
                    </div>
                    <span className="text-600 text-xs">
                        <i className="pi pi-calendar-plus mr-1"></i>
                        Tanggal: {businessDate || 'Hari ini'}
                    </span>
                </div>
            </div>

            {/* Card 3: Ruang Kosong / Siap Pakai */}
            <div className="col-12 sm:col-6 lg:col-3">
                <div className="card shadow-1 p-3 border-round surface-0 border-left-3 border-green-500">
                    <div className="flex justify-content-between mb-2">
                        <div>
                            <span className="block text-500 font-medium text-xs mb-1 uppercase tracking-wider">
                                Ruang Siap / Kosong
                            </span>
                            <div className="text-900 font-bold text-2xl text-green-700">
                                {summary.available_now} <span className="text-sm font-normal text-500">Ruang</span>
                            </div>
                        </div>
                        <div
                            className="flex align-items-center justify-content-center bg-green-100 border-round"
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                            <i className="pi pi-check-circle text-green-600 text-xl"></i>
                        </div>
                    </div>
                    <span className="text-green-600 text-xs font-semibold">
                        <i className="pi pi-check mr-1"></i>
                        Tersedia untuk Booking
                    </span>
                </div>
            </div>

            {/* Card 4: Estimasi Total Tamu Hari Ini */}
            <div className="col-12 sm:col-6 lg:col-3">
                <div className="card shadow-1 p-3 border-round surface-0 border-left-3 border-indigo-500">
                    <div className="flex justify-content-between mb-2">
                        <div>
                            <span className="block text-500 font-medium text-xs mb-1 uppercase tracking-wider">
                                Estimasi Tamu Hari Ini
                            </span>
                            <div className="text-900 font-bold text-2xl text-indigo-700">
                                {summary.expected_guests_today} <span className="text-sm font-normal text-500">Orang / Pax</span>
                            </div>
                        </div>
                        <div
                            className="flex align-items-center justify-content-center bg-indigo-100 border-round"
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        >
                            <i className="pi pi-user-plus text-indigo-600 text-xl"></i>
                        </div>
                    </div>
                    <span className="text-indigo-600 text-xs font-semibold">
                        <i className="pi pi-chart-line mr-1"></i>
                        Total Banquet Covers
                    </span>
                </div>
            </div>
        </div>
    );
};
