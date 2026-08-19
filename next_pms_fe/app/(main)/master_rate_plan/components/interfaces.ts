import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id?: number;
    kode_paket_harga?: string;
    kode_cabang?: string;
    name: string;
    tipe_paket: string;
    bisa_refund: number;
    termasuk_sarapan: number;
    minimal_malam: number;
    maksimal_malam: number | null;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    kode_paket_harga?: string;
    kode_cabang?: string;
    name: string;
    tipe_paket: string;
    bisa_refund: number;
    termasuk_sarapan: number;
    minimal_malam: number;
    maksimal_malam: number | null;
    is_active: number;
}

export interface State {
    load: boolean;
    data: TableData[];
    add: boolean;
    edit: boolean;
    delete: boolean;
    selectedDatas: TableData[];
    searchVal: string;
    filters: {
        global: {
            value: string | null;
            matchMode: FilterMatchMode;
        };
    };
    session: Session | null;
    submittedData: initValue | null;
    first: number;
    rows: number;
    page: number;
    keyword: string;
    totalData: number;
    sortField: string;
    sortOrder: string;
}

export interface TableProps {
    dataRekap: DataRekap;
    setDataRekap: React.Dispatch<React.SetStateAction<DataRekap>>;
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    formik: FormikProps<initValue>;
    toast: RefObject<Toast>;
    getData: (apiEndpoint: string) => Promise<void>;
    getPrintData: (apiEndpoint: string) => Promise<void>;
    onLazyLoad: (event: DataTableStateEvent) => void;
}

export interface FormProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    formik: FormikProps<initValue>;
    toast: RefObject<Toast>;
    getData: (apiEndpoint: string) => Promise<void>;
}

export const HEADER_CONFIG = {
    kode: 'Kode Rate Plan',
    name: 'Nama Paket (Rate Plan)',
    tipe_paket: 'Tipe Paket',
    bisa_refund: 'Refundable',
    termasuk_sarapan: 'Termasuk Sarapan',
    minimal_malam: 'Min. Malam',
    maksimal_malam: 'Max. Malam',
    is_active: 'Status',
    created_at: 'Waktu Dibuat',
    updated_at: 'Waktu Diperbarui'
};

export const FORMATTER_CONFIG = {
    bisa_refund: (val: number) => (val === 1 ? 'Ya' : 'Tidak'),
    termasuk_sarapan: (val: number) => (val === 1 ? 'Ya' : 'Tidak'),
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};

export const TIPE_PAKET_OPTIONS = [
    { label: 'Room Only (RO)', value: 'RO' },
    { label: 'Bed & Breakfast (BB)', value: 'BB' },
    { label: 'Half Board (HB)', value: 'HB' },
    { label: 'Full Board (FB)', value: 'FB' },
    { label: 'All Inclusive (AI)', value: 'AI' }
];