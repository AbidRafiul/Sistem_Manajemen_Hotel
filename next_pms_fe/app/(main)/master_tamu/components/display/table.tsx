'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useRef } from 'react';
import { GuestData, State } from '../interfaces';
import { formatDateSystem } from '@/lib/tools/dateTools';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import StatusLegend from '@/app/components/status/StatusLegend';

interface TableProps {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  getData: () => void;
  getPrintData: () => void;
  onLazyLoad: (e: any) => void;
  formik: any;
}

export default function Table({ state, setState, getData, getPrintData, onLazyLoad, formik }: TableProps) {
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const guestTypeOptions = [
    { label: 'Semua Jenis', value: '' },
    { label: 'Individual', value: 'individual' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Travel Agent', value: 'travel_agent' },
    { label: 'Group Member', value: 'group' }
  ];

  const vipOptions = [
    { label: 'Semua VIP', value: '' },
    { label: 'Non VIP', value: 'none' },
    { label: 'VIP', value: 'vip' },
    { label: 'VVIP', value: 'vvip' },
    { label: 'Owner Guest', value: 'owner' }
  ];

  const blacklistOptions = [
    { label: 'Semua Status Blacklist', value: '' },
    { label: 'Aktif / Normal', value: '0' },
    { label: 'Blacklist', value: '1' }
  ];

  const headerTemplate = (
    <div className="flex flex-column gap-3">
      <div className="flex flex-wrap align-items-center justify-content-between gap-2">
        <span className="text-xl font-bold">Daftar Tamu</span>
        <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
          <IconField iconPosition="left" className="w-full md:w-20rem">
            <InputIcon className="pi pi-search" />
            <InputText
              value={state.searchVal}
              className="w-full"
              placeholder="Cari Nama / Kode / HP / Identitas..."
              onChange={(e) => {
                const val = e.target.value;
                setState((p) => ({ ...p, searchVal: val }));
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = setTimeout(() => {
                  setState((p) => ({ ...p, keyword: val, page: 1, first: 0 }));
                }, 500);
              }}
            />
          </IconField>
          <Button
            type="button"
            icon="pi pi-filter-slash"
            outlined
            severity="danger"
            tooltip="Reset Filter"
            tooltipOptions={{ position: 'bottom' }}
            onClick={() => {
              setState((p) => ({
                ...p,
                searchVal: '',
                keyword: '',
                guestTypeFilter: '',
                nationalityFilter: '',
                vipFilter: '',
                blacklistFilter: '',
                incompleteOnly: false,
                page: 1,
                first: 0
              }));
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap align-items-center gap-2 pt-2 border-top-1 surface-border">
        <Dropdown
          value={state.guestTypeFilter}
          options={guestTypeOptions}
          onChange={(e) => setState((p) => ({ ...p, guestTypeFilter: e.value, page: 1, first: 0 }))}
          placeholder="Jenis Tamu"
          className="p-inputtext-sm w-full md:w-11rem"
        />
        <Dropdown
          value={state.vipFilter}
          options={vipOptions}
          onChange={(e) => setState((p) => ({ ...p, vipFilter: e.value, page: 1, first: 0 }))}
          placeholder="Tingkat VIP"
          className="p-inputtext-sm w-full md:w-11rem"
        />
        <Dropdown
          value={state.blacklistFilter}
          options={blacklistOptions}
          onChange={(e) => setState((p) => ({ ...p, blacklistFilter: e.value, page: 1, first: 0 }))}
          placeholder="Blacklist"
          className="p-inputtext-sm w-full md:w-11rem"
        />
      </div>
    </div>
  );

  const actionBodyTemplate = (rowData: GuestData) => (
    <div className="flex justify-content-center gap-1">
      <Button
        icon="pi pi-eye"
        outlined
        severity="info"
        className="p-button-sm"
        onClick={() => setState((p) => ({ ...p, selectedGuest: rowData, detail: true }))}
        tooltip="Detail Profil & Riwayat"
      />
      <Button
        icon="pi pi-pencil"
        outlined
        className="p-button-sm"
        onClick={() => {
          formik.setValues({
            id: rowData.id,
            kode_cabang: rowData.kode_cabang || '',
            kode_tamu: rowData.kode_tamu || '',
            full_name: rowData.full_name || '',
            title: rowData.title || 'Mr',
            first_name: rowData.first_name || '',
            last_name: rowData.last_name || '',
            id_type: rowData.id_type || 'ktp',
            id_number: rowData.id_number || '',
            phone: rowData.phone || '',
            email: rowData.email || '',
            nationality: rowData.nationality || 'Indonesia',
            gender: rowData.gender || 'L',
            birth_date: rowData.birth_date || '',
            identity_file_path: rowData.identity_file_path || '',

            passport_no: rowData.passport_no || '',
            passport_issuing_country: rowData.passport_issuing_country || '',
            passport_expiry: rowData.passport_expiry || '',
            visa_type: rowData.visa_type || '',
            visa_no: rowData.visa_no || '',
            arrival_date_indonesia: rowData.arrival_date_indonesia || '',
            purpose_of_visit: rowData.purpose_of_visit || '',

            guest_type: rowData.guest_type || 'individual',
            vip_level: rowData.vip_level || 'none',
            company_id: rowData.company_id || '',
            loyalty_tier: rowData.loyalty_tier || '',

            preferences: rowData.preferences || {},
            internal_notes: rowData.internal_notes || '',
            consent_marketing: rowData.consent_marketing || 0
          });
          setState((p) => ({ ...p, add: false, edit: true }));
        }}
        tooltip="Edit Profil Tamu"
      />
      <Button
        icon="pi pi-trash"
        outlined
        severity="danger"
        className="p-button-sm"
        onClick={() => setState((p) => ({ ...p, delete: true, selectedDatas: [rowData] }))}
        tooltip="Hapus Profil Tamu"
      />
    </div>
  );

  const nameBodyTemplate = (rowData: GuestData) => (
    <div className="flex align-items-center gap-2">
      <span className="font-semibold text-gray-900">{rowData.full_name}</span>
      {rowData.vip_level && rowData.vip_level !== 'none' && (
        <Tag value={rowData.vip_level.toUpperCase()} severity="warning" />
      )}
      {rowData.is_blacklisted === 1 && (
        <Tag value="BLACKLIST" severity="danger" />
      )}
    </div>
  );

  const completenessBodyTemplate = (rowData: GuestData) => {
    const score = rowData.completeness_score || 0;
    let sev: 'success' | 'warning' | 'danger' = 'danger';
    if (score >= 80) sev = 'success';
    else if (score >= 50) sev = 'warning';

    return <Tag value={`${score}%`} severity={sev} />;
  };

  return (
    <>
      <div className="card">
        <div className="flex justify-content-between align-items-start mb-4">
          <div className="flex flex-column">
            <h3 className="text-2xl font-semibold flex align-items-center gap-2">
              <i className="pi pi-users text-blue-600 text-3xl"></i>Master Tamu
            </h3>
            <p className="text-gray-500">Kelola master data profil tamu, klasifikasi VIP, preferensi, dan riwayat kunjungan.</p>
          </div>
        </div>

        <div className="flex flex-row flex-wrap align-items-center gap-2 mb-3">
          <Button
            size="small"
            label="Tamu Baru"
            icon="pi pi-user-plus"
            outlined
            severity="success"
            onClick={() => {
              formik.resetForm();
              setState((p) => ({ ...p, selectedDatas: [], add: true, edit: false }));
            }}
          />
          <Divider layout="vertical" />
          <Button size="small" label="Cetak / Export" icon="pi pi-file-excel" outlined onClick={getPrintData} loading={state.load} />
          <Divider layout="vertical" />
          <Button
            size="small"
            label={`Hapus${state.selectedDatas.length > 0 ? ` (${state.selectedDatas.length})` : ''}`}
            icon="pi pi-trash"
            severity="danger"
            outlined
            onClick={() => {
              if (state.selectedDatas.length > 0) setState((p) => ({ ...p, delete: true }));
            }}
            disabled={state.selectedDatas.length === 0}
          />
          <Divider layout="vertical" />
          <Button
            size="small"
            label="Suspek Duplikat"
            icon="pi pi-copy"
            severity="warning"
            outlined
            onClick={() => setState((p) => ({ ...p, suspects: true }))}
          />
          <Divider layout="vertical" />
          <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={getData} loading={state.load} />
        </div>

        <StatusLegend />

        <DataTable
          value={state.data}
          scrollable
          lazy
          paginator
          first={state.first}
          rows={state.rows}
          totalRecords={state.totalData}
          onPage={onLazyLoad}
          onSort={onLazyLoad}
          sortField={state.sortField}
          sortOrder={state.sortOrder === 'asc' ? 1 : -1}
          selectionMode="multiple"
          header={headerTemplate}
          loading={state.load}
          selection={state.selectedDatas}
          onSelectionChange={(e) => setState((p) => ({ ...p, selectedDatas: e.value }))}
          dataKey="kode_tamu"
          emptyMessage="Tidak ada data tamu ditemukan"
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data tamu"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column field="is_active" header="Status" align="center" body={(rowData) => <StatusIndicator status={rowData.is_active} />} style={{ minWidth: '5rem', width: '5rem' }} />
          <Column field="kode_tamu" header="Kode Tamu" sortable style={{ minWidth: '10rem' }} />
          <Column field="full_name" header="Nama Lengkap" body={nameBodyTemplate} sortable style={{ minWidth: '16rem' }} />
          <Column field="id_number" header="Jenis & No. Identitas" body={(rowData) => `${(rowData.id_type || 'KTP').toUpperCase()}: ${rowData.id_number || '-'}`} style={{ minWidth: '14rem' }} />
          <Column field="phone" header="No. Telepon" sortable style={{ minWidth: '11rem' }} />
          <Column field="nationality" header="Kewarganegaraan" sortable style={{ minWidth: '11rem' }} />
          <Column field="total_stay" header="Kunjungan" align="center" sortable style={{ minWidth: '8rem' }} />
          <Column field="last_stay_date" header="Terakhir Menginap" body={(rowData) => rowData.last_stay_date ? formatDateSystem(rowData.last_stay_date) : '-'} align="center" sortable style={{ minWidth: '11rem' }} />
          <Column field="completeness_score" header="Kelengkapan" body={completenessBodyTemplate} align="center" sortable style={{ minWidth: '8rem' }} />
          <Column header="Aksi" body={actionBodyTemplate} align="center" frozen alignFrozen="right" style={{ minWidth: '10rem' }} />
        </DataTable>
      </div>
    </>
  );
}
