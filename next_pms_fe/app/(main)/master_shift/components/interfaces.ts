import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id?: number;
    kode_shift?: string;
    kode_cabang?: string;
    cabang_name?: string;
    nama_shift: string;
    waktu_mulai: string;
    waktu_selesai: string;
    default_opening_cash: number;
    is_night_audit: number;
    urutan: number;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    id?: number;
    kode_shift?: string;
    kode_cabang: string;
    nama_shift: string;
    waktu_mulai: string;
    waktu_selesai: string;
    default_opening_cash: number;
    is_night_audit: number;
    urutan: number;
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

export const FORMATTER_CONFIG: Record<string, (value: any) => any> = {
    is_active: (value: any) => value === 1 ? 'Aktif' : 'Tidak Aktif',
    is_night_audit: (value: any) => value === 1 ? 'Ya (Night Audit)' : 'Tidak',
    default_opening_cash: (value: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value || 0))
};

export const HEADER_CONFIG: Record<string, string> = {
    'kode_shift': 'Kode Shift',
    'cabang_name': 'Cabang',
    'nama_shift': 'Nama Shift',
    'waktu_mulai': 'Jam Mulai',
    'waktu_selesai': 'Jam Selesai',
    'default_opening_cash': 'Modal Awal Standar',
    'is_night_audit': 'Night Audit',
    'urutan': 'Urutan',
    'is_active': 'Status'
};
