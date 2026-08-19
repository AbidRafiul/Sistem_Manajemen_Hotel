import { FilterMatchMode } from 'primereact/api';
import { FormikProps } from 'formik';
import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';
import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';

export interface TableData {
    id?: number;
    kode_kamar?: string;
    kode_cabang?: string | number;
    kode_lantai?: string | number;
    kode_tipe_kamar?: string | number;
    kode_bed_type?: string | number | null;
    nomor_kamar: string;
    tipe_view: string;
    boleh_merokok: number;
    occupancy_status: string;
    housekeeping_status: string;
    is_active: number;
    cabang_name?: string;
    floor_name?: string;
    room_type_name?: string;
    bed_type_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface initValue {
    kode_kamar?: string;
    kode_cabang: string | number;
    kode_lantai: string | number;
    kode_tipe_kamar: string | number;
    kode_bed_type: string | number | null;
    nomor_kamar: string;
    tipe_view: string;
    boleh_merokok: number;
    occupancy_status: string;
    housekeeping_status: string;
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
    kode_cabang: string;
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
    kode: 'Kode Kamar',
    cabang_name: 'Cabang',
    floor_name: 'Lantai',
    room_type_name: 'Tipe Kamar',
    bed_type_name: 'Tipe Bed',
    nomor_kamar: 'Nomor Kamar',
    tipe_view: 'View',
    boleh_merokok: 'Boleh Merokok',
    room_status: 'Status Kamar',
    is_active: 'Status Aktif',
    created_at: 'Waktu Dibuat',
    updated_at: 'Waktu Diperbarui'
};

export const FORMATTER_CONFIG = {
    boleh_merokok: (val: number) => (val === 1 ? 'Ya' : 'Tidak'),
    is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};

export const VIEW_TYPE_OPTIONS = [
    { label: 'City View', value: 'City View' },
    { label: 'Pool View', value: 'Pool View' },
    { label: 'Garden View', value: 'Garden View' },
    { label: 'Ocean View', value: 'Ocean View' },
    { label: 'No View', value: 'No View' }
];

export const OCCUPANCY_STATUS_OPTIONS = [
    { label: 'Vacant', value: 'vacant' },
    { label: 'Occupied', value: 'occupied' },
    { label: 'Blocked', value: 'blocked' }
];

export const HOUSEKEEPING_STATUS_OPTIONS = [
    { label: 'Clean', value: 'clean' },
    { label: 'Dirty', value: 'dirty' },
    { label: 'Inspection', value: 'inspection' },
    { label: 'Maintenance', value: 'maintenance' }
];