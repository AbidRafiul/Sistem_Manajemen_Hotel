'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps, initValue, TIPE_PAKET_OPTIONS } from '../interfaces';
import { InputText } from 'primereact/inputtext';
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
    const [cabangList, setCabangList] = useState<any[]>([]);

    const fetchCabang = async (keyword = '') => {
        try {
            const res = await postData('/master/cabang/cabang-data', { perPage: 50, keyword });
            setCabangList(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFilterCabang = (e: any) => fetchCabang(e.filter);

    const isFormFieldInvalid = (name: keyof initValue) => !!(formik?.touched[name] && formik?.errors[name]);
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
                tipe_paket: input.tipe_paket,
                tipe_markup: input.tipe_markup,
                nilai_markup: input.nilai_markup,
                bisa_refund: input.bisa_refund,
                termasuk_sarapan: input.termasuk_sarapan,
                minimal_malam: input.minimal_malam,
                maksimal_malam: input.maksimal_malam,
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_paket_harga'] = input.kode_paket_harga;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil Menyimpan Data Rate Plan');
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

            const vaCode = state.selectedDatas.map((v) => v.kode_paket_harga);

            const vaData = await postData(apiEndpointDelete, { kode_paket_harga: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Rate Plan.');
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
                header={state.edit ? 'Edit Data Rate Plan' : 'Tambah Rate Plan Baru'}
                modal
                style={{ width: '100%', maxWidth: '700px' }}
                breakpoints={{ '641px': '90vw' }}
                onHide={() => {
                    setState((p) => ({ ...p, add: false, edit: false, delete: false }));
                    formik?.resetForm();
                }}
            >
                <form onSubmit={formik?.handleSubmit} className="flex gap-3 flex-column pt-2">
                    <div className="flex gap-2 flex-column w-full">
                        {/* Kode Hotel Removed */}

                        {/* Cabang & Nama Rate Plan */}
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
                                    Nama Rate Plan <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="name"
                                    name="name"
                                    value={formik?.values.name || ''}
                                    placeholder="Contoh: Room Only, Breakfast Included"
                                    onChange={(e) => formik?.setFieldValue('name', e.target.value)}
                                    className={isFormFieldInvalid('name') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('name')}
                            </div>
                        </div>
                        {/* Tipe Paket */}
                        <div className="flex flex-column gap-1 w-full mt-2">
                            <label htmlFor="tipe_paket" className="font-semibold text-sm">
                                Tipe Paket <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="tipe_paket"
                                name="tipe_paket"
                                options={TIPE_PAKET_OPTIONS}
                                value={formik?.values.tipe_paket || 'RO'}
                                onChange={(e) => formik?.setFieldValue('tipe_paket', e.value)}
                                placeholder="Pilih Tipe Paket"
                                className={isFormFieldInvalid('tipe_paket') ? 'p-invalid w-full' : 'w-full'}
                            />
                            {getFormErrorMessage('tipe_paket')}
                        </div>

                        {/* Markup */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="tipe_markup" className="font-semibold text-sm">
                                    Tipe Markup <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="tipe_markup"
                                    name="tipe_markup"
                                    options={[{ label: 'Nominal (Rp)', value: 'nominal' }, { label: 'Persentase (%)', value: 'persen' }]}
                                    value={formik?.values.tipe_markup || 'nominal'}
                                    onChange={(e) => {
                                        formik?.setFieldValue('tipe_markup', e.value);
                                        formik?.setFieldValue('nilai_markup', 0); // Reset value when type changes
                                    }}
                                    placeholder="Pilih Tipe Markup"
                                    className={isFormFieldInvalid('tipe_markup') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('tipe_markup')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="nilai_markup" className="font-semibold text-sm">
                                    Nilai Markup <span className="text-red-500">*</span>
                                </label>
                                <InputNumber
                                    id="nilai_markup"
                                    name="nilai_markup"
                                    value={formik?.values.nilai_markup}
                                    onValueChange={(e) => formik?.setFieldValue('nilai_markup', e.value)}
                                    className={isFormFieldInvalid('nilai_markup') ? 'p-invalid w-full' : 'w-full'}
                                    mode={formik?.values.tipe_markup === 'nominal' ? 'currency' : 'decimal'}
                                    currency={formik?.values.tipe_markup === 'nominal' ? 'IDR' : undefined}
                                    locale="id-ID"
                                    suffix={formik?.values.tipe_markup === 'persen' ? '%' : ''}
                                    min={0}
                                />
                                {getFormErrorMessage('nilai_markup')}
                            </div>
                        </div>

                        {/* Minimal & Maksimal Malam */}
                        <div className="flex flex-column md:flex-row gap-3 w-full mt-2">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="minimal_malam" className="font-semibold text-sm">
                                    Minimal Malam <span className="text-red-500">*</span>
                                </label>
                                <InputNumber
                                    id="minimal_malam"
                                    name="minimal_malam"
                                    value={formik?.values.minimal_malam}
                                    onValueChange={(e) => formik?.setFieldValue('minimal_malam', e.value)}
                                    className={isFormFieldInvalid('minimal_malam') ? 'p-invalid w-full' : 'w-full'}
                                    showButtons
                                    min={1}
                                    max={100}
                                />
                                {getFormErrorMessage('minimal_malam')}
                            </div>
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="maksimal_malam" className="font-semibold text-sm">
                                    Maksimal Malam (Opsional)
                                </label>
                                <InputNumber
                                    id="maksimal_malam"
                                    name="maksimal_malam"
                                    value={formik?.values.maksimal_malam}
                                    onValueChange={(e) => formik?.setFieldValue('maksimal_malam', e.value)}
                                    className="w-full"
                                    showButtons
                                    min={1}
                                    max={365}
                                    placeholder="Tidak terbatas"
                                />
                            </div>
                        </div>

                        {/* Switches */}
                        <div className="flex flex-column md:flex-row gap-5 mt-4">
                            <div className="flex align-items-center gap-2">
                                <InputSwitch
                                    id="termasuk_sarapan"
                                    name="termasuk_sarapan"
                                    checked={formik?.values.termasuk_sarapan === 1}
                                    onChange={(e) => formik?.setFieldValue('termasuk_sarapan', e.value ? 1 : 0)}
                                />
                                <label htmlFor="termasuk_sarapan" className="font-semibold text-sm cursor-pointer select-none">
                                    Termasuk Sarapan
                                </label>
                            </div>
                            <div className="flex align-items-center gap-2">
                                <InputSwitch
                                    id="bisa_refund"
                                    name="bisa_refund"
                                    checked={formik?.values.bisa_refund === 1}
                                    onChange={(e) => formik?.setFieldValue('bisa_refund', e.value ? 1 : 0)}
                                />
                                <label htmlFor="bisa_refund" className="font-semibold text-sm cursor-pointer select-none">
                                    Bisa Refund
                                </label>
                            </div>
                            <div className="flex align-items-center gap-2">
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
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Rate Plan?` : 'Hapus data Rate Plan ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item rate plan.`
                            ) : (
                                <>
                                    Anda akan menghapus rate plan: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_paket_harga || ''} - {state.selectedDatas[0]?.name || ''}
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
