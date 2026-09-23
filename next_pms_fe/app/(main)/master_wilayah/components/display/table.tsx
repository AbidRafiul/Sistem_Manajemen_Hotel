'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import { useRef } from 'react';
import { TableData, TableProps } from '../interfaces';
import Form from './form';
import { apiEndpointGet } from '../endpoints';
import { formatDateSystem } from '@/lib/tools/dateTools';

const Table = ({ state, setState, formik, toast, onCustomPage, onCustomSort, getData }: TableProps) => {
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Daftar Wilayah (Regional)</span>

            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <span className="p-input-icon-left w-full md:w-20rem">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={state.searchVal}
                            className="w-full"
                            placeholder="Cari Kode atau Nama Wilayah..."
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
                    tooltip="Reset Pencarian"
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
                severity="warning"
                className="p-button-sm"
                tooltip="Edit Wilayah"
                tooltipOptions={{ position: 'bottom' }}
                onClick={() => {
                    formik.setValues({
                        id: rowData.id,
                        kode_wilayah: rowData.kode_wilayah || '',
                        nama_wilayah: rowData.nama_wilayah || '',
                        status: rowData.status || 'active',
                        is_active: rowData.is_active !== undefined ? rowData.is_active : 1
                    });
                    setState((p) => ({ ...p, edit: true }));
                }}
            />
            <Button
                icon="pi pi-trash"
                outlined
                severity="danger"
                className="p-button-sm"
                tooltip="Hapus Wilayah"
                tooltipOptions={{ position: 'bottom' }}
                onClick={() => {
                    setState((p) => ({
                        ...p,
                        selectedDatas: [rowData],
                        delete: true
                    }));
                }}
            />
        </div>
    );

    const statusBodyTemplate = (rowData: TableData) => {
        const isActive = rowData.status === 'active' || rowData.is_active === 1;
        return (
            <Tag
                value={isActive ? 'AKTIF' : 'NON-AKTIF'}
                severity={isActive ? 'success' : 'danger'}
                className="text-xs px-2 py-1 font-semibold"
            />
        );
    };

    const totalCabangBodyTemplate = (rowData: TableData) => {
        const total = rowData.total_cabang || 0;
        return (
            <span className="font-semibold text-900">
                <i className="pi pi-building text-primary mr-2" />
                {total} Cabang Hotel
            </span>
        );
    };

    return (
        <div className="card">
            {/* Action Toolbar */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="flex align-items-center gap-2">
                    <Button
                        label="Tambah Wilayah"
                        icon="pi pi-plus"
                        className="p-button-primary"
                        onClick={() => {
                            formik.resetForm();
                            setState((p) => ({ ...p, add: true }));
                        }}
                    />
                    <Button
                        label="Hapus Terpilih"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        disabled={!state.selectedDatas || state.selectedDatas.length === 0}
                        onClick={() => setState((p) => ({ ...p, delete: true }))}
                    />
                </div>
                <div className="flex align-items-center gap-2">
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        severity="secondary"
                        tooltip="Refresh Data"
                        tooltipOptions={{ position: 'bottom' }}
                        onClick={() => getData(apiEndpointGet)}
                    />
                </div>
            </div>

            <Divider />

            {/* Data Table */}
            <DataTable
                value={state.data}
                selectionMode="multiple"
                selection={state.selectedDatas}
                onSelectionChange={(e: any) => setState((p) => ({ ...p, selectedDatas: e.value }))}
                dataKey="id"
                paginator
                lazy
                rows={state.rows}
                first={state.first}
                totalRecords={state.totalData}
                onPage={onCustomPage}
                onSort={onCustomSort}
                sortField={state.sortField}
                sortOrder={state.sortOrder === 'asc' ? 1 : -1}
                loading={state.load}
                header={headerTemplate}
                emptyMessage="Tidak ada data wilayah ditemukan"
                className="p-datatable-sm"
                stripedRows
                responsiveLayout="scroll"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column
                    field="kode_wilayah"
                    header="Kode Wilayah"
                    sortable
                    className="font-bold text-primary"
                    style={{ minWidth: '140px' }}
                />
                <Column
                    field="nama_wilayah"
                    header="Nama Wilayah / Regional"
                    sortable
                    style={{ minWidth: '240px' }}
                    className="font-semibold text-900"
                />
                <Column
                    header="Unit Cabang Binaan"
                    body={totalCabangBodyTemplate}
                    style={{ minWidth: '180px' }}
                />
                <Column
                    field="status"
                    header="Status"
                    body={statusBodyTemplate}
                    sortable
                    style={{ minWidth: '120px' }}
                />
                <Column
                    field="created_at"
                    header="Dibuat Pada"
                    body={(row) => (row.created_at ? formatDateSystem(new Date(row.created_at), 'dd-MM-yyyy HH:mm') : '-')}
                    style={{ minWidth: '150px' }}
                />
                <Column
                    header="Aksi"
                    body={actionBodyTemplate}
                    exportable={false}
                    style={{ minWidth: '110px', textAlign: 'center' }}
                />
            </DataTable>

            {/* Modal Dialog Form & Delete Confirmation */}
            <Form state={state} setState={setState} formik={formik} toast={toast} getData={getData} />
        </div>
    );
};

export default Table;
