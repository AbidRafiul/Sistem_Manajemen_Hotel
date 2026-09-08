import React, { useEffect, useState } from 'react';
import { ReservasiBaruState, initValue } from './interfaces';
import { FormikProps } from 'formik';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiGuestList, apiGuestCreate, apiCabangDropdown } from './endpoints';
import { FilterMatchMode } from 'primereact/api';

interface StepGuestProps {
    state: ReservasiBaruState;
    setState: React.Dispatch<React.SetStateAction<ReservasiBaruState>>;
    formik: FormikProps<initValue>;
    toast: React.RefObject<Toast>;
}

const StepGuest: React.FC<StepGuestProps> = ({ state, setState, formik, toast }) => {
    
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value as any;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    
    useEffect(() => {
        const getCabang = async () => {
            setState(p => ({ ...p, cabangLoad: true }));
            try {
                const res = await postData(apiCabangDropdown, {});
                setState(p => ({ ...p, cabangOptions: res.data.data }));
            } catch (e: any) {
                showError(toast, "Gagal memuat cabang: " + (e?.response?.data?.message || e.message));
            } finally {
                setState(p => ({ ...p, cabangLoad: false }));
            }
        };
        getCabang();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (formik.values.kode_cabang) {
            getGuestList();
        } else {
            setState(p => ({ ...p, guestList: [] }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.kode_cabang]);

    const getGuestList = async () => {
        setState(p => ({ ...p, guestListLoad: true, isGuestNew: false }));
        try {
            const res = await postData(apiGuestList, {
                kode_cabang: formik.values.kode_cabang
            });
            setState(p => ({ ...p, guestList: res.data.data || [] }));
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Gagal memuat daftar tamu");
        } finally {
            setState(p => ({ ...p, guestListLoad: false }));
        }
    };

    const handleSelectGuest = (guestData: any) => {
        setState(p => ({ ...p, foundGuest: guestData, isGuestNew: false }));
        formik.setFieldValue('kode_guest', guestData.kode_tamu);
        formik.setFieldValue('full_name', guestData.full_name);
        showSuccess(toast, `Tamu ${guestData.full_name} dipilih`);
    };

    const handleNewGuest = () => {
        if (!formik.values.kode_cabang) {
            showError(toast, "Pilih cabang terlebih dahulu");
            return;
        }
        setState(p => ({ ...p, isGuestNew: true, foundGuest: null }));
        formik.setFieldValue('kode_guest', '');
        formik.setFieldValue('keyword_guest', '');
        formik.setFieldValue('full_name', '');
        formik.setFieldValue('id_type', 'ktp');
        formik.setFieldValue('id_number', '');
        formik.setFieldValue('phone', '');
        formik.setFieldValue('email', '');
        formik.setFieldValue('nationality', '');
    };

    const handleCancelNewGuest = () => {
        setState(p => ({ ...p, isGuestNew: false, foundGuest: null }));
        formik.setFieldValue('kode_guest', '');
    };

    const handleSaveNewGuest = async () => {
        const errors = await formik.validateForm();
        if (errors.full_name || errors.id_number || errors.phone) {
            formik.setTouched({
                ...formik.touched,
                full_name: true,
                id_number: true,
                phone: true
            });
            return;
        }

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
            getGuestList(); // refresh list
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Terjadi kesalahan saat membuat tamu");
        } finally {
            setState(p => ({ ...p, load: false }));
        }
    };

    const tableHeader = () => {
        return (
            <div className="flex flex-wrap justify-content-between align-items-center gap-2">
                <span className="p-input-icon-left w-full md:w-20rem">
                    <i className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Cari nama, No KTP/Telp..." className="w-full" />
                </span>
                <Button label="Tamu Baru" icon="pi pi-user-plus" severity="success" onClick={handleNewGuest} className="w-full md:w-auto" />
            </div>
        );
    };

    return (
        <div className="p-fluid formgrid grid">
            <div className="field col-12 md:col-6">
                <label>Pilih Cabang</label>
                <Dropdown 
                    value={formik.values.kode_cabang} 
                    options={state.cabangOptions} 
                    onChange={(e) => {
                        formik.setFieldValue('kode_cabang', e.value);
                        // reset selected guest when branch changes
                        setState(p => ({ ...p, foundGuest: null, isGuestNew: false }));
                        formik.setFieldValue('kode_guest', '');
                        formik.setFieldValue('full_name', '');
                    }}
                    optionLabel="name" 
                    optionValue="kode_cabang"
                    placeholder="-- Pilih Cabang --" 
                    disabled={state.cabangLoad}
                    className={formik.errors.kode_cabang && formik.touched.kode_cabang ? 'p-invalid' : ''}
                />
                {formik.errors.kode_cabang && formik.touched.kode_cabang && <small className="p-error">{formik.errors.kode_cabang}</small>}
            </div>

            {state.foundGuest && !state.isGuestNew && (
                <div className="field col-12">
                    <div className="p-3 border-round border-1 surface-border bg-green-50 flex justify-content-between align-items-center">
                        <div>
                            <h6 className="m-0 mb-2 text-green-700">Tamu Terpilih</h6>
                            <p className="m-0">Nama: <strong>{state.foundGuest.full_name}</strong> | Phone: <strong>{state.foundGuest.phone}</strong> | KTP: <strong>{state.foundGuest.id_number}</strong></p>
                            {state.foundGuest.is_blacklisted === 1 && (
                                <p className="m-0 mt-1 text-red-600 font-bold text-sm">TAMU INI MASUK DAFTAR BLACKLIST</p>
                            )}
                        </div>
                        <Button icon="pi pi-times" rounded text severity="danger" onClick={() => {
                            setState(p => ({ ...p, foundGuest: null }));
                            formik.setFieldValue('kode_guest', '');
                            formik.setFieldValue('full_name', '');
                        }} tooltip="Ganti Tamu" />
                    </div>
                </div>
            )}

            {!state.isGuestNew && formik.values.kode_cabang && !state.foundGuest && (
                <div className="field col-12">
                    <div className="card shadow-none border-1 surface-border p-3">
                        <DataTable
                            value={state.guestList}
                            loading={state.guestListLoad}
                            paginator
                            rows={5}
                            dataKey="kode_tamu"
                            filters={filters}
                            globalFilterFields={['full_name', 'phone', 'id_number']}
                            header={tableHeader()}
                            emptyMessage="Belum ada data tamu di cabang ini."
                            className="p-datatable-sm"
                        >
                            <Column field="full_name" header="Nama Tamu" sortable />
                            <Column field="phone" header="Telepon" />
                            <Column field="id_number" header="Nomor ID" />
                            <Column body={(rowData) => {
                                if (rowData.is_blacklisted === 1) {
                                    return <span className="text-red-500 font-bold text-xs"><i className="pi pi-ban text-xs mr-1"/>BLACKLIST</span>;
                                }
                                return <span className="text-green-500 text-xs">Aman</span>;
                            }} header="Status" />
                            <Column body={(rowData) => (
                                <Button 
                                    label="Pilih" 
                                    size="small" 
                                    severity={rowData.is_blacklisted === 1 ? 'danger' : 'info'} 
                                    onClick={() => handleSelectGuest(rowData)} 
                                    disabled={rowData.is_blacklisted === 1}
                                />
                            )} headerStyle={{ width: '10%' }} align="center" />
                        </DataTable>
                    </div>
                </div>
            )}

            {state.isGuestNew && (
                <div className="col-12 mt-3 grid p-3 border-round border-1 surface-border bg-blue-50">
                    <div className="col-12 flex justify-content-between align-items-center mb-2">
                        <h6 className="m-0">Form Tamu Baru</h6>
                        <Button 
                            icon="pi pi-times" 
                            label="Batal, kembali ke pencarian" 
                            className="p-button-text p-button-sm p-button-danger"
                            onClick={handleCancelNewGuest}
                        />
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

            {state.isGuestNew && (
                <div className="col-12 flex justify-content-end mt-4">
                    <Button 
                        label="Simpan Tamu Baru" 
                        icon="pi pi-save" 
                        severity="success"
                        onClick={handleSaveNewGuest} 
                        loading={state.load}
                    />
                </div>
            )}
        </div>
    );
};

export default StepGuest;
