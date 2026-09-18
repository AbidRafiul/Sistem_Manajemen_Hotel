'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { Chart } from 'primereact/chart';

import postData from '@/lib/axios/postData';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { formatCurrency, showError, showSuccess } from '@/lib/tools/generalTools';
import { apiDashboardAnalytics, apiDashboardSummary, apiGuestData, apiGuestExport } from '../components/endpoints';

const STATUS_COLOR_MAP: Record<string, string> = {
  regular: 'bg-gray-500',
  vip: 'bg-blue-500',
  vvip: 'bg-yellow-500',
  owner: 'bg-purple-500',
  blacklist: 'bg-red-500'
};

export default function DashboardTamuPage() {
  const toast = useRef<Toast>(null);
  const op = useRef<OverlayPanel>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [load, setLoad] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalData, setTotalData] = useState(0);

  // Filters & State
  const [tanggalAwal, setTanggalAwal] = useState<any>(null);
  const [tanggalAkhir, setTanggalAkhir] = useState<any>(null);
  const [searchVal, setSearchVal] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedGuestType, setSelectedGuestType] = useState<any>(null);
  const [selectedVip, setSelectedVip] = useState<any>(null);
  const [selectedBlacklist, setSelectedBlacklist] = useState<any>(null);

  // Pagination & Sorting
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Analytics tab data
  const [originData, setOriginData] = useState<any[]>([]);
  const [segmentData, setSegmentData] = useState<any[]>([]);
  const [topSpenders, setTopSpenders] = useState<any[]>([]);
  const [dormantList, setDormantList] = useState<any[]>([]);
  const [birthdayList, setBirthdayList] = useState<any[]>([]);
  const [vipArrivals, setVipArrivals] = useState<any[]>([]);

  // Total accumulation
  const [totalSpendingAll, setTotalSpendingAll] = useState(0);

  useEffect(() => {
    fetchSummary();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchTableData();
  }, [page, rows, sortField, sortOrder, keyword, selectedGuestType, selectedVip, selectedBlacklist, tanggalAwal, tanggalAkhir]);

  const fetchSummary = async () => {
    try {
      const res = await postData(apiDashboardSummary, {});
      if (res?.data?.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const resOrigin = await postData(apiDashboardAnalytics, { type: 'origin' });
      if (resOrigin?.data?.data) setOriginData(resOrigin.data.data);

      const resSeg = await postData(apiDashboardAnalytics, { type: 'segment' });
      if (resSeg?.data?.data) setSegmentData(resSeg.data.data);

      const resTop = await postData(apiDashboardAnalytics, { type: 'top_spender' });
      if (resTop?.data?.data) setTopSpenders(resTop.data.data);

      const resDor = await postData(apiDashboardAnalytics, { type: 'dormant' });
      if (resDor?.data?.data) setDormantList(resDor.data.data);

      const resBday = await postData(apiDashboardAnalytics, { type: 'birthday' });
      if (resBday?.data?.data) setBirthdayList(resBday.data.data);

      const resVip = await postData(apiDashboardAnalytics, { type: 'vip_arrival' });
      if (resVip?.data?.data) setVipArrivals(resVip.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTableData = async () => {
    setLoad(true);
    try {
      const oPayload = {
        page,
        perPage: rows,
        keyword,
        guest_type: selectedGuestType ? selectedGuestType.join(',') : '',
        vip_level: selectedVip ? selectedVip.join(',') : '',
        is_blacklisted: selectedBlacklist ? selectedBlacklist.join(',') : '',
        sortField: sortField || 'created_at',
        sortOrder: sortOrder || 'desc',
        tanggal_awal: tanggalAwal ? formatDateSystem(tanggalAwal, 'yyyy-MM-dd') : undefined,
        tanggal_akhir: tanggalAkhir ? formatDateSystem(tanggalAkhir, 'yyyy-MM-dd') : undefined
      };

      const res = await postData(apiGuestData, oPayload);
      if (res?.data?.data) {
        setData(res.data.data || []);
        setTotalData(res.data.total_data || 0);

        const sumSpend = (res.data.data || []).reduce((acc: number, curr: any) => acc + Number(curr.total_spending || 0), 0);
        setTotalSpendingAll(sumSpend);
      }
    } catch (err: any) {
      const e = err?.response?.data || err;
      showError(toast, e?.message || 'Gagal memuat data laporan tamu');
    } finally {
      setLoad(false);
    }
  };

  const handleCopyCode = (e: React.MouseEvent, kode: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(kode);
    showSuccess(toast, `Kode tamu ${kode} disalin ke clipboard`);
  };

  const statusIndicatorTemplate = (rowData: any) => {
    let key = 'regular';
    if (rowData.is_blacklisted === 1) key = 'blacklist';
    else if (rowData.vip_level && rowData.vip_level !== 'none') key = rowData.vip_level.toLowerCase();

    const colorClass = STATUS_COLOR_MAP[key] || 'bg-gray-500';
    const cId = `status-dot-${rowData.id}`;

    return (
      <div className="flex justify-content-center align-items-center w-full">
        <Tooltip target={`#${cId}`} content={key.toUpperCase()} position="top" />
        <span id={cId} className={`block border-round-sm ${colorClass}`} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
      </div>
    );
  };

  const guestCodeTemplate = (rowData: any) => (
    <div className="flex align-items-center gap-2">
      <span className="font-semibold text-800">{rowData.kode_tamu}</span>
      <Button
        icon="pi pi-copy"
        className="p-button-rounded p-button-text p-button-secondary p-0"
        style={{ width: '28px', height: '28px', color: '#3b82f6' }}
        tooltip="Salin Kode"
        onClick={(e) => handleCopyCode(e, rowData.kode_tamu)}
      />
    </div>
  );

  const headerTemplate = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-3">
      {/* SISI KIRI: Rentang Tanggal */}
      <div className="flex align-items-center flex-wrap gap-2">
        <div className="flex align-items-center gap-2">
          <Calendar
            value={tanggalAwal}
            onChange={(e) => {
              setTanggalAwal(e.value);
              setPage(1);
              setFirst(0);
            }}
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Tanggal Awal"
            className="w-11rem text-sm"
          />
          <span className="text-xs text-500 font-bold">s.d</span>
          <Calendar
            value={tanggalAkhir}
            onChange={(e) => {
              setTanggalAkhir(e.value);
              setPage(1);
              setFirst(0);
            }}
            dateFormat="yy-mm-dd"
            showIcon
            placeholder="Tanggal Akhir"
            className="w-11rem text-sm"
          />
        </div>
      </div>

      {/* SISI KANAN: Filter, Search & Reset */}
      <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
        <Button
          type="button"
          icon="pi pi-filter"
          label="Filter"
          outlined
          severity={selectedGuestType || selectedVip || selectedBlacklist ? 'warning' : 'secondary'}
          onClick={(e) => op.current?.toggle(e)}
        />

        <span className="p-input-icon-left w-full md:w-20rem">
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={searchVal}
              className="w-full text-sm"
              placeholder="Cari Tiket, Pelanggan, IMEI..."
              onChange={(e) => {
                const val = e.target.value;
                setSearchVal(val);
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = setTimeout(() => {
                  setKeyword(val);
                  setPage(1);
                  setFirst(0);
                }, 500);
              }}
            />
          </IconField>
        </span>

        <Button
          type="button"
          icon="pi pi-filter-slash"
          outlined
          severity="danger"
          tooltip="Reset Semua Filter"
          onClick={() => {
            setSearchVal('');
            setKeyword('');
            setTanggalAwal(null);
            setTanggalAkhir(null);
            setSelectedGuestType(null);
            setSelectedVip(null);
            setSelectedBlacklist(null);
            setPage(1);
            setFirst(0);
          }}
        />
      </div>

      {/* Panel Overlay Filter Tambahan */}
      <OverlayPanel ref={op} style={{ width: '580px' }}>
        <div className="flex flex-column gap-3">
          <span className="font-bold text-lg border-bottom-1 border-300 pb-2">Filter Tambahan Laporan Tamu</span>
          <div className="grid formgrid p-fluid">
            <div className="field col-12 md:col-6 mb-3">
              <label className="font-semibold text-xs text-700 block mb-2">Jenis Tamu / Segmen</label>
              <MultiSelect
                value={selectedGuestType}
                options={[
                  { label: 'Individual', value: 'individual' },
                  { label: 'Corporate', value: 'corporate' },
                  { label: 'Travel Agent', value: 'travel_agent' },
                  { label: 'Group Member', value: 'group' }
                ]}
                onChange={(e) => { setSelectedGuestType(e.value); setPage(1); setFirst(0); }}
                placeholder="Semua Segmen"
                display="chip"
              />
            </div>

            <div className="field col-12 md:col-6 mb-3">
              <label className="font-semibold text-xs text-700 block mb-2">Tingkat VIP</label>
              <MultiSelect
                value={selectedVip}
                options={[
                  { label: 'Non VIP', value: 'none' },
                  { label: 'VIP', value: 'vip' },
                  { label: 'VVIP', value: 'vvip' },
                  { label: 'Owner Guest', value: 'owner' }
                ]}
                onChange={(e) => { setSelectedVip(e.value); setPage(1); setFirst(0); }}
                placeholder="Semua VIP"
                display="chip"
              />
            </div>

            <div className="field col-12 md:col-6 mb-3">
              <label className="font-semibold text-xs text-700 block mb-2">Status Blacklist</label>
              <MultiSelect
                value={selectedBlacklist}
                options={[
                  { label: 'Normal / Aktif', value: '0' },
                  { label: 'Blacklist', value: '1' }
                ]}
                onChange={(e) => { setSelectedBlacklist(e.value); setPage(1); setFirst(0); }}
                placeholder="Semua Status Blacklist"
                display="chip"
              />
            </div>
          </div>
        </div>
      </OverlayPanel>
    </div>
  );

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column footer="Grand Total (Semua Halaman):" colSpan={7} footerStyle={{ textAlign: 'right', fontWeight: 'bold' }} />
        <Column footer={formatCurrency(totalSpendingAll)} footerStyle={{ fontWeight: 'bold', textAlign: 'right' }} />
        <Column footer="" colSpan={2} />
      </Row>
    </ColumnGroup>
  );

  const onLazyLoad = (e: any) => {
    const newPage = typeof e.page === 'number' ? e.page + 1 : page;
    setFirst(e.first);
    setRows(e.rows);
    setPage(newPage);
    if (e.sortField) setSortField(e.sortField);
    if (e.sortOrder) setSortOrder(e.sortOrder === 1 ? 'asc' : 'desc');
  };

  const chartSegmentData = {
    labels: segmentData.map((s) => (s.name || 'Individual').toUpperCase()),
    datasets: [{ data: segmentData.map((s) => s.count || 0), backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'] }]
  };

  const chartOriginData = {
    labels: originData.map((o) => o.name || 'Indonesia'),
    datasets: [{ label: 'Jumlah Tamu', data: originData.map((o) => o.count || 0), backgroundColor: '#3B82F6' }]
  };

  return (
    <div className="p-0">
      <Toast ref={toast} position="top-right" />

      {/* Judul Laporan */}
      <div className="flex justify-content-between items-start mb-5">
        <div className="flex flex-column">
          <h3 className="text-2xl font-semibold flex align-items-center gap-2">
            <i className="pi pi-cog text-blue-600 text-3xl"></i>Laporan Operasional Tamu & CRM
          </h3>
          <p className="text-gray-500">
            Analisis data tamu hotel, status VIP & blacklist, distribusi segmen, performansi lifetime spending, dan monitoring reservasi tamu.
          </p>
        </div>
      </div>

      {/* Widget Ringkasan Finansial Modern (Matching Laporan Operasional Service Template) */}
      <div className="grid mb-2">
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="surface-card border-round-xl border-1 surface-border p-3 flex align-items-center justify-content-between h-full hover:shadow-2 transition-duration-150">
            <div className="flex flex-column gap-1">
              <span className="text-sm font-bold text-500 uppercase tracking-wider">Total Profil Tamu</span>
              <span className="text-xl font-black text-blue-700">{summary?.total_guests || 0}</span>
            </div>
            <div className="p-3 bg-blue-50 border-round-lg">
              <i className="pi pi-box text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="col-12 sm:col-6 lg:col-3">
          <div className="surface-card border-round-xl border-1 surface-border p-3 flex align-items-center justify-content-between h-full hover:shadow-2 transition-duration-150">
            <div className="flex flex-column gap-1">
              <span className="text-sm font-bold text-500 uppercase tracking-wider">Tamu Baru Bulan Ini</span>
              <span className="text-xl font-black text-purple-700">+{summary?.new_guests_this_month || 0}</span>
            </div>
            <div className="p-3 bg-purple-50 border-round-lg">
              <i className="pi pi-briefcase text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="col-12 sm:col-6 lg:col-3">
          <div className="surface-card border-round-xl border-1 surface-border p-3 flex align-items-center justify-content-between h-full hover:shadow-2 transition-duration-150">
            <div className="flex flex-column gap-1">
              <span className="text-sm font-bold text-500 uppercase tracking-wider">Repeat Guest Ratio</span>
              <span className="text-xl font-black text-red-600">{summary?.repeat_guest_ratio || 0}%</span>
            </div>
            <div className="p-3 bg-red-50 border-round-lg">
              <i className="pi pi-percentage text-red-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="col-12 sm:col-6 lg:col-3">
          <div className="surface-card border-round-xl border-1 surface-border p-3 flex align-items-center justify-content-between h-full hover:shadow-2 transition-duration-150">
            <div className="flex flex-column gap-1">
              <span className="text-sm font-bold text-500 uppercase tracking-wider">Tamu In-House Saat Ini</span>
              <span className="text-xl font-black text-green-600">{summary?.in_house_guests || 0} orang</span>
            </div>
            <div className="p-3 bg-green-50 border-round-lg">
              <i className="pi pi-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Card Utama */}
      <div className="card">
        {/* Tombol Aksi Utama */}
        <div className="flex flex-row flex-wrap items-center gap-2 mb-4">
          <Button
            size="small"
            label="Cetak Laporan"
            icon="pi pi-print"
            outlined
            onClick={async () => {
              try {
                const res = await postData(apiGuestExport, {});
                showSuccess(toast, `Export Laporan Tamu (${res?.data?.data?.length || 0} data) berhasil`);
              } catch (err) {
                console.error(err);
              }
            }}
          />
          <Divider layout="vertical" />
          <Button
            size="small"
            label="Refresh"
            icon="pi pi-refresh"
            outlined
            onClick={() => {
              fetchSummary();
              fetchAnalytics();
              fetchTableData();
            }}
            loading={load}
          />
        </div>

        {/* Legend Box Status */}
        <div className="flex flex-wrap align-items-center gap-4 mb-3 p-3 surface-50 border-round-xl border-1 surface-border">
          <span className="flex align-items-center text-xs font-bold text-500 uppercase tracking-wider mr-2">
            <i className="pi pi-info-circle mr-2"></i> KETERANGAN STATUS TAMU:
          </span>
          <div className="flex align-items-center gap-2">
            <span className="block bg-gray-500 border-round-sm" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-xs font-semibold text-700">Regular</span>
          </div>
          <div className="flex align-items-center gap-2">
            <span className="block bg-blue-500 border-round-sm" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-xs font-semibold text-700">VIP</span>
          </div>
          <div className="flex align-items-center gap-2">
            <span className="block bg-yellow-500 border-round-sm" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-xs font-semibold text-700">VVIP</span>
          </div>
          <div className="flex align-items-center gap-2">
            <span className="block bg-purple-500 border-round-sm" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-xs font-semibold text-700">Owner Guest</span>
          </div>
          <div className="flex align-items-center gap-2">
            <span className="block bg-red-500 border-round-sm" style={{ width: '12px', height: '12px' }}></span>
            <span className="text-xs font-semibold text-700">Batal / Blacklist</span>
          </div>
        </div>

        {/* TabView: Laporan Tabel & Grafik Analitik */}
        <TabView>
          <TabPanel header="Data Laporan Operasional Tamu" leftIcon="pi pi-table mr-2">
            <DataTable
              value={data}
              scrollable
              lazy
              paginator
              first={first}
              rows={rows}
              totalRecords={totalData}
              onPage={onLazyLoad}
              onSort={onLazyLoad}
              sortField={sortField}
              sortOrder={sortOrder === 'asc' ? 1 : -1}
              header={headerTemplate}
              loading={load}
              dataKey="id"
              emptyMessage="Data Laporan Operasional Tamu Tidak Ditemukan"
              rowsPerPageOptions={[10, 25, 50, 100]}
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
              footerColumnGroup={footerGroup}
            >
              <Column header="" align="center" body={statusIndicatorTemplate} headerStyle={{ width: '3.5rem' }} />
              <Column field="kode_tamu" header="Kode Tamu" body={guestCodeTemplate} style={{ minWidth: '12rem' }} sortable />
              <Column field="created_at" header="Tanggal Masuk" body={(r) => !r.created_at ? '-' : formatDateSystem(r.created_at, 'yyyy-MM-dd HH:mm')} align="center" style={{ minWidth: '11rem' }} sortable />
              <Column field="full_name" header="Pelanggan / Tamu" body={(r) => <span className="font-semibold">{r.full_name || '-'}</span>} style={{ minWidth: '12rem' }} sortable />
              <Column field="id_number" header="Identitas" body={(r) => `${(r.id_type || 'KTP').toUpperCase()}: ${r.id_number || '-'}`} style={{ minWidth: '12rem' }} sortable />
              <Column field="phone" header="No. HP" body={(r) => r.phone || '-'} style={{ minWidth: '10rem' }} sortable />
              <Column field="nationality" header="Kewarganegaraan" body={(r) => r.nationality || 'Indonesia'} style={{ minWidth: '11rem' }} sortable />
              <Column field="guest_type" header="Segmen" body={(r) => (r.guest_type || 'individual').toUpperCase()} style={{ minWidth: '10rem' }} sortable />
              <Column field="total_stay" header="Total Stay" align="center" style={{ minWidth: '8rem' }} sortable />
              <Column field="total_spending" header="Total Spending" body={(r) => formatCurrency(Number(r.total_spending || 0))} align="right" style={{ minWidth: '11rem' }} sortable />
              <Column
                field="is_blacklisted"
                header="Status VIP"
                align="center"
                style={{ minWidth: '10rem' }}
                sortable
                body={(r) => (
                  <Tag
                    severity={r.is_blacklisted === 1 ? 'danger' : r.vip_level && r.vip_level !== 'none' ? 'warning' : 'info'}
                    value={r.is_blacklisted === 1 ? 'BLACKLIST' : (r.vip_level || 'REGULAR').toUpperCase()}
                  />
                )}
              />
            </DataTable>
          </TabPanel>

          <TabPanel header="Grafik Analitik & CRM" leftIcon="pi pi-chart-bar mr-2">
            <div className="grid mb-4 pt-3">
              <div className="col-12 md:col-6">
                <div className="card p-3 surface-card border-1 surface-border">
                  <h5 className="font-bold text-lg mb-3">Komposisi Segmen Pasar Tamu</h5>
                  <div className="flex justify-content-center">
                    <Chart type="doughnut" data={chartSegmentData} className="w-full md:w-20rem" />
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="card p-3 surface-card border-1 surface-border">
                  <h5 className="font-bold text-lg mb-3">Distribusi Asal Kewarganegaraan</h5>
                  <Chart type="bar" data={chartOriginData} />
                </div>
              </div>
            </div>

            <div className="grid">
              <div className="col-12 md:col-6">
                <h5 className="font-bold text-base mb-2">Top 20 Lifetime Spenders</h5>
                <DataTable value={topSpenders} emptyMessage="Tidak ada data">
                  <Column field="kode_tamu" header="Kode" />
                  <Column field="full_name" header="Nama Lengkap" className="font-bold" />
                  <Column field="total_spending" header="Total Spending" body={(r) => formatCurrency(Number(r.total_spending || 0))} align="right" />
                </DataTable>
              </div>
              <div className="col-12 md:col-6">
                <h5 className="font-bold text-base mb-2">Tamu Dorman &gt; 12 Bulan (Win-Back)</h5>
                <DataTable value={dormantList} emptyMessage="Tidak ada tamu dorman">
                  <Column field="kode_tamu" header="Kode" />
                  <Column field="full_name" header="Nama Tamu" className="font-bold" />
                  <Column field="phone" header="No HP" />
                </DataTable>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
}
