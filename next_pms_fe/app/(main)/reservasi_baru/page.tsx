'use client';
import { Toast } from 'primereact/toast';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ReservasiBaruState, initValue } from './components/interfaces';
import { useFormik } from 'formik';
import FormWalkIn from './components/form_walk_in';

const WalkInContent = () => {
    const toast = useRef<Toast>(null);
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const [state, setState] = useState<ReservasiBaruState>({
        load: false,
        activeStep: 0,
        cabangLoad: false,
        cabangOptions: [],
        cashierShiftLoad: false,
        cashierShiftOptions: [],
        
        searchGuestLoad: false,
        foundGuest: null,
        isGuestNew: false,
        guestList: [],
        guestListLoad: false,

        packagesLoad: false,
        packagesOptions: [],
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
            kode_kamar: '',
            selected_rooms: [],
            extra_facilities: [],
            special_request: '',
            deposit_amount: 0,
            payment_method: '',
            kode_cashier_shift: ''
        },
        validate: (data) => {
            let errors: any = {};
            const checkStep0 = state.activeStep === 0 || state.activeStep === 4;
            const checkStep1 = state.activeStep === 1 || state.activeStep === 4;
            const checkStep3 = state.activeStep === 3 || state.activeStep === 4;

            if (checkStep0) {
                if (!data.kode_cabang) errors.kode_cabang = 'Cabang wajib dipilih';
                if (!state.foundGuest && !state.isGuestNew && !data.kode_guest) {
                    errors.keyword_guest = 'Silakan cari atau buat data tamu baru';
                }
                if (state.isGuestNew) {
                    if (!data.full_name) errors.full_name = 'Nama lengkap wajib diisi';
                    if (!data.id_number) errors.id_number = 'Nomor ID wajib diisi';
                    if (!data.phone) errors.phone = 'Nomor Telepon wajib diisi';
                }
            }
            if (checkStep1) {
                if (!data.check_in_date) errors.check_in_date = 'Tanggal Check In wajib diisi';
                if (!data.check_out_date) errors.check_out_date = 'Tanggal Check Out wajib diisi';
                const hasRooms = (data.selected_rooms && data.selected_rooms.length > 0) || (data.kode_kamar && data.kode_tipe_kamar);
                if (!hasRooms) {
                    errors.kode_kamar = 'Silakan pilih minimal 1 kamar fisik yang tersedia';
                }
            }
            if (checkStep3) {
                if (data.deposit_amount > 0) {
                    if (!data.payment_method) errors.payment_method = 'Metode pembayaran wajib dipilih';
                    if (!data.kode_cashier_shift) errors.kode_cashier_shift = 'Shift kasir wajib dipilih';
                }
            }
            return errors;
        },
        onSubmit: () => {
            // Handled by final submit function
        }
    });

    // Sinkronisasi otomatis kode_cabang dengan active branch dari toggle header
    useEffect(() => {
        if (session?.user?.active_kode_cabang) {
            formik.setFieldValue('kode_cabang', session.user.active_kode_cabang);
        }

        if (!searchParams) return;
        const tipe = searchParams.get('tipe');
        const inDate = searchParams.get('in');
        const outDate = searchParams.get('out');

        if (tipe) formik.setFieldValue('kode_tipe_kamar', tipe);
        if (inDate) {
            const dIn = new Date(inDate);
            if (!isNaN(dIn.getTime())) formik.setFieldValue('check_in_date', dIn);
        }
        if (outDate) {
            const dOut = new Date(outDate);
            if (!isNaN(dOut.getTime())) {
                formik.setFieldValue('check_out_date', dOut);
                const cinTime = inDate ? new Date(inDate).getTime() : new Date().getTime();
                const nights = Math.max(1, Math.round((dOut.getTime() - cinTime) / (1000 * 60 * 60 * 24)));
                formik.setFieldValue('nights', nights);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, session?.user?.active_kode_cabang]);

    return (
        <div className="p-0">
            <Toast ref={toast} position="top-right" />
            <FormWalkIn state={state} setState={setState} formik={formik} toast={toast} />
        </div>
    );
};

const Page = () => {
    return (
        <Suspense fallback={<div className="p-4 text-center">Memuat data...</div>}>
            <WalkInContent />
        </Suspense>
    );
};

export default Page;
