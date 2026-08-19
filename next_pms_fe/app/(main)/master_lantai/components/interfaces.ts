import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id?: number;
    kode_gedung?: string | number;
    kode_lantai?: string;
    name: string;
    nomor_lantai: number;
    building_name?: string;
    hotel_name?: string;
    kode_cabang?: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    kode_lantai?: string;
    kode_cabang?: string;
    kode_gedung: string | number;
    name: string;
    nomor_lantai: number;
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
    kode: 'Kode Lantai',
    kode_gedung: 'Kode Gedung',
    building_name: 'Nama Gedung',
    hotel_name: 'Nama Hotel',
    name: 'Nama Lantai',
    nomor_lantai: 'Nomor Lantai',
    is_active: 'Status',
    created_at: 'Waktu Dibuat',
    updated_at: 'Waktu Diperbarui'
};

export const FORMATTER_CONFIG = {
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};