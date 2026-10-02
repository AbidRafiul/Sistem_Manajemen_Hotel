'use client';

import { DataTable } from 'primereact/datatable';
import { TableData, TableProps } from '../interfaces';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import Form from './form';
import { apiEndpointGet } from '../endpoints';
import { useRef } from 'react';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import StatusLegend from '@/app/components/status/StatusLegend';

const Table = ({ dataRekap, setDataRekap, state, setState, formik, toast, getData, getPrintData, onLazyLoad }: TableProps) => {
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Daftar Shift Kasir</span>

            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <span className="p-input-icon-left w-full md:w-20rem">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={state.searchVal}
                            className="w-full"
                            placeholder="Cari Shift..."
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
                        id: rowData.id,
                        kode_shift: rowData.kode_shift,
                        kode_cabang: rowData.kode_cabang || '',
                        nama_shift: rowData.nama_shift || '',
                        waktu_mulai: rowData.waktu_mulai || '07:00:00',
                        waktu_selesai: rowData.waktu_selesai || '15:00:00',
                        default_opening_cash: Number(rowData.default_opening_cash || 1000000),
                        is_night_audit: Number(rowData.is_night_audit || 0),
                        urutan: Number(rowData.urutan || 1),
                        is_active: rowData.is_active !== undefined ? rowData.is_active : 1
                    });
                    setState((p) => ({ ...p, add: false, delete: false, edit: true }));
                }}
                tooltip="Edit Shift"
            />
            <Button
                icon="pi pi-trash"
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => setState((p) => ({ ...p, delete: true, selectedDatas: [rowData] }))}
                tooltip="Hapus Shift"
            />
        </div>
    );

    const jamBodyTemplate = (rowData: TableData) => (
        <div className="flex align-items-center justify-content-center gap-2">
            <i className="pi pi-clock text-500 text-xs"></i>
            <span className="font-semibold text-sm">
                {rowData.waktu_mulai ? rowData.waktu_mulai.substring(0, 5) : '-'} – {rowData.waktu_selesai ? rowData.waktu_selesai.substring(0, 5) : '-'}
            </span>
        </div>
    );

    const openingCashBodyTemplate = (rowData: TableData) => (
        <span className="font-bold text-teal-700">
            {formatCurrency(rowData.default_opening_cash)}
        </span>
    );

    const nightAuditBodyTemplate = (rowData: TableData) => (
        rowData.is_night_audit === 1 ? (
            <Tag severity="warning" value="Night Audit" icon="pi pi-moon" />
        ) : (
            <Tag severity="info" value="Reguler" icon="pi pi-sun" />
        )
    );

    const activeStatusBodyTemplate = (rowData: TableData) => (
        <StatusIndicator status={rowData.is_active} />
    );

    return (
        <>
            <div className="card">
                <div className="flex justify-content-between align-items-start mb-4">
                    <div className="flex flex-column">
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2">
                            <i className="pi pi-clock text-blue-600 text-3xl"></i>Master Shift Kasir
                        </h3>
                        <p className="text-gray-500">Kelola jadwal shift kerja, jam operasional, standar modal kas awal, dan penanda sesi Night Audit hotel.</p>
                    </div>
                </div>

                <div className="flex flex-row flex-wrap align-items-center gap-2 mb-3">
                    <Button
                        size="small"
                        label="Baru"
                        icon="pi pi-plus"
                        outlined
                        severity="success"
                        onClick={() => {
                            formik.resetForm();
                            formik.setValues({
                                kode_cabang: state.session?.user?.active_kode_cabang || state.session?.user?.default_kode_cabang || '',
                                nama_shift: '',
                                waktu_mulai: '07:00:00',
                                waktu_selesai: '15:00:00',
                                default_opening_cash: 1000000,
                                is_night_audit: 0,
                                urutan: (state.data?.length || 0) + 1,
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

                <StatusLegend />

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
                    dataKey="id"
                    emptyMessage="Tidak ada data shift"
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data shift"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="is_active" header="Status" align="center" body={activeStatusBodyTemplate} style={{ minWidth: '5rem', width: '5rem' }}></Column>
                    <Column field="kode_shift" header="Kode" align="center" sortable style={{ minWidth: '8rem' }}></Column>
                    <Column field="kode_cabang" header="Cabang" sortable style={{ minWidth: '12rem' }} body={(rowData) => rowData.cabang_name || rowData.kode_cabang}></Column>
                    <Column field="nama_shift" header="Nama Shift" sortable style={{ minWidth: '14rem' }}></Column>
                    <Column header="Jam Operasional" align="center" body={jamBodyTemplate} style={{ minWidth: '11rem' }}></Column>
                    <Column field="default_opening_cash" header="Modal Standar" align="right" body={openingCashBodyTemplate} sortable style={{ minWidth: '11rem' }}></Column>
                    <Column field="is_night_audit" header="Sesi" align="center" body={nightAuditBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                    <Column header="Aksi" body={actionBodyTemplate} align="center" frozen alignFrozen="right" style={{ minWidth: '8rem' }}></Column>
                </DataTable>
            </div>

            <Form
                state={state}
                setState={setState}
                formik={formik}
                toast={toast}
                getData={getData}
                dataRekap={dataRekap}
                setDataRekap={setDataRekap}
            />
        </>
    );
};

export default Table;
