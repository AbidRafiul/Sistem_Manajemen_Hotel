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
import { showError } from '@/lib/tools/generalTools';
import { useRef } from 'react';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import StatusLegend from '@/app/components/status/StatusLegend';

const Table = ({ dataRekap, setDataRekap, state, setState, formik, toast, getData, getPrintData, onLazyLoad }: TableProps) => {
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Daftar Cashier Counter</span>

            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <span className="p-input-icon-left w-full md:w-20rem">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={state.searchVal}
                            className="w-full"
                            placeholder="Cari Counter..."
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
                        kode_cabang: rowData.kode_cabang || '',
                        name: rowData.name || '',
                        is_active: rowData.is_active !== undefined ? rowData.is_active : 1
                    });
                    setState((p) => ({ ...p, add: false, delete: false, edit: true }));
                }}
                tooltip="Edit Cashier Counter"
            />
            <Button
                icon="pi pi-trash"
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => setState((p) => ({ ...p, delete: true, selectedDatas: [rowData] }))}
                tooltip="Hapus Cashier Counter"
            />
        </div>
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
                            <i className="pi pi-desktop text-blue-600 text-3xl"></i>Master Cashier Counter
                        </h3>
                        <p className="text-gray-500">Kelola master cashier counter untuk digunakan pada shift kasir.</p>
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
                                kode_cabang: '',
                                name: '',
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
                            if (state.selectedDatas.length > 0) {
                                setState((p) => ({ ...p, delete: true }));
                            } else {
                                showError(toast, 'Pilih data yang akan dihapus terlebih dahulu');
                            }
                        }}
                        disabled={state.selectedDatas.length === 0}
                    />
                </div>

                <DataTable
                    value={state.data}
                    loading={state.load}
                    header={headerTemplate}
                    emptyMessage="Data Cashier Counter tidak ditemukan."
                    responsiveLayout="scroll"
                    selectionMode="checkbox"
                    selection={state.selectedDatas}
                    onSelectionChange={(e) => setState((p) => ({ ...p, selectedDatas: e.value }))}
                    dataKey="id"
                    lazy
                    first={state.first}
                    rows={state.rows}
                    totalRecords={state.totalData}
                    onPage={onLazyLoad}
                    onSort={onLazyLoad}
                    sortField={state.sortField}
                    sortOrder={state.sortOrder === 'asc' ? 1 : -1}
                    paginator
                    rowsPerPageOptions={[10, 20, 50]}
                    className="p-datatable-sm"
                    stripedRows
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                    <Column header="No" body={(_, options) => options.rowIndex + 1 + state.first} style={{ width: '3rem' }} align="center" />
                    <Column field="kode_counter" header="Kode Counter" sortable />
                    <Column field="cabang_name" header="Cabang" sortable />
                    <Column field="name" header="Nama Counter" sortable />
                    <Column field="is_active" header="Status Aktif" body={activeStatusBodyTemplate} sortable align="center" />
                    <Column header="Aksi" body={actionBodyTemplate} align="center" style={{ minWidth: '8rem' }} />
                </DataTable>
                
                <div className="mt-3">
                    <StatusLegend />
                </div>
            </div>
            
            {(state.add || state.edit || state.delete) && <Form state={state} setState={setState} formik={formik} toast={toast} getData={getData} />}
        </>
    );
};

export default Table;
