import React from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import postData from '@/lib/axios/postData';
import { apiSubmitBooking } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface StepConfirmationProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepConfirmation: React.FC<StepConfirmationProps> = ({ state, setState, formik, toast }) => {


    const submitWalkIn = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length > 0) {
            formik.setTouched(
                Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            showError(toast, "Terdapat isian yang belum lengkap. Silakan periksa kembali tab yang bertanda peringatan.");
            return;
        }
        setState(p => ({ ...p, submitLoad: true }));
        try {
            const res = await postData(apiSubmitBooking, {
                kode_cabang: formik.values.kode_cabang,
                kode_guest: formik.values.kode_guest,
                check_in_date: formatDateSystem(formik.values.check_in_date || new Date(), "yyyy-MM-dd"),
                check_out_date: formatDateSystem(formik.values.check_out_date || new Date(), "yyyy-MM-dd"),
                nights: formik.values.nights,
                kode_tipe_kamar: formik.values.kode_tipe_kamar,
                kode_rate_plan: formik.values.kode_rate_plan,
                deposit_amount: formik.values.deposit_amount,
                payment_method: formik.values.payment_method || null,
                kode_cashier_shift: formik.values.kode_cashier_shift || null
            });

            if (res.data.status === '00') {
                setState(p => ({ ...p, submittedData: res.data.data }));
                showSuccess(toast, "Reservasi berhasil dibuat");
            } else {
                showError(toast, res.data.message || "Gagal membuat reservasi");
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat memproses reservasi");
        } finally {
            setState(p => ({ ...p, submitLoad: false }));
        }
    };

    const totalTagihan = (state.rateInfo?.price_per_night || 0) * formik.values.nights;

    if (state.submittedData) {
        return (
            <div className="col-12 mt-4 text-center">
                <i className="pi pi-check-circle text-green-500" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Reservasi Berhasil!</h4>
                <p className="text-secondary">Tamu dapat melakukan check-in pada hari kedatangan.</p>
                
                <div className="mt-4 flex flex-column align-items-center gap-3">
                    <div className="surface-100 p-3 border-round w-full md:w-6 flex justify-content-between">
                        <span className="font-medium">No. Reservasi:</span>
                        <span className="font-bold">{state.submittedData?.kode_reservasi}</span>
                    </div>
                    <div className="surface-100 p-3 border-round w-full md:w-6 flex justify-content-between">
                        <span className="font-medium">Status:</span>
                        <span className="font-bold uppercase text-primary">{state.submittedData?.status}</span>
                    </div>
                </div>
                <Button label="Buat Reservasi Baru" className="mt-4" onClick={() => window.location.reload()} />
            </div>
        );
    }

    return (
        <div className="p-fluid">
            <h5>Ringkasan Reservasi</h5>
            <div className="grid">
                <div className="col-12 md:col-6">
                    <div className="p-3 border-1 surface-border border-round h-full">
                        <h6>Data Tamu</h6>
                        <p className="m-0 text-secondary">ID Tamu: <strong>{formik.values.kode_guest}</strong></p>
                        <p className="m-0 text-secondary">Nama: <strong>{formik.values.full_name || state.foundGuest?.full_name}</strong></p>
                        <p className="m-0 text-secondary">Phone: <strong>{formik.values.phone || state.foundGuest?.phone}</strong></p>
                    </div>
                </div>
                <div className="col-12 md:col-6">
                    <div className="p-3 border-1 surface-border border-round h-full">
                        <h6>Kamar & Waktu</h6>
                        <p className="m-0 text-secondary">
                            Check In: <strong>{formik.values.check_in_date ? formatDateSystem(formik.values.check_in_date, 'dd-MM-yyyy') : '-'}</strong>
                        </p>
                        <p className="m-0 text-secondary">
                            Check Out: <strong>{formik.values.check_out_date ? formatDateSystem(formik.values.check_out_date, 'dd-MM-yyyy') : '-'}</strong>
                        </p>
                        <p className="m-0 text-secondary">Malam: <strong>{formik.values.nights}</strong></p>
                    </div>
                </div>
                <div className="col-12">
                    <div className="p-3 border-1 surface-border border-round bg-blue-50">
                        <h6>Keuangan</h6>
                        <div className="flex justify-content-between">
                            <span>Tagihan Kamar</span>
                            <strong>Rp {totalTagihan.toLocaleString('id-ID')}</strong>
                        </div>
                        <div className="flex justify-content-between mt-2">
                            <span>Deposit Dibayarkan</span>
                            <strong>Rp {formik.values.deposit_amount.toLocaleString('id-ID')}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-content-end mt-4">
                <Button label="Proses Booking" icon="pi pi-check" iconPos="right" severity="success" onClick={submitWalkIn} loading={state.submitLoad} />
            </div>
        </div>
    );
};

export default StepConfirmation;
