'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useEffect, useState } from 'react';
import postData from '@/lib/axios/postData';
import { apiEndpointCabang, apiEndpointCreate, apiEndpointGet } from './endpoints';
import { FormProps } from './interfaces';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const FormCreate = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);
    const [submitLoad, setSubmitLoad] = useState(false);

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
                await postData(apiEndpointCreate, formik.values);
                showSuccess(toast, 'Data berhasil disimpan');
                setState((p) => ({ ...p, add: false }));
                formik.resetForm();
                getData(apiEndpointGet);
            } catch (error: any) {
                showError(toast, error?.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
            } finally {
                setSubmitLoad(false);
            }
        }
    };

    const isFormFieldInvalid = (name: string) => !!(formik.touched[name as keyof typeof formik.touched] && formik.errors[name as keyof typeof formik.errors]);
    const getFormErrorMessage = (name: string) => {
        return isFormFieldInvalid(name) && <small className="p-error">{formik.errors[name as keyof typeof formik.errors]}</small>;
    };

    return (
        <Dialog
            header="Tambah Cashier Counter"
            visible={state.add}
            style={{ width: '500px' }}
            modal
            onHide={() => setState((p) => ({ ...p, add: false }))}
            footer={
                <div>
                    <Button label="Batal" icon="pi pi-times" outlined onClick={() => setState((p) => ({ ...p, add: false }))} />
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

export default FormCreate;
