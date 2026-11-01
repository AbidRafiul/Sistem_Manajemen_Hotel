import { DataTableStateEvent } from 'primereact/datatable';
import { DataRekap } from '@/types/print-tools';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';

export interface GuestData {
  id?: number;
  kode_cabang: string;
  kode_tamu: string;
  full_name: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  id_type: 'ktp' | 'passport' | 'sim' | 'other';
  id_number: string;
  id_number_masked?: string;
  phone: string;
  email?: string;
  nationality?: string;
  gender?: 'L' | 'P';
  birth_date?: string;
  identity_file_path?: string;

  passport_no?: string;
  passport_issuing_country?: string;
  passport_expiry?: string;
  visa_type?: string;
  visa_no?: string;
  arrival_date_indonesia?: string;
  purpose_of_visit?: string;

  guest_type: 'individual' | 'corporate' | 'travel_agent' | 'group';
  vip_level: 'none' | 'vip' | 'vvip' | 'owner';
  is_vip?: number;
  is_blacklisted?: number;
  blacklist_reason?: string;
  company_id?: string;
  company_name?: string;
  loyalty_tier?: string;

  preferences?: any;
  internal_notes?: string;
  consent_marketing?: number;
  
  total_stay?: number;
  total_night?: number;
  total_spending?: number;
  avg_adr?: number;
  last_stay_date?: string;
  completeness_score?: number;
  source?: string;
  is_merged?: number;
  merged_into_guest_id?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface State {
  load: boolean;
  data: GuestData[];
  add: boolean;
  edit: boolean;
  delete: boolean;
  detail: boolean;
  suspects: boolean;
  selectedDatas: GuestData[];
  selectedGuest: GuestData | null;
  searchVal: string;
  keyword: string;
  guestTypeFilter: string;
  nationalityFilter: string;
  vipFilter: string;
  blacklistFilter: string;
  incompleteOnly: boolean;
  first: number;
  rows: number;
  page: number;
  totalData: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

export const initValueForm: Partial<GuestData> = {
  kode_cabang: '',
  full_name: '',
  title: 'Mr',
  first_name: '',
  last_name: '',
  id_type: 'ktp',
  id_number: '',
  phone: '',
  email: '',
  nationality: 'Indonesia',
  gender: 'L',
  birth_date: '',
  identity_file_path: '',

  passport_no: '',
  passport_issuing_country: '',
  passport_expiry: '',
  visa_type: '',
  visa_no: '',
  arrival_date_indonesia: '',
  purpose_of_visit: '',

  guest_type: 'individual',
  vip_level: 'none',
  company_id: '',
  loyalty_tier: '',

  preferences: {
    floor: '',
    room_type: '',
    bed_type: '',
    smoking: false,
    pillow: '',
    allergy: '',
    special_request: ''
  },
  internal_notes: '',
  consent_marketing: 0
};

export interface TableProps {
  dataRekap: DataRekap;
  setDataRekap: React.Dispatch<React.SetStateAction<DataRekap>>;
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  getData: () => Promise<void> | void;
  getPrintData: () => Promise<void> | void;
  onLazyLoad: (e: any) => void;
  formik: any;
  toast: RefObject<Toast>;
}

export const HEADER_CONFIG: Record<string, string> = {
  nama_lengkap: 'Nama Lengkap',
  identitas: 'No. Identitas',
  phone: 'No. Telepon',
  email: 'Email',
  nationality: 'Kewarganegaraan',
  guest_type: 'Jenis Tamu',
  vip_level: 'Tingkat VIP',
  company_name: 'Perusahaan / Corporate',
  total_stay: 'Total Kunjungan',
  total_spending: 'Total Pengeluaran',
  last_stay_date: 'Terakhir Menginap',
  is_blacklisted: 'Status Blacklist',
  is_active: 'Status',
  created_at: 'Waktu Registrasi'
};

export const FORMATTER_CONFIG: Record<string, (val: any) => any> = {
  guest_type: (val: string) => {
    switch (val) {
      case 'individual':
        return 'Individual';
      case 'corporate':
        return 'Corporate';
      case 'travel_agent':
        return 'Travel Agent';
      case 'group':
        return 'Group';
      default:
        return val || '-';
    }
  },
  vip_level: (val: string) => {
    switch (val) {
      case 'none':
        return 'Non-VIP';
      case 'vip':
        return 'VIP';
      case 'vvip':
        return 'VVIP';
      case 'owner':
        return 'Owner Guest';
      default:
        return val || '-';
    }
  },
  total_spending: (val: number) => {
    if (!val || val === 0) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  },
  total_stay: (val: number) => `${val || 0}x`,
  is_blacklisted: (val: number) => (val === 1 ? 'Blacklist' : 'Normal'),
  is_active: (val: number) => (val === 1 ? 'Aktif' : 'Non-Aktif')
};
