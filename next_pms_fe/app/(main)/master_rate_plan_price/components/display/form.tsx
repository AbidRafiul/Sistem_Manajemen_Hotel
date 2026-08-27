'use client';

import { Dialog } from 'primereact/dialog';
import { FormProps, initValue } from '../interfaces';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect, useState } from 'react';
import { getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const [tipeKamarList, setTipeKamarList] = useState<any[]>([]);
    const [ratePlanList, setRatePlanList] = useState<any[]>([]);
    const [seasonList, setSeasonList] = useState<any[]>([]);

    const fetchOptions = async () => {
        try {
            const [tipeKamarRes, ratePlanRes, seasonRes] = await Promise.all([
                postData('/master/tipe-kamar/tipe-kamar-data', { page: 1, perPage: 100 }),
                postData('/master/rate-plan/rate-plan-data', { page: 1, perPage: 100 }),
                postData('/master/season/season-data', { page: 1, perPage: 100 })
            ]);
            setTipeKamarList(tipeKamarRes.data?.data || []);
            setRatePlanList(ratePlanRes.data?.data || []);
            setSeasonList(seasonRes.data?.data || []);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleSave = async (input: initValue) => {
        setState((p) => ({ ...p, load: true }));

        try {
            const isEdit = Boolean(state.edit);
            const cEndPoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;

            const oHeaders: Record<string, string> = {
                'X-Level': '1'
            };

            const oBody: Record<string, any> = {
                kode_tipe_kamar: input.kode_tipe_kamar,
                kode_rate_plan: input.kode_rate_plan,
                kode_season: input.kode_season,
                price: input.price,
                extra_bed_price: input.extra_bed_price,
                valid_from: input.valid_from,
                valid_to: input.valid_to,
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_harga_price'] = input.kode_harga_price;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil Menyimpan Harga Kamar');
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

            const vaCode = state.selectedDatas.map((v) => v.kode_harga_price);

            const vaData = await postData(apiEndpointDelete, { kode_harga_price: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus Harga Kamar.');
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
        if (state.add || state.edit) {
            fetchOptions();
        }
    }, [state.add, state.edit]);

    return (
        <>
            <Dialog
                visible={state.add || state.edit}
                header={state.edit ? 'Edit Harga Kamar' : 'Tambah Harga Kamar Baru'}
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
                        <div className="grid">
                            {/* Tipe Kamar */}
                            <div className="col-12 md:col-6 flex flex-column gap-1">
                                <label htmlFor="kode_tipe_kamar" className="font-semibold text-sm">
                                    Tipe Kamar <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="kode_tipe_kamar"
                                    name="kode_tipe_kamar"
                                    options={tipeKamarList.map((c) => ({ label: c.name, value: c.kode_tipe_kamar }))}
                                    value={formik?.values.kode_tipe_kamar || ''}
                                    onChange={(e) => formik?.setFieldValue('kode_tipe_kamar', e.value)}
                                    placeholder="Pilih Tipe Kamar"
                                    className={isFormFieldInvalid('kode_tipe_kamar') ? 'p-invalid w-full' : 'w-full'}
                                    filter
                                />
                                {getFormErrorMessage('kode_tipe_kamar')}
                            </div>

                            {/* Rate Plan */}
                            <div className="col-12 md:col-6 flex flex-column gap-1">
                                <label htmlFor="kode_rate_plan" className="font-semibold text-sm">
                                    Rate Plan <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="kode_rate_plan"
                                    name="kode_rate_plan"
                                    options={ratePlanList.map((c) => ({ label: c.name, value: c.kode_paket_harga }))}
                                    value={formik?.values.kode_rate_plan || ''}
                                    onChange={(e) => formik?.setFieldValue('kode_rate_plan', e.value)}
                                    placeholder="Pilih Rate Plan"
                                    className={isFormFieldInvalid('kode_rate_plan') ? 'p-invalid w-full' : 'w-full'}
                                    filter
                                />
                                {getFormErrorMessage('kode_rate_plan')}
                            </div>

                            {/* Season */}
                            <div className="col-12 flex flex-column gap-1">
                                <label htmlFor="kode_season" className="font-semibold text-sm">
                                    Musim (kosongkan untuk harga reguler)
                                </label>
                                <Dropdown
                                    id="kode_season"
                                    name="kode_season"
                                    options={seasonList.map((c) => ({ label: c.nama_musim, value: c.kode_musim }))}
                                    value={formik?.values.kode_season || ''}
                                    onChange={(e) => formik?.setFieldValue('kode_season', e.value)}
                                    placeholder="Pilih Musim"
                                    className={isFormFieldInvalid('kode_season') ? 'p-invalid w-full' : 'w-full'}
                                    showClear
                                    filter
                                />
                                {getFormErrorMessage('kode_season')}
                            </div>

                            {/* Price */}
                            <div className="col-12 md:col-6 flex flex-column gap-1">
                                <label htmlFor="price" className="font-semibold text-sm">
                                    Harga <span className="text-red-500">*</span>
                                </label>
                                <InputNumber
                                    id="price"
                                    name="price"
                                    value={formik?.values.price}
                                    onValueChange={(e) => formik?.setFieldValue('price', e.value)}
                                    className={isFormFieldInvalid('price') ? 'p-invalid w-full' : 'w-full'}
                                    mode="currency"
                                    currency="IDR"
                                    locale="id-ID"
                                    min={0}
                                />
                                {getFormErrorMessage('price')}
                            </div>

                            {/* Extra Bed Price */}
                            <div className="col-12 md:col-6 flex flex-column gap-1">
                                <label htmlFor="extra_bed_price" className="font-semibold text-sm">
                                    Harga Extra Bed
                                </label>
                                <InputNumber
                                    id="extra_bed_price"
                                    name="extra_bed_price"
                                    value={formik?.values.extra_bed_price}
                                    onValueChange={(e) => formik?.setFieldValue('extra_bed_price', e.value)}
                                    className={isFormFieldInvalid('extra_bed_price') ? 'p-invalid w-full' : 'w-full'}
                                    mode="currency"
                                    currency="IDR"
                                    locale="id-ID"
                                    min={0}
                                />
                                {getFormErrorMessage('extra_bed_price')}
                            </div>

                            {/* Valid From */}
                            <div className="col-12 md:col-6 flex flex-column gap-1">
                                <label htmlFor="valid_from" className="font-semibold text-sm">
                                    Berlaku Mulai <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    id="valid_from"
                                    name="valid_from"
                                    value={formik?.values.valid_from ? new Date(formik.values.valid_from) : null}
                                    onChange={(e) => formik?.setFieldValue('valid_from', e.value)}
                                    className={isFormFieldInvalid('valid_from') ? 'p-invalid w-full' : 'w-full'}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                />
                                {getFormErrorMessage('valid_from')}
                            </div>

                            {/* Valid To */}
                            <div className="col-12 md:col-6 flex flex-column gap-1">
                                <label htmlFor="valid_to" className="font-semibold text-sm">
                                    Berlaku Sampai
                                </label>
                                <Calendar
                                    id="valid_to"
                                    name="valid_to"
                                    value={formik?.values.valid_to ? new Date(formik.values.valid_to) : null}
                                    onChange={(e) => formik?.setFieldValue('valid_to', e.value)}
                                    className={isFormFieldInvalid('valid_to') ? 'p-invalid w-full' : 'w-full'}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                />
                                {getFormErrorMessage('valid_to')}
                            </div>

                            {/* Switches */}
                            <div className="col-12 mt-3">
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
                            type="button"
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
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Harga Kamar?` : 'Hapus data Harga Kamar ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} harga kamar.`
                            ) : (
                                <>
                                    Anda akan menghapus harga untuk:<br />
                                    <strong>
                                        {state.selectedDatas[0]?.tipe_kamar_name || ''} - {state.selectedDatas[0]?.rate_plan_name || ''}
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
