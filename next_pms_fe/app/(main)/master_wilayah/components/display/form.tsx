'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps, initValue } from '../interfaces';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect } from 'react';
import { getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const handleSave = async (input: initValue) => {
        setState((p) => ({ ...p, load: true }));

        try {
            const isEdit = Boolean(state.edit);
            const cEndPoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;

            const oHeaders: Record<string, string> = {
                'X-Level': '1'
            };

            const oBody: Record<string, any> = {
                kode_wilayah: input.kode_wilayah?.trim() || undefined,
                nama_wilayah: input.nama_wilayah?.trim(),
                status: input.is_active === 1 ? 'active' : 'inactive',
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['id'] = input.id;
                oBody['kode_wilayah'] = input.kode_wilayah;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || (isEdit ? 'Berhasil memperbarui data Master Wilayah' : 'Berhasil menyimpan data Master Wilayah'));
            formik.resetForm();
            setState((p) => ({ ...p, add: false, edit: false, delete: false }));
            await getData(apiEndpointGet);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi kesalahan saat menyimpan data');
        } finally {
            setState((p) => ({ ...p, load: false, submittedData: null }));
        }
    };

    const handleDelete = async () => {
        setState((p) => ({ ...p, load: true }));

        try {
            if (state.selectedDatas.length < 1) {
                showError(toast, 'Tidak ada data yang dipilih.');
                return;
            }

            const vaIds = state.selectedDatas.map((v) => v.id);
            const vaCodes = state.selectedDatas.map((v) => v.kode_wilayah);

            const vaData = await postData(apiEndpointDelete, { ids: vaIds, kode_wilayah: vaCodes, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Master Wilayah.');
            setState((p) => ({ ...p, selectedDatas: [], add: false, edit: false, delete: false }));
            await getData(apiEndpointGet);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi kesalahan saat menghapus data.');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const deleteFooterTemplate = (
        <div className="flex justify-content-center gap-2">
            <Button
                label="Batal"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={() => {
                    setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                }}
                disabled={state.load}
            />
            <Button label="Ya, Hapus" icon="pi pi-trash" severity="danger" onClick={handleDelete} loading={state.load} />
        </div>
    );

    const isFormFieldInvalid = (name: keyof initValue) => !!(formik?.touched[name] && formik?.errors[name]);

    const getFormErrorMessage = (name: keyof initValue) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik?.errors[name] as string}</small> : <small className="p-error">&nbsp;</small>;
    };

    useEffect(() => {
        if (state.submittedData) {
            handleSave(state.submittedData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submittedData]);

    return (
        <>
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? 'Edit Data Master Wilayah' : 'Tambah Master Wilayah Baru'}
                modal
                style={{ width: '100%', maxWidth: '600px' }}
                breakpoints={{ '641px': '90vw' }}
                onHide={() => {
                    setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                    formik?.resetForm();
                }}
            >
                <form onSubmit={formik?.handleSubmit} className="flex gap-3 flex-column pt-2">
                    <div className="flex gap-2 flex-column w-full">
                        {/* Kode Wilayah */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="kode_wilayah" className="font-semibold text-sm">
                                Kode Wilayah
                            </label>
                            <InputText
                                id="kode_wilayah"
                                name="kode_wilayah"
                                disabled={state.edit}
                                readOnly={state.edit}
                                value={formik?.values.kode_wilayah || ''}
                                placeholder={state.edit ? formik?.values.kode_wilayah : 'Otomatis (Contoh: REG-001) atau isi kustom'}
                                onChange={(e) => formik?.setFieldValue('kode_wilayah', e.target.value.toUpperCase())}
                                className="w-full uppercase font-bold"
                            />
                            <small className="text-gray-500">
                                {state.edit ? 'Kode wilayah tidak dapat diubah.' : 'Kosongkan untuk pembuatan kode otomatis oleh sistem.'}
                            </small>
                        </div>

                        {/* Nama Wilayah */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="nama_wilayah" className="font-semibold text-sm">
                                Nama Wilayah / Regional <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="nama_wilayah"
                                name="nama_wilayah"
                                value={formik?.values.nama_wilayah || ''}
                                placeholder="Contoh: Wilayah Jawa Timur & Madura"
                                onChange={(e) => formik?.setFieldValue('nama_wilayah', e.target.value)}
                                className={isFormFieldInvalid('nama_wilayah') ? 'p-invalid w-full' : 'w-full'}
                            />
                            {getFormErrorMessage('nama_wilayah')}
                        </div>

                        {/* Status Aktif */}
                        <div className="flex flex-column gap-4 mt-2">
                            <div className="flex align-items-center gap-2">
                                <InputSwitch
                                    id="is_active"
                                    name="is_active"
                                    checked={formik?.values.is_active === 1}
                                    onChange={(e) => formik?.setFieldValue('is_active', e.value ? 1 : 0)}
                                />
                                <label htmlFor="is_active" className="font-semibold text-sm cursor-pointer select-none">
                                    Status Wilayah Aktif
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-content-end mt-3 border-t-1 border-300 pt-3 gap-2">
                        <Button
                            label="Batal"
                            severity="secondary"
                            outlined
                            icon="pi pi-times"
                            onClick={() => {
                                setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                                formik?.resetForm();
                            }}
                            className="w-full md:w-auto"
                        />
                        <Button type="submit" severity="success" label="Simpan" icon="pi pi-check" loading={state?.load} className="w-full md:w-auto" />
                    </div>
                </form>
            </Dialog>

            <Dialog
                header="Konfirmasi Hapus"
                visible={state.delete}
                onHide={() => setState((p) => ({ ...p, add: false, edit: false, delete: false }))}
                modal
                style={{ width: '25rem' }}
                footer={deleteFooterTemplate}
            >
                <div className="flex flex-column align-items-center text-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500 text-6xl" />
                    <div>
                        <h3 className="font-bold mb-2">
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Master Wilayah?` : 'Hapus data Master Wilayah ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item wilayah.`
                            ) : (
                                <>
                                    Anda akan menghapus data wilayah: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_wilayah || ''} - {state.selectedDatas[0]?.nama_wilayah || ''}
                                    </strong>
                                </>
                            )}
                            <br />
                            <br />
                            Wilayah yang masih memiliki unit cabang binaan tidak dapat dihapus.
                        </p>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default Form;
