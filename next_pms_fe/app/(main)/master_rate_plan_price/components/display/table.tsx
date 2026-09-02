import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Divider } from 'primereact/divider';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import { TableProps } from '../interfaces';
import { apiEndpointDelete, apiEndpointGet } from '../endpoints';
import { initValue } from '../interfaces';
import Form from './form';
import { useRef } from 'react';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import StatusLegend from '@/app/components/status/StatusLegend';

const Table = ({ state, setState, formik, toast, getData, getPrintData, onLazyLoad }: TableProps) => {
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    const openNew = () => {
        setState((p) => ({ ...p, add: true, edit: false, submittedData: null }));
        formik?.resetForm();
    };

    const confirmDeleteSelected = () => {
        setState((p) => ({ ...p, delete: true }));
    };

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl font-bold">Daftar Harga Kamar</span>

            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <span className="p-input-icon-left w-full md:w-20rem">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={state.searchVal}
                            className="w-full"
                            placeholder="Cari Harga..."
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

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex justify-content-center gap-2">
                <Button
                    icon="pi pi-pencil"
                    outlined
                    className="p-button-sm"
                    onClick={() => {
                        setState((p) => ({ ...p, edit: true, add: false, submittedData: null }));
                        const formValues: initValue = {
                            kode_harga_price: rowData.kode_harga_price,
                            kode_tipe_kamar: rowData.kode_tipe_kamar,
                            kode_rate_plan: rowData.kode_rate_plan,
                            kode_season: rowData.kode_season,
                            price: rowData.price,
                            extra_bed_price: rowData.extra_bed_price,
                            valid_from: rowData.valid_from ? new Date(rowData.valid_from) : null,
                            valid_to: rowData.valid_to ? new Date(rowData.valid_to) : null,
                            is_active: rowData.is_active !== undefined ? rowData.is_active : 1
                        };
                        formik?.setValues(formValues);
                    }}
                    tooltip="Edit Harga"
                />
                <Button
                    icon="pi pi-trash"
                    outlined
                    severity="danger"
                    className="p-button-sm"
                    onClick={() => setState((p) => ({ ...p, delete: true, selectedDatas: [rowData] }))}
                    tooltip="Hapus Harga"
                />
            </div>
        );
    };

    const activeStatusBodyTemplate = (rowData: any) => (
        <StatusIndicator status={rowData.is_active} />
    );

    return (
        <div className="card">
            <div className="flex justify-content-between items-start mb-6">
                <div className="flex flex-column">
                    <h3 className="text-2xl font-semibold flex align-items-center gap-2">
                        <i className="pi pi-money-bill text-blue-600 text-3xl"></i>Master Harga Kamar
                    </h3>
                    <p className="text-gray-500">Kelola tarif sewa kamar berdasarkan tipe kamar, rate plan, dan musim.</p>
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
                            kode_tipe_kamar: '',
                            kode_rate_plan: '',
                            kode_season: null,
                            price: null,
                            extra_bed_price: null,
                            valid_from: null,
                            valid_to: null,
                            is_active: 1
                        });
                        setState((p) => ({ ...p, selectedDatas: [], add: true, edit: false }));
                    }}
                />
                <Divider layout="vertical" />
                <Button size="small" label="Cetak" icon="pi pi-print" outlined onClick={() => getPrintData(apiEndpointGet)} loading={state.load} />
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
                selection={state.selectedDatas}
                onSelectionChange={(e) => setState((p) => ({ ...p, selectedDatas: e.value }))}
                dataKey="kode_harga_price"
                lazy
                paginator
                first={state.first}
                rows={state.rows}
                totalRecords={state.totalData}
                onPage={onLazyLoad}
                onSort={onLazyLoad}
                sortField={state.sortField}
                sortOrder={state.sortOrder === 'desc' ? -1 : 1}
                header={headerTemplate}
                loading={state.load}
                emptyMessage="Tidak ada data harga kamar."
                rowsPerPageOptions={[10, 25, 50, 100]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data harga"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="is_active" header="" align="center" body={activeStatusBodyTemplate} style={{ minWidth: '4rem', width: '4rem' }}></Column>
                <Column field="tipe_kamar_name" header="Tipe Kamar" sortable style={{ minWidth: '12rem' }}></Column>
                <Column field="rate_plan_name" header="Rate Plan" sortable style={{ minWidth: '12rem' }}></Column>
                <Column field="season_name" header="Musim" body={(r) => r.season_name || 'Reguler'} sortable style={{ minWidth: '8rem' }}></Column>
                <Column field="price" header="Harga" body={(r) => `Rp ${Number(r.price).toLocaleString('id-ID')}`} sortable align="right" style={{ minWidth: '10rem' }}></Column>
                <Column field="extra_bed_price" header="Extra Bed" body={(r) => r.extra_bed_price ? `Rp ${Number(r.extra_bed_price).toLocaleString('id-ID')}` : '-'} sortable align="right" style={{ minWidth: '10rem' }}></Column>
                <Column field="valid_from" header="Berlaku Mulai" body={(r) => r.valid_from ? new Date(r.valid_from).toLocaleDateString('id-ID') : '-'} sortable style={{ minWidth: '10rem' }}></Column>
                <Column field="valid_to" header="Berlaku Sampai" body={(r) => r.valid_to ? new Date(r.valid_to).toLocaleDateString('id-ID') : 'Selamanya'} sortable style={{ minWidth: '10rem' }}></Column>
                <Column header="Aksi" body={actionBodyTemplate} align="center" frozen alignFrozen="right" exportable={false} style={{ minWidth: '8rem' }}></Column>
            </DataTable>

            <Form state={state} setState={setState} formik={formik} toast={toast} getData={getData} />
        </div>
    );
};

export default Table;
