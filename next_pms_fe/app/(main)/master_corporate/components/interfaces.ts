import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id?: number;
    kode_corporate?: string;
    kode_cabang?: string;
    name: string;
    account_type: string;
    npwp?: string;
    billing_address?: string;
    payment_term_days?: number;
    commission_pct?: number;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    kode_corporate?: string;
    kode_cabang?: string;
    name: string;
    account_type: string;
    npwp: string;
    billing_address: string;
    payment_term_days: number;
    commission_pct: number;
    contact_person: string;
    contact_phone: string;
    contact_email: string;
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
    kode: 'Kode Corporate',
    name: 'Nama Corporate',
    account_type: 'Tipe Akun',
    npwp: 'NPWP',
    billing_address: 'Alamat Tagihan',
    payment_term_days: 'Term Pembayaran (Hari)',
    commission_pct: 'Komisi (%)',
    contact_person: 'Kontak',
    contact_phone: 'Telepon',
    contact_email: 'Email',
    is_active: 'Status',
    created_at: 'Waktu Dibuat',
    updated_at: 'Waktu Diperbarui'
};

export const FORMATTER_CONFIG = {
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};

export const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Corporate', value: 'Corporate' },
    { label: 'Travel Agent', value: 'Travel Agent' },
    { label: 'Government', value: 'Government' },
    { label: 'OTA', value: 'OTA' },
    { label: 'Other', value: 'Other' }
];