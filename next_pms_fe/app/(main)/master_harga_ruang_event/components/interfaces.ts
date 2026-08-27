import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { FormikProps } from 'formik';
import { DataTableStateEvent } from 'primereact/datatable';
import { Dispatch, SetStateAction } from 'react';
import { DataRekap } from '@/types/print-tools';

export interface DropdownData {
    kode: string;
    nama: string;
}

export interface TableData {
    id?: number;
    kode_harga_ruang_event: string;
    kode_ruang_event: string;
    ruang_name?: string;
    tipe_sewa: string;
    kode_musim?: string;
    harga: number;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface State {
    load: boolean;
    data: TableData[];
    add: boolean;
    edit: boolean;
    delete: boolean;
    selectedDatas: TableData[];
    searchVal: string;
    filters: any;
    session: Session | null;
    submittedData: any;
    first: number;
    rows: number;
    page: number;
    keyword: string;
    totalData: number;
    sortField: string;
    sortOrder: string;
    dataRuangEvent: DropdownData[];
    dataMusim: DropdownData[];
}

export interface TableProps {
    dataRekap: DataRekap;
    setDataRekap: Dispatch<SetStateAction<DataRekap>>;
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    formik: FormikProps<any>;
    toast: React.RefObject<Toast>;
    getData: (apiEndpoint: string) => void;
    getPrintData: (apiEndpoint: string) => void;
    onLazyLoad: (event: DataTableStateEvent) => void;
}

export interface PrintProps {
    dataRekap: DataRekap;
    setDataRekap: Dispatch<SetStateAction<DataRekap>>;
    state: State;
    toast: React.RefObject<Toast>;
}

export interface FormProps {
    getData: (apiEndpoint: string) => void;
    toast: React.RefObject<Toast>;
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    formik: FormikProps<any>;
}

export const initValue = {
    kode_harga_ruang_event: '',
    kode_ruang_event: '',
    tipe_sewa: 'full_day',
    kode_musim: '',
    harga: 0,
    is_active: 1
};

export const HEADER_CONFIG = {
    kode_harga_ruang_event: 'Kode',
    ruang_name: 'Ruang Event',
    tipe_sewa: 'Tipe Sewa',
    harga: 'Harga',
    is_active: 'Status'
};

export const FORMATTER_CONFIG = {
    is_active: (value: any) => (value === 1 ? 'Aktif' : 'Non-Aktif'),
    harga: (value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value),
    tipe_sewa: (value: any) => {
        if (value === 'per_jam') return 'Per Jam';
        if (value === 'half_day') return 'Half Day';
        if (value === 'full_day') return 'Full Day';
        return value;
    }
};
