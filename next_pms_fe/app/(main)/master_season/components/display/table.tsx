'use client';

import { DataTable } from 'primereact/datatable';
import { TableData, TableProps } from '../interfaces';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import Form from './form';
import { apiEndpointGet } from '../endpoints';
import { useRef } from 'react';

const Table = ({ dataRekap, setDataRekap, state, setState, formik, toast, getData, getPrintData, onLazyLoad }: TableProps) => {
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Daftar Season</span>

            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <span className="p-input-icon-left w-full md:w-20rem">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={state.searchVal}
                            className="w-full"
                            placeholder="Cari Season..."
                            onChange={(e) => {
                                const value = e.target.value;
                                setState((p) => ({ ...p, searchVal: value }));

                                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                searchTimeoutRef.current = setTimeout(() => {
                                    setState((p) => ({ ...p, keyword: value, page: 1, first: 0 }));
                                }, 500);
                            }}
                        />
                    </IconField>
                </span>
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    outlined
                    severity="danger"
                    tooltip="Reset Semua Filter"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={() => {
                        setState((p) => ({
                            ...p,
                            searchVal: '',
                            keyword: '',
                            page: 1,
                            first: 0
                        }));
                    }}
                />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData: TableData) => (
        <div className="flex justify-content-center gap-2">
            <Button
                icon="pi pi-pencil"
                outlined
                className="p-button-sm"
                onClick={() => {
                    formik.setValues({
                        kode_musim: rowData.kode_musim || '',
                        kode_cabang: rowData.kode_cabang || '',
                        nama_musim: rowData.nama_musim || '',
                        tanggal_mulai: rowData.tanggal_mulai ? new Date(rowData.tanggal_mulai).toISOString().split('T')[0] : '',
                        tanggal_selesai: rowData.tanggal_selesai ? new Date(rowData.tanggal_selesai).toISOString().split('T')[0] : '',
                        hari_berlaku: rowData.hari_berlaku || '',
                        is_active: rowData.is_active !== undefined ? rowData.is_active : 1
                    });
                    setState((p) => ({ ...p, add: false, delete: false, edit: true }));
                }}
                tooltip="Edit Season"
            />
            <Button
                icon="pi pi-trash"
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => setState((p) => ({ ...p, delete: true, selectedDatas: [rowData] }))}
                tooltip="Hapus Season"
            />
        </div>
    );

    const activeStatusBodyTemplate = (rowData: TableData) => (
        <Tag
            value={rowData.is_active === 1 ? 'Aktif' : 'Non-Aktif'}
            severity={rowData.is_active === 1 ? 'success' : 'danger'}
        />
    );

    const dateBodyTemplate = (dateString: string) => {
        if (!dateString) return '-';
        // Date strings are usually YYYY-MM-DD from the DB for date fields
        // Let's just return it nicely or use our tool
        return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <>
            <div className="card">
                <div className="flex justify-content-between items-start mb-6">
                    <div className="flex flex-column">
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2">
                            <i className="pi pi-calendar text-blue-600 text-3xl"></i>Master Season
                        </h3>
                        <p className="text-gray-500">Kelola pengaturan musim (season) seperti High Season, Low Season.</p>
                    </div>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-2 mb-4">
                    <Button
                        size="small"
                        label="Baru"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => {
                            formik.resetForm();
                            formik.setValues({
                                kode_cabang: '',
                                nama_musim: '',
                                tanggal_mulai: '',
                                tanggal_selesai: '',
                                hari_berlaku: '',
                                is_active: 1
                            });
                            setState((p) => ({ ...p, selectedDatas: [], add: true, edit: false }));
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button size="small" label="Cetak" icon="pi pi-print" outlined onClick={() => getPrintData(apiEndpointGet)} loading={dataRekap.load} />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label={`Hapus${state.selectedDatas.length > 0 ? ` (${state.selectedDatas.length})` : ''}`}
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={() => {
                            if (state.selectedDatas.length < 1) {
                                setState((p) => ({ ...p, selectedDatas: [], delete: false }));
                                return;
                            }
                            setState((p) => ({ ...p, delete: true }));
                        }}
                        disabled={state.selectedDatas.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={() => getData(apiEndpointGet)} loading={state.load} />
                </div>

                <DataTable
                    value={state.data}
                    scrollable
                    lazy={true}
                    paginator={true}
                    first={state.first}
                    rows={state.rows}
                    totalRecords={state.totalData}
                    onPage={onLazyLoad}
                    onSort={onLazyLoad}
                    sortField={state.sortField}
                    sortOrder={state.sortOrder === 'asc' ? 1 : -1}
                    selectionMode={'multiple'}
                    header={headerTemplate}
                    loading={state.load}
                    selection={state.selectedDatas}
                    onSelectionChange={(e) => setState((p) => ({ ...p, selectedDatas: e.value }))}
                    dataKey="kode_musim"
                    emptyMessage="Tidak ada data season"
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data season"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="kode_musim" header="Kode Season" align="center" sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="kode_cabang" header="Cabang" sortable style={{ minWidth: '10rem' }} body={(rowData) => rowData.cabang_name || rowData.kode_cabang}></Column>
                    <Column field="nama_musim" header="Nama Season" sortable style={{ minWidth: '16rem' }}></Column>
                    <Column field="tanggal_mulai" header="Tgl Mulai" align="center" body={(rowData) => dateBodyTemplate(rowData.tanggal_mulai)} sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="tanggal_selesai" header="Tgl Selesai" align="center" body={(rowData) => dateBodyTemplate(rowData.tanggal_selesai)} sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="hari_berlaku" header="Hari Berlaku" sortable style={{ minWidth: '12rem' }}></Column>
                    <Column field="is_active" header="Status Aktif" align="center" body={activeStatusBodyTemplate} style={{ minWidth: '8rem' }}></Column>
                    <Column field="created_at" header="Waktu Dibuat" body={(rowData) => formatDateSystem(rowData.created_at)} align="center" sortable style={{ minWidth: '12rem' }}></Column>
                    <Column field="updated_at" header="Waktu Diperbarui" body={(rowData) => formatDateSystem(rowData.updated_at)} align="center" sortable style={{ minWidth: '12rem' }}></Column>
                    <Column header="Aksi" body={actionBodyTemplate} align="center" frozen alignFrozen="right" style={{ minWidth: '8rem' }}></Column>
                </DataTable>
            </div>

            <Form getData={getData} toast={toast} state={state} setState={setState} formik={formik} />
        </>
    );
};

export default Table;
