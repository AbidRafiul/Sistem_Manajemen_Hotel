'use client';

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { EventBooking } from '../interfaces';
import { formatCurrency } from '@/lib/tools/generalTools';

interface EventTableProps {
    data: EventBooking[];
    loading: boolean;
    onViewBeo: (event: EventBooking) => void;
    onEdit: (event: EventBooking) => void;
    onChangeStatus: (event: EventBooking) => void;
}

export const EventTable: React.FC<EventTableProps> = ({
    data,
    loading,
    onViewBeo,
    onEdit,
    onChangeStatus,
}) => {
    const statusEventBodyTemplate = (rowData: EventBooking) => {
        const status = rowData.status_event;
        let severity: 'warning' | 'info' | 'success' | 'danger' | null = 'info';
        let label = status.toUpperCase();

        switch (status) {
            case 'tentative':
                severity = 'warning';
                label = 'TENTATIVE';
                break;
            case 'confirmed':
                severity = 'info';
                label = 'CONFIRMED';
                break;
            case 'in_progress':
                severity = 'success';
                label = 'IN PROGRESS';
                break;
            case 'completed':
                severity = 'success';
                label = 'COMPLETED';
                break;
            case 'cancelled':
                severity = 'danger';
                label = 'CANCELLED';
                break;
        }

        return <Tag value={label} severity={severity} className="text-xs px-2 py-1 font-semibold" />;
    };

    const statusPembayaranBodyTemplate = (rowData: EventBooking) => {
        const payStatus = rowData.status_pembayaran;
        let severity: 'warning' | 'info' | 'success' | 'danger' | null = 'danger';
        let label = 'BELUM BAYAR';

        switch (payStatus) {
            case 'paid':
                severity = 'success';
                label = 'LUNAS';
                break;
            case 'deposit':
                severity = 'warning';
                label = 'DP / DEPOSIT';
                break;
            case 'refunded':
                severity = 'info';
                label = 'REFUNDED';
                break;
            default:
                severity = 'danger';
                label = 'BELUM BAYAR';
        }

        return (
            <div className="flex flex-column gap-1">
                <span className="font-semibold text-sm">{formatCurrency(rowData.total_biaya || 0)}</span>
                <Tag value={label} severity={severity} className="text-xs w-max" />
                {payStatus === 'deposit' && (
                    <span className="text-xs text-500">
                        Sisa: {formatCurrency(rowData.sisa_tagihan || 0)}
                    </span>
                )}
            </div>
        );
    };

    const scheduleBodyTemplate = (rowData: EventBooking) => {
        return (
            <div className="flex flex-column gap-1 text-sm">
                <span className="font-semibold text-900">
                    <i className="pi pi-calendar mr-1 text-primary text-xs"></i>
                    {rowData.tgl_mulai} {rowData.tgl_selesai !== rowData.tgl_mulai ? `s/d ${rowData.tgl_selesai}` : ''}
                </span>
                <span className="text-xs text-600">
                    <i className="pi pi-clock mr-1 text-xs"></i>
                    {rowData.jam_mulai} - {rowData.jam_selesai} ({rowData.durasi_jam} Jam)
                </span>
            </div>
        );
    };

    const roomAndLayoutTemplate = (rowData: EventBooking) => {
        return (
            <div className="flex flex-column gap-1">
                <span className="font-semibold text-900">{rowData.nama_ruang}</span>
                <div className="flex align-items-center gap-2">
                    <Tag value={rowData.layout_setup?.toUpperCase() || 'THEATER'} className="text-xs surface-200 text-700" />
                    <span className="text-xs text-500">
                        <i className="pi pi-users mr-1"></i>
                        {rowData.jumlah_tamu} Pax
                    </span>
                </div>
            </div>
        );
    };

    const organizerTemplate = (rowData: EventBooking) => {
        return (
            <div className="flex flex-column gap-1">
                <span className="font-semibold text-900">{rowData.penyelenggara}</span>
                {rowData.contact_person && (
                    <span className="text-xs text-600">
                        PIC: {rowData.contact_person} {rowData.contact_phone ? `(${rowData.contact_phone})` : ''}
                    </span>
                )}
            </div>
        );
    };

    const actionBodyTemplate = (rowData: EventBooking) => {
        const isLocked = ['completed', 'cancelled'].includes(rowData.status_event);

        return (
            <div className="flex align-items-center gap-1 justify-content-end">
                <Button
                    icon="pi pi-file-pdf"
                    className="p-button-sm p-button-outlined p-button-info p-1"
                    tooltip="Lihat / Cetak Lembar BEO"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => onViewBeo(rowData)}
                />
                {!isLocked && (
                    <>
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-sm p-button-outlined p-button-secondary p-1"
                            tooltip="Edit Pemesanan"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => onEdit(rowData)}
                        />
                        <Button
                            icon="pi pi-sliders-h"
                            className="p-button-sm p-button-outlined p-button-success p-1"
                            tooltip="Kelola Status & Pembayaran"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => onChangeStatus(rowData)}
                        />
                    </>
                )}
            </div>
        );
    };

    return (
        <DataTable
            value={data}
            loading={loading}
            dataKey="kode_reservasi_event"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            className="p-datatable-sm"
            stripedRows
            emptyMessage="Tidak ada data pemesanan ruang event yang ditemukan"
            responsiveLayout="scroll"
        >
            <Column field="kode_reservasi_event" header="Kode BEO" sortable style={{ width: '9rem' }} className="font-mono font-bold text-primary" />
            <Column field="nama_event" header="Nama Acara" sortable style={{ minWidth: '13rem' }} body={(r) => (
                <div className="flex flex-column">
                    <span className="font-semibold text-900">{r.nama_event}</span>
                    <span className="text-xs text-500 font-mono">{r.kode_reservasi_event}</span>
                </div>
            )} />
            <Column header="Ruang & Tata Letak" style={{ minWidth: '13rem' }} body={roomAndLayoutTemplate} />
            <Column header="Penyelenggara / PIC" style={{ minWidth: '13rem' }} body={organizerTemplate} />
            <Column header="Jadwal Pelaksanaan" sortable field="tgl_mulai" style={{ minWidth: '13rem' }} body={scheduleBodyTemplate} />
            <Column header="Biaya & Status Bayar" style={{ minWidth: '12rem' }} body={statusPembayaranBodyTemplate} />
            <Column header="Status Acara" align="center" style={{ width: '9rem' }} body={statusEventBodyTemplate} />
            <Column header="Aksi" align="right" style={{ width: '9rem' }} body={actionBodyTemplate} />
        </DataTable>
    );
};
