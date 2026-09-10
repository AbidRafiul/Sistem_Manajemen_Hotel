'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { HistoryDialogProps, HousekeepingHistoryItem } from '../interfaces';
import { apiEndpointGetHousekeepingHistory } from '../endpoints';
import postData from '@/lib/axios/postData';

const HistoryDialog: React.FC<HistoryDialogProps> = ({ visible, onHide, kodeCabang, selectedRoom }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [historyData, setHistoryData] = useState<HousekeepingHistoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [filterByRoom, setFilterByRoom] = useState<boolean>(!!selectedRoom);

    const statusOptions = [
        { label: 'Semua Status', value: '' },
        { label: 'Disetujui SPV (Approved)', value: 'supervisor_approved' },
        { label: 'Selesai (Menunggu Inspeksi)', value: 'finished' },
        { label: 'Sedang Dikerjakan (In Progress)', value: 'in_progress' },
        { label: 'Ditugaskan (Assigned)', value: 'assigned' },
        { label: 'Dibatalkan (Cancelled)', value: 'cancelled' }
    ];

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const payload: any = {
                cabang: kodeCabang,
                status: statusFilter || undefined,
                search: searchTerm || undefined
            };

            if (filterByRoom && selectedRoom?.kode_kamar) {
                payload.kode_kamar = selectedRoom.kode_kamar;
            }

            const res = await postData(apiEndpointGetHousekeepingHistory, payload, { 'X-Level': '1' });
            setHistoryData(res?.data?.data || []);
        } catch (error) {
            console.error('Gagal mengambil data riwayat housekeeping:', error);
            setHistoryData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            setFilterByRoom(!!selectedRoom);
            fetchHistory();
        }
    }, [visible, kodeCabang, selectedRoom, statusFilter, filterByRoom]);

    const formatDateTime = (val: string | null) => {
        if (!val) return '-';
        const d = new Date(val);
        if (isNaN(d.getTime())) return val;
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusBodyTemplate = (rowData: HousekeepingHistoryItem) => {
        let severity: 'success' | 'warning' | 'danger' | 'info' | undefined;
        let label = rowData.status;

        switch (rowData.status) {
            case 'supervisor_approved':
                severity = 'success';
                label = 'Disetujui SPV';
                break;
            case 'finished':
                severity = 'info';
                label = 'Menunggu Inspeksi';
                break;
            case 'in_progress':
                severity = 'warning';
                label = 'Sedang Dikerjakan';
                break;
            case 'assigned':
                severity = undefined;
                label = 'Ditugaskan';
                break;
            case 'cancelled':
                severity = 'danger';
                label = 'Dibatalkan';
                break;
        }

        return <Tag value={label} severity={severity} />;
    };

    const roomBodyTemplate = (rowData: HousekeepingHistoryItem) => {
        return (
            <div>
                <span className="font-bold text-900">{rowData.nomor_kamar || rowData.kode_kamar}</span>
                {rowData.nama_tipe_kamar && (
                    <div className="text-xs text-500">{rowData.nama_tipe_kamar}</div>
                )}
            </div>
        );
    };

    const staffBodyTemplate = (rowData: HousekeepingHistoryItem) => {
        return (
            <div className="flex align-items-center gap-2">
                <i className="pi pi-user text-primary" />
                <span className="font-medium text-900">{rowData.assigned_to_name || '-'}</span>
            </div>
        );
    };

    const timingBodyTemplate = (rowData: HousekeepingHistoryItem) => {
        return (
            <div className="text-xs line-height-2">
                <div>
                    <span className="text-500 font-medium">Mulai: </span>
                    <span className="text-800">{rowData.started_at ? formatDateTime(rowData.started_at) : '-'}</span>
                </div>
                <div>
                    <span className="text-500 font-medium">Selesai: </span>
                    <span className="text-800">{rowData.finished_at ? formatDateTime(rowData.finished_at) : '-'}</span>
                </div>
                {rowData.duration_minutes !== null && (
                    <div className="mt-1">
                        <Tag 
                            value={`Durasi: ${rowData.duration_minutes} menit`} 
                            severity={rowData.duration_minutes > 45 ? 'warning' : 'success'} 
                            style={{ fontSize: '11px', padding: '2px 6px' }}
                        />
                    </div>
                )}
            </div>
        );
    };

    const supervisorBodyTemplate = (rowData: HousekeepingHistoryItem) => {
        if (!rowData.supervisor_name && !rowData.approved_at) {
            return <span className="text-400 text-xs">-</span>;
        }
        return (
            <div className="text-xs line-height-2">
                <div className="font-semibold text-green-700 flex align-items-center gap-1">
                    <i className="pi pi-check-circle" style={{ fontSize: '11px' }} />
                    {rowData.supervisor_name || 'Supervisor'}
                </div>
                <div className="text-500">{formatDateTime(rowData.approved_at)}</div>
            </div>
        );
    };

    const noteBodyTemplate = (rowData: HousekeepingHistoryItem) => {
        if (rowData.status === 'cancelled' && rowData.cancel_reason) {
            return (
                <div className="text-xs text-red-600">
                    <i className="pi pi-exclamation-circle mr-1" />
                    {rowData.cancel_reason}
                </div>
            );
        }
        return <span className="text-400 text-xs">-</span>;
    };

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-history text-primary text-xl" />
                    <div>
                        <div className="font-bold text-lg">Riwayat & Audit Trail Pembersihan Kamar</div>
                        <div className="text-sm text-500 font-normal">
                            Log aktivitas PIC Housekeeping dan riwayat verifikasi supervisor untuk akuntabilitas operasional.
                        </div>
                    </div>
                </div>
            }
            style={{ width: '85vw', maxWidth: '1200px' }}
            modal
            maximizable
        >
            <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3 mb-3">
                <div className="flex flex-wrap align-items-center gap-2 w-full md:w-auto">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
                            placeholder="Cari kamar / PIC / task..."
                            className="p-inputtext-sm"
                        />
                    </span>
                    <Dropdown
                        value={statusFilter}
                        options={statusOptions}
                        onChange={(e) => setStatusFilter(e.value)}
                        placeholder="Filter Status"
                        className="p-inputtext-sm w-15rem"
                    />
                    <Button
                        icon="pi pi-search"
                        size="small"
                        severity="secondary"
                        onClick={fetchHistory}
                        tooltip="Cari Data"
                    />
                </div>

                <div className="flex align-items-center gap-2">
                    {selectedRoom && (
                        <Button
                            label={filterByRoom ? `Kamar: ${selectedRoom.nomor_kamar} (Aktif)` : `Semua Kamar`}
                            icon={filterByRoom ? "pi pi-filter-fill" : "pi pi-filter"}
                            size="small"
                            severity={filterByRoom ? undefined : "secondary"}
                            outlined={!filterByRoom}
                            onClick={() => setFilterByRoom(!filterByRoom)}
                            tooltip="Klik untuk beralih antara kamar ini dan semua kamar"
                        />
                    )}
                    <Button
                        icon="pi pi-refresh"
                        size="small"
                        outlined
                        severity="secondary"
                        onClick={fetchHistory}
                        tooltip="Segarkan Data"
                    />
                </div>
            </div>

            <DataTable
                value={historyData}
                loading={loading}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="Belum ada riwayat aktivitas pembersihan kamar."
                responsiveLayout="scroll"
                stripedRows
                size="small"
            >
                <Column header="Kamar" body={roomBodyTemplate} sortable field="nomor_kamar" style={{ width: '12%' }} />
                <Column header="Petugas (PIC)" body={staffBodyTemplate} sortable field="assigned_to_name" style={{ width: '18%' }} />
                <Column header="Status" body={statusBodyTemplate} sortable field="status" style={{ width: '15%' }} />
                <Column header="Waktu Pengerjaan & Durasi" body={timingBodyTemplate} style={{ width: '25%' }} />
                <Column header="Verifikasi SPV" body={supervisorBodyTemplate} style={{ width: '18%' }} />
                <Column header="Catatan" body={noteBodyTemplate} style={{ width: '12%' }} />
            </DataTable>
        </Dialog>
    );
};

export default HistoryDialog;
