'use client';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ReservasiBaruState, initValue } from './components/interfaces';
import { useFormik } from 'formik';
import { getTzUser } from '@/lib/tools/dateTools';
import FormWalkIn from './components/form_walk_in';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<ReservasiBaruState>({
        load: false,
        activeStep: 0,
        cabangLoad: false,
        cabangOptions: [],
        tipeKamarLoad: false,
        tipeKamarOptions: [],
        ratePlanLoad: false,
        ratePlanOptions: [],
        musimLoad: false,
        musimOptions: [],
        cashierShiftLoad: false,
        cashierShiftOptions: [],
        searchGuestLoad: false,
        foundGuest: null,
        isGuestNew: false,
        availabilityLoad: false,
        availableRooms: [],
        rateInfo: null,
        submitLoad: false,
        submittedData: null,
    });

    const formik = useFormik<initValue>({
        initialValues: {
            kode_cabang: '',
            keyword_guest: '',
            kode_guest: '',
            full_name: '',
            id_type: 'ktp',
            id_number: '',
            phone: '',
            email: '',
            nationality: '',
            check_in_date: new Date(),
            check_out_date: new Date(new Date().setDate(new Date().getDate() + 1)), // default tomorrow
            nights: 1,
            kode_tipe_kamar: '',
            kode_rate_plan: '',
            kode_season: '',
            kode_kamar: '',
            deposit_amount: 0,
            payment_method: '',
            kode_cashier_shift: ''
        },
        validate: (data) => {
            let errors: any = {};
            // Validation logic based on active step will be handled in child components or here
            if (state.activeStep === 0) {
                if (!data.kode_cabang) errors.kode_cabang = 'Cabang wajib dipilih';
                if (!state.foundGuest && !state.isGuestNew) {
                    errors.keyword_guest = 'Silakan cari atau buat data tamu baru';
                }
                if (state.isGuestNew) {
                    if (!data.full_name) errors.full_name = 'Nama lengkap wajib diisi';
                    if (!data.id_number) errors.id_number = 'Nomor ID wajib diisi';
                    if (!data.phone) errors.phone = 'Nomor Telepon wajib diisi';
                }
            } else if (state.activeStep === 1) {
                if (!data.check_in_date) errors.check_in_date = 'Tanggal Check In wajib diisi';
                if (!data.check_out_date) errors.check_out_date = 'Tanggal Check Out wajib diisi';
                if (!data.kode_tipe_kamar) errors.kode_tipe_kamar = 'Tipe Kamar wajib dipilih';
                if (!data.kode_rate_plan) errors.kode_rate_plan = 'Rate Plan wajib dipilih';
                if (!data.kode_kamar) errors.kode_kamar = 'Kamar wajib dipilih';
            } else if (state.activeStep === 2) {
                if (data.deposit_amount > 0) {
                    if (!data.payment_method) errors.payment_method = 'Metode pembayaran wajib dipilih';
                    if (!data.kode_cashier_shift) errors.kode_cashier_shift = 'Shift kasir wajib dipilih';
                }
            }
            return errors;
        },
        onSubmit: (data) => {
            // Handled by final submit function
        }
    });

    return (
        <div className="p-0">
            <Toast ref={toast} position="top-right" />
            <div className="card">
                <h5>Reservasi Baru (Walk-in)</h5>
                <FormWalkIn state={state} setState={setState} formik={formik} toast={toast} />
            </div>
        </div>
    );
};

export default Page;
