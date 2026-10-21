'use client';

import React from 'react';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';

interface TimelineMatrixProps {
    rooms: any[];
    targetDate: string;
    onSelectEvent: (eventCode: string) => void;
}

export const TimelineMatrix: React.FC<TimelineMatrixProps> = ({ rooms, targetDate, onSelectEvent }) => {
    const hours = Array.from({ length: 16 }, (_, i) => 7 + i); // 07:00 to 22:00

    if (!rooms || rooms.length === 0) {
        return (
            <div className="text-center p-5 surface-100 border-round text-500">
                Tidak ada data ruang event yang terdaftar pada cabang ini.
            </div>
        );
    }

    return (
        <div className="surface-0 border-round shadow-1 p-3 mb-4">
            <Tooltip target=".timeline-slot-occupied" position="top" />

            <div className="flex justify-content-between align-items-center mb-3">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-clock text-primary text-xl"></i>
                    <div>
                        <h4 className="m-0 font-bold text-900">Matriks Utilisasi Jam Ruang Event</h4>
                        <span className="text-xs text-500">Jadwal per jam pada tanggal: {targetDate}</span>
                    </div>
                </div>
                <div className="flex align-items-center gap-3 text-xs">
                    <span className="flex align-items-center gap-1">
                        <span className="inline-block w-1rem h-1rem border-round surface-200"></span>
                        <span className="text-600">Tersedia</span>
                    </span>
                    <span className="flex align-items-center gap-1">
                        <span className="inline-block w-1rem h-1rem border-round bg-primary"></span>
                        <span className="text-600">Terpakai (Confirmed / In-Progress)</span>
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs" style={{ minWidth: '900px' }}>
                    <thead>
                        <tr>
                            <th className="p-2 border-1 border-200 surface-100 text-left font-bold" style={{ width: '160px' }}>
                                Ruangan
                            </th>
                            {hours.map((h) => (
                                <th key={h} className="p-2 border-1 border-200 surface-100 text-center font-bold text-600">
                                    {String(h).padStart(2, '0')}:00
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((room) => (
                            <tr key={room.kode_ruang_event}>
                                <td className="p-2 border-1 border-200 font-semibold surface-50">
                                    <div className="text-sm font-bold text-900">{room.nama_ruang}</div>
                                    <div className="text-xs text-500 font-normal">Kap: {room.kapasitas} Pax</div>
                                    <Tag
                                        value={room.status_sekarang === 'in_use' ? 'IN-USE' : 'AVAILABLE'}
                                        severity={room.status_sekarang === 'in_use' ? 'warning' : 'success'}
                                        className="text-xs mt-1"
                                    />
                                </td>
                                {room.slots?.map((slot: any, idx: number) => {
                                    const isOccupied = slot.status === 'occupied';

                                    return (
                                        <td
                                            key={idx}
                                            className={`p-1 border-1 border-200 text-center ${
                                                isOccupied
                                                    ? 'bg-primary text-white cursor-pointer hover:bg-primary-600 timeline-slot-occupied'
                                                    : 'surface-0 hover:surface-100'
                                            }`}
                                            data-pr-tooltip={
                                                isOccupied
                                                    ? `${slot.event_name} (${slot.event_code}) - Penyelenggara: ${slot.organizer}`
                                                    : 'Tersedia'
                                            }
                                            onClick={() => isOccupied && slot.event_code && onSelectEvent(slot.event_code)}
                                        >
                                            {isOccupied && (
                                                <div className="text-xs font-bold truncate px-1" title={slot.event_name}>
                                                    {slot.event_name?.slice(0, 8)}...
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
