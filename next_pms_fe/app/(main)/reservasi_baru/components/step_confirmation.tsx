import React from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import postData from '@/lib/axios/postData';
import { apiWalkInSubmit } from './endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface StepConfirmationProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepConfirmation: React.FC<StepConfirmationProps> = ({ state, setState, formik, toast }) => {
    const handlePrev = () => {
        setState(p => ({ ...p, activeStep: 2 }));
    };

    const submitWalkIn = async () => {
        setState(p => ({ ...p, submitLoad: true }));
        try {
            const payload = {
                ...formik.values,
                check_in_date: formik.values.check_in_date ? formatDateSystem(formik.values.check_in_date, 'yyyy-MM-dd') : null,
                check_out_date: formik.values.check_out_date ? formatDateSystem(formik.values.check_out_date, 'yyyy-MM-dd') : null
            };
            const res = await postData(apiWalkInSubmit, payload);
            showSuccess(toast, "Proses Walk-in berhasil!");
            setState(p => ({ ...p, submittedData: res.data.data }));
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat memproses walk-in");
        } finally {
            setState(p => ({ ...p, submitLoad: false }));
        }
    };

    const totalTagihan = (state.rateInfo?.price || 0) * formik.values.nights;

    if (state.submittedData) {
        return (
            <div className="text-center p-5">
                <i className="pi pi-check-circle text-green-500" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Walk-in Berhasil Diproses</h4>
                <div className="mt-4 surface-100 p-4 border-round max-w-sm mx-auto text-left">
                    <p><strong>Kode Reservasi:</strong> {state.submittedData.kode_reservasi}</p>
                    <p><strong>Kode Check-in:</strong> {state.submittedData.kode_checkin}</p>
                    <p><strong>Kode Folio:</strong> {state.submittedData.kode_folio}</p>
                    <p><strong>Total Charge:</strong> Rp {state.submittedData.total_charge.toLocaleString('id-ID')}</p>
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
                        <p className="m-0 text-secondary">Kamar: <strong>{formik.values.kode_kamar}</strong></p>
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

            <div className="flex justify-content-between mt-4">
                <Button label="Kembali" icon="pi pi-arrow-left" onClick={handlePrev} className="p-button-text" disabled={state.submitLoad} />
                <Button label="Proses Walk-in & Check-in" icon="pi pi-check" iconPos="right" severity="success" onClick={submitWalkIn} loading={state.submitLoad} />
            </div>
        </div>
    );
};

export default StepConfirmation;
