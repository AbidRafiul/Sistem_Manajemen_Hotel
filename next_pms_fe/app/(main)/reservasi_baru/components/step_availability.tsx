import React, { useEffect } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiCheckAvailability, apiTipeKamarDropdown, apiRatePlanDropdown, apiMusimDropdown } from './endpoints';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface StepAvailabilityProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepAvailability: React.FC<StepAvailabilityProps> = ({ state, setState, formik, toast }) => {
    
    useEffect(() => {
    const getDropdowns = async () => {
            const kode_cabang = formik.values.kode_cabang;
            setState(p => ({ ...p, tipeKamarLoad: true, ratePlanLoad: true, musimLoad: true }));
            try {
                const [resTK, resRP, resM] = await Promise.all([
                    postData(apiTipeKamarDropdown, { kode_cabang }),
                    postData(apiRatePlanDropdown, { kode_cabang }),
                    postData(apiMusimDropdown, { kode_cabang })
                ]);
                setState(p => ({ 
                    ...p, 
                    tipeKamarOptions: resTK.data.data,
                    ratePlanOptions: resRP.data.data,
                    musimOptions: resM.data.data
                }));
            } catch (e: any) {
                showError(toast, "Gagal memuat opsi dropdown: " + (e?.response?.data?.message || e.message));
            } finally {
                setState(p => ({ ...p, tipeKamarLoad: false, ratePlanLoad: false, musimLoad: false }));
            }
        };
        getDropdowns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.kode_cabang]);

    const handleNightsChange = (val: number | null) => {
        const nights = val || 1;
        formik.setFieldValue('nights', nights);
        if (formik.values.check_in_date) {
            const outDate = new Date(formik.values.check_in_date);
            outDate.setDate(outDate.getDate() + nights);
            formik.setFieldValue('check_out_date', outDate);
        }
    };

    const handleCheckInChange = (date: Date | null) => {
        formik.setFieldValue('check_in_date', date);
        if (date && formik.values.nights) {
            const outDate = new Date(date);
            outDate.setDate(outDate.getDate() + formik.values.nights);
            formik.setFieldValue('check_out_date', outDate);
        }
    };

    const checkAvailability = async () => {
        const { kode_cabang, kode_tipe_kamar, kode_rate_plan, kode_season, check_in_date, check_out_date } = formik.values;
        if (!kode_tipe_kamar || !kode_rate_plan || !check_in_date || !check_out_date) {
            showError(toast, "Lengkapi Tipe Kamar, Rate Plan, dan Tanggal");
            return;
        }

        setState(p => ({ ...p, availabilityLoad: true, availableRooms: [], rateInfo: null }));
        formik.setFieldValue('kode_kamar', '');

        try {
            const res = await postData(apiCheckAvailability, {
                kode_cabang,
                kode_tipe_kamar,
                kode_rate_plan,
                kode_season: kode_season || null,
                check_in_date: formatDateSystem(check_in_date, "yyyy-MM-dd"),
                check_out_date: formatDateSystem(check_out_date, "yyyy-MM-dd")
            });

            if (res.data.data) {
                setState(p => ({
                    ...p,
                    availableRooms: res.data.data.available_rooms || [],
                    rateInfo: res.data.data.rate_info || null
                }));
                if (res.data.data.available_rooms?.length > 0) {
                    showSuccess(toast, "Kamar tersedia");
                } else {
                    showError(toast, "Tidak ada kamar tersedia");
                }
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat cek ketersediaan");
        } finally {
            setState(p => ({ ...p, availabilityLoad: false }));
        }
    };

    const handleNext = async () => {
        const errors = await formik.validateForm();
        if (errors.check_in_date || errors.check_out_date || errors.kode_tipe_kamar || errors.kode_rate_plan || errors.kode_kamar) {
            formik.setTouched({
                ...formik.touched,
                check_in_date: true,
                check_out_date: true,
                kode_tipe_kamar: true,
                kode_rate_plan: true,
                kode_kamar: true
            });
            return;
        }
        setState(p => ({ ...p, activeStep: 2 }));
    };

    const handlePrev = () => {
        setState(p => ({ ...p, activeStep: 0 }));
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

            <div className="field col-12 md:col-4">
                <label>Tipe Kamar</label>
                <Dropdown 
                    value={formik.values.kode_tipe_kamar} 
                    options={state.tipeKamarOptions} 
                    onChange={(e) => {
                        formik.setFieldValue('kode_tipe_kamar', e.value);
                        setState(p => ({...p, availableRooms: [], rateInfo: null}));
                        formik.setFieldValue('kode_kamar', '');
                    }}
                    optionLabel="name" 
                    optionValue="kode_tipe_kamar"
                    placeholder="Pilih Tipe Kamar" 
                    disabled={state.tipeKamarLoad}
                    className={formik.errors.kode_tipe_kamar && formik.touched.kode_tipe_kamar ? 'p-invalid' : ''}
                />
            </div>
            <div className="field col-12 md:col-4">
                <label>Rate Plan</label>
                <Dropdown 
                    value={formik.values.kode_rate_plan} 
                    options={state.ratePlanOptions} 
                    onChange={(e) => {
                        formik.setFieldValue('kode_rate_plan', e.value);
                        setState(p => ({...p, availableRooms: [], rateInfo: null}));
                    }}
                    optionLabel="name" 
                    optionValue="kode_paket_harga"
                    placeholder="Pilih Rate Plan" 
                    disabled={state.ratePlanLoad}
                    className={formik.errors.kode_rate_plan && formik.touched.kode_rate_plan ? 'p-invalid' : ''}
                />
            </div>
            <div className="field col-12 md:col-4">
                <label>Season (Opsional, Default Auto)</label>
                <Dropdown 
                    value={formik.values.kode_season} 
                    options={state.musimOptions} 
                    onChange={(e) => {
                        formik.setFieldValue('kode_season', e.value);
                        setState(p => ({...p, availableRooms: [], rateInfo: null}));
                    }}
                    optionLabel="name" 
                    optionValue="kode_musim"
                    placeholder="Pilih Season Override" 
                    disabled={state.musimLoad}
                    showClear
                />
            </div>

            <div className="col-12 mt-2">
                <Button label="Cek Ketersediaan & Hitung Harga" icon="pi pi-search" onClick={checkAvailability} loading={state.availabilityLoad} className="p-button-outlined" />
            </div>

            {state.rateInfo && (
                <div className="col-12 mt-3 p-3 border-round border-1 surface-border bg-yellow-50 flex flex-column md:flex-row align-items-center justify-content-between">
                    <div>
                        <h6 className="m-0 mb-1">Informasi Tarif</h6>
                        <p className="m-0 text-sm">
                            Rate/Night: <strong>Rp {state.rateInfo.price?.toLocaleString('id-ID')}</strong> <br/>
                            Total ({formik.values.nights} malam): <strong>Rp {(state.rateInfo.price * formik.values.nights).toLocaleString('id-ID')}</strong><br/>
                            Sumber: {state.rateInfo.source}
                        </p>
                    </div>
                </div>
            )}

            {state.availableRooms && state.availableRooms.length > 0 && (
                <div className="field col-12 mt-3">
                    <label>Pilih Kamar ({state.availableRooms.length} tersedia)</label>
                    <Dropdown 
                        value={formik.values.kode_kamar} 
                        options={state.availableRooms} 
                        onChange={(e) => formik.setFieldValue('kode_kamar', e.value)}
                        optionLabel="nomor_kamar" 
                        optionValue="kode_kamar"
                        placeholder="Pilih Kamar" 
                        className={formik.errors.kode_kamar && formik.touched.kode_kamar ? 'p-invalid' : ''}
                        itemTemplate={(option) => (
                            <div>
                                {option.nomor_kamar} <small className="text-secondary">({option.tipe_pemandangan})</small>
                            </div>
                        )}
                    />
                    {formik.errors.kode_kamar && formik.touched.kode_kamar && <small className="p-error">{formik.errors.kode_kamar}</small>}
                </div>
            )}

            <div className="col-12 flex justify-content-between mt-4">
                <Button label="Kembali" icon="pi pi-arrow-left" onClick={handlePrev} className="p-button-text" />
                <Button 
                    label="Lanjut ke Pembayaran" 
                    icon="pi pi-arrow-right" 
                    iconPos="right" 
                    onClick={handleNext} 
                    disabled={!formik.values.kode_kamar || !state.rateInfo}
                />
            </div>
        </div>
    );
};

export default StepAvailability;
