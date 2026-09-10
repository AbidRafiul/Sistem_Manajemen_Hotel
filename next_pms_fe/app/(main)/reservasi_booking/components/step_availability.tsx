import React, { useEffect } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiRoomPackages } from './endpoints';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { Card } from 'primereact/card';

interface StepAvailabilityProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepAvailability: React.FC<StepAvailabilityProps> = ({ state, setState, formik, toast }) => {

    useEffect(() => {
        if (formik.values.kode_cabang && formik.values.check_in_date && formik.values.check_out_date) {
            searchPackages();
        }
    }, [formik.values.kode_cabang]);

    const handleNightsChange = (val: number | null) => {
        const nights = val || 1;
        formik.setFieldValue('nights', nights);
        if (formik.values.check_in_date) {
            const outDate = new Date(formik.values.check_in_date);
            outDate.setDate(outDate.getDate() + nights);
            formik.setFieldValue('check_out_date', outDate);
            formik.setFieldValue('kode_tipe_kamar', '');
            formik.setFieldValue('kode_rate_plan', '');
            setState(p => ({ ...p, rateInfo: null, packagesOptions: [] }));
        }
    };

    const handleCheckInChange = (date: Date | null) => {
        formik.setFieldValue('check_in_date', date);
        if (date && formik.values.nights) {
            const outDate = new Date(date);
            outDate.setDate(outDate.getDate() + formik.values.nights);
            formik.setFieldValue('check_out_date', outDate);
            formik.setFieldValue('kode_tipe_kamar', '');
            formik.setFieldValue('kode_rate_plan', '');
            setState(p => ({ ...p, rateInfo: null, packagesOptions: [] }));
        }
    };

