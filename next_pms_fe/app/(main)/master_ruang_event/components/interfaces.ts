import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface DropdownData {
    kode: string;
    nama: string;
    kode_cabang?: string;
    kode_gedung?: string;
}

export interface TableData {
    id?: number;
    kode_ruang_event?: string;
    kode_cabang?: string;
    cabang_name?: string;
    kode_gedung?: string;
    nama_gedung?: string;
    kode_lantai?: string;
    nama_lantai?: string;
    kode_tipe_ruang_event?: string;
    tipe_ruang_name?: string;
    nama_ruang: string;
    kapasitas_orang?: number;
    luas_sqm?: number;
    layout_support?: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    kode_ruang_event?: string;
    kode_cabang: string;
    kode_gedung: string;
    kode_lantai: string;
    kode_tipe_ruang_event: string;
    nama_ruang: string;
    kapasitas_orang: number;
    luas_sqm: number;
    layout_support: string;
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
    dataCabang: DropdownData[];
    dataGedung: DropdownData[];
    dataLantai: DropdownData[];
    dataTipe: DropdownData[];
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
    kode_ruang_event: 'Kode',
    nama_ruang: 'Nama Ruang',
    tipe_ruang_name: 'Tipe Ruang',
    cabang_name: 'Cabang',
    nama_gedung: 'Gedung',
    nama_lantai: 'Lantai',
    kapasitas_orang: 'Kapasitas',
    luas_sqm: 'Luas (m2)',
    is_active: 'Status',
    created_at: 'Dibuat',
    updated_at: 'Diperbarui'
};

export const FORMATTER_CONFIG = {
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};
