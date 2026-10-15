'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { NightAuditRun, NightAuditItem } from './types';

interface DialogAuditDetailProps {
  visible: boolean;
  onHide: () => void;
  run: NightAuditRun | null;
  items: NightAuditItem[];
  loading: boolean;
  onRetryFailed: (runId: string | number) => void;
  onOpenReopenDialog: (run: NightAuditRun) => void;
  retryLoading: boolean;
}

export const formatCurrency = (val: number | string | null | undefined) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(val || 0));
};

export const DialogAuditDetail: React.FC<DialogAuditDetailProps> = ({
  visible,
  onHide,
  run,
  items,
  loading,
  onRetryFailed,
  onOpenReopenDialog,
  retryLoading
}) => {
  const [globalFilter, setGlobalFilter] = useState('');

  if (!run) return null;

  const statusTemplate = (rowData: NightAuditItem) => {
    switch (rowData.status) {
      case 'POSTED':
        return <Tag severity="success" value="POSTED" icon="pi pi-check" rounded />;
      case 'FAILED':
        return <Tag severity="danger" value="FAILED" icon="pi pi-times" rounded />;
      case 'SKIPPED':
        return <Tag severity="warning" value="SKIPPED" icon="pi pi-minus" rounded />;
      default:
        return <Tag severity="info" value={rowData.status} rounded />;
    }
  };

  const hasFailed = items.some((i) => i.status === 'FAILED');

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center justify-content-between w-full pr-3">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-list text-primary text-xl" />
            <div>
              <div className="text-lg font-bold text-900">
                Detail Transaksi Posting: {run.kode_night_audit}
              </div>
              <div className="text-xs text-500">
                Business Date: <strong>{run.business_date}</strong> &bull; Total In-House: {run.total_in_house} Kamar
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {hasFailed && (
              <Button
                label="Retry Failed Items"
                icon="pi pi-refresh"
                severity="warning"
                size="small"
                loading={retryLoading}
                onClick={() => onRetryFailed(run.kode_night_audit)}
              />
            )}
            {run.status === 'completed' && (
              <Button
                label="Reopen Audit"
                icon="pi pi-undo"
                severity="danger"
                outlined
                size="small"
                onClick={() => onOpenReopenDialog(run)}
              />
            )}
          </div>
        </div>
      }
      style={{ width: '92vw', maxWidth: '1100px' }}
      modal
    >
      {/* Summary KPI Cards */}
      <div className="grid mb-3">
        <div className="col-12 md:col-3">
          <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="text-500 text-xs font-semibold">TOTAL KAMAR POSTED</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{run.total_posted}</div>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="text-500 text-xs font-semibold">TOTAL FAILED</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{run.total_failed}</div>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="text-500 text-xs font-semibold">ROOM REVENUE (NET)</div>
            <div className="text-xl font-bold text-900 mt-1">{formatCurrency(run.total_room_revenue)}</div>
          </div>
        </div>
        <div className="col-12 md:col-3">
          <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="text-500 text-xs font-semibold">TOTAL PAJAK & SERVICE</div>
            <div className="text-xl font-bold text-primary mt-1">
              {formatCurrency(Number(run.total_tax) + Number(run.total_service))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="flex justify-content-between align-items-center mb-2">
        <span className="p-input-icon-left w-full md:w-20rem">
          <i className="pi pi-search" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cari kamar / tamu / reservasi..."
            className="w-full p-inputtext-sm"
          />
        </span>
        <div className="text-xs text-500">Menampilkan {items.length} rincian kamar</div>
      </div>

      <DataTable
        value={items}
        loading={loading}
        globalFilter={globalFilter}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 50]}
        showGridlines
        stripedRows
        emptyMessage="Tidak ada data rincian posting untuk audit ini."
        className="p-datatable-sm"
        responsiveLayout="scroll"
      >
        <Column
          field="nomor_kamar"
          header="Kamar"
          sortable
          body={(r) => (
            <div>
              <div className="font-bold text-900">{r.nomor_kamar || r.kode_kamar || '-'}</div>
              <div className="text-xs text-500">{r.nama_tipe_kamar || ''}</div>
            </div>
          )}
          style={{ width: '110px' }}
        />
        <Column
          field="guest_name"
          header="Tamu / Reservasi"
          sortable
          body={(r) => (
            <div>
              <div className="font-semibold text-800">{r.guest_name || '-'}</div>
              <div className="text-xs font-mono text-500">{r.kode_reservation}</div>
            </div>
          )}
        />
        <Column
          field="rate_applied"
          header="Tarif Kamar"
          sortable
          align="right"
          alignHeader="right"
          headerStyle={{ textAlign: 'right' }}
          body={(r) => formatCurrency(r.rate_applied)}
          style={{ width: '150px' }}
        />
        <Column
          field="tax_amount"
          header="Pajak"
          align="right"
          alignHeader="right"
          headerStyle={{ textAlign: 'right' }}
          body={(r) => formatCurrency(r.tax_amount)}
          style={{ width: '130px' }}
        />
        <Column
          field="service_charge_amount"
          header="Service"
          align="right"
          alignHeader="right"
          headerStyle={{ textAlign: 'right' }}
          body={(r) => formatCurrency(r.service_charge_amount)}
          style={{ width: '130px' }}
        />
        <Column
          header="Total Malam Ini"
          align="right"
          alignHeader="right"
          headerStyle={{ textAlign: 'right' }}
          body={(r) => (
            <span className="font-bold text-primary">
              {formatCurrency(
                Number(r.rate_applied) + Number(r.tax_amount) + Number(r.service_charge_amount)
              )}
            </span>
          )}
          style={{ width: '160px' }}
        />
        <Column field="status" header="Status" body={statusTemplate} style={{ width: '110px' }} />
        <Column
          field="error_message"
          header="Catatan / Keterangan"
          body={(r) => (
            <span className={`text-xs ${r.status === 'FAILED' ? 'text-red-600 font-bold' : 'text-500'}`}>
              {r.error_message || '-'}
            </span>
          )}
        />
      </DataTable>
    </Dialog>
  );
};

export default DialogAuditDetail;
