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
import { apiEndpointGet, apiEndpointCabang, apiEndpointGedung, apiEndpointLantai, apiEndpointTipe } from './components/endpoints';
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
        dataCabang: [],
        dataGedung: [],
        dataLantai: [],
        dataTipe: []
    });

    const [dataRekap, setDataRekap] = useState<DataRekap>({
        data: [],
        totalData: 0,
        head: [],
        load: false,
        columnStyles: {},
        show: false,
        adjust: false,
        fileName: `laporan-master-ruang-event-${new Date().toISOString().slice(0, 10)}`,
        judul1: 'Laporan Master Ruang Event',
        judul2: ''
    });

    const formik = useFormik<initValue>({
        initialValues: {
            kode_cabang: '',
            kode_gedung: '',
            kode_lantai: '',
            kode_tipe_ruang_event: '',
            nama_ruang: '',
            kapasitas_orang: 0,
            luas_sqm: 0,
            layout_support: '',
            is_active: 1,
            kode_fasilitas: []
        },
        validate: (data: initValue) => {
            let errors: Record<string, string> = {};
            if (!data.kode_cabang) errors.kode_cabang = 'Cabang wajib dipilih.';
            if (!data.kode_tipe_ruang_event) errors.kode_tipe_ruang_event = 'Tipe Ruang Event wajib dipilih.';
            if (!data.nama_ruang || !data.nama_ruang.trim()) errors.nama_ruang = 'Nama Ruang wajib diisi.';
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

    const getDropdowns = async () => {
        try {
            const [resCabang, resGedung, resLantai, resTipe] = await Promise.all([
                postData(apiEndpointCabang, {}),
                postData(apiEndpointGedung, {}),
                postData(apiEndpointLantai, {}),
                postData(apiEndpointTipe, {})
            ]);

            setState((p) => ({
                ...p,
                dataCabang: resCabang.data?.data?.map((d: any) => ({ kode: d.kode_cabang, nama: d.name })) || [],
                dataGedung: resGedung.data?.data?.map((d: any) => ({ kode: d.kode_gedung, nama: d.nama_gedung, kode_cabang: d.kode_cabang })) || [],
                dataLantai: resLantai.data?.data?.map((d: any) => ({ kode: d.kode_lantai, nama: d.name, kode_gedung: d.kode_gedung, kode_cabang: d.kode_cabang })) || [],
                dataTipe: resTipe.data?.data?.map((d: any) => ({ kode: d.kode_tipe_ruang_event, nama: d.nama_tipe })) || []
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
                4: { halign: 'left' },
                5: { halign: 'left' },
                6: { halign: 'center' },
                7: { halign: 'center' },
                8: { halign: 'center' }
            };

            const formattedData = transformTableData(res.data.data, {
                headerMap: HEADER_CONFIG,
                customFormatters: FORMATTER_CONFIG,
                excludeKeys: ['id', 'kode_cabang', 'kode_gedung', 'kode_lantai', 'kode_tipe_ruang_event']
            });

            setDataRekap((p) => ({
                ...p,
                data: formattedData,
                totalData: res.data.total_data,
                show: true,
                adjust: true,
                columnStyles
            }));
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan saat menyiapkan data cetak');
        } finally {
            setDataRekap((p) => ({ ...p, load: false }));
        }
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
        getDropdowns();
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
                <Print
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
