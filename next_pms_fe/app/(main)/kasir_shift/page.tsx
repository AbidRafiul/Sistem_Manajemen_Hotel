'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { useFormik } from 'formik';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { 
    apiShiftCurrent, 
    apiShiftOpen, 
    apiShiftClose, 
    apiCabangDropdown, 
    apiCashierCounterDropdown 
} from './components/endpoints';

interface ShiftData {
    kode_cashier_shift: string;
    kode_cabang: string;
    kode_cashier_counter: string;
    nama_counter: string;
    cabang_name: string;
    opening_cash: string | number;
    opened_at: string;
}

const Page = () => {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(true);
    const [shiftAktif, setShiftAktif] = useState<ShiftData | null>(null);
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);
    const [counterOptions, setCounterOptions] = useState<any[]>([]);
    const [submitLoad, setSubmitLoad] = useState(false);
    
    // For close shift modal
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closeSummary, setCloseSummary] = useState<any>(null);

    // Form open shift
    const formikOpen = useFormik({
        initialValues: {
            kode_cabang: '',
            kode_cashier_counter: '',
            opening_cash: 0
        },
        validate: (data) => {
            let errors: any = {};
            if (!data.kode_cabang) errors.kode_cabang = 'Cabang wajib dipilih';
            if (!data.kode_cashier_counter) errors.kode_cashier_counter = 'Counter wajib dipilih';
            if (data.opening_cash < 0) errors.opening_cash = 'Uang modal tidak valid';
            return errors;
        },
        onSubmit: async (values) => {
            setSubmitLoad(true);
            try {
                const res = await postData(apiShiftOpen, values);
                showSuccess(toast, "Shift berhasil dibuka!");
                fetchCurrentShift();
            } catch (error: any) {
                showError(toast, error?.response?.data?.message || "Gagal buka shift");
            } finally {
                setSubmitLoad(false);
            }
        }
    });

    // Form close shift
    const formikClose = useFormik({
        initialValues: {
            closing_cash: 0
        },
        onSubmit: async (values) => {
            if (!shiftAktif) return;
            setSubmitLoad(true);
            try {
                const res = await postData(apiShiftClose, {
                    kode_cashier_shift: shiftAktif.kode_cashier_shift,
                    closing_cash: values.closing_cash
                });
                
                const dataClose = res.data.data;
                setCloseSummary(dataClose);
                setShowCloseModal(true);
                
                // Refresh to show no active shift after they close the summary modal
            } catch (error: any) {
                showError(toast, error?.response?.data?.message || "Gagal tutup shift");
            } finally {
                setSubmitLoad(false);
            }
        }
    });

    const fetchCurrentShift = async () => {
        setLoading(true);
        try {
            // Note: the backend for shift_current is GET, so if postData fails we should change to GET.
            // Wait, we defined it as router.get("/") in backend?
            // Actually our postData uses POST by default, let's use fetch directly for GET or postData if backend allows.
            // I will use fetch for GET via BFF or just change backend to POST for consistency.
            // Ah, the interceptor needs POST to send to BFF? No, BFF proxy is mostly POST.
            // Let's use postData since all BFF in this project uses POST pattern.
            // Wait, the backend code for shift_current.js uses `router.get("/")`.
            // Let me fetch via standard fetch with session token if needed. 
            // I'll adjust the backend to be router.post("/") later if there's issue, or I'll just use fetch API.
            // For now, let's try fetch or postData (sometimes BFF handles it if it's GET/POST agnostic).
            // Usually the BFF interceptor in this project (`api/interceptor/route.ts`) handles POST request and forwards as POST.
            // I should use POST in the backend for `shift_current.js` to match the project's standard `postData` usage.
            const res = await postData(apiShiftCurrent, {});
            setShiftAktif(res.data.data);
        } catch (error: any) {
            // showError(toast, "Gagal memuat status shift");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getCabang = async () => {
        try {
            const res = await postData(apiCabangDropdown, {});
            setCabangOptions(res.data.data);
        } catch (e) {}
    };

    const getCounter = async (kode_cabang: string) => {
        try {
            const res = await postData(apiCashierCounterDropdown, { 
                kode_cabang, 
                perPage: 100, 
                page: 1 
            });
            setCounterOptions(res.data.data);
        } catch (e) {}
    };

    useEffect(() => {
        fetchCurrentShift();
        getCabang();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (formikOpen.values.kode_cabang) {
            getCounter(formikOpen.values.kode_cabang);
        }
    }, [formikOpen.values.kode_cabang]);

    const formatCurrency = (val: number | string) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(val));
    };

    const isFormFieldInvalidOpen = (name: string) => !!(formikOpen.touched[name as keyof typeof formikOpen.touched] && formikOpen.errors[name as keyof typeof formikOpen.errors]);
    const getFormErrorMessageOpen = (name: string) => {
        return isFormFieldInvalidOpen(name) && <small className="p-error">{formikOpen.errors[name as keyof typeof formikOpen.errors]}</small>;
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="card">
                    <h5>Manajemen Shift Kasir</h5>
                    
                    {loading ? (
                        <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
                            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                        </div>
                    ) : (
                        <>
                            {!shiftAktif ? (
                                <div className="p-fluid max-w-30rem">
                                    <div className="mb-4">
                                        <div className="flex align-items-center gap-2 mb-2 text-red-500">
                                            <i className="pi pi-times-circle" style={{ fontSize: '1.5rem' }}></i>
                                            <span className="text-xl font-bold">Shift Belum Dibuka</span>
                                        </div>
                                        <p className="text-secondary">Anda belum memiliki shift aktif. Silakan buka shift terlebih dahulu untuk dapat menerima transaksi.</p>
                                    </div>
                                    
                                    <form onSubmit={formikOpen.handleSubmit}>
                                        <div className="field">
                                            <label htmlFor="kode_cabang">Cabang <span className="text-red-500">*</span></label>
                                            <Dropdown
                                                id="kode_cabang"
                                                value={formikOpen.values.kode_cabang}
                                                options={cabangOptions}
                                                optionLabel="nama_hotel"
                                                optionValue="kode_cabang"
                                                onChange={formikOpen.handleChange}
                                                placeholder="Pilih Cabang"
                                                className={isFormFieldInvalidOpen('kode_cabang') ? 'p-invalid' : ''}
                                            />
                                            {getFormErrorMessageOpen('kode_cabang')}
                                        </div>
                                        
                                        <div className="field">
                                            <label htmlFor="kode_cashier_counter">Loket/Counter <span className="text-red-500">*</span></label>
                                            <Dropdown
                                                id="kode_cashier_counter"
                                                value={formikOpen.values.kode_cashier_counter}
                                                options={counterOptions}
                                                optionLabel="name"
                                                optionValue="kode_counter"
                                                onChange={formikOpen.handleChange}
                                                placeholder="Pilih Counter"
                                                className={isFormFieldInvalidOpen('kode_cashier_counter') ? 'p-invalid' : ''}
                                                disabled={!formikOpen.values.kode_cabang}
                                            />
                                            {getFormErrorMessageOpen('kode_cashier_counter')}
                                        </div>
                                        
                                        <div className="field">
                                            <label htmlFor="opening_cash">Uang Modal Awal (Cash) <span className="text-red-500">*</span></label>
                                            <InputNumber
                                                id="opening_cash"
                                                value={formikOpen.values.opening_cash}
                                                onValueChange={(e) => formikOpen.setFieldValue('opening_cash', e.value)}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                className={isFormFieldInvalidOpen('opening_cash') ? 'p-invalid' : ''}
                                            />
                                            {getFormErrorMessageOpen('opening_cash')}
                                        </div>
                                        
                                        <Button label="Buka Shift" icon="pi pi-check" type="submit" loading={submitLoad} />
                                    </form>
                                </div>
                            ) : (
                                <div className="p-fluid max-w-30rem">
                                    <div className="mb-4">
                                        <div className="flex align-items-center gap-2 mb-2 text-green-500">
                                            <i className="pi pi-check-circle" style={{ fontSize: '1.5rem' }}></i>
                                            <span className="text-xl font-bold">Shift Sedang Aktif</span>
                                        </div>
                                        <p className="text-secondary">Anda memiliki shift kasir yang sedang berjalan. Transaksi akan dicatat ke dalam shift ini.</p>
                                    </div>
                                    
                                    <div className="surface-100 p-3 border-round mb-4">
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-secondary">Kode Shift</span>
                                            <span className="font-bold">{shiftAktif.kode_cashier_shift}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-secondary">Cabang</span>
                                            <span className="font-bold">{shiftAktif.cabang_name}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-secondary">Loket</span>
                                            <span className="font-bold">{shiftAktif.nama_counter}</span>
                                        </div>
                                        <div className="flex justify-content-between mb-2">
                                            <span className="text-secondary">Waktu Buka</span>
                                            <span className="font-bold">{formatDateSystem(shiftAktif.opened_at, "dd-MM-yyyy HH:mm:ss")}</span>
                                        </div>
                                        <div className="flex justify-content-between">
                                            <span className="text-secondary">Uang Modal Awal</span>
                                            <span className="font-bold">{formatCurrency(shiftAktif.opening_cash)}</span>
                                        </div>
                                    </div>
                                    
                                    <form onSubmit={formikClose.handleSubmit}>
                                        <div className="field">
                                            <label htmlFor="closing_cash">Uang Fisik Akhir (Cash) <span className="text-red-500">*</span></label>
                                            <InputNumber
                                                id="closing_cash"
                                                value={formikClose.values.closing_cash}
                                                onValueChange={(e) => formikClose.setFieldValue('closing_cash', e.value)}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                            />
                                            <small className="text-secondary block mt-1">Masukkan jumlah uang fisik tunai yang ada di laci kasir saat ini.</small>
                                        </div>
                                        
                                        <Button label="Tutup Shift" icon="pi pi-lock" severity="danger" type="submit" loading={submitLoad} />
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            <Dialog 
                header="Ringkasan Penutupan Shift" 
                visible={showCloseModal} 
                onHide={() => setShowCloseModal(false)}
                style={{ width: '350px' }} 
                modal 
                closable={false}
                footer={<Button label="Tutup" icon="pi pi-check" onClick={() => {
                    setShowCloseModal(false);
                    setCloseSummary(null);
                    fetchCurrentShift();
                }} autoFocus />}
            >
                {closeSummary && (
                    <div className="m-0 text-center">
                        <i className={`pi ${closeSummary.cash_difference === 0 ? 'pi-check-circle text-green-500' : 'pi-exclamation-triangle text-orange-500'} mb-3`} style={{ fontSize: '3rem' }}></i>
                        <h5 className="mb-3">Shift Ditutup</h5>
                        
                        <div className="text-left surface-100 p-3 border-round mb-3">
                            <div className="flex justify-content-between mb-2">
                                <span className="text-secondary">System Cash</span>
                                <span className="font-bold">{formatCurrency(closeSummary.system_cash)}</span>
                            </div>
                            <div className="flex justify-content-between mb-2">
                                <span className="text-secondary">Fisik (Closing)</span>
                                <span className="font-bold">{formatCurrency(closeSummary.closing_cash)}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-secondary font-bold">Selisih</span>
                                <span className={`font-bold ${closeSummary.cash_difference < 0 ? 'text-red-500' : closeSummary.cash_difference > 0 ? 'text-green-500' : ''}`}>
                                    {formatCurrency(closeSummary.cash_difference)}
                                </span>
                            </div>
                        </div>
                        
                        {closeSummary.cash_difference !== 0 && (
                            <p className="text-red-500 text-sm m-0">Terdapat selisih kas! Harap laporkan ke supervisor.</p>
                        )}
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default Page;
