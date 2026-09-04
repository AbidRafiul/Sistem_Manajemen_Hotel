'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useState } from 'react';
import postData from '@/lib/axios/postData';
import { apiEndpointUpdate, apiEndpointGet } from './endpoints';
import { FormProps } from './interfaces';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const FormEdit = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [submitLoad, setSubmitLoad] = useState(false);

    const handleSubmit = async () => {
        formik.handleSubmit();
        if (Object.keys(formik.errors).length === 0 && formik.values.name) {
            setSubmitLoad(true);
            try {
                await postData(apiEndpointUpdate, {
                    id: formik.values.id,
                    name: formik.values.name,
                    is_active: formik.values.is_active
                });
                showSuccess(toast, 'Data berhasil diupdate');
                setState((p) => ({ ...p, edit: false }));
                formik.resetForm();
                getData(apiEndpointGet);
            } catch (error: any) {
                showError(toast, error?.response?.data?.message || 'Terjadi kesalahan saat mengupdate data');
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
            header="Edit Cashier Counter"
            visible={state.edit}
            style={{ width: '500px' }}
            modal
            onHide={() => setState((p) => ({ ...p, edit: false }))}
            footer={
                <div>
                    <Button label="Batal" icon="pi pi-times" outlined onClick={() => setState((p) => ({ ...p, edit: false }))} />
                    <Button label="Simpan" icon="pi pi-check" onClick={handleSubmit} loading={submitLoad} />
                </div>
            }
        >
            <div className="p-fluid">
                <div className="field">
                    <label htmlFor="name">Nama Counter <span className="text-red-500">*</span></label>
                    <InputText
                        id="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        className={isFormFieldInvalid('name') ? 'p-invalid' : ''}
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

export default FormEdit;
