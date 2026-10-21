export interface EventItem {
    id?: number;
    item_type: 'fnb' | 'equipment' | 'facility' | 'other';
    item_name: string;
    qty: number;
    unit: string;
    harga_satuan: number;
    subtotal: number;
    catatan?: string;
}

export interface EventBooking {
    id: number;
    kode_reservasi_event: string;
    nama_event: string;
    kode_ruang_event: string;
    nama_ruang: string;
    kapasitas_ruang?: number;
    kode_cabang: string;
    kode_tamu: string;
    guest_name: string;
    guest_phone?: string;
    kode_corporate?: string;
    corporate_name?: string;
    penyelenggara: string;
    tgl_mulai: string;
    tgl_selesai: string;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_tamu: number;
    layout_setup: 'theater' | 'classroom' | 'u_shape' | 'boardroom' | 'banquet' | 'standing' | 'hollow_square' | 'custom';
    tipe_sewa: 'per_jam' | 'half_day' | 'full_day' | 'custom_package';
    durasi_jam: number;
    tarif_sewa: number;
    biaya_tambahan: number;
    diskon: number;
    pajak_persen: number;
    nominal_pajak: number;
    service_charge_persen: number;
    nominal_service_charge: number;
    total_biaya: number;
    deposit_paid: number;
    sisa_tagihan: number;
    status_pembayaran: 'unpaid' | 'deposit' | 'paid' | 'refunded';
    status_event: 'tentative' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    setup_buffer_minutes: number;
    teardown_buffer_minutes: number;
    catatan_khusus?: string;
    catatan_batal?: string;
    items?: EventItem[];
    created_at?: string;
    updated_at?: string;
}

export interface FormikEventValues {
    kode_reservasi_event?: string;
    nama_event: string;
    kode_ruang_event: string;
    kode_cabang: string;
    kode_tamu: string;
    kode_corporate: string;
    tgl_mulai: string;
    tgl_selesai: string;
    jam_mulai: string;
    jam_selesai: string;
    jumlah_tamu: number;
    layout_setup: string;
    tipe_sewa: string;
    durasi_jam: number;
    tarif_sewa: number;
    diskon: number;
    pajak_persen: number;
    service_charge_persen: number;
    deposit_paid: number;
    contact_person: string;
    contact_phone: string;
    contact_email: string;
    setup_buffer_minutes: number;
    teardown_buffer_minutes: number;
    catatan_khusus: string;
    items: EventItem[];
}
