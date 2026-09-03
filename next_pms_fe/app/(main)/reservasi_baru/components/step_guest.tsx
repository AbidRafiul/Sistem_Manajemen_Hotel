import React, { useEffect } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiGuestSearch, apiGuestCreate, apiCabangDropdown } from './endpoints';

interface StepGuestProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepGuest: React.FC<StepGuestProps> = ({ state, setState, formik, toast }) => {
    
    useEffect(() => {
        const getCabang = async () => {
            setState(p => ({ ...p, cabangLoad: true }));
            try {
                const res = await postData(apiCabangDropdown, {});
                setState(p => ({ ...p, cabangOptions: res.data.data }));
            } catch (e: any) {
                // swallow error or default to empty
            } finally {
                setState(p => ({ ...p, cabangLoad: false }));
            }
        };
        getCabang();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const searchGuest = async () => {
        if (!formik.values.kode_cabang) {
            showError(toast, "Pilih cabang terlebih dahulu");
            return;
        }
        if (!formik.values.keyword_guest) {
            showError(toast, "Masukkan ID atau Nomor Telepon untuk mencari");
            return;
        }
        setState(p => ({ ...p, searchGuestLoad: true, isGuestNew: false, foundGuest: null }));
        formik.setFieldValue('kode_guest', '');
        
        try {
            const res = await postData(apiGuestSearch, {
                kode_cabang: formik.values.kode_cabang,
                keyword: formik.values.keyword_guest
            });
            if (res.data.data) {
                showSuccess(toast, "Tamu ditemukan");
                setState(p => ({ ...p, foundGuest: res.data.data }));
                formik.setFieldValue('kode_guest', res.data.data.kode_tamu);
                // Also set full_name to display
                formik.setFieldValue('full_name', res.data.data.full_name);
            } else {
                showError(toast, "Tamu tidak ditemukan, silakan isi data tamu baru");
                setState(p => ({ ...p, isGuestNew: true }));
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan");
        } finally {
            setState(p => ({ ...p, searchGuestLoad: false }));
        }
    };

    const handleNext = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length > 0) {
            formik.setTouched(
                Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
            return;
        }

        if (state.isGuestNew) {
            setState(p => ({ ...p, load: true }));
            try {
                const res = await postData(apiGuestCreate, {
                    kode_cabang: formik.values.kode_cabang,
                    full_name: formik.values.full_name,
                    id_type: formik.values.id_type,
                    id_number: formik.values.id_number,
                    phone: formik.values.phone,
                    email: formik.values.email,
                    nationality: formik.values.nationality
                });
                formik.setFieldValue('kode_guest', res.data.data.kode_tamu);
                setState(p => ({ ...p, foundGuest: res.data.data, isGuestNew: false }));
                showSuccess(toast, "Tamu baru berhasil dibuat");
                setState(p => ({ ...p, activeStep: 1 }));
            } catch (e: any) {
                showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat membuat tamu");
            } finally {
                setState(p => ({ ...p, load: false }));
            }
        } else if (state.foundGuest) {
            setState(p => ({ ...p, activeStep: 1 }));
        }
    };

    return (
        <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-6">
                <label>Cabang</label>
                <Dropdown 
                    value={formik.values.kode_cabang} 
                    options={state.cabangOptions} 
                    onChange={(e) => formik.setFieldValue('kode_cabang', e.value)}
                    optionLabel="name" 
                    optionValue="kode_cabang"
                    placeholder="Pilih Cabang" 
                    disabled={state.cabangLoad}
                    className={formik.errors.kode_cabang && formik.touched.kode_cabang ? 'p-invalid' : ''}
                />
                {formik.errors.kode_cabang && formik.touched.kode_cabang && <small className="p-error">{formik.errors.kode_cabang}</small>}
            </div>
            
            <div className="field col-12 md:col-6">
                <label>Pencarian Tamu (KTP / No. Telp)</label>
                <div className="p-inputgroup">
                    <InputText 
                        value={formik.values.keyword_guest} 
                        onChange={(e) => formik.setFieldValue('keyword_guest', e.target.value)} 
                        placeholder="Masukkan ID / Telepon"
                    />
                    <Button icon="pi pi-search" onClick={searchGuest} loading={state.searchGuestLoad} />
                </div>
                {formik.errors.keyword_guest && formik.touched.keyword_guest && <small className="p-error">{formik.errors.keyword_guest}</small>}
            </div>

            {state.foundGuest && !state.isGuestNew && (
                <div className="field col-12">
                    <div className="p-3 border-round border-1 surface-border bg-green-50">
                        <h6 className="m-0 mb-2 text-green-700">Data Tamu Ditemukan</h6>
                        <p className="m-0">Nama: <strong>{state.foundGuest.full_name}</strong></p>
                        <p className="m-0">Phone: <strong>{state.foundGuest.phone}</strong></p>
                        <p className="m-0">KTP: <strong>{state.foundGuest.id_number}</strong></p>
                        {state.foundGuest.is_blacklisted === 1 && (
                            <p className="m-0 mt-2 text-red-600 font-bold">TAMU INI MASUK DAFTAR BLACKLIST</p>
                        )}
                    </div>
                </div>
            )}

            {state.isGuestNew && (
                <div className="col-12 mt-3 grid p-3 border-round border-1 surface-border bg-blue-50">
                    <div className="col-12">
                        <h6>Form Tamu Baru</h6>
                    </div>
                    <div className="field col-12 md:col-6">
                        <label>Nama Lengkap</label>
                        <InputText 
                            value={formik.values.full_name} 
                            onChange={(e) => formik.setFieldValue('full_name', e.target.value)}
                            className={formik.errors.full_name && formik.touched.full_name ? 'p-invalid' : ''}
                        />
                        {formik.errors.full_name && formik.touched.full_name && <small className="p-error">{formik.errors.full_name}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label>Tipe ID</label>
                        <Dropdown 
                            value={formik.values.id_type} 
                            options={[{label:'KTP', value:'ktp'}, {label:'Passport', value:'passport'}, {label:'SIM', value:'sim'}]} 
                            onChange={(e) => formik.setFieldValue('id_type', e.value)}
                        />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label>Nomor ID</label>
                        <InputText 
                            value={formik.values.id_number} 
                            onChange={(e) => formik.setFieldValue('id_number', e.target.value)}
                            className={formik.errors.id_number && formik.touched.id_number ? 'p-invalid' : ''}
                        />
                        {formik.errors.id_number && formik.touched.id_number && <small className="p-error">{formik.errors.id_number}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label>No. Telepon</label>
                        <InputText 
                            value={formik.values.phone} 
                            onChange={(e) => formik.setFieldValue('phone', e.target.value)}
                            className={formik.errors.phone && formik.touched.phone ? 'p-invalid' : ''}
                        />
                        {formik.errors.phone && formik.touched.phone && <small className="p-error">{formik.errors.phone}</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label>Email (Opsional)</label>
                        <InputText 
                            value={formik.values.email} 
                            onChange={(e) => formik.setFieldValue('email', e.target.value)}
                        />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label>Kewarganegaraan (Opsional)</label>
                        <InputText 
                            value={formik.values.nationality} 
                            onChange={(e) => formik.setFieldValue('nationality', e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="col-12 flex justify-content-end mt-4">
                <Button 
                    label="Lanjut ke Ketersediaan & Rate" 
                    icon="pi pi-arrow-right" 
                    iconPos="right" 
                    onClick={handleNext} 
                    disabled={(!state.foundGuest && !state.isGuestNew) || (state.foundGuest?.is_blacklisted === 1)}
                    loading={state.load}
                />
            </div>
        </div>
    );
};

export default StepGuest;
