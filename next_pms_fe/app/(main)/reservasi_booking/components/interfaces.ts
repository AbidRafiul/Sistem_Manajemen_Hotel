export interface ReservasiBaruState {
    load: boolean;
    activeStep: number;
    cabangLoad: boolean;
    cabangOptions: any[];
    
    // Dropdowns
    cashierShiftLoad: boolean;
    cashierShiftOptions: any[];
    
    // Guest Search/List
    searchGuestLoad: boolean;
    foundGuest: any | null;
    isGuestNew: boolean;
    guestList: any[];
    guestListLoad: boolean;

    // Availability
    packagesLoad: boolean;
    packagesOptions: any[];
    rateInfo: any | null;

    // Submission
    submitLoad: boolean;
    submittedData: any | null;
}

export interface SelectedRoomItem {
    kode_tipe_kamar: string;
    nama_tipe: string;
    kode_kamar: string;
    nomor_kamar: string;
    kode_rate_plan: string;
    nama_rate_plan: string;
    price_per_night: number;
    total_price: number;
    nights?: number;
}

export interface ExtraFacilityItem {
    id: string;
    nama: string;
    tipe: 'counter' | 'switch';
    harga: number;
    unit_label: string;
    icon: string;
    qty: number;
    subtotal: number;
    kode_fasilitas?: string;
    kode_amenity?: string;
    category?: 'fasilitas' | 'amenity';
    source?: string;
    description?: string;
}

export interface MasterFasilitasItem {
    id: number;
    kode_fasilitas: string;
    kode_cabang: string;
    cabang_name?: string;
    name: string;
    harga?: number;
    is_active: number;
}

export interface MasterAmenityItem {
    id: number;
    kode_amenity: string;
    name: string;
    icon?: string;
    harga?: number;
    is_active: number;
}

export interface initValue {
    // Step 1: Guest
    kode_cabang: string;
    keyword_guest: string;
    kode_guest: string; // filled if found
    
    // if new guest
    full_name: string;
    id_type: string;
    id_number: string;
    phone: string;
    email: string;
    nationality: string;

    // Step 2: Availability
    check_in_date: Date | null;
    check_out_date: Date | null;
    nights: number;
    kode_tipe_kamar: string;
    kode_rate_plan: string;
    kode_kamar?: string;
    selected_rooms?: SelectedRoomItem[];

    // Step 3: Fasilitas Tambahan
    extra_facilities?: ExtraFacilityItem[];
    special_request?: string;

    // Step 4: Payment
    deposit_amount: number;
    payment_method: string;
    kode_cashier_shift: string;
}

