import React, { useEffect } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import postData from '@/lib/axios/postData';
import { apiCashierShiftDropdown } from './endpoints';

interface StepPaymentProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepPayment: React.FC<StepPaymentProps> = ({ state, setState, formik, toast }) => {

    useEffect(() => {
        const getCashierShift = async () => {
            setState(p => ({ ...p, cashierShiftLoad: true }));
            try {
                const res = await postData(apiCashierShiftDropdown, {});
                setState(p => ({ ...p, cashierShiftOptions: res.data.data }));
            } catch (e) {
                // optional
            } finally {
                setState(p => ({ ...p, cashierShiftLoad: false }));
            }
        };
        getCashierShift();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const paymentMethods = [
        { label: 'Cash', value: 'cash' },
        { label: 'Card', value: 'card' },
        { label: 'Transfer', value: 'transfer' },
        { label: 'EDC', value: 'edc' }
    ];

    const handleNext = async () => {
        const errors = await formik.validateForm();
        if (formik.values.deposit_amount > 0) {
            if (errors.payment_method || errors.kode_cashier_shift) {
                formik.setTouched({
                    ...formik.touched,
                    payment_method: true,
                    kode_cashier_shift: true
                });
                return;
            }
        }
        setState(p => ({ ...p, activeStep: 3 }));
    };

    const handlePrev = () => {
        setState(p => ({ ...p, activeStep: 1 }));
    };

    const totalTagihan = (state.rateInfo?.price || 0) * formik.values.nights;

    return (
        <div className="p-fluid formgrid grid">
            <div className="col-12 mb-3">
                <div className="p-3 bg-blue-50 border-round">
                    <h6 className="m-0">Ringkasan Tagihan Kamar</h6>
                    <p className="m-0 mt-2 text-xl font-bold">Rp {totalTagihan.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="field col-12 md:col-4">
                <label>Deposit Awal (Opsional)</label>
                <InputNumber 
                    value={formik.values.deposit_amount} 
                    onValueChange={(e) => formik.setFieldValue('deposit_amount', e.value || 0)} 
                    mode="currency" 
                    currency="IDR" 
                    locale="id-ID"
                    min={0}
                />
            </div>

            {formik.values.deposit_amount > 0 && (
                <>
                    <div className="field col-12 md:col-4">
                        <label>Metode Pembayaran Deposit</label>
                        <Dropdown 
                            value={formik.values.payment_method} 
                            options={paymentMethods} 
                            onChange={(e) => formik.setFieldValue('payment_method', e.value)}
                            placeholder="Pilih Metode" 
                            className={formik.errors.payment_method && formik.touched.payment_method ? 'p-invalid' : ''}
                        />
                        {formik.errors.payment_method && formik.touched.payment_method && <small className="p-error">{formik.errors.payment_method}</small>}
                    </div>
                    <div className="field col-12 md:col-4">
                        <label>Shift Kasir</label>
                        <Dropdown 
                            value={formik.values.kode_cashier_shift} 
                            options={state.cashierShiftOptions} 
                            onChange={(e) => formik.setFieldValue('kode_cashier_shift', e.value)}
                            optionLabel="nama_shift" 
                            optionValue="kode_cashier_shift"
                            placeholder="Pilih Shift" 
                            disabled={state.cashierShiftLoad}
                            className={formik.errors.kode_cashier_shift && formik.touched.kode_cashier_shift ? 'p-invalid' : ''}
                        />
                        {formik.errors.kode_cashier_shift && formik.touched.kode_cashier_shift && <small className="p-error">{formik.errors.kode_cashier_shift}</small>}
                    </div>
                </>
            )}

            <div className="col-12 flex justify-content-between mt-4">
                <Button label="Kembali" icon="pi pi-arrow-left" onClick={handlePrev} className="p-button-text" />
                <Button label="Lanjut ke Konfirmasi" icon="pi pi-arrow-right" iconPos="right" onClick={handleNext} />
            </div>
        </div>
    );
};

export default StepPayment;
