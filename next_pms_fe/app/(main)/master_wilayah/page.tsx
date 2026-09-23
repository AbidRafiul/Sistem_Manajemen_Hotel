'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { useFormik } from 'formik';
import { initValue, State } from './components/interfaces';
import Table from './components/display/table';
import { FilterMatchMode } from 'primereact/api';
import { useSession } from 'next-auth/react';
import { DataTableStateEvent } from 'primereact/datatable';
import { apiEndpointGet } from './components/endpoints';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load: false,
        data: [],
        add: false,
        edit: false,
        delete: false,
        selectedDatas: [],
        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
        session: null,
        submittedData: null,
        first: 0,
        rows: 10,
        page: 1,
        keyword: '',
        totalData: 0,
        sortField: 'created_at',
        sortOrder: 'asc'
    });

    const formik = useFormik<initValue>({
        initialValues: {
            kode_wilayah: '',
            nama_wilayah: '',
            status: 'active',
            is_active: 1
        },
        validate: (data: initValue) => {
            let errors: Record<string, string> = {};
            if (!data.nama_wilayah || !data.nama_wilayah.trim()) {
                errors.nama_wilayah = 'Nama Wilayah wajib diisi.';
            }
            return errors;
        },
        onSubmit: (data) => {
            setState((p) => ({ ...p, submittedData: data }));
        }
    });

    const getData = async (apiEndpoint: string) => {
        setState((p) => ({ ...p, load: true }));
        try {
            const oPayload = {
                page: state.page,
                perPage: state.rows,
                keyword: state.keyword,
                sortField: state.sortField || 'created_at',
                sortOrder: state.sortOrder || 'asc'
            };

            const res = await postData(apiEndpoint, oPayload);
            if (res?.data?.status === '00') {
                const dataList = res.data?.data || [];
                const total = res.data?.total_data ?? dataList.length;
                setState((p) => ({
                    ...p,
                    data: dataList,
                    totalData: total,
                    load: false
                }));
            } else {
                showError(toast as any, res?.data?.message || 'Gagal memuat data wilayah');
                setState((p) => ({ ...p, load: false }));
            }
        } catch (error: any) {
            showError(toast as any, error?.response?.data?.message || error.message || 'Gagal terhubung ke server');
            setState((p) => ({ ...p, load: false }));
        }
    };

    const onCustomPage = (event: DataTableStateEvent) => {
        const newPage = (event.page ?? 0) + 1;
        setState((p) => ({
            ...p,
            first: event.first,
            rows: event.rows,
            page: newPage
        }));
    };

    const onCustomSort = (event: DataTableStateEvent) => {
        setState((p) => ({
            ...p,
            sortField: event.sortField,
            sortOrder: event.sortOrder === 1 ? 'asc' : 'desc'
        }));
    };

    useEffect(() => {
        getData(apiEndpointGet);
    }, [state.page, state.rows, state.keyword, state.sortField, state.sortOrder]);

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="card mb-3 py-3 px-4 surface-card shadow-1 border-round">
                    <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3">
                        <div>
                            <h4 className="m-0 font-bold text-900 flex align-items-center gap-2">
                                <i className="pi pi-map text-primary text-2xl" />
                                Master Wilayah (Regional)
                            </h4>
                            <p className="text-500 m-0 text-sm mt-1">
                                Kelola zonasi wilayah geografis dan kluster penugasan unit hotel di jaringan Enterprise PMS.
                            </p>
                        </div>
                    </div>
                </div>

                <Table
                    state={state}
                    setState={setState}
                    formik={formik}
                    toast={toast}
                    onCustomPage={onCustomPage}
                    onCustomSort={onCustomSort}
                    getData={getData}
                />
            </div>
        </div>
    );
};

export default Page;
