'use client';

import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { TableProps, RoomStatusData } from '../interfaces';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { ToggleButton } from 'primereact/togglebutton';
import { apiEndpointStartTask, apiEndpointCompleteTask, apiEndpointVerifyTask } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const Table = ({ state, setState, toast, getData }: TableProps) => {
    const [cabangList, setCabangList] = useState<any[]>([]);

    const fetchCabang = async (keyword = '') => {
        try {
            const res = await postData('/master/cabang/cabang-data', {
                perPage: 50,
                keyword: keyword
            });
            const cabangs = res?.data?.data || [];
            setCabangList(cabangs);
            if (cabangs.length > 0 && !state.kode_cabang) {
                setState(p => ({ ...p, kode_cabang: cabangs[0].kode_cabang }));
            }
        } catch (error) {
            console.error('Gagal mengambil data cabang:', error);
        }
    };

    useEffect(() => {
        fetchCabang();
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setState((p) => ({
            ...p,
            filters: {
                ...p.filters,
                global: { ...p.filters.global, value }
            },
            searchVal: value
        }));
    };

    const toggleReadyToSell = (e: any) => {
        setState((p) => ({
            ...p,
            filters: {
                ...p.filters,
                ready_to_sell: { ...p.filters.ready_to_sell, value: e.value ? true : null }
            }
        }));
    };

    const handleStart = async (kode_task: string) => {
        try {
            setState((p) => ({ ...p, load: true }));
            const res = await postData(apiEndpointStartTask(kode_task), {}, { 'X-Level': '1' });
            showSuccess(toast, res?.data?.message || 'Task dimulai');
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memulai task');
            setState((p) => ({ ...p, load: false }));
        }
    };

    const handleComplete = async (kode_task: string) => {
        try {
            setState((p) => ({ ...p, load: true }));
            const res = await postData(apiEndpointCompleteTask(kode_task), {}, { 'X-Level': '1' });
            showSuccess(toast, res?.data?.message || 'Task selesai (menunggu inspeksi)');
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menyelesaikan task');
            setState((p) => ({ ...p, load: false }));
        }
    };

    const handleVerify = async (kode_task: string) => {
        try {
            setState((p) => ({ ...p, load: true }));
            const res = await postData(apiEndpointVerifyTask(kode_task), {}, { 'X-Level': '1' });
            showSuccess(toast, res?.data?.message || 'Task diverifikasi');
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memverifikasi task');
            setState((p) => ({ ...p, load: false }));
        }
    };

    const occupancyBodyTemplate = (rowData: RoomStatusData) => {
        const status = rowData.occupancy_status;
        let severity: 'success' | 'warning' | 'danger' | 'info' | undefined;
        if (status === 'vacant') severity = 'success';
        else if (status === 'occupied') severity = 'danger';
        else severity = 'warning';

        return <Tag value={status.toUpperCase()} severity={severity} />;
    };

    const hkBodyTemplate = (rowData: RoomStatusData) => {
        const status = rowData.housekeeping_status;
        let severity: 'success' | 'warning' | 'danger' | 'info' | undefined;
        if (status === 'clean') severity = 'success';
        else if (status === 'dirty') severity = 'danger';
        else if (status === 'inspection') severity = 'warning';
        else severity = 'warning';

        return <Tag value={status.toUpperCase()} severity={severity} />;
    };

    const taskBodyTemplate = (rowData: RoomStatusData) => {
        if (!rowData.task_status) return <span className="text-gray-500">-</span>;
        
        const status = rowData.task_status;
        let severity: 'success' | 'warning' | 'danger' | 'info' | undefined;
        if (status === 'assigned') severity = 'info';
        else if (status === 'in_progress') severity = 'warning';
        else severity = 'success';

        return (
            <div className="flex flex-column gap-1">
                <Tag value={status.toUpperCase()} severity={severity} />
                <small className="text-gray-600">{rowData.assigned_to_name}</small>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: RoomStatusData) => {
        return (
            <div className="flex gap-2">
                <Button 
                    label={rowData.kode_housekeeping_task ? "Re-assign" : "Assign"} 
                    icon="pi pi-user" 
                    size="small"
                    outlined
                    disabled={!rowData.kode_housekeeping_task || (rowData.task_status !== null && !['assigned', 'in_progress'].includes(rowData.task_status))}
                    onClick={() => setState((p) => ({ ...p, actionDialogVisible: true, selectedRoom: rowData }))}
                />
                
                {rowData.task_status === 'assigned' && (
                    <Button 
                        label="Start" 
                        icon="pi pi-play" 
                        size="small"
                        severity="info"
                        onClick={() => handleStart(rowData.kode_housekeeping_task!)}
                    />
                )}
                
                {rowData.task_status === 'in_progress' && (
                    <Button 
                        label="Complete" 
                        icon="pi pi-check" 
                        size="small"
                        severity="warning"
                        onClick={() => handleComplete(rowData.kode_housekeeping_task!)}
                    />
                )}

                {rowData.task_status === 'finished' && (
                    <Button 
                        label="Verify" 
                        icon="pi pi-verified" 
                        size="small"
                        severity="success"
                        onClick={() => handleVerify(rowData.kode_housekeeping_task!)}
                    />
                )}

                {(rowData.task_status === 'assigned' || rowData.task_status === 'in_progress') && (
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        size="small"
                        severity="danger"
                        outlined
                        onClick={() => setState((p) => ({ ...p, cancelDialogVisible: true, selectedRoom: rowData }))}
                    />
                )}

                <Button 
                    icon="pi pi-history" 
                    size="small"
                    outlined
                    severity="secondary"
                    tooltip="Riwayat Pembersihan"
                    onClick={() => setState((p) => ({ ...p, historyDialogVisible: true, historyRoom: rowData }))}
                />
            </div>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row justify-content-between gap-3">
            <div className="flex gap-3 w-full md:w-auto">
                <Dropdown
                    value={state.kode_cabang}
                    options={cabangList}
                    onChange={(e) => setState(p => ({ ...p, kode_cabang: e.value }))}
                    optionLabel="name"
                    optionValue="kode_cabang"
                    placeholder="Semua Cabang"
                    filter
                    showClear
                    onFilter={(e) => fetchCabang(e.filter)}
                    className="w-full md:w-15rem"
                    emptyMessage="Cabang tidak ditemukan"
                    emptyFilterMessage="Cabang tidak ditemukan"
                />
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText 
                        value={state.searchVal} 
                        onChange={onGlobalFilterChange} 
                        placeholder="Cari kamar..." 
                        className="w-full"
                    />
                </span>
            </div>
            <div className="flex gap-2">
                <Button 
                    label="Riwayat Pembersihan" 
                    icon="pi pi-history" 
                    severity="info" 
                    outlined
                    onClick={() => setState((p) => ({ ...p, historyDialogVisible: true, historyRoom: null }))}
                />
                <ToggleButton 
                    checked={!!state.filters.ready_to_sell?.value} 
                    onChange={toggleReadyToSell} 
                    onLabel="Ready to Sell Saja" 
                    offLabel="Tampilkan Semua" 
                    onIcon="pi pi-check" 
                    offIcon="pi pi-times" 
                    className="w-full sm:w-15rem" 
                />
            </div>
        </div>
    );

    return (
        <div className="card">
            <DataTable 
                value={state.data} 
                loading={state.load}
                paginator 
                rows={10} 
                rowsPerPageOptions={[10, 25, 50]}
                filters={state.filters}
                globalFilterFields={['nomor_kamar', 'assigned_to_name']}
                header={header}
                emptyMessage="Tidak ada data kamar."
                responsiveLayout="scroll"
                stripedRows
            >
                <Column field="nomor_kamar" header="Nomor Kamar" sortable style={{ width: '15%' }}></Column>
                <Column field="occupancy_status" header="Occupancy" body={occupancyBodyTemplate} sortable style={{ width: '15%' }}></Column>
                <Column field="housekeeping_status" header="Housekeeping" body={hkBodyTemplate} sortable style={{ width: '15%' }}></Column>
                <Column field="task_status" header="Task Terkini" body={taskBodyTemplate} style={{ width: '20%' }}></Column>
                <Column body={actionBodyTemplate} header="Aksi" style={{ width: '35%' }}></Column>
            </DataTable>
        </div>
    );
};

export default Table;
