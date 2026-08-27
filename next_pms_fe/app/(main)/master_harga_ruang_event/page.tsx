'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { useFormik } from 'formik';
import { FORMATTER_CONFIG, HEADER_CONFIG, initValue, State } from './components/interfaces';
import Table from './components/display/table';
import { FilterMatchMode } from 'primereact/api';
import { useSession } from 'next-auth/react';
import { DataTableStateEvent } from 'primereact/datatable';
import { apiEndpointGet, apiEndpointRuangEvent, apiEndpointSeason } from './components/endpoints';
import { DataRekap } from '@/types/print-tools';
import Print from './components/display/print';
import { transformTableData } from '@/lib/tools/printTools/transformData';

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
        sortOrder: 'desc',
        dataRuangEvent: [],
        dataMusim: []
    });

    const [dataRekap, setDataRekap] = useState<DataRekap>({
        data: [],
        totalData: 0,
        head: [],
        load: false,
        columnStyles: {},
        show: false,
        adjust: false,
        fileName: `laporan-master-harga-ruang-event-${new Date().toISOString().slice(0, 10)}`,
        judul1: 'Laporan Master Harga Ruang Event',
        judul2: ''
    });

    const formik = useFormik({
        initialValues: initValue,
        validate: (data) => {
            let errors: any = {};
            if (!data.kode_ruang_event) errors.kode_ruang_event = 'Ruang Event wajib diisi.';
            if (!data.tipe_sewa) errors.tipe_sewa = 'Tipe sewa wajib diisi.';
            if (data.harga < 0) errors.harga = 'Harga tidak boleh negatif.';
            return errors;
        },
        onSubmit: () => {}
    });

    useEffect(() => {
        if (session) {
            setState((p) => ({ ...p, session }));
            getData(apiEndpointGet);
            getDropdowns();
        }
    }, [session, state.first, state.rows, state.keyword, state.sortField, state.sortOrder]);

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
        } catch (error) {
            showError(toast, "Gagal mengambil data");
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const getDropdowns = async () => {
        try {
            const [resRuang, resSeason] = await Promise.all([
                postData(apiEndpointRuangEvent, { perPage: 1000 }),
                postData(apiEndpointSeason, { perPage: 1000 })
            ]);

            setState((p) => ({
                ...p,
                dataRuangEvent: resRuang.data?.data?.map((d: any) => ({ kode: d.kode_ruang_event || d.kode, nama: `${d.nama_ruang} (${d.nama_gedung || d.cabang_name || 'Tanpa Gedung'})` })) || [],
                dataMusim: resSeason.data?.data?.map((d: any) => ({ kode: d.kode_musim, nama: d.name })) || []
            }));
        } catch (error) {
            console.error("Gagal memuat data dropdown", error);
        }
    };

    const getPrintData = async (apiEndpoint: string) => {
        setDataRekap((p) => ({ ...p, load: true }));
        try {
            const oPayload = {
                keyword: state.keyword,
                sortField: state.sortField || 'updated_at',
                sortOrder: state.sortOrder || 'desc'
            };

            const res = await postData(apiEndpoint, oPayload);

            let columnStyles = {
                0: { halign: 'center' },
                1: { halign: 'left' },
                2: { halign: 'left' },
                3: { halign: 'left' },
                4: { halign: 'right' },
                5: { halign: 'center' }
            };

            const headerKeys = Object.keys(HEADER_CONFIG);
            const transformedData = transformTableData(res.data?.data, {
                includeKeys: headerKeys,
                customFormatters: FORMATTER_CONFIG,
                headerMap: HEADER_CONFIG
            });

            setDataRekap((p) => ({
                ...p,
                data: transformedData,
                columnStyles,
                load: false,
                show: true
            }));
        } catch (error) {
            showError(toast, 'Gagal Load Data');
            setDataRekap((p) => ({ ...p, load: false }));
        }
    };

    const onLazyLoad = (event: DataTableStateEvent) => {
        const _page = (event.first ?? 0) / (event.rows ?? 10) + 1;
        setState((p) => ({
            ...p,
            first: event.first ?? 0,
            rows: event.rows ?? 10,
            page: _page,
            sortField: event.sortField || 'updated_at',
            sortOrder: event.sortOrder === 1 ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <Table 
                    dataRekap={dataRekap} 
                    setDataRekap={setDataRekap} 
                    state={state} 
                    setState={setState} 
                    formik={formik} 
                    toast={toast} 
                    getData={getData} 
                    getPrintData={getPrintData} 
                    onLazyLoad={onLazyLoad} 
                />
            </div>
            <Print dataRekap={dataRekap} setDataRekap={setDataRekap} state={state} toast={toast} />
        </div>
    );
};

export default Page;
