import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id?: number;
    kode_cabang?: string;
    kode_tipe_kamar?: string;
    cabang_name?: string;
    name: string;
    kapasitas_dasar: number;
    kapasitas_maksimal: number;
    luas_m2: number | null;
    deskripsi: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    kode_cabang?: string;
    kode_tipe_kamar?: string;
    name: string;
    kapasitas_dasar: number;
    kapasitas_maksimal: number;
    luas_m2: number | null;
    deskripsi: string;
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
    kode_tipe_kamar: 'Kode Tipe Kamar',
    name: 'Nama Tipe Kamar',
    kapasitas_dasar: 'Kapasitas Dasar',
    kapasitas_maksimal: 'Kapasitas Maksimal',
    luas_m2: 'Luas (m2)',
    deskripsi: 'Deskripsi',
    is_active: 'Status',
    created_at: 'Waktu Dibuat',
    updated_at: 'Waktu Diperbarui'
};

export const FORMATTER_CONFIG = {
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};