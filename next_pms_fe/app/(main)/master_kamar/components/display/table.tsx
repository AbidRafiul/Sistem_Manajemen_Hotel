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
import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import postData from '@/lib/axios/postData';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import StatusLegend from '@/app/components/status/StatusLegend';

const Table = ({ dataRekap, setDataRekap, state, setState, formik, toast, getData, getPrintData, onLazyLoad }: TableProps) => {
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [cabangList, setCabangList] = useState<any[]>([]);

    const fetchCabang = async (keyword = '') => {
        try {
            const res = await postData('/master/cabang/cabang-data', {
                perPage: 50,
                keyword: keyword
            });
            setCabangList(res.data.data);
        } catch (error) {
            console.error('Gagal mengambil data cabang:', error);
        }
    };

    useEffect(() => {
        fetchCabang();
    }, []);

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Daftar Kamar</span>

            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <Dropdown
                    value={state.kode_cabang}
                    options={cabangList}
                    onChange={(e) => setState(p => ({ ...p, kode_cabang: e.value, page: 1, first: 0 }))}
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
                <span className="p-input-icon-left w-full md:w-20rem">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={state.searchVal}
                            className="w-full"
                            placeholder="Cari Kamar..."
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
                        kode_kamar: rowData.kode_kamar || '',
                        kode_cabang: rowData.kode_cabang || '',
                        kode_lantai: rowData.kode_lantai || '',
                        kode_tipe_kamar: rowData.kode_tipe_kamar || '',
                        nomor_kamar: rowData.nomor_kamar || '',
                        tipe_view: rowData.tipe_view || 'City View',
                        boleh_merokok: rowData.boleh_merokok || 0,
                        occupancy_status: rowData.occupancy_status || 'vacant',
                        housekeeping_status: rowData.housekeeping_status || 'clean',
                        is_active: rowData.is_active !== undefined ? rowData.is_active : 1
                    });
                    setState((p) => ({ ...p, add: false, delete: false, edit: true }));
                }}
                tooltip="Edit Kamar"
            />
            <Button
                icon="pi pi-trash"
                outlined
                severity="danger"
                className="p-button-sm"
                onClick={() => setState((p) => ({ ...p, delete: true, selectedDatas: [rowData] }))}
                tooltip="Hapus Kamar"
            />
        </div>
    );

    const activeStatusBodyTemplate = (rowData: TableData) => (
        <StatusIndicator status={rowData.is_active} />
    );

    const occupancyStatusBodyTemplate = (rowData: TableData) => {
        const s = rowData.occupancy_status || '';
        return <StatusIndicator status={s} label={s.toUpperCase()} />;
    };

    const housekeepingStatusBodyTemplate = (rowData: TableData) => {
        const s = rowData.housekeeping_status || '';
        return <StatusIndicator status={s} label={s.toUpperCase()} />;
    };

    return (
        <>
            <div className="card">
                <div className="flex justify-content-between items-start mb-6">
                    <div className="flex flex-column">
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2">
                            <i className="pi pi-key text-blue-600 text-3xl"></i>Master Kamar
                        </h3>
                        <p className="text-gray-500">Kelola informasi data kamar (rooms) yang tersedia pada cabang.</p>
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
                                kode_cabang: state.kode_cabang || '',
                                kode_lantai: '',
                                kode_tipe_kamar: '',
                                nomor_kamar: '',
                                tipe_view: 'City View',
                                boleh_merokok: 0,
                                occupancy_status: 'vacant',
                                housekeeping_status: 'clean',
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
                    dataKey="kode_kamar"
                    emptyMessage="Tidak ada data kamar"
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data kamar"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="is_active" header="" align="center" body={activeStatusBodyTemplate} style={{ minWidth: '4rem', width: '4rem' }}></Column>
                    <Column field="kode_kamar" header="Kode Kamar" align="center" sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="nomor_kamar" header="Nomor Kamar" sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="room_type_name" header="Tipe Kamar" sortable style={{ minWidth: '14rem' }} body={(rowData) => rowData.room_type_name || rowData.kode_tipe_kamar}></Column>
                    <Column field="floor_name" header="Lantai" sortable style={{ minWidth: '10rem' }} body={(rowData) => rowData.floor_name || rowData.kode_lantai}></Column>
                    <Column field="tipe_view" header="View" sortable style={{ minWidth: '10rem' }}></Column>
                    <Column field="occupancy_status" header="Occupancy" align="center" body={occupancyStatusBodyTemplate} style={{ minWidth: '8rem' }}></Column>
                    <Column field="housekeeping_status" header="Housekeeping" align="center" body={housekeepingStatusBodyTemplate} style={{ minWidth: '8rem' }}></Column>
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
