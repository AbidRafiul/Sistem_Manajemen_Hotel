import { DataTableStateEvent } from 'primereact/datatable';

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
