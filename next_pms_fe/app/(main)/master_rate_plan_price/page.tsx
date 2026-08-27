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
import { DataRekap } from '@/types/print-tools';

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
        sortField: 'updated_at',
        sortOrder: 'desc'
    });

    const [dataRekap, setDataRekap] = useState<DataRekap>({
        data: [],
        totalData: 0,
        head: [],
        load: false,
        columnStyles: {},
        show: false,
        adjust: false,
        fileName: `laporan-harga-kamar-${new Date().toISOString().slice(0, 10)}`,
        judul1: 'Laporan Master Harga Kamar',
        judul2: ''
    });

    const formik = useFormik<initValue>({
        initialValues: {
            kode_tipe_kamar: '',
            kode_rate_plan: '',
            kode_season: null,
            price: null,
            extra_bed_price: null,
            valid_from: null,
            valid_to: null,
            is_active: 1
        },
        validate: (data: initValue) => {
            let errors: Record<string, string> = {};
            if (!data.kode_tipe_kamar) errors.kode_tipe_kamar = 'Tipe Kamar wajib diisi.';
            if (!data.kode_rate_plan) errors.kode_rate_plan = 'Rate Plan wajib diisi.';
            if (data.price === null || data.price === undefined || data.price < 0) errors.price = 'Harga wajib diisi.';
            if (!data.valid_from) errors.valid_from = 'Tanggal Berlaku Mulai wajib diisi.';
            
            if (data.valid_from && data.valid_to) {
                const start = new Date(data.valid_from);
                const end = new Date(data.valid_to);
                if (end < start) {
                    errors.valid_to = 'Tanggal Berlaku Sampai tidak boleh kurang dari Berlaku Mulai.';
                }
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
                sortField: state.sortField || 'updated_at',
                sortOrder: state.sortOrder || 'desc'
            };

            const res = await postData(apiEndpoint, oPayload);
            setState((p) => ({
                ...p,
                data: res.data.data,
                totalData: res.data.total_data
            }));
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan saat memuat data');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const getPrintData = async (apiEndpoint: string) => {
        // Placeholder for now
    };

    const onLazyLoad = (event: DataTableStateEvent) => {
        setState((prev) => {
            const newPage = typeof event.page === 'number' ? event.page + 1 : prev.page;

            return {
                ...prev,
                first: event.first,
                rows: event.rows,
                page: newPage,
                sortField: event.sortField || prev.sortField,
                sortOrder: event.sortOrder ? (event.sortOrder === 1 ? 'asc' : 'desc') : prev.sortOrder
            };
        });
    };

    useEffect(() => {
        getData(apiEndpointGet);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.page, state.rows, state.sortField, state.sortOrder, state.keyword]);

    useEffect(() => {
        if (session) {
            setState((prev) => ({
                ...prev,
                session: session
            }));
        }
    }, [session]);

    return (
        <>
            <div className="p-0">
                <Toast ref={toast} position="top-right" />
                <Table
                    dataRekap={dataRekap}
                    setDataRekap={setDataRekap}
                    getData={getData}
                    getPrintData={getPrintData}
                    state={state}
                    setState={setState}
                    formik={formik}
                    toast={toast}
                    onLazyLoad={onLazyLoad}
                />
            </div>
        </>
    );
};

export default Page;
