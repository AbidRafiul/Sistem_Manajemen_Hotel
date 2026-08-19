/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file interfaces.ts
 * @description Interfaces and types for Master Cabang module
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-12
 */

import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id?: number;
    cabang_id?: number;
    kode_cabang?: string;
    name: string;
    address?: string | null;
    telepon?: string | null;
    check_in_time: string;
    check_out_time: string;
    timezone: string;
    is_active: number;
    is_pkp?: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    kode_cabang?: string;
    name: string;
    address?: string;
    telepon?: string;
    check_in_time: string | Date;
    check_out_time: string | Date;
    timezone: string;
    is_pkp: number;
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
    kode: 'Kode Cabang',
    name: 'Nama Cabang',
    address: 'Alamat',
    check_in_time: 'Check-In',
    check_out_time: 'Check-Out',
    timezone: 'Zona Waktu',
    created_at: 'Waktu Dibuat',
    updated_at: 'Waktu Diperbarui'
};

export const FORMATTER_CONFIG = {
    is_pkp: (val: number) => (val === 1 ? 'PKP' : 'Non-PKP'),
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};

export const CURRENCY_OPTIONS = [
    { label: 'IDR - Rupiah Indonesia', value: 'IDR' },
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'SGD - Singapore Dollar', value: 'SGD' },
    { label: 'EUR - Euro', value: 'EUR' }
];

export const TIMEZONE_OPTIONS = [
    { label: 'Asia/Jakarta (WIB)', value: 'Asia/Jakarta' },
    { label: 'Asia/Makassar (WITA)', value: 'Asia/Makassar' },
    { label: 'Asia/Jayapura (WIT)', value: 'Asia/Jayapura' },
    { label: 'UTC', value: 'UTC' }
];