    const searchPackages = async () => {
        const { kode_cabang, check_in_date, check_out_date } = formik.values;
        if (!check_in_date || !check_out_date) {
            showError(toast, "Lengkapi Tanggal Check-In dan Check-Out");
            return;
        }

        setState(p => ({ ...p, packagesLoad: true, packagesOptions: [], rateInfo: null }));
        formik.setFieldValue('kode_tipe_kamar', '');
        formik.setFieldValue('kode_rate_plan', '');

        try {
            const res = await postData(apiRoomPackages, {
                kode_cabang,
                check_in_date: formatDateSystem(check_in_date, "yyyy-MM-dd"),
                check_out_date: formatDateSystem(check_out_date, "yyyy-MM-dd")
            });

            if (res.data.data) {
                setState(p => ({
                    ...p,
                    packagesOptions: res.data.data || []
                }));
                if (res.data.data.length > 0) {
                    showSuccess(toast, "Katalog produk kamar berhasil dimuat");
                } else {
                    showError(toast, "Tidak ada tipe kamar yang tersedia");
                }
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat memuat paket kamar");
        } finally {
            setState(p => ({ ...p, packagesLoad: false }));
        }
    };

    const selectPackage = (tk: any, pkg: any) => {
        formik.setFieldValue('kode_tipe_kamar', tk.kode_tipe_kamar);
        formik.setFieldValue('kode_rate_plan', pkg.kode_rate_plan);
        setState(p => ({
            ...p,
            rateInfo: {
                ...pkg,
                nama_tipe: tk.nama_tipe
            }
        }));
        showSuccess(toast, `Dipilih: ${tk.nama_tipe} - ${pkg.nama_rate_plan}`);
    };



    return (
        <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-4">
                <label>Check In</label>
                <Calendar 
                    value={formik.values.check_in_date} 
                    onChange={(e) => handleCheckInChange(e.value as Date)}
                    dateFormat="dd/mm/yy" 
                    showIcon
                    className={formik.errors.check_in_date && formik.touched.check_in_date ? 'p-invalid' : ''}
                />
            </div>
            <div className="field col-12 md:col-4">
                <label>Jumlah Malam (Nights)</label>
                <InputNumber 
                    value={formik.values.nights} 
                    onValueChange={(e) => handleNightsChange(e.value ?? null)} 
                    min={1} 
                    showButtons
                />
            </div>
            <div className="field col-12 md:col-4">
                <label>Check Out (Otomatis)</label>
                <Calendar 
                    value={formik.values.check_out_date} 
                    disabled
                    dateFormat="dd/mm/yy" 
                    showIcon
                />
            </div>

            <div className="col-12 mt-2 mb-4">
                <Button label="Cari Paket Kamar Tersedia" icon="pi pi-search" onClick={searchPackages} loading={state.packagesLoad} className="p-button-outlined" />
            </div>

            {/* Katalog Paket Kamar */}
            {state.packagesOptions && state.packagesOptions.length > 0 && (
                <div className="col-12">
                    <h5>Katalog Kamar & Harga</h5>
                    <div className="grid">
                        {state.packagesOptions.map((tk: any, i: number) => (
                            <div key={i} className="col-12 lg:col-6 xl:col-4">
                                <Card className="h-full shadow-2 hover:shadow-4 transition-all transition-duration-200">
                                    <div className="flex justify-content-between align-items-start mb-1">
                                        <h5 className="m-0 text-primary">{tk.nama_tipe}</h5>
                                        <div className="flex flex-column align-items-end">
                                            <span className={`badge ${tk.available_count > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-1 border-round text-sm font-bold`}>
                                                {tk.available_count > 0 ? `Sisa ${tk.available_count}` : 'Habis (0)'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right text-500 mb-3" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                        *Sisa kamar berlaku untuk semua paket harga di bawah ini
                                    </div>
                                    <div className="text-sm text-secondary mb-3 flex gap-3">
                                        <span><i className="pi pi-users mr-1"></i>{tk.kapasitas_dasar} Pax</span>
                                        <span><i className="pi pi-arrows-alt mr-1"></i>{tk.luas_m2} m²</span>
                                    </div>

                                    {/* List Rate Plans for this Room Type */}
                                    <div className="flex flex-column gap-2 mt-3 border-top-1 surface-border pt-3">
                                        {tk.packages.map((pkg: any, j: number) => {
                                            const isSelected = formik.values.kode_tipe_kamar === tk.kode_tipe_kamar && formik.values.kode_rate_plan === pkg.kode_rate_plan;
                                            const isUnavailable = tk.available_count <= 0;
                                            return (
                                                <div 
                                                    key={j} 
                                                    className={`p-2 border-round transition-colors transition-duration-150 ${isUnavailable ? 'surface-200 opacity-60 cursor-not-allowed border-1 surface-border' : isSelected ? 'bg-primary-reverse border-primary border-2 cursor-pointer' : 'surface-100 hover:surface-200 border-1 surface-border cursor-pointer'}`}
                                                    onClick={() => {
                                                        if (tk.available_count > 0) {
                                                            selectPackage(tk, pkg);
                                                        } else {
                                                            showError(toast, "Tipe kamar ini sudah penuh pada rentang tanggal yang dipilih.");
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="font-bold text-sm">{pkg.nama_rate_plan}</div>
                                                            <div className="text-xs text-secondary mt-1">Rp {pkg.price_per_night?.toLocaleString('id-ID')} /malam</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-primary">Rp {pkg.total_price?.toLocaleString('id-ID')}</div>
                                                            {isSelected && <i className="pi pi-check-circle text-green-500 mt-1"></i>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Info (jika sudah milih) */}
            {state.rateInfo && (
                <div className="col-12 mt-4 p-3 border-round border-1 surface-border bg-yellow-50 flex flex-column md:flex-row align-items-center justify-content-between">
                    <div>
                        <h6 className="m-0 mb-1">Paket Terpilih</h6>
                        <p className="m-0 text-sm">
                            <strong>{state.rateInfo.nama_tipe}</strong> - {state.rateInfo.nama_rate_plan} <br/>
                            Total ({formik.values.nights} malam): <strong>Rp {(state.rateInfo.total_price).toLocaleString('id-ID')}</strong><br/>
                        </p>
                    </div>
                </div>
            )}


        </div>
    );
};

export default StepAvailability;
