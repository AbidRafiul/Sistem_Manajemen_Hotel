'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { useEffect, useState } from 'react';
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
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([]);
  const [cabangOptions, setCabangOptions] = useState<any[]>([]);
  const [loadingDuplicate, setLoadingDuplicate] = useState(false);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const resCabang = await postData(apiCabangDropdown, {});
      if (resCabang?.data?.data) {
        setCabangOptions(resCabang.data.data.map((c: any) => ({ label: c.nama_hotel || c.kode_cabang, value: c.kode_cabang })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckDuplicate = async () => {
    if (!formik.values.full_name && !formik.values.phone && !formik.values.id_number) return;
    setLoadingDuplicate(true);
    try {
      const res = await postData(apiCheckDuplicate, {
        kode_cabang: formik.values.kode_cabang,
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
      const res = await postData(endpoint, formik.values);
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

  return (
    <Dialog
      visible={state.add || state.edit}
      header={state.edit ? 'Edit Data Tamu' : 'Tambah Data Tamu'}
      style={{ width: '90vw', maxWidth: '750px' }}
      modal
      onHide={() => setState((p: any) => ({ ...p, add: false, edit: false }))}
      footer={
        <div className="flex flex-column gap-2 pt-2">
          <Button
            label="Save"
            icon="pi pi-check"
            severity="success"
            className="w-full p-button-success"
            style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 600, fontSize: '1rem', padding: '0.75rem' }}
            onClick={handleSubmit}
          />
        </div>
      }
    >
      {duplicateCandidates.length > 0 && (
        <div className="mb-3">
          <Message
            severity="warn"
            className="w-full"
            content={
              <div className="flex flex-column gap-2 p-2">
                <span className="font-bold flex align-items-center gap-2">
                  <i className="pi pi-exclamation-triangle"></i> Peringatan Suspek Duplikat ({duplicateCandidates.length} Tamu Serupa Ditemukan)
                </span>
                <p className="m-0 text-sm">Sistem menemukan tamu yang mirip di database:</p>
                <div className="flex flex-column gap-1">
                  {duplicateCandidates.slice(0, 2).map((c, i) => (
                    <div key={i} className="text-sm bg-yellow-50 p-2 border-round flex justify-content-between align-items-center">
                      <span><strong>{c.full_name}</strong> ({c.kode_tamu}) - HP: {c.phone} | ID: {c.id_number || '-'}</span>
                      <Button
                        size="small"
                        label="Gunakan Profil Ini"
                        icon="pi pi-check-circle"
                        type="button"
                        severity="warning"
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

      {/* Form Identitas Tamu - Sekali Jalan */}
      <div className="grid p-fluid mt-1">
        {/* Pilihan Tipe Tamu & Cabang */}
        <div className="col-12 md:col-6">
          <label className="font-semibold text-color-secondary block mb-1">Tipe Tamu *</label>
          <SelectButton
            value={formik.values.guest_type || 'individual'}
            options={guestTypeOptions}
            onChange={(e) => formik.setFieldValue('guest_type', e.value || 'individual')}
            className="w-full"
          />
        </div>

        <div className="col-12 md:col-6">
          <label className="font-semibold text-color-secondary block mb-1">Cabang Hotel *</label>
          <Dropdown
            value={formik.values.kode_cabang}
            options={cabangOptions}
            onChange={(e) => formik.setFieldValue('kode_cabang', e.value)}
            placeholder="Pilih Cabang Hotel"
            className={formik.errors.kode_cabang ? 'p-invalid' : ''}
          />
        </div>

        {/* Nama Lengkap & Gelar */}
        <div className="col-12 md:col-3">
          <label className="font-semibold text-color-secondary block mb-1">Gelar</label>
          <Dropdown
            value={formik.values.title || 'Mr'}
            options={[
              { label: 'Mr', value: 'Mr' },
              { label: 'Mrs', value: 'Mrs' },
              { label: 'Ms', value: 'Ms' },
              { label: 'Dr', value: 'Dr' }
            ]}
            onChange={(e) => formik.setFieldValue('title', e.value)}
          />
        </div>

        <div className="col-12 md:col-9">
          <label className="font-semibold text-color-secondary block mb-1">Nama Lengkap *</label>
          <InputText
            value={formik.values.full_name}
            onChange={(e) => formik.setFieldValue('full_name', e.target.value)}
            onBlur={handleCheckDuplicate}
            placeholder="fullname"
            className={formik.errors.full_name ? 'p-invalid' : ''}
          />
        </div>

        {/* Telepon & Email */}
        <div className="col-12 md:col-6">
          <label className="font-semibold text-color-secondary block mb-1">Telp / WhatsApp *</label>
          <InputText
            value={formik.values.phone}
            onChange={(e) => formik.setFieldValue('phone', e.target.value)}
            onBlur={handleCheckDuplicate}
            placeholder="089222333444"
            className={formik.errors.phone ? 'p-invalid' : ''}
          />
        </div>

        <div className="col-12 md:col-6">
          <label className="font-semibold text-color-secondary block mb-1">Email</label>
          <InputText
            value={formik.values.email}
            onChange={(e) => formik.setFieldValue('email', e.target.value)}
            placeholder="email@example.com"
          />
        </div>

        {/* Tipe & No Identitas */}
        <div className="col-12 md:col-4">
          <label className="font-semibold text-color-secondary block mb-1">Tipe Identitas *</label>
          <Dropdown
            value={formik.values.id_type || 'ktp'}
            options={[
              { label: 'KTP', value: 'ktp' },
              { label: 'Paspor', value: 'passport' },
              { label: 'SIM', value: 'sim' },
              { label: 'Lainnya', value: 'other' }
            ]}
            onChange={(e) => formik.setFieldValue('id_type', e.value)}
          />
        </div>

        <div className="col-12 md:col-8">
          <label className="font-semibold text-color-secondary block mb-1">Nomor Identitas *</label>
          <InputText
            value={formik.values.id_number}
            onChange={(e) => formik.setFieldValue('id_number', e.target.value)}
            onBlur={handleCheckDuplicate}
            placeholder="Nomor KTP / Paspor / SIM"
            className={formik.errors.id_number ? 'p-invalid' : ''}
          />
        </div>

        {/* Jenis Kelamin, Tanggal Lahir, Kewarganegaraan */}
        <div className="col-12 md:col-4">
          <label className="font-semibold text-color-secondary block mb-1">Jenis Kelamin</label>
          <Dropdown
            value={formik.values.gender || 'L'}
            options={[
              { label: 'Laki-laki', value: 'L' },
              { label: 'Perempuan', value: 'P' }
            ]}
            onChange={(e) => formik.setFieldValue('gender', e.value)}
          />
        </div>

        <div className="col-12 md:col-4">
          <label className="font-semibold text-color-secondary block mb-1">Tanggal Lahir</label>
          <InputText
            type="date"
            value={formik.values.birth_date || ''}
            onChange={(e) => formik.setFieldValue('birth_date', e.target.value)}
            onBlur={handleCheckDuplicate}
          />
        </div>

        <div className="col-12 md:col-4">
          <label className="font-semibold text-color-secondary block mb-1">Kewarganegaraan</label>
          <InputText
            value={formik.values.nationality || 'Indonesia'}
            onChange={(e) => formik.setFieldValue('nationality', e.target.value)}
            placeholder="Indonesia / WNA"
          />
        </div>

        {/* Catatan Internal / Special Request */}
        <div className="col-12">
          <label className="font-semibold text-color-secondary block mb-1">Catatan (Opsional)</label>
          <InputTextarea
            rows={2}
            value={formik.values.internal_notes || ''}
            onChange={(e) => formik.setFieldValue('internal_notes', e.target.value)}
            placeholder="Catatan khusus / preferensi tamu..."
          />
        </div>
      </div>
    </Dialog>
  );
}

