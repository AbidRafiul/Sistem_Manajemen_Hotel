'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useState, useEffect } from 'react';
import postData from '@/lib/axios/postData';
import { apiEndpointUpdate, apiEndpointCreate, apiEndpointDelete, apiEndpointCabang, apiEndpointGet } from '../endpoints';
import { FormProps } from '../interfaces';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const Form = ({ state, setState, formik, toast, getData, dataRekap, setDataRekap }: any) => {
    const [submitLoad, setSubmitLoad] = useState(false);
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);

    useEffect(() => {
        const fetchCabang = async () => {
            try {
                const res = await postData(apiEndpointCabang, {});
                setCabangOptions(res.data.data);
            } catch (e) {}
        };
        fetchCabang();
    }, []);

    const handleSubmit = async () => {
        formik.handleSubmit();
        if (Object.keys(formik.errors).length === 0 && formik.values.kode_cabang && formik.values.name) {
            setSubmitLoad(true);
            try {
                if (state.add) {
                    await postData(apiEndpointCreate, formik.values);
                    showSuccess(toast, 'Data berhasil disimpan');
                } else if (state.edit) {
                    await postData(apiEndpointUpdate, {
                        kode_cashier_counter: formik.values.kode_cashier_counter,
                        kode_cabang: formik.values.kode_cabang,
                        name: formik.values.name,
                        is_active: formik.values.is_active
                    });
                    showSuccess(toast, 'Data berhasil diupdate');
                }
                
                setState((p: any) => ({ ...p, add: false, edit: false }));
                formik.resetForm();
                getData(apiEndpointGet);
            } catch (error: any) {
                showError(toast, error?.response?.data?.message || 'Terjadi kesalahan saat memproses data');
            } finally {
                setSubmitLoad(false);
            }
        }
    };

    const handleDelete = async () => {
        setSubmitLoad(true);
        try {
            for (const data of state.selectedDatas) {
                await postData(apiEndpointDelete, { kode_cashier_counter: data.kode_cashier_counter });
            }
            showSuccess(toast, 'Data berhasil dihapus');
            setState((p: any) => ({ ...p, delete: false, selectedDatas: [] }));
            getData(apiEndpointGet);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Terjadi kesalahan saat menghapus data');
        } finally {
            setSubmitLoad(false);
        }
    };

    const isFormFieldInvalid = (name: string) => !!(formik.touched[name as keyof typeof formik.touched] && formik.errors[name as keyof typeof formik.errors]);
    const getFormErrorMessage = (name: string) => {
        return isFormFieldInvalid(name) && <small className="p-error">{formik.errors[name as keyof typeof formik.errors]}</small>;
    };

    if (state.delete) {
        return (
            <Dialog 
                header="Konfirmasi Hapus" 
                visible={state.delete} 
                style={{ width: '450px' }} 
                modal 
                onHide={() => setState((p: any) => ({ ...p, delete: false }))}
                footer={
                    <div>
                        <Button label="Batal" icon="pi pi-times" outlined onClick={() => setState((p: any) => ({ ...p, delete: false }))} />
                        <Button label="Hapus" icon="pi pi-check" severity="danger" onClick={handleDelete} loading={submitLoad} />
                    </div>
                }
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {state.selectedDatas && (
                        <span>
                            Apakah Anda yakin ingin menghapus <b>{state.selectedDatas.length}</b> data?
                        </span>
                    )}
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog
            header={state.add ? "Tambah Cashier Counter" : "Edit Cashier Counter"}
            visible={state.add || state.edit}
            style={{ width: '500px' }}
            modal
            onHide={() => {
                setState((p: any) => ({ ...p, add: false, edit: false }));
                formik.resetForm();
            }}
            footer={
                <div>
                    <Button label="Batal" icon="pi pi-times" outlined onClick={() => {
                        setState((p: any) => ({ ...p, add: false, edit: false }));
                        formik.resetForm();
                    }} />
                    <Button label="Simpan" icon="pi pi-check" onClick={handleSubmit} loading={submitLoad} />
                </div>
            }
        >
            <div className="p-fluid">
                <div className="field">
                    <label htmlFor="kode_cabang">Cabang <span className="text-red-500">*</span></label>
                    <Dropdown
                        id="kode_cabang"
                        value={formik.values.kode_cabang}
                        options={cabangOptions}
                        optionLabel="nama_hotel"
                        optionValue="kode_cabang"
                        onChange={formik.handleChange}
                        placeholder="Pilih Cabang"
                        className={isFormFieldInvalid('kode_cabang') ? 'p-invalid' : ''}
                        disabled={state.edit}
                    />
                    {getFormErrorMessage('kode_cabang')}
                </div>
                <div className="field">
                    <label htmlFor="name">Nama Counter <span className="text-red-500">*</span></label>
                    <InputText
                        id="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        className={isFormFieldInvalid('name') ? 'p-invalid' : ''}
                        placeholder="Contoh: Loket 1, FO Kasir"
                    />
                    {getFormErrorMessage('name')}
                </div>
                <div className="field">
                    <label htmlFor="is_active">Status Aktif</label>
                    <Dropdown
                        id="is_active"
                        value={formik.values.is_active}
                        options={[{ label: 'Aktif', value: 1 }, { label: 'Tidak Aktif', value: 0 }]}
                        onChange={formik.handleChange}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default Form;
