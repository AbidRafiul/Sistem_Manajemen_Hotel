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
import { apiEndpointGet } from './components/endpoints';
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
        fileName: `laporan-master-tipe-kamar-${new Date().toISOString().slice(0, 10)}`,
        judul1: 'Laporan Master Tipe Kamar',
        judul2: ''
    });

    const formik = useFormik<initValue>({
        initialValues: {
            name: '',
            harga_default: 0,
            kode_bed_type: null,
            kapasitas_dasar: 1,
            kapasitas_maksimal: 2,
            luas_m2: null,
            deskripsi: '',
            is_active: 1
        },
        validate: (data: initValue) => {
            let errors: Record<string, string> = {};
            if (!data.name || !data.name.trim()) errors.name = 'Nama Tipe Kamar wajib diisi.';
            if (data.kapasitas_dasar < 1) errors.kapasitas_dasar = 'Kapasitas dasar minimal 1.';
            if (data.kapasitas_maksimal < 1) errors.kapasitas_maksimal = 'Kapasitas maksimal minimal 1.';
            if (data.kapasitas_maksimal < data.kapasitas_dasar) errors.kapasitas_maksimal = 'Kapasitas maksimal tidak boleh kurang dari kapasitas dasar.';
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
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' },
                6: { halign: 'left' },
                7: { halign: 'center' }
            };

            const formattedData = transformTableData(res.data.data, {
                headerMap: HEADER_CONFIG,
                customFormatters: FORMATTER_CONFIG,
                excludeKeys: ['id', 'created_at', 'updated_at']
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
