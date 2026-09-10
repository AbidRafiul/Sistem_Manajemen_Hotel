import React, { useEffect } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';
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
                const res = await postData(apiCashierShiftDropdown, {
                    kode_cabang: formik.values.kode_cabang
                });
                setState(p => ({ ...p, cashierShiftOptions: res.data.data }));
            } catch (e: any) {
                showError(toast, "Gagal memuat data shift kasir: " + (e?.response?.data?.message || e.message));
            } finally {
                setState(p => ({ ...p, cashierShiftLoad: false }));
            }
        };
        getCashierShift();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.kode_cabang]);

    const paymentMethods = [
        { label: 'Cash', value: 'cash' },
        { label: 'Card', value: 'card' },
        { label: 'Transfer', value: 'transfer' },
        { label: 'EDC', value: 'edc' }
    ];



    return (
        <div className="p-fluid formgrid grid">
            <div className="col-12 mt-3 mb-4 p-3 border-round border-1 surface-border bg-blue-50">
                <h6 className="m-0 mb-2 text-blue-700">Total Biaya Kamar (Perkiraan)</h6>
                <p className="m-0 text-xl font-bold text-blue-800">
                    Rp {((state.rateInfo?.price_per_night || 0) * formik.values.nights).toLocaleString('id-ID')}
                </p>
                <small className="text-blue-600">Deposit opsional. Isi jika tamu membayar DP.</small>
            </div>

            <div className="field col-12 md:col-6">
                <label>Nominal Deposit (Opsional)</label>
                <InputNumber 
                    value={formik.values.deposit_amount} 
                    onValueChange={(e) => formik.setFieldValue('deposit_amount', e.value ?? 0)} 
                    mode="currency" 
                    currency="IDR" 
                    locale="id-ID" 
                />
            </div>

            <div className="field col-12 md:col-4">
                <label>Metode Pembayaran Deposit</label>
                <Dropdown 
                    value={formik.values.payment_method} 
                    options={paymentMethods} 
                    onChange={(e) => formik.setFieldValue('payment_method', e.value)}
                    placeholder="Pilih Metode" 
                    disabled={!formik.values.deposit_amount || formik.values.deposit_amount === 0}
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
                    disabled={state.cashierShiftLoad || !formik.values.deposit_amount || formik.values.deposit_amount === 0}
                    className={formik.errors.kode_cashier_shift && formik.touched.kode_cashier_shift ? 'p-invalid' : ''}
                />
                {formik.errors.kode_cashier_shift && formik.touched.kode_cashier_shift && <small className="p-error">{formik.errors.kode_cashier_shift}</small>}
            </div>


        </div>
    );
};

export default StepPayment;
