import { DataTableStateEvent } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { DataRekap } from '@/types/print-tools';

export interface initValue {
    kode_harga_price?: string;
    kode_tipe_kamar: string;
    kode_rate_plan: string;
    kode_season: string | null;
    price: number | null;
    extra_bed_price: number | null;
    valid_from: Date | string | null;
    valid_to: Date | string | null;
    is_active: number;
}

export interface State {
    load: boolean;
    data: any[];
    add: boolean;
    edit: boolean;
    delete: boolean;
    selectedDatas: any[];
    searchVal: string;
    filters: any;
    session: any;
    submittedData: any;
    first: number;
    rows: number;
    page: number;
    keyword: string;
    totalData: number;
    sortField: string;
    sortOrder: string;
}

export interface FormProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    formik: any;
    toast: React.RefObject<Toast>;
    getData: (apiEndpoint: string) => Promise<void>;
}

export interface TableProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    formik: any;
    toast: React.RefObject<Toast>;
    getData: (apiEndpoint: string) => Promise<void>;
    getPrintData: (apiEndpoint: string) => Promise<void>;
    onLazyLoad: (event: DataTableStateEvent) => void;
    dataRekap: DataRekap;
    setDataRekap: React.Dispatch<React.SetStateAction<DataRekap>>;
}

export const HEADER_CONFIG = {
    tipe_kamar_name: 'Tipe Kamar',
    rate_plan_name: 'Rate Plan',
    season_name: 'Musim',
    price: 'Harga',
    extra_bed_price: 'Extra Bed',
    valid_from: 'Berlaku Mulai',
    valid_to: 'Berlaku Sampai',
    is_active: 'Status'
};

export const FORMATTER_CONFIG: Record<string, (val: any) => string> = {
    price: (val: any) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`,
    extra_bed_price: (val: any) => val ? `Rp ${Number(val).toLocaleString('id-ID')}` : '-',
    season_name: (val: any) => val || 'Reguler',
    valid_from: (val: any) => val ? new Date(val).toLocaleDateString('id-ID') : '-',
    valid_to: (val: any) => val ? new Date(val).toLocaleDateString('id-ID') : 'Selamanya',
    is_active: (val: any) => (val === 1 ? 'Aktif' : 'Non Aktif')
};
