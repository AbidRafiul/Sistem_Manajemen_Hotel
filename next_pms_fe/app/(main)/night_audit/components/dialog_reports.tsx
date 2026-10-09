'use client';

import React, { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { NightAuditRun } from './types';
import { formatCurrency } from './dialog_audit_detail';

interface DialogReportsProps {
  visible: boolean;
  onHide: () => void;
  run: NightAuditRun | null;
  snapshots: any;
  loading: boolean;
}

export const DialogReports: React.FC<DialogReportsProps> = ({
  visible,
  onHide,
  run,
  snapshots,
  loading
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!run) return null;

  // Mendukung key format report_snapshots dari backend
  const dailyRevenue = snapshots?.daily_revenue;
  const trialBalance = snapshots?.trial_balance;
  const inHouseGuestList = snapshots?.inhouse_guest_list || snapshots?.in_house_guests?.guest_list || [];
  const movement = snapshots?.guest_movement || snapshots?.movement;
  const roomStatus = snapshots?.room_status_housekeeping || [];
  const exceptions = snapshots?.exception_report || snapshots?.exceptions;
  const depositLedger = snapshots?.deposit_and_ledger;

  const handlePrint = () => {
    window.print();
  };

  // KPI Perhitungan & Fallbacks
  const occupancyPct = dailyRevenue?.occupancy_percentage ?? dailyRevenue?.kpi?.occupancy_rate_percent ?? 0;
  const occupiedRooms = dailyRevenue?.occupied_rooms ?? dailyRevenue?.kpi?.rooms_in_house ?? 0;
  const totalCapacity = dailyRevenue?.total_rooms_capacity ?? dailyRevenue?.kpi?.total_rooms ?? 0;
  const adrVal = dailyRevenue?.adr ?? dailyRevenue?.kpi?.adr ?? 0;
  const revparVal = dailyRevenue?.revpar ?? dailyRevenue?.kpi?.revpar ?? 0;
  const grossRevVal = dailyRevenue?.revenue?.grand_total_revenue ?? dailyRevenue?.kpi?.total_gross_revenue ?? 0;
  const roomRevVal = dailyRevenue?.revenue?.room_revenue ?? dailyRevenue?.kpi?.total_room_revenue ?? 0;
  const taxVal = dailyRevenue?.revenue?.tax_amount ?? dailyRevenue?.kpi?.total_tax ?? 0;
  const serviceVal = dailyRevenue?.revenue?.service_charge_amount ?? dailyRevenue?.kpi?.total_service ?? 0;
  const fbVal = dailyRevenue?.revenue?.fb_revenue ?? 0;
  const otherVal = dailyRevenue?.revenue?.other_revenue ?? 0;

  // Nilai Neraca Saldo (Trial Balance)
  const totalDebit = trialBalance?.total_debit_charges ?? trialBalance?.ledger_summary?.total_debit ?? 0;
  const totalCredit = trialBalance?.total_credit_payments ?? trialBalance?.ledger_summary?.total_credit ?? 0;
  const netDiff = trialBalance?.net_difference ?? (Number(totalDebit) - Number(totalCredit));
  const paymentsByMethod = trialBalance?.payments_by_method || {};

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center justify-content-between w-full pr-3">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-file-pdf text-primary text-2xl" />
            <div>
              <div className="text-xl font-bold text-900">
                Snapshot Laporan Harian Night Audit: {run.kode_night_audit}
              </div>
              <div className="text-xs text-500">
                Tanggal Operasional: <strong>{run.business_date}</strong> &bull; Waktu Selesai:{' '}
                {run.completed_at || run.started_at || '-'}
              </div>
            </div>
          </div>
          <Button
            label="Cetak Laporan"
            icon="pi pi-print"
            size="small"
            className="p-button-outlined"
            onClick={handlePrint}
          />
        </div>
      }
      style={{ width: '92vw', maxWidth: '1200px' }}
      modal
    >
      {loading ? (
        <div className="flex flex-column align-items-center justify-content-center py-6">
          <i className="pi pi-spin pi-spinner text-primary text-4xl mb-3" />
          <span className="text-600 font-medium">Memuat data laporan snapshot...</span>
        </div>
      ) : (
        <div ref={printRef} className="py-2">
          <TabView>
            {/* TAB 1: PENDAPATAN HARIAN & KPI */}
            <TabPanel header="Pendapatan Harian & KPI (Daily Revenue)" leftIcon="pi pi-chart-line mr-2">
              {dailyRevenue ? (
                <div>
                  <div className="grid mb-4">
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round shadow-1 border-left-3 border-primary">
                        <span className="text-500 text-xs font-semibold block mb-1">
                          TINGKAT KETERISIAN (Occupancy Rate)
                        </span>
                        <span className="text-3xl font-bold text-900">
                          {occupancyPct}%
                        </span>
                        <span className="text-xs text-500 block mt-1">
                          {occupiedRooms} dari {totalCapacity} kamar terisi
                        </span>
                      </div>
                    </div>
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round shadow-1 border-left-3 border-teal-500">
                        <span className="text-500 text-xs font-semibold block mb-1">
                          TARIF RATA-RATA KAMAR (ADR)
                        </span>
                        <span className="text-2xl font-bold text-teal-700">
                          {formatCurrency(adrVal)}
                        </span>
                        <span className="text-xs text-500 block mt-1">
                          Rata-rata harga sewa per kamar terjual
                        </span>
                      </div>
                    </div>
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round shadow-1 border-left-3 border-purple-500">
                        <span className="text-500 text-xs font-semibold block mb-1">
                          REVPAR (Revenue Per Available Room)
                        </span>
                        <span className="text-2xl font-bold text-purple-700">
                          {formatCurrency(revparVal)}
                        </span>
                        <span className="text-xs text-500 block mt-1">
                          Pendapatan rata-rata per total kapasitas kamar
                        </span>
                      </div>
                    </div>
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round shadow-1 border-left-3 border-green-500">
                        <span className="text-500 text-xs font-semibold block mb-1">
                          TOTAL PENDAPATAN KOTOR (Gross Revenue)
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          {formatCurrency(grossRevVal)}
                        </span>
                        <span className="text-xs text-500 block mt-1">
                          Kamar ({formatCurrency(roomRevVal)}) + Pajak & Service
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Rincian Pendapatan */}
                  <h4 className="text-base font-bold text-900 mb-2">Rincian Pendapatan Hari Ini</h4>
                  <div className="surface-card p-3 border-round border-1 surface-border mb-3">
                    <div className="flex justify-content-between py-2 border-bottom-1 surface-border">
                      <span className="text-sm text-700">Pendapatan Sewa Kamar Bersih (Net Room Revenue)</span>
                      <span className="font-semibold text-sm">{formatCurrency(roomRevVal)}</span>
                    </div>
                    <div className="flex justify-content-between py-2 border-bottom-1 surface-border">
                      <span className="text-sm text-700">Pajak Hotel (Room Tax 10%)</span>
                      <span className="font-semibold text-sm">{formatCurrency(taxVal)}</span>
                    </div>
                    <div className="flex justify-content-between py-2 border-bottom-1 surface-border">
                      <span className="text-sm text-700">Biaya Layanan (Service Charge 5%)</span>
                      <span className="font-semibold text-sm">{formatCurrency(serviceVal)}</span>
                    </div>
                    {Number(fbVal) > 0 && (
                      <div className="flex justify-content-between py-2 border-bottom-1 surface-border">
                        <span className="text-sm text-700">Restoran / Makanan & Minuman (F&B)</span>
                        <span className="font-semibold text-sm">{formatCurrency(fbVal)}</span>
                      </div>
                    )}
                    {Number(otherVal) > 0 && (
                      <div className="flex justify-content-between py-2 border-bottom-1 surface-border">
                        <span className="text-sm text-700">Pendapatan Lain-lain (Other Revenue)</span>
                        <span className="font-semibold text-sm">{formatCurrency(otherVal)}</span>
                      </div>
                    )}
                    <div className="flex justify-content-between py-2 font-bold text-base text-primary mt-1">
                      <span>Total Pendapatan Kotor Hari Ini (Gross Revenue)</span>
                      <span>{formatCurrency(grossRevVal)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-500 text-center py-4">Data Pendapatan Harian tidak tersedia.</div>
              )}
            </TabPanel>

            {/* TAB 2: NERACA SALDO & REKONSILIASI KASIR */}
            <TabPanel header="Neraca Saldo & Rekonsiliasi Kasir (Trial Balance)" leftIcon="pi pi-calculator mr-2">
              {trialBalance ? (
                <div>
                  <div className="p-3 border-round-xl mb-4 bg-green-50 border-1 border-green-200 flex align-items-center justify-content-between">
                    <div className="flex align-items-center gap-3">
                      <i className="pi pi-check-circle text-green-600 text-3xl" />
                      <div>
                        <div className="font-bold text-base text-green-900">
                          REKONSILIASI KEUANGAN HARIAN TERCATAT
                        </div>
                        <div className="text-xs text-green-700">
                          Total Piutang Tagihan Folio (Debit): {formatCurrency(totalDebit)} &bull; Total Pembayaran Masuk Kasir (Kredit): {formatCurrency(totalCredit)}
                        </div>
                      </div>
                    </div>
                    <Tag severity="success" value="TEREKONSILIASI" rounded />
                  </div>

                  <div className="grid">
                    {/* Sisi Debit */}
                    <div className="col-12 md:col-6">
                      <div className="surface-card p-3 border-round border-1 surface-border h-full">
                        <div className="text-sm font-bold text-900 mb-3 flex align-items-center justify-content-between">
                          <span>SISI DEBIT (Beban Piutang Baru ke Folio Tamu)</span>
                          <Tag severity="info" value="DEBIT" />
                        </div>
                        <div className="flex justify-content-between py-2 border-bottom-1 surface-border">
                          <span className="text-xs text-600">Total Tarif Kamar Diposting Hari Ini</span>
                          <span className="font-semibold text-sm">{formatCurrency(roomRevVal)}</span>
                        </div>
                        <div className="flex justify-content-between py-2 border-bottom-1 surface-border">
                          <span className="text-xs text-600">Pajak Hotel & Biaya Layanan Terhitung</span>
                          <span className="font-semibold text-sm">{formatCurrency(Number(taxVal) + Number(serviceVal))}</span>
                        </div>
                        <div className="flex justify-content-between py-3 font-bold text-base text-900 mt-2 bg-blue-50 px-2 border-round">
                          <span>TOTAL PIUTANG TAGIHAN BARU (DEBIT)</span>
                          <span>{formatCurrency(totalDebit)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sisi Kredit */}
                    <div className="col-12 md:col-6">
                      <div className="surface-card p-3 border-round border-1 surface-border h-full">
                        <div className="text-sm font-bold text-900 mb-3 flex align-items-center justify-content-between">
                          <span>SISI KREDIT (Pembayaran Diterima Kasir)</span>
                          <Tag severity="success" value="KREDIT" />
                        </div>
                        {Object.keys(paymentsByMethod).length > 0 ? (
                          Object.entries(paymentsByMethod).map(([method, amt], idx) => {
                            let methodLabel = method;
                            if (method === 'cash') methodLabel = 'Uang Tunai (Cash)';
                            else if (method === 'card') methodLabel = 'Kartu Debit / Kredit (Card)';
                            else if (method === 'transfer') methodLabel = 'Transfer Bank';
                            else if (method === 'qris') methodLabel = 'QRIS / Dompet Digital';
                            return (
                              <div key={idx} className="flex justify-content-between py-2 border-bottom-1 surface-border">
                                <span className="text-xs text-600">Metode {methodLabel}</span>
                                <span className="font-semibold text-sm">{formatCurrency(amt as number)}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-500 py-2 border-bottom-1 surface-border">
                            Belum ada penerimaan pembayaran kasir pada tanggal audit ini.
                          </div>
                        )}
                        <div className="flex justify-content-between py-3 font-bold text-base text-900 mt-2 bg-green-50 px-2 border-round">
                          <span>TOTAL PEMBAYARAN KASIR (KREDIT)</span>
                          <span>{formatCurrency(totalCredit)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Saldo Piutang Berjalan */}
                  <div className="mt-3 surface-card p-3 border-round border-1 surface-border flex justify-content-between align-items-center">
                    <div>
                      <div className="text-xs text-500 font-bold uppercase">POSISI PIUTANG TAMU MENGINAP (Guest Ledger Balance)</div>
                      <div className="text-xs text-700 mt-1">Sisa akumulasi tagihan menginap yang akan diselesaikan oleh tamu saat Checkout.</div>
                    </div>
                    <div className="text-xl font-bold text-900">{formatCurrency(netDiff)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-500 text-center py-4">Data Neraca Saldo tidak tersedia.</div>
              )}
            </TabPanel>

            {/* TAB 3: DAFTAR TAMU MENGINAP */}
            <TabPanel header="Daftar Tamu Menginap (In-House Guests)" leftIcon="pi pi-users mr-2">
              <div>
                <div className="text-xs text-500 mb-2 font-semibold">
                  Total Tamu Menginap saat Penutupan Hari: <strong>{inHouseGuestList.length}</strong> Kamar / Tamu
                </div>
                <DataTable
                  value={inHouseGuestList}
                  className="p-datatable-sm"
                  paginator
                  rows={10}
                  showGridlines
                  stripedRows
                  emptyMessage="Tidak ada data tamu menginap pada saat audit."
                >
                  <Column
                    field="nomor_kamar"
                    header="No. Kamar"
                    sortable
                    body={(r) => <span className="font-bold text-primary">{r.nomor_kamar || r.kode_kamar || '-'}</span>}
                    style={{ width: '100px' }}
                  />
                  <Column field="guest_name" header="Nama Tamu" sortable />
                  <Column
                    field="kode_reservasi"
                    header="No. Reservasi"
                    body={(r) => <span className="font-mono text-xs text-600">{r.kode_reservasi}</span>}
                    style={{ width: '180px' }}
                  />
                  <Column
                    field="check_in_date"
                    header="Tgl. Check-In"
                    style={{ width: '125px', textAlign: 'center' }}
                    align="center"
                    alignHeader="center"
                  />
                  <Column
                    field="check_out_date"
                    header="Tgl. Check-Out"
                    style={{ width: '125px', textAlign: 'center' }}
                    align="center"
                    alignHeader="center"
                  />
                  <Column
                    field="rate_per_night"
                    header="Tarif Kamar / Malam"
                    align="right"
                    alignHeader="right"
                    headerStyle={{ textAlign: 'right' }}
                    body={(r) => <span className="font-medium text-900">{formatCurrency(r.rate_per_night)}</span>}
                    style={{ width: '170px' }}
                  />
                  <Column
                    field="folio_grand_total"
                    header="Saldo Tagihan Folio"
                    align="right"
                    alignHeader="right"
                    headerStyle={{ textAlign: 'right' }}
                    body={(r) => <span className="font-bold text-primary">{formatCurrency(r.folio_grand_total || r.current_folio_balance)}</span>}
                    style={{ width: '180px' }}
                  />
                </DataTable>
              </div>
            </TabPanel>

            {/* TAB 4: PERGERAKAN TAMU */}
            <TabPanel header="Pergerakan Tamu (Guest Movement)" leftIcon="pi pi-arrows-h mr-2">
              {movement ? (
                <div>
                  <div className="grid">
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round border-1 surface-border text-center">
                        <span className="text-xs text-500 block font-semibold">KEDATANGAN HARI INI (Arrivals)</span>
                        <span className="text-3xl font-bold text-blue-600 block mt-1">
                          {movement.total_arrivals ?? movement.summary?.arrivals_count ?? 0}
                        </span>
                        <span className="text-xs text-400 block mt-1">Tamu yang tiba dan melakukan check-in</span>
                      </div>
                    </div>
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round border-1 surface-border text-center">
                        <span className="text-xs text-500 block font-semibold">KEPULANGAN HARI INI (Departures)</span>
                        <span className="text-3xl font-bold text-orange-600 block mt-1">
                          {movement.total_departures ?? movement.summary?.departures_count ?? 0}
                        </span>
                        <span className="text-xs text-400 block mt-1">Tamu yang menyelesaikan checkout</span>
                      </div>
                    </div>
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round border-1 surface-border text-center">
                        <span className="text-xs text-500 block font-semibold">LANJUT MENGINAP (Stayover)</span>
                        <span className="text-3xl font-bold text-green-600 block mt-1">
                          {occupiedRooms}
                        </span>
                        <span className="text-xs text-400 block mt-1">Tamu yang masih melanjutkan inap</span>
                      </div>
                    </div>
                    <div className="col-12 sm:col-6 md:col-3">
                      <div className="surface-card p-3 border-round border-1 surface-border text-center">
                        <span className="text-xs text-500 block font-semibold">TIDAK HADIR RESMI (No-Show)</span>
                        <span className="text-3xl font-bold text-red-600 block mt-1">
                          {movement.total_noshow ?? movement.summary?.no_shows_count ?? 0}
                        </span>
                        <span className="text-xs text-400 block mt-1">Reservasi yang ditandai tidak hadir</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-500 text-center py-4">Data Pergerakan Tamu tidak tersedia.</div>
              )}
            </TabPanel>

            {/* TAB 5: STATUS KAMAR & TATA GRAHA */}
            <TabPanel header="Status Kamar & Tata Graha (Housekeeping)" leftIcon="pi pi-home mr-2">
              <div>
                <h4 className="text-base font-bold text-900 mb-2">Potret Status Kamar Saat Penutupan Hari</h4>
                <DataTable
                  value={roomStatus}
                  className="p-datatable-sm"
                  emptyMessage="Tidak ada data status kamar."
                >
                  <Column
                    field="occupancy_status"
                    header="Status Keterisian (Occupancy)"
                    body={(r) => {
                      const isOccupied = r.occupancy_status === 'occupied';
                      return (
                        <Tag
                          severity={isOccupied ? 'danger' : 'success'}
                          value={isOccupied ? 'Terisi (Occupied)' : 'Kosong (Vacant)'}
                          rounded
                        />
                      );
                    }}
                  />
                  <Column
                    field="housekeeping_status"
                    header="Status Kebersihan (Housekeeping)"
                    body={(r) => {
                      const status = r.housekeeping_status;
                      const isClean = status === 'clean';
                      let label = 'Bersih (Clean)';
                      let sev: 'info' | 'warning' | 'danger' = 'info';

                      if (status === 'dirty') {
                        label = 'Kotor (Dirty)';
                        sev = 'warning';
                      } else if (status === 'out_of_order') {
                        label = 'Dalam Perbaikan (Out of Order)';
                        sev = 'danger';
                      } else if (status === 'inspecting') {
                        label = 'Sedang Diperiksa (Inspecting)';
                        sev = 'info';
                      }

                      return (
                        <Tag
                          severity={sev}
                          value={label}
                        />
                      );
                    }}
                  />
                  <Column
                    field="count"
                    header="Jumlah Kamar"
                    style={{ textAlign: 'center', width: '150px', fontWeight: 'bold' }}
                  />
                </DataTable>
              </div>
            </TabPanel>

            {/* TAB 6: BUKU BESAR PIUTANG & DEPOSIT */}
            {depositLedger && (
              <TabPanel header="Buku Besar Piutang & Deposit (Ledgers)" leftIcon="pi pi-book mr-2">
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <div className="surface-card p-3 border-round border-1 surface-border">
                      <span className="text-xs text-500 block font-semibold">BUKU BESAR TAMU INDIVIDU (Guest Ledger)</span>
                      <span className="text-xl font-bold text-900 block mt-1">
                        {formatCurrency(depositLedger.guest_ledger_total)}
                      </span>
                      <span className="text-xs text-400 block mt-1">Akumulasi tagihan tamu menginap individu</span>
                    </div>
                  </div>
                  <div className="col-12 md:col-4">
                    <div className="surface-card p-3 border-round border-1 surface-border">
                      <span className="text-xs text-500 block font-semibold">BUKU BESAR PERUSAHAAN (City Ledger)</span>
                      <span className="text-xl font-bold text-900 block mt-1">
                        {formatCurrency(depositLedger.city_ledger_total)}
                      </span>
                      <span className="text-xs text-400 block mt-1">Akumulasi tagihan korporasi atau travel agent</span>
                    </div>
                  </div>
                  <div className="col-12 md:col-4">
                    <div className="surface-card p-3 border-round border-1 surface-border">
                      <span className="text-xs text-500 block font-semibold">TOTAL SELURUH PIUTANG TERBUKA (Open Receivables)</span>
                      <span className="text-xl font-bold text-primary block mt-1">
                        {formatCurrency(depositLedger.total_open_receivables)}
                      </span>
                      <span className="text-xs text-400 block mt-1">Total seluruh piutang hotel yang belum lunas</span>
                    </div>
                  </div>
                </div>
              </TabPanel>
            )}

            {/* TAB 7: CATATAN PENGECUALIAN & MASALAH AUDIT */}
            <TabPanel header="Laporan Pengecualian (Exception Report)" leftIcon="pi pi-exclamation-triangle mr-2">
              <div>
                <div className="mb-4">
                  <h4 className="text-base font-bold text-900 mb-2">Item Kamar Gagal Diposting (Posting Failures)</h4>
                  {exceptions?.failed_items && exceptions.failed_items.length > 0 ? (
                    <DataTable value={exceptions.failed_items} className="p-datatable-sm" emptyMessage="Tidak ada item gagal.">
                      <Column field="kode_kamar" header="Kode Kamar" style={{ width: '150px' }} />
                      <Column field="kode_reservasi_room" header="ID Reservasi Kamar" style={{ width: '220px' }} />
                      <Column
                        field="error_message"
                        header="Penyebab Kendala"
                        body={(r) => <span className="text-red-600 font-semibold">{r.error_message}</span>}
                      />
                    </DataTable>
                  ) : (
                    <div className="surface-card p-3 border-round border-1 surface-border flex align-items-center gap-3 bg-green-50 border-green-200">
                      <i className="pi pi-check-circle text-green-600 text-2xl" />
                      <div>
                        <div className="font-bold text-green-900 text-sm">Seluruh Kamar Berhasil Diposting</div>
                        <div className="text-xs text-green-700">
                          Tidak ada kegagalan posting biaya kamar maupun pajak dan biaya layanan pada audit ini.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-bold text-900 mb-2">Peringatan yang Dikonfirmasi Operator (Acknowledged Warnings)</h4>
                  {exceptions?.acknowledged_warnings && exceptions.acknowledged_warnings.length > 0 ? (
                    <div className="surface-card p-3 border-round border-1 surface-border">
                      <ul className="m-0 pl-3">
                        {exceptions.acknowledged_warnings.map((w: any, idx: number) => (
                          <li key={idx} className="text-sm text-700 mb-2">
                            <strong>{w.code || `Peringatan #${idx + 1}`}:</strong> {w.message || JSON.stringify(w)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="surface-card p-3 border-round border-1 surface-border flex align-items-center gap-3">
                      <i className="pi pi-info-circle text-blue-500 text-2xl" />
                      <div>
                        <div className="font-semibold text-900 text-sm">Tidak Ada Peringatan Khusus</div>
                        <div className="text-xs text-500">
                          Audit dijalankan tanpa adanya peringatan operasional tertunda yang dilewati.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>
      )}
    </Dialog>
  );
};

export default DialogReports;
