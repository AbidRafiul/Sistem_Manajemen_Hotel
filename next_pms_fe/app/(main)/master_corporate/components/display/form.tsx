'use client';

import { Dialog } from 'primereact/dialog';
import { ACCOUNT_TYPE_OPTIONS, FormProps, initValue } from '../interfaces';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect, useState } from 'react';
import { getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [cabangList, setCabangList] = useState([]);

    const fetchCabang = async (keyword = '') => {
        try {
            const res = await postData('/master/cabang/cabang-data', { perPage: 50, keyword });
            setCabangList(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFilterCabang = (e: any) => fetchCabang(e.filter);

    const handleSave = async (input: initValue) => {
        setState((p) => ({ ...p, load: true }));

        try {
            const isEdit = Boolean(state.edit);
            const cEndPoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;

            const oHeaders: Record<string, string> = {
                'X-Level': '1'
            };

            const oBody: Record<string, any> = {
                name: input.name,
                kode_cabang: input.kode_cabang,
                account_type: input.account_type,
                npwp: input.npwp || '',
                billing_address: input.billing_address || '',
                payment_term_days: input.payment_term_days || 0,
                commission_pct: input.commission_pct || 0,
                contact_person: input.contact_person || '',
                contact_phone: input.contact_phone || '',
                contact_email: input.contact_email || '',
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_corporate'] = input.kode_corporate;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil Menyimpan Data Corporate');
            formik.resetForm();
            setState((p) => ({ ...p, add: false, edit: false, delete: false }));
            await getData(apiEndpointGet);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan saat menyimpan data');
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

            const vaCode = state.selectedDatas.map((v) => v.kode_corporate);

            const vaData = await postData(apiEndpointDelete, { kode_corporate: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Corporate.');
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

    useEffect(() => {
        fetchCabang();
    }, []);

    return (
        <>
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? 'Edit Data Corporate' : 'Tambah Corporate Baru'}
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
                        {/* Kode Corporate */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="code" className="font-semibold text-sm">
                                Kode Corporate
                            </label>
                            <InputText
                                id="code"
                                name="code"
                                disabled
                                value={formik?.values.kode_corporate || ''}
                                placeholder="Otomatis"
                                readOnly
                                className="w-full"
                            />
                            <small className="text-gray-500">Kode dibuat otomatis oleh sistem.</small>
                        </div>

                        {/* Cabang & Nama Corporate */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="kode_cabang" className="font-semibold text-sm">
                                    Cabang <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="kode_cabang"
                                    name="kode_cabang"
                                    value={formik?.values.kode_cabang}
                                    options={cabangList}
                                    optionLabel="name"
                                    optionValue="kode_cabang"
                                    onChange={formik?.handleChange}
                                    placeholder="-- Pilih Cabang --"
                                    filter
                                    onFilter={handleFilterCabang}
                                    resetFilterOnHide={true}
                                    className={isFormFieldInvalid('kode_cabang') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('kode_cabang')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="name" className="font-semibold text-sm">
                                    Nama Corporate <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="name"
                                    name="name"
                                    value={formik?.values.name || ''}
                                    placeholder="Contoh: PT Angkasa Raya"
                                    onChange={(e) => formik?.setFieldValue('name', e.target.value)}
                                    className={isFormFieldInvalid('name') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('name')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="account_type" className="font-semibold text-sm">
                                    Tipe Akun <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="account_type"
                                    name="account_type"
                                    options={ACCOUNT_TYPE_OPTIONS}
                                    value={formik?.values.account_type || 'Corporate'}
                                    onChange={(e) => formik?.setFieldValue('account_type', e.value)}
                                    placeholder="Pilih Tipe Akun"
                                    className={isFormFieldInvalid('account_type') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('account_type')}
                            </div>
                        </div>

                        {/* NPWP & Kontak Person */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="npwp" className="font-semibold text-sm">
                                    NPWP
                                </label>
                                <InputText
                                    id="npwp"
                                    name="npwp"
                                    value={formik?.values.npwp || ''}
                                    placeholder="01.234.567.8-901.000"
                                    onChange={(e) => formik?.setFieldValue('npwp', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="contact_person" className="font-semibold text-sm">
                                    Kontak Person
                                </label>
                                <InputText
                                    id="contact_person"
                                    name="contact_person"
                                    value={formik?.values.contact_person || ''}
                                    placeholder="Nama PIC"
                                    onChange={(e) => formik?.setFieldValue('contact_person', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Telepon & Email */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="contact_phone" className="font-semibold text-sm">
                                    Telepon
                                </label>
                                <InputText
                                    id="contact_phone"
                                    name="contact_phone"
                                    value={formik?.values.contact_phone || ''}
                                    placeholder="08123456789"
                                    onChange={(e) => formik?.setFieldValue('contact_phone', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="contact_email" className="font-semibold text-sm">
                                    Email
                                </label>
                                <InputText
                                    id="contact_email"
                                    name="contact_email"
                                    type="email"
                                    value={formik?.values.contact_email || ''}
                                    placeholder="pic@corporate.com"
                                    onChange={(e) => formik?.setFieldValue('contact_email', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Term Pembayaran & Komisi */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="payment_term_days" className="font-semibold text-sm">
                                    Term Pembayaran (Hari)
                                </label>
                                <InputNumber
                                    id="payment_term_days"
                                    name="payment_term_days"
                                    value={formik?.values.payment_term_days}
                                    onValueChange={(e) => formik?.setFieldValue('payment_term_days', e.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="commission_pct" className="font-semibold text-sm">
                                    Komisi (%)
                                </label>
                                <InputNumber
                                    id="commission_pct"
                                    name="commission_pct"
                                    value={formik?.values.commission_pct}
                                    onValueChange={(e) => formik?.setFieldValue('commission_pct', e.value)}
                                    className="w-full"
                                    max={100}
                                    min={0}
                                />
                            </div>
                        </div>

                        {/* Alamat Tagihan */}
                        <div className="flex flex-column gap-1 w-full mt-2">
                            <label htmlFor="billing_address" className="font-semibold text-sm">
                                Alamat Tagihan
                            </label>
                            <InputTextarea
                                id="billing_address"
                                name="billing_address"
                                rows={3}
                                value={formik?.values.billing_address || ''}
                                placeholder="Alamat lengkap pengiriman tagihan"
                                onChange={(e) => formik?.setFieldValue('billing_address', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex align-items-center gap-2 mt-4">
                            <InputSwitch
                                id="is_active"
                                name="is_active"
                                checked={formik?.values.is_active === 1}
                                onChange={(e) => formik?.setFieldValue('is_active', e.value ? 1 : 0)}
                            />
                            <label htmlFor="is_active" className="font-semibold text-sm cursor-pointer select-none">
                                Status Aktif
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-content-end mt-4 border-t-1 border-300 pt-3 gap-2">
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
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Corporate?` : 'Hapus data Corporate ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item corporate.`
                            ) : (
                                <>
                                    Anda akan menghapus corporate: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_corporate || ''} - {state.selectedDatas[0]?.name || ''}
                                    </strong>
                                </>
                            )}
                            <br />
                            <br />
                            Data akan dinonaktifkan (soft delete).
                        </p>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default Form;
