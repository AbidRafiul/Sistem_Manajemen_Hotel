'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { PreCheckResult } from './types';

interface DialogPreCheckProps {
  visible: boolean;
  onHide: () => void;
  preCheckData: PreCheckResult | null;
  loading: boolean;
  acknowledged: boolean;
  setAcknowledged: (val: boolean) => void;
  onProceedToAudit: () => void;
  onRefreshCheck: () => void;
  onMarkNoShow?: (resCode: string) => void;
}

export const DialogPreCheck: React.FC<DialogPreCheckProps> = ({
  visible,
  onHide,
  preCheckData,
  loading,
  acknowledged,
  setAcknowledged,
  onProceedToAudit,
  onRefreshCheck,
  onMarkNoShow
}) => {
  const blockers = preCheckData?.blockers || [];
  const warnings = preCheckData?.warnings || [];
  const hasBlockers = blockers.length > 0;
  const hasWarnings = warnings.length > 0;

  const canExecute = !hasBlockers && (!hasWarnings || acknowledged);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-shield text-primary text-2xl" />
          <div>
            <div className="text-xl font-bold text-900">Pre-Audit System Check</div>
            <div className="text-xs text-500">
              Validasi kesiapan operasional sebelum penutupan hari (Business Date: {preCheckData?.business_date || '-'})
            </div>
          </div>
        </div>
      }
      style={{ width: '90vw', maxWidth: '850px' }}
      modal
      className="p-fluid"
      footer={
        <div className="flex justify-content-between align-items-center w-full pt-2">
          <Button
            label="Refresh Pengecekan"
            icon="pi pi-refresh"
            className="p-button-outlined p-button-secondary"
            onClick={onRefreshCheck}
            loading={loading}
          />
          <div className="flex gap-2">
            <Button
              label="Tutup"
              icon="pi pi-times"
              className="p-button-text p-button-secondary"
              onClick={onHide}
            />
            <Button
              label="Lanjutkan ke Audit"
              icon="pi pi-arrow-right"
              className={hasBlockers ? 'p-button-secondary' : 'p-button-primary font-bold'}
              disabled={!canExecute || loading}
              onClick={onProceedToAudit}
            />
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-column align-items-center justify-content-center py-6">
          <i className="pi pi-spin pi-spinner text-primary text-4xl mb-3" />
          <span className="text-600 font-medium">Sedang memvalidasi sistem operasional hotel...</span>
        </div>
      ) : (
        <div className="flex flex-column gap-3 py-2">
          {/* Status Summary Banner */}
          <div
            className={`p-3 border-round-xl flex align-items-center justify-content-between ${
              hasBlockers
                ? 'bg-red-50 border-1 border-red-200'
                : hasWarnings
                ? 'bg-yellow-50 border-1 border-yellow-200'
                : 'bg-green-50 border-1 border-green-200'
            }`}
          >
            <div className="flex align-items-center gap-3">
              <i
                className={`pi text-2xl ${
                  hasBlockers
                    ? 'pi-times-circle text-red-600'
                    : hasWarnings
                    ? 'pi-exclamation-triangle text-yellow-700'
                    : 'pi-check-circle text-green-600'
                }`}
              />
              <div>
                <div
                  className={`font-bold text-base ${
                    hasBlockers ? 'text-red-900' : hasWarnings ? 'text-yellow-900' : 'text-green-900'
                  }`}
                >
                  {hasBlockers
                    ? 'Terdapat Hambatan Kritis (Blockers)'
                    : hasWarnings
                    ? 'Peringatan Operasional (Warnings)'
                    : 'Sistem Siap untuk Night Audit'}
                </div>
                <div
                  className={`text-xs ${
                    hasBlockers ? 'text-red-700' : hasWarnings ? 'text-yellow-700' : 'text-green-700'
                  }`}
                >
                  {hasBlockers
                    ? 'Selesaikan seluruh blocker di bawah ini agar Night Audit dapat dijalankan.'
                    : hasWarnings
                    ? 'Audit dapat dijalankan setelah mengonfirmasi bahwa peringatan telah ditinjau.'
                    : 'Semua shift kasir tertutup, kedatangan & kepulangan selesai diproses.'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Tag
                severity={hasBlockers ? 'danger' : 'success'}
                value={`${blockers.length} Blocker`}
                rounded
              />
              <Tag
                severity={hasWarnings ? 'warning' : 'info'}
                value={`${warnings.length} Warning`}
                rounded
              />
            </div>
          </div>

          {/* Blockers Section */}
          {hasBlockers && (
            <div>
              <div className="text-sm font-bold text-red-800 mb-2 flex align-items-center gap-2">
                <i className="pi pi-ban text-red-600" />
                Daftar Hambatan (Harus Diselesaikan):
              </div>
              <div className="flex flex-column gap-2">
                {blockers.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-3 border-round-lg surface-card border-1 border-red-300 shadow-1"
                  >
                    <div className="flex justify-content-between align-items-start mb-1">
                      <span className="font-semibold text-900 text-sm">{b.title}</span>
                      <Tag severity="danger" value={b.type} className="text-xs" />
                    </div>
                    <p className="text-xs text-700 m-0 mb-2">{b.message}</p>

                    {b.entity_ids && b.entity_ids.length > 0 && (
                      <div className="bg-red-50 p-2 border-round text-xs font-mono text-red-900 flex flex-wrap gap-1 align-items-center">
                        <span className="font-bold mr-1">Terdampak:</span>
                        {b.entity_ids.map((id, idIdx) => (
                          <span
                            key={idIdx}
                            className="bg-white px-2 py-1 border-round border-1 border-red-200 text-xs inline-flex align-items-center gap-2"
                          >
                            <span>{id}</span>
                            {b.type === 'PENDING_ARRIVALS' && onMarkNoShow && (
                              <button
                                type="button"
                                className="p-0 border-none bg-red-600 text-white border-round px-1 py-0 text-xs cursor-pointer hover:bg-red-700"
                                onClick={() => onMarkNoShow(id)}
                                title="Tandai Reservasi Ini Sebagai No-Show"
                              >
                                Tandai No-Show
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {hasWarnings && (
            <div>
              <div className="text-sm font-bold text-yellow-800 mb-2 flex align-items-center gap-2">
                <i className="pi pi-exclamation-circle text-yellow-600" />
                Peringatan Operasional (Bisa Diabaikan dengan Konfirmasi):
              </div>
              <div className="flex flex-column gap-2">
                {warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 border-round-lg surface-card border-1 border-yellow-300 shadow-1"
                  >
                    <div className="flex justify-content-between align-items-start mb-1">
                      <span className="font-semibold text-900 text-sm">{w.title}</span>
                      <Tag severity="warning" value={w.type} className="text-xs" />
                    </div>
                    <p className="text-xs text-700 m-0">{w.message}</p>
                    {w.entity_ids && w.entity_ids.length > 0 && (
                      <div className="bg-yellow-50 p-2 border-round text-xs text-yellow-900 mt-2 flex flex-wrap gap-1">
                        <span className="font-bold mr-1">Entitas:</span>
                        {w.entity_ids.slice(0, 8).map((id, idIdx) => (
                          <span key={idIdx} className="bg-white px-2 py-0 border-round border-1 border-yellow-200">
                            {id}
                          </span>
                        ))}
                        {w.entity_ids.length > 8 && (
                          <span className="text-yellow-700 font-semibold">
                            +{w.entity_ids.length - 8} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Acknowledgement Checkbox */}
              <div className="flex align-items-center gap-2 mt-3 p-3 bg-yellow-50 border-round border-1 border-yellow-300">
                <Checkbox
                  inputId="ack_warnings"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(Boolean(e.checked))}
                />
                <label htmlFor="ack_warnings" className="text-xs font-semibold text-yellow-900 cursor-pointer">
                  Saya telah meninjau seluruh peringatan di atas dan menyetujui untuk melanjutkan Night Audit (Acknowledge Warnings).
                </label>
              </div>
            </div>
          )}

          {!hasBlockers && !hasWarnings && (
            <div className="text-center py-4 text-green-700">
              <i className="pi pi-verified text-5xl mb-2 text-green-500" />
              <div className="text-lg font-bold">Kondisi Operasional Optimal</div>
              <p className="text-xs text-600 m-0">
                Tidak ada blocker atau peringatan. Anda dapat langsung menjalankan Night Audit.
              </p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
};

export default DialogPreCheck;
