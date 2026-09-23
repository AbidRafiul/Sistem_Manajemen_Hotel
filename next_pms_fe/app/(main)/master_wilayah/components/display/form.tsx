'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import postData from '@/lib/axios/postData';
import { useState } from 'react';
import { FormProps } from '../interfaces';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [loading, setLoading] = useState(false);

    const isEdit = state.edit;
    const isVisible = state.add || state.edit;

    const handleHide = () => {
        setState((p) => ({ ...p, add: false, edit: false }));
        formik.resetForm();
    };

    const handleSave = async () => {
        if (!formik.values.nama_wilayah || !formik.values.nama_wilayah.trim()) {
            showError(toast as any, 'Nama Wilayah wajib diisi.');
            return;
        }

        setLoading(true);
        try {
            const endpoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;
            const payload = {
                id: formik.values.id,
                kode_wilayah: formik.values.kode_wilayah?.trim() || undefined,
                nama_wilayah: formik.values.nama_wilayah.trim(),
                status: formik.values.is_active === 1 ? 'active' : 'inactive',
                is_active: formik.values.is_active
            };

            const res = await postData(endpoint, payload);

            if (res?.data?.status === '00') {
                showSuccess(toast as any, isEdit ? 'Wilayah berhasil diperbarui' : 'Wilayah berhasil ditambahkan');
                handleHide();
                await getData(apiEndpointGet);
            } else {
                showError(toast as any, res?.data?.message || 'Gagal menyimpan data wilayah');
            }
        } catch (err: any) {
            showError(toast as any, err?.response?.data?.message || err.message || 'Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!state.selectedDatas || state.selectedDatas.length === 0) return;

        setLoading(true);
        try {
            const ids = state.selectedDatas.map((d) => d.id);
            const res = await postData(apiEndpointDelete, { ids });

            if (res?.data?.status === '00') {
                showSuccess(toast as any, res?.data?.message || 'Data wilayah berhasil dihapus');
                setState((p) => ({ ...p, delete: false, selectedDatas: [] }));
                await getData(apiEndpointGet);
            } else {
                showError(toast as any, res?.data?.message || 'Gagal menghapus data wilayah');
            }
        } catch (err: any) {
            showError(toast as any, err?.response?.data?.message || err.message || 'Terjadi kesalahan saat menghapus');
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        { label: 'Aktif', value: 1 },
        { label: 'Non-Aktif', value: 0 }
    ];

    const formFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" outlined severity="secondary" onClick={handleHide} disabled={loading} />
            <Button
                label={isEdit ? 'Perbarui' : 'Simpan'}
                icon="pi pi-check"
                severity="success"
                onClick={handleSave}
                loading={loading}
            />
        </div>
    );

    const deleteFooter = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Batal"
                icon="pi pi-times"
                outlined
                severity="secondary"
                onClick={() => setState((p) => ({ ...p, delete: false }))}
                disabled={loading}
            />
            <Button
                label="Hapus"
                icon="pi pi-trash"
                severity="danger"
                onClick={handleDelete}
                loading={loading}
            />
        </div>
    );

    return (
        <>
            {/* Modal Form Tambah / Edit */}
            <Dialog
                visible={isVisible}
                style={{ width: '480px' }}
                header={isEdit ? 'Ubah Master Wilayah' : 'Tambah Master Wilayah Baru'}
                modal
                className="p-fluid"
                footer={formFooter}
                onHide={handleHide}
            >
                <div className="field mb-3">
                    <label htmlFor="kode_wilayah" className="font-semibold text-900">
                        Kode Wilayah {isEdit && <span className="text-500 font-normal">(Tidak dapat diubah)</span>}
                    </label>
                    <InputText
                        id="kode_wilayah"
                        value={formik.values.kode_wilayah || ''}
                        onChange={(e) => formik.setFieldValue('kode_wilayah', e.target.value.toUpperCase())}
                        placeholder="Contoh: REG-JATIM (Kosongkan untuk auto-generate)"
                        disabled={isEdit || loading}
                        className="p-inputtext-sm uppercase font-bold"
                    />
                    <small className="text-500">
                        Biarkan kosong untuk membuat kode otomatis berurutan (misal: REG-001, REG-002).
                    </small>
                </div>

                <div className="field mb-3">
                    <label htmlFor="nama_wilayah" className="font-semibold text-900">
                        Nama Wilayah / Regional <span className="text-danger font-bold">*</span>
                    </label>
                    <InputText
                        id="nama_wilayah"
                        value={formik.values.nama_wilayah || ''}
                        onChange={(e) => formik.setFieldValue('nama_wilayah', e.target.value)}
                        placeholder="Contoh: Wilayah Jawa Timur & Madura"
                        disabled={loading}
                        className="p-inputtext-sm"
                        autoFocus
                    />
                </div>

                <div className="field mb-2">
                    <label htmlFor="is_active" className="font-semibold text-900">
                        Status Keaktifan
                    </label>
                    <Dropdown
                        id="is_active"
                        value={formik.values.is_active}
                        options={statusOptions}
                        onChange={(e) => formik.setFieldValue('is_active', e.value)}
                        placeholder="Pilih Status"
                        disabled={loading}
                        className="p-inputtext-sm"
                    />
                </div>
            </Dialog>

            {/* Modal Dialog Konfirmasi Delete */}
            <Dialog
                visible={state.delete}
                style={{ width: '420px' }}
                header="Konfirmasi Hapus Wilayah"
                modal
                footer={deleteFooter}
                onHide={() => setState((p) => ({ ...p, delete: false }))}
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-danger text-4xl" />
                    <div>
                        <p className="m-0 font-medium text-800">
                            Apakah Anda yakin ingin menghapus{' '}
                            <strong>{state.selectedDatas.length}</strong> data wilayah terpilih?
                        </p>
                        <small className="text-500 mt-1 block">
                            Catatan: Wilayah yang masih memiliki unit cabang hotel binaan tidak dapat dihapus.
                        </small>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default Form;
