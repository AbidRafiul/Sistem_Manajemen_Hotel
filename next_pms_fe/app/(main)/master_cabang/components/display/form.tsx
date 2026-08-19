'use client';

import { Dialog } from 'primereact/dialog';
import { CURRENCY_OPTIONS, FormProps, initValue, TIMEZONE_OPTIONS } from '../interfaces';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { apiEndpointCreate, apiEndpointDelete, apiEndpointGet, apiEndpointUpdate } from '../endpoints';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useEffect } from 'react';
import { formatDateSystem, getTzUser } from '@/lib/tools/dateTools';
import { InputSwitch } from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';

const Form = ({ state, setState, formik, toast, getData }: FormProps) => {
    const handleSave = async (input: initValue) => {
        setState((p) => ({ ...p, load: true }));

        try {
            const isEdit = Boolean(state.edit);
            const cEndPoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;

            const oHeaders: Record<string, string> = {
                'X-Level': '1'
            };

            // Format check-in dan check-out time (HH:mm:ss)
            let checkInTimeStr = '14:00:00';
            if (input.check_in_time) {
                if (input.check_in_time instanceof Date) {
                    const h = String(input.check_in_time.getHours()).padStart(2, '0');
                    const m = String(input.check_in_time.getMinutes()).padStart(2, '0');
                    checkInTimeStr = `${h}:${m}:00`;
                } else if (typeof input.check_in_time === 'string') {
                    checkInTimeStr = input.check_in_time;
                }
            }

            let checkOutTimeStr = '12:00:00';
            if (input.check_out_time) {
                if (input.check_out_time instanceof Date) {
                    const h = String(input.check_out_time.getHours()).padStart(2, '0');
                    const m = String(input.check_out_time.getMinutes()).padStart(2, '0');
                    checkOutTimeStr = `${h}:${m}:00`;
                } else if (typeof input.check_out_time === 'string') {
                    checkOutTimeStr = input.check_out_time;
                }
            }

            const oBody: Record<string, any> = {
                name: input.name,
                address: input.address || '',
                telepon: input.telepon || '',
                check_in_time: checkInTimeStr,
                check_out_time: checkOutTimeStr,
                timezone: input.timezone || 'Asia/Jakarta',
                is_pkp: input.is_pkp,
                is_active: input.is_active,
                tz: getTzUser()
            };

            if (isEdit) {
                oBody['kode_cabang'] = input.kode_cabang;
            }

            const vaData = await postData(cEndPoint, oBody, oHeaders);
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil Menyimpan Data Master Cabang');
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

            const vaCode = state.selectedDatas.map((v) => v.kode_cabang);

            const vaData = await postData(apiEndpointDelete, { kode_cabang: vaCode, tz: getTzUser() });
            const res = vaData.data;

            showSuccess(toast, res.message || 'Berhasil menghapus data Master Cabang.');
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
                header={state.edit ? 'Edit Data Master Cabang' : 'Tambah Master Cabang Baru'}
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
                        {/* Kode Cabang */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="code" className="font-semibold text-sm">
                                Kode Cabang
                            </label>
                            <InputText
                                id="code"
                                name="code"
                                disabled
                                value={formik?.values.kode_cabang || ''}
                                placeholder="Otomatis (Contoh: HTL0001)"
                                readOnly
                                className="w-full"
                            />
                            <small className="text-gray-500">Kode dibuat otomatis oleh sistem.</small>
                        </div>

                        {/* Nama Cabang */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="name" className="font-semibold text-sm">
                                Nama Cabang <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="name"
                                name="name"
                                value={formik?.values.name || ''}
                                placeholder="Contoh: Grand Marstech Cabang Jakarta"
                                onChange={(e) => formik?.setFieldValue('name', e.target.value)}
                                className={isFormFieldInvalid('name') ? 'p-invalid w-full' : 'w-full'}
                            />
                            {getFormErrorMessage('name')}
                        </div>

                        {/* Alamat */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="address" className="font-semibold text-sm">
                                Alamat Cabang
                            </label>
                            <InputTextarea
                                id="address"
                                name="address"
                                rows={3}
                                value={formik?.values.address || ''}
                                placeholder="Jl. Sudirman No. 123, Jakarta Selatan"
                                onChange={(e) => formik?.setFieldValue('address', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Informasi Kontak */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="telepon" className="font-semibold text-sm">
                                No. Telepon
                            </label>
                            <InputText
                                id="telepon"
                                name="telepon"
                                value={formik?.values.telepon || ''}
                                placeholder="021-1234567"
                                onChange={(e) => formik?.setFieldValue('telepon', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Waktu Check-In & Check-Out */}
                        <div className="flex flex-column md:flex-row gap-3 w-full">
                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="check_in_time" className="font-semibold text-sm">
                                    Waktu Check-In Default <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    id="check_in_time"
                                    name="check_in_time"
                                    value={formik?.values.check_in_time ? (formik.values.check_in_time instanceof Date ? formik.values.check_in_time : new Date(`1970-01-01T${formik.values.check_in_time}`)) : null}
                                    onChange={(e) => formik?.setFieldValue('check_in_time', e.value)}
                                    timeOnly
                                    hourFormat="24"
                                    placeholder="14:00"
                                    className={isFormFieldInvalid('check_in_time') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('check_in_time')}
                            </div>

                            <div className="flex flex-column gap-1 w-full">
                                <label htmlFor="check_out_time" className="font-semibold text-sm">
                                    Waktu Check-Out Default <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    id="check_out_time"
                                    name="check_out_time"
                                    value={formik?.values.check_out_time ? (formik.values.check_out_time instanceof Date ? formik.values.check_out_time : new Date(`1970-01-01T${formik.values.check_out_time}`)) : null}
                                    onChange={(e) => formik?.setFieldValue('check_out_time', e.value)}
                                    timeOnly
                                    hourFormat="24"
                                    placeholder="12:00"
                                    className={isFormFieldInvalid('check_out_time') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {getFormErrorMessage('check_out_time')}
                            </div>
                        </div>

                        {/* Zona Waktu */}
                        <div className="flex flex-column gap-1 w-full">
                            <label htmlFor="timezone" className="font-semibold text-sm">
                                Zona Waktu Cabang
                            </label>
                            <Dropdown
                                id="timezone"
                                name="timezone"
                                options={TIMEZONE_OPTIONS}
                                value={formik?.values.timezone || 'Asia/Jakarta'}
                                onChange={(e) => formik?.setFieldValue('timezone', e.value)}
                                placeholder="Pilih Zona Waktu"
                                className="w-full"
                            />
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
                                    Status Properti Aktif
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
                            {state.selectedDatas.length > 1 ? `Hapus ${state.selectedDatas.length} data Master Cabang?` : 'Hapus data Master Cabang ini?'}
                        </h3>
                        <p className="text-color-secondary">
                            {state.selectedDatas.length > 1 ? (
                                `Anda akan menghapus ${state.selectedDatas.length} item cabang.`
                            ) : (
                                <>
                                    Anda akan menghapus properti cabang: <br />
                                    <strong>
                                        {state.selectedDatas[0]?.kode_cabang || ''} - {state.selectedDatas[0]?.name || ''}
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
