'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { apiCabangDropdown, apiCheckDuplicate, apiGuestCreate, apiGuestUpdate } from '../endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';

interface FormProps {
  state: any;
  setState: any;
  formik: any;
  toast: any;
  getData: () => void;
}

export default function Form({ state, setState, formik, toast, getData }: FormProps) {
  const { data: session } = useSession();
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([]);
  const [cabangOptions, setCabangOptions] = useState<any[]>([]);
  const [, setLoadingDuplicate] = useState(false);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const resCabang = await postData(apiCabangDropdown, {});
      if (resCabang?.data?.data) {
        setCabangOptions(
          resCabang.data.data.map((c: any) => ({
            label: c.nama_hotel || c.name || c.kode_cabang,
            value: c.kode_cabang
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sinkronisasi otomatis ke cabang aktif saat tambah tamu baru
  useEffect(() => {
    if (state.add) {
      const activeCabang = session?.user?.active_kode_cabang || session?.user?.default_kode_cabang || '';
      if (activeCabang && formik.values.kode_cabang !== activeCabang) {
        formik.setFieldValue('kode_cabang', activeCabang);
      }
    }
  }, [state.add, session?.user?.active_kode_cabang, session?.user?.default_kode_cabang]);

  const activeKodeCabang =
    formik.values.kode_cabang ||
    session?.user?.active_kode_cabang ||
    session?.user?.default_kode_cabang ||
    '';

  const matchedCabang =
    cabangOptions.find((c: any) => c.value === activeKodeCabang) ||
    session?.user?.allowed_branches?.find((b: any) => b.kode_cabang === activeKodeCabang);

  const activeBranchName =
    matchedCabang?.label ||
    matchedCabang?.nama_hotel ||
    session?.user?.active_branch_name ||
    session?.user?.default_branch_name ||
    activeKodeCabang ||
    'Cabang Aktif';

  const handleCheckDuplicate = async () => {
    if (!formik.values.full_name && !formik.values.phone && !formik.values.id_number) return;
    setLoadingDuplicate(true);
    try {
      const res = await postData(apiCheckDuplicate, {
        kode_cabang: activeKodeCabang,
        full_name: formik.values.full_name,
        phone: formik.values.phone,
        id_number: formik.values.id_number,
        birth_date: formik.values.birth_date,
        current_guest_id: formik.values.kode_tamu
      });
      if (res?.data?.data?.candidates) {
        setDuplicateCandidates(res.data.data.candidates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDuplicate(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const isEdit = state.edit;
      const endpoint = isEdit ? apiGuestUpdate : apiGuestCreate;
      const payload = {
        ...formik.values,
        kode_cabang: activeKodeCabang
      };

      const res = await postData(endpoint, payload);
      if (res.status === 200) {
        showSuccess(toast, isEdit ? 'Profil tamu berhasil diperbarui' : 'Tamu baru berhasil dibuat');
        setState((p: any) => ({ ...p, add: false, edit: false }));
        getData();
      }
    } catch (error: any) {
      const e = error?.response?.data || error;
      showError(toast, e?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  const guestTypeOptions = [
    { label: 'Individual (Perorangan)', value: 'individual' },
    { label: 'Group (Rombongan)', value: 'group' }
  ];

  const dialogHeader = (
    <div className="flex align-items-center gap-2">
      <div className="w-2rem h-2rem border-round bg-primary-50 text-primary flex align-items-center justify-content-center">
        <i className={state.edit ? 'pi pi-user-edit text-base' : 'pi pi-user-plus text-base'}></i>
      </div>
      <div>
        <span className="font-bold text-base text-900 line-height-1">
          {state.edit ? 'Edit Data Tamu' : 'Tambah Data Tamu'}
        </span>
        <span className="text-xs text-500 font-normal block mt-1 line-height-1">
          {state.edit
            ? `Perbarui informasi profil tamu (${formik.values.kode_tamu || ''})`
            : 'Lengkapi formulir profil tamu di bawah ini'}
        </span>
      </div>
    </div>
  );

  const dialogFooter = (
    <div className="flex justify-content-between align-items-center w-full pt-2 border-top-1 surface-border">
      <span className="text-xs text-500">
        <span className="text-red-500 font-bold">*</span> Wajib diisi
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          label="Batal"
          icon="pi pi-times"
          outlined
          severity="secondary"
          size="small"
          className="px-3"
          onClick={() => setState((p: any) => ({ ...p, add: false, edit: false }))}
        />
        <Button
          type="button"
          label={state.edit ? 'Simpan Perubahan' : 'Simpan Tamu'}
          icon="pi pi-check"
          size="small"
          className="p-button-success px-4 font-semibold"
          onClick={handleSubmit}
        />
      </div>
    </div>
  );

  return (
    <Dialog
      visible={state.add || state.edit}
      header={dialogHeader}
      style={{ width: '680px', maxWidth: '95vw' }}
      breakpoints={{ '960px': '80vw', '640px': '95vw' }}
      modal
      className="p-fluid"
      onHide={() => setState((p: any) => ({ ...p, add: false, edit: false }))}
      footer={dialogFooter}
    >
      {duplicateCandidates.length > 0 && (
        <div className="mb-2">
          <Message
            severity="warn"
            className="w-full text-xs"
            content={
              <div className="flex flex-column gap-1 p-1 w-full">
                <span className="font-bold flex align-items-center gap-1 text-xs">
                  <i className="pi pi-exclamation-triangle text-xs"></i> Suspek Duplikat ({duplicateCandidates.length} Tamu Serupa Ditemukan)
                </span>
                <div className="flex flex-column gap-1 mt-1">
                  {duplicateCandidates.slice(0, 2).map((c, i) => (
                    <div
                      key={i}
                      className="text-xs bg-yellow-50 p-1.5 border-round flex justify-content-between align-items-center border-1 border-yellow-200"
                    >
                      <span className="text-overflow-ellipsis overflow-hidden white-space-nowrap mr-2">
                        <strong>{c.full_name}</strong> ({c.kode_tamu}) &bull; {c.phone}
                      </span>
                      <Button
                        size="small"
                        label="Gunakan Profil"
                        icon="pi pi-check"
                        type="button"
                        severity="warning"
                        className="py-1 px-2 text-xs flex-shrink-0"
                        onClick={() => {
                          setState((p: any) => ({ ...p, add: false, edit: false, selectedGuest: c, detail: true }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Form Identitas Tamu - Rapi, Kompak & Sesuai Cabang Aktif */}
      <div className="grid p-fluid formgrid row-gap-2 mt-1">
        {/* Pilihan Tipe Tamu & Cabang Aktif */}
        <div className="col-12 sm:col-6 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">
            Tipe Tamu <span className="text-red-500">*</span>
          </label>
          <SelectButton
            value={formik.values.guest_type || 'individual'}
            options={guestTypeOptions}
            onChange={(e) => e.value && formik.setFieldValue('guest_type', e.value)}
            className="w-full text-xs"
            pt={{
              button: { className: 'p-button-sm text-xs font-medium py-2' }
            }}
          />
        </div>

        <div className="col-12 sm:col-6 py-1">
          <div className="flex justify-content-between align-items-center mb-1">
            <label className="text-xs font-semibold text-700">Cabang Hotel</label>
            <span className="text-[11px] text-500 font-normal">Sesuai Cabang Aktif</span>
          </div>
          <div className="flex align-items-center justify-content-between border-1 border-round surface-border surface-50 px-3 py-2 h-2.5rem">
            <div className="flex align-items-center gap-2 overflow-hidden mr-2">
              <i className="pi pi-building text-primary text-sm flex-shrink-0"></i>
              <span
                className="font-semibold text-800 text-xs sm:text-sm text-overflow-ellipsis white-space-nowrap overflow-hidden"
                title={activeBranchName}
              >
                {activeBranchName}
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 border-round bg-primary-50 text-primary border-1 border-primary-200 font-bold white-space-nowrap flex-shrink-0">
              {activeKodeCabang || 'Aktif'}
            </span>
          </div>
        </div>

        {/* Gelar & Nama Lengkap */}
        <div className="col-4 sm:col-3 md:col-2 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">Gelar</label>
          <Dropdown
            value={formik.values.title || 'Mr'}
            options={[
              { label: 'Mr', value: 'Mr' },
              { label: 'Mrs', value: 'Mrs' },
              { label: 'Ms', value: 'Ms' },
              { label: 'Dr', value: 'Dr' }
            ]}
            onChange={(e) => formik.setFieldValue('title', e.value)}
            className="p-inputtext-sm w-full"
          />
        </div>

        <div className="col-8 sm:col-9 md:col-10 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-user text-sm" />
            <InputText
              value={formik.values.full_name || ''}
              onChange={(e) => formik.setFieldValue('full_name', e.target.value)}
              onBlur={handleCheckDuplicate}
              placeholder="Nama lengkap sesuai kartu identitas"
              className={`p-inputtext-sm w-full ${formik.errors.full_name ? 'p-invalid' : ''}`}
            />
          </IconField>
          {formik.errors.full_name && (
            <small className="p-error text-xs block mt-0.5">{formik.errors.full_name}</small>
          )}
        </div>

        {/* Telepon & Email */}
        <div className="col-12 sm:col-6 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">
            Telp / WhatsApp <span className="text-red-500">*</span>
          </label>
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-phone text-sm" />
            <InputText
              value={formik.values.phone || ''}
              onChange={(e) => formik.setFieldValue('phone', e.target.value)}
              onBlur={handleCheckDuplicate}
              placeholder="Contoh: 081234567890"
              className={`p-inputtext-sm w-full ${formik.errors.phone ? 'p-invalid' : ''}`}
            />
          </IconField>
          {formik.errors.phone && (
            <small className="p-error text-xs block mt-0.5">{formik.errors.phone}</small>
          )}
        </div>

        <div className="col-12 sm:col-6 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">Email</label>
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-envelope text-sm" />
            <InputText
              value={formik.values.email || ''}
              onChange={(e) => formik.setFieldValue('email', e.target.value)}
              placeholder="tamu@example.com"
              className="p-inputtext-sm w-full"
            />
          </IconField>
        </div>

        {/* Tipe & No Identitas */}
        <div className="col-12 sm:col-4 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">
            Tipe Identitas <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={formik.values.id_type || 'ktp'}
            options={[
              { label: 'KTP', value: 'ktp' },
              { label: 'Paspor', value: 'passport' },
              { label: 'SIM', value: 'sim' },
              { label: 'Lainnya', value: 'other' }
            ]}
            onChange={(e) => formik.setFieldValue('id_type', e.value)}
            className="p-inputtext-sm w-full"
          />
        </div>

        <div className="col-12 sm:col-8 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">
            Nomor Identitas <span className="text-red-500">*</span>
          </label>
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-id-card text-sm" />
            <InputText
              value={formik.values.id_number || ''}
              onChange={(e) => formik.setFieldValue('id_number', e.target.value)}
              onBlur={handleCheckDuplicate}
              placeholder="Nomor KTP / Paspor / SIM"
              className={`p-inputtext-sm w-full ${formik.errors.id_number ? 'p-invalid' : ''}`}
            />
          </IconField>
          {formik.errors.id_number && (
            <small className="p-error text-xs block mt-0.5">{formik.errors.id_number}</small>
          )}
        </div>

        {/* Jenis Kelamin, Tanggal Lahir, Kewarganegaraan */}
        <div className="col-12 sm:col-4 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">Jenis Kelamin</label>
          <Dropdown
            value={formik.values.gender || 'L'}
            options={[
              { label: 'Laki-laki', value: 'L' },
              { label: 'Perempuan', value: 'P' }
            ]}
            onChange={(e) => formik.setFieldValue('gender', e.value)}
            className="p-inputtext-sm w-full"
          />
        </div>

        <div className="col-12 sm:col-4 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">Tanggal Lahir</label>
          <InputText
            type="date"
            value={formik.values.birth_date || ''}
            onChange={(e) => formik.setFieldValue('birth_date', e.target.value)}
            onBlur={handleCheckDuplicate}
            className="p-inputtext-sm w-full"
          />
        </div>

        <div className="col-12 sm:col-4 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">Kewarganegaraan</label>
          <IconField iconPosition="left" className="w-full">
            <InputIcon className="pi pi-globe text-sm" />
            <InputText
              value={formik.values.nationality || 'Indonesia'}
              onChange={(e) => formik.setFieldValue('nationality', e.target.value)}
              placeholder="Indonesia"
              className="p-inputtext-sm w-full"
            />
          </IconField>
        </div>

        {/* Catatan Internal / Preferensi */}
        <div className="col-12 py-1">
          <label className="text-xs font-semibold text-700 block mb-1">Catatan (Opsional)</label>
          <InputTextarea
            rows={2}
            autoResize
            value={formik.values.internal_notes || ''}
            onChange={(e) => formik.setFieldValue('internal_notes', e.target.value)}
            placeholder="Catatan khusus, preferensi kamar, atau alergi tamu..."
            className="p-inputtext-sm w-full text-sm"
          />
        </div>
      </div>
    </Dialog>
  );
}
