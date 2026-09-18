'use client';

import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import postData from '@/lib/axios/postData';
import { apiStayHistory } from '../endpoints';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface DetailProps {
  state: any;
  setState: any;
}

export default function Detail({ state, setState }: DetailProps) {
  const guest = state.selectedGuest;
  const [stayHistory, setStayHistory] = useState<any[]>([]);
  const [staySummary, setStaySummary] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (state.detail && guest?.kode_tamu) {
      fetchStayHistory(guest.kode_tamu);
    }
  }, [state.detail, guest?.kode_tamu]);

  const fetchStayHistory = async (kode_tamu: string) => {
    setLoadingHistory(true);
    try {
      const res = await postData(apiStayHistory, { kode_tamu });
      if (res?.data?.data) {
        setStayHistory(res.data.data.history || []);
        setStaySummary(res.data.data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!guest) return null;

  return (
    <Dialog
      visible={state.detail}
      header={`Detail Profil Tamu: ${guest.full_name} (${guest.kode_tamu})`}
      style={{ width: '85vw', maxWidth: '1000px' }}
      modal
      onHide={() => setState((p: any) => ({ ...p, detail: false, selectedGuest: null }))}
      footer={<Button label="Tutup" icon="pi pi-times" onClick={() => setState((p: any) => ({ ...p, detail: false, selectedGuest: null }))} />}
    >
      <div className="flex flex-wrap align-items-center justify-content-between p-3 bg-blue-50 border-round mb-4">
        <div className="flex align-items-center gap-3">
          <div className="w-4rem h-4rem border-circle bg-blue-500 text-white flex align-items-center justify-content-center text-2xl font-bold">
            {guest.full_name?.charAt(0)?.toUpperCase() || 'G'}
          </div>
          <div>
            <h4 className="m-0 text-xl font-bold flex align-items-center gap-2">
              {guest.title} {guest.full_name}
              {guest.vip_level && guest.vip_level !== 'none' && <Tag value={guest.vip_level.toUpperCase()} severity="warning" />}
              {guest.is_blacklisted === 1 && <Tag value="BLACKLIST" severity="danger" />}
            </h4>
            <p className="m-0 text-gray-600 text-sm">{guest.guest_type?.toUpperCase()} | HP: {guest.phone} | Email: {guest.email || '-'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Tag value={`Kelengkapam: ${guest.completeness_score || 0}%`} severity={guest.completeness_score >= 80 ? 'success' : 'warning'} />
        </div>
      </div>

      <TabView>
        {/* Tab 1: Ringkasan & Profil */}
        <TabPanel header="Profil & Identitas" leftIcon="pi pi-user mr-2">
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="card p-3 surface-100">
                <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-2">Informasi Identitas</h5>
                <p><strong>Tipe Identitas:</strong> {(guest.id_type || 'KTP').toUpperCase()}</p>
                <p><strong>Nomor Identitas:</strong> {guest.id_number || guest.id_number_masked || '-'}</p>
                <p><strong>Kewarganegaraan:</strong> {guest.nationality || 'Indonesia'}</p>
                <p><strong>Jenis Kelamin:</strong> {guest.gender === 'L' ? 'Laki-laki' : guest.gender === 'P' ? 'Perempuan' : '-'}</p>
                <p><strong>Tanggal Lahir:</strong> {guest.birth_date ? formatDateSystem(guest.birth_date) : '-'}</p>
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="card p-3 surface-100">
                <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-2">Klasifikasi & Perusahaan</h5>
                <p><strong>Jenis Tamu:</strong> {guest.guest_type?.toUpperCase()}</p>
                <p><strong>Tingkat VIP:</strong> {guest.vip_level?.toUpperCase()}</p>
                <p><strong>Perusahaan:</strong> {guest.company_name || '-'}</p>
                <p><strong>Loyalty Tier:</strong> {guest.loyalty_tier || '-'}</p>
                <p><strong>Consent Marketing:</strong> {guest.consent_marketing === 1 ? 'Ya (Setuju)' : 'Tidak'}</p>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Tab 2: Riwayat Menginap */}
        <TabPanel header="Riwayat Menginap" leftIcon="pi pi-calendar mr-2">
          {staySummary && (
            <div className="grid mb-3 text-center">
              <div className="col-6 md:col-3">
                <div className="surface-card p-3 border-round border-1 surface-border">
                  <div className="text-gray-500 text-sm mb-1">Total Kunjungan</div>
                  <div className="text-2xl font-bold text-blue-600">{staySummary.total_stay || 0} kali</div>
                </div>
              </div>
              <div className="col-6 md:col-3">
                <div className="surface-card p-3 border-round border-1 surface-border">
                  <div className="text-gray-500 text-sm mb-1">Total Malam</div>
                  <div className="text-2xl font-bold text-green-600">{staySummary.total_nights || 0} malam</div>
                </div>
              </div>
              <div className="col-6 md:col-3">
                <div className="surface-card p-3 border-round border-1 surface-border">
                  <div className="text-gray-500 text-sm mb-1">Total Spending</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(staySummary.total_spending || 0)}
                  </div>
                </div>
              </div>
              <div className="col-6 md:col-3">
                <div className="surface-card p-3 border-round border-1 surface-border">
                  <div className="text-gray-500 text-sm mb-1">Rata-rata ADR</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(staySummary.avg_adr || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DataTable value={stayHistory} loading={loadingHistory} emptyMessage="Belum ada riwayat menginap">
            <Column field="kode_reservasi" header="No. Reservasi" />
            <Column field="room_type_name" header="Tipe Kamar" />
            <Column field="room_name" header="No. Kamar" />
            <Column field="check_in_date" header="Check In" body={(r) => formatDateSystem(r.check_in_date)} />
            <Column field="check_out_date" header="Check Out" body={(r) => formatDateSystem(r.check_out_date)} />
            <Column field="nights" header="Malam" align="center" />
            <Column field="folio_amount" header="Total Biaya" body={(r) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(r.folio_amount || 0)} align="right" />
            <Column field="reservation_status" header="Status" body={(r) => <Tag value={r.reservation_status?.toUpperCase()} severity={r.reservation_status === 'checked_in' ? 'success' : 'info'} />} align="center" />
          </DataTable>
        </TabPanel>

        {/* Tab 3: Preferensi & Catatan Internal */}
        <TabPanel header="Preferensi & Catatan" leftIcon="pi pi-sliders-h mr-2">
          <div className="card p-3">
            <h5 className="font-bold border-bottom-1 surface-border pb-2 mb-2">Preferensi Kamar</h5>
            <p><strong>Lantai:</strong> {guest.preferences_parsed?.floor || '-'}</p>
            <p><strong>Kasur:</strong> {guest.preferences_parsed?.bed_type || '-'}</p>
            <p><strong>Smoking Room:</strong> {guest.preferences_parsed?.smoking ? 'Ya' : 'Tidak'}</p>
            <p><strong>Alergi:</strong> {guest.preferences_parsed?.allergy || '-'}</p>
          </div>
          <div className="card p-3 mt-3 surface-100">
            <h5 className="font-bold text-red-600 border-bottom-1 surface-border pb-2 mb-2">Catatan Rahasia Internal Hotel</h5>
            <p className="m-0 text-gray-800">{guest.internal_notes || 'Tidak ada catatan khusus.'}</p>
          </div>
        </TabPanel>
      </TabView>
    </Dialog>
  );
}
