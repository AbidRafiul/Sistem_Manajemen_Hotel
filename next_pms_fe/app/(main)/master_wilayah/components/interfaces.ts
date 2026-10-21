/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file interfaces.ts
 * @description Interfaces and types for Master Wilayah module
 */

import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id: number;
    kode_wilayah: string;
    nama_wilayah: string;
    node_type?: string;
    status: string;
    is_active: number;
    total_cabang?: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    id?: number;
    kode_wilayah: string;
    nama_wilayah: string;
    status?: string;
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
    kode_wilayah: 'Kode Wilayah',
    nama_wilayah: 'Nama Wilayah / Regional',
    total_cabang: 'Unit Cabang Binaan',
    created_at: 'Waktu Dibuat',
    updated_at: 'Waktu Diperbarui'
};

export const FORMATTER_CONFIG = {
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif'),
    total_cabang: (val: number) => `${val || 0} Cabang Hotel`
};
