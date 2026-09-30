'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { useState, useEffect } from 'react';
import postData from '@/lib/axios/postData';
import { apiEndpointUpdate, apiEndpointCreate, apiEndpointDelete, apiEndpointCabang, apiEndpointGet } from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

const Form = ({ state, setState, formik, toast, getData, dataRekap, setDataRekap }: any) => {
    const [submitLoad, setSubmitLoad] = useState(false);
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);

    useEffect(() => {
        const fetchCabang = async () => {
            try {
                const res = await postData(apiEndpointCabang, {});
                setCabangOptions(res.data.data || []);
            } catch (e) {}
        };
        fetchCabang();
    }, []);

    const handleSubmit = async () => {
        formik.handleSubmit();
        if (
            formik.values.kode_cabang &&
            formik.values.nama_shift &&
            formik.values.waktu_mulai &&
            formik.values.waktu_selesai
        ) {
            setSubmitLoad(true);
            try {
                if (state.add) {
                    await postData(apiEndpointCreate, formik.values);
                    showSuccess(toast, 'Master Shift berhasil ditambahkan');
                } else if (state.edit) {
                    await postData(apiEndpointUpdate, {
                        id: formik.values.id,
                        nama_shift: formik.values.nama_shift,
                        waktu_mulai: formik.values.waktu_mulai,
                        waktu_selesai: formik.values.waktu_selesai,
                        default_opening_cash: formik.values.default_opening_cash,
                        is_night_audit: formik.values.is_night_audit,
                        urutan: formik.values.urutan,
                        is_active: formik.values.is_active
                    });
                    showSuccess(toast, 'Master Shift berhasil diperbarui');
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
                await postData(apiEndpointDelete, { id: data.id });
            }
            showSuccess(toast, 'Data Shift berhasil dihapus');
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
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {state.selectedDatas && (
                        <span>
                            Apakah Anda yakin ingin menghapus master shift <b>{state.selectedDatas.map((d: any) => d.nama_shift).join(', ')}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog
            header={state.add ? 'Tambah Master Shift' : 'Edit Master Shift'}
            visible={state.add || state.edit}
            style={{ width: '560px' }}
            modal
            onHide={() => {
                setState((p: any) => ({ ...p, add: false, edit: false }));
                formik.resetForm();
            }}
            footer={
                <div>
                    <Button
                        label="Batal"
                        icon="pi pi-times"
                        outlined
                        onClick={() => {
                            setState((p: any) => ({ ...p, add: false, edit: false }));
                            formik.resetForm();
                        }}
                    />
                    <Button label="Simpan" icon="pi pi-check" onClick={handleSubmit} loading={submitLoad} />
                </div>
            }
        >
            <div className="p-fluid formgrid grid">
                <div className="field col-12">
                    <label htmlFor="kode_cabang" className="font-semibold">
                        Cabang Hotel <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="kode_cabang"
                        value={formik.values.kode_cabang}
                        options={cabangOptions}
                        optionLabel="nama_hotel"
                        optionValue="kode_cabang"
                        placeholder="Pilih Cabang"
                        disabled={state.edit}
                        onChange={(e) => formik.setFieldValue('kode_cabang', e.value)}
                        className={isFormFieldInvalid('kode_cabang') ? 'p-invalid' : ''}
                    />
                    {getFormErrorMessage('kode_cabang')}
                </div>

                <div className="field col-12">
                    <label htmlFor="nama_shift" className="font-semibold">
                        Nama Shift <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="nama_shift"
                        value={formik.values.nama_shift}
                        placeholder="Contoh: Shift 1 – Pagi (Morning)"
                        onChange={formik.handleChange}
                        className={isFormFieldInvalid('nama_shift') ? 'p-invalid' : ''}
                    />
                    {getFormErrorMessage('nama_shift')}
                </div>

                <div className="field col-6">
                    <label htmlFor="waktu_mulai" className="font-semibold">
                        Jam Mulai <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="waktu_mulai"
                        value={formik.values.waktu_mulai}
                        placeholder="07:00:00"
                        onChange={formik.handleChange}
                        className={isFormFieldInvalid('waktu_mulai') ? 'p-invalid' : ''}
                    />
                    {getFormErrorMessage('waktu_mulai')}
                </div>

                <div className="field col-6">
                    <label htmlFor="waktu_selesai" className="font-semibold">
                        Jam Selesai <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="waktu_selesai"
                        value={formik.values.waktu_selesai}
                        placeholder="15:00:00"
                        onChange={formik.handleChange}
                        className={isFormFieldInvalid('waktu_selesai') ? 'p-invalid' : ''}
                    />
                    {getFormErrorMessage('waktu_selesai')}
                </div>

                <div className="field col-12">
                    <label htmlFor="default_opening_cash" className="font-semibold">
                        Standar Modal Awal Kas (Floating Cash)
                    </label>
                    <InputNumber
                        id="default_opening_cash"
                        value={formik.values.default_opening_cash}
                        onValueChange={(e) => formik.setFieldValue('default_opening_cash', e.value || 0)}
                        mode="currency"
                        currency="IDR"
                        locale="id-ID"
                        min={0}
                    />
                    <small className="text-500">Nominal uang kas awal standar di laci saat kasir membuka shift.</small>
                </div>

                <div className="field col-6">
                    <label htmlFor="is_night_audit" className="font-semibold">
                        Tipe Shift (Night Audit)
                    </label>
                    <Dropdown
                        id="is_night_audit"
                        value={formik.values.is_night_audit}
                        options={[
                            { label: 'Shift Reguler (Biasa)', value: 0 },
                            { label: 'Shift Night Audit (Tutup Buku)', value: 1 }
                        ]}
                        onChange={(e) => formik.setFieldValue('is_night_audit', e.value)}
                    />
                </div>

                <div className="field col-6">
                    <label htmlFor="urutan" className="font-semibold">
                        Urutan Shift
                    </label>
                    <InputNumber
                        id="urutan"
                        value={formik.values.urutan}
                        onValueChange={(e) => formik.setFieldValue('urutan', e.value || 1)}
                        min={1}
                        max={10}
                    />
                </div>

                <div className="field col-12">
                    <label htmlFor="is_active" className="font-semibold">
                        Status Aktif
                    </label>
                    <Dropdown
                        id="is_active"
                        value={formik.values.is_active}
                        options={[
                            { label: 'Aktif', value: 1 },
                            { label: 'Tidak Aktif', value: 0 }
                        ]}
                        onChange={(e) => formik.setFieldValue('is_active', e.value)}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default Form;
