export interface ReservasiBaruState {
    load: boolean;
    activeStep: number;
    cabangLoad: boolean;
    cabangOptions: any[];
    
    // Dropdowns
    tipeKamarLoad: boolean;
    tipeKamarOptions: any[];
    ratePlanLoad: boolean;
    ratePlanOptions: any[];
    musimLoad: boolean;
    musimOptions: any[];
    cashierShiftLoad: boolean;
    cashierShiftOptions: any[];
    
    // Guest Search
    searchGuestLoad: boolean;
    foundGuest: any | null;
    isGuestNew: boolean;

    // Availability
    availabilityLoad: boolean;
    availableRooms: any[];
    rateInfo: any | null;

    // Submission
    submitLoad: boolean;
    submittedData: any | null;
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
    kode_season: string;
    kode_kamar: string; // selected room

    // Step 3: Payment
    deposit_amount: number;
    payment_method: string;
    kode_cashier_shift: string;
}
