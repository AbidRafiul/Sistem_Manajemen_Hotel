/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file alert_panel.tsx
 * @description Panel peringatan & kepatuhan operasional hotel: Night audit tertinggal/gagal,
 *              overdue checkout, shift kasir terbuka, folio belum tertutup, dan no-show berisiko.
 * @author Antigravity
 * @created 2026-10-14
 * @version 1.0.0
 */

'use client';

import React, { useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { AlertItem, DashboardAlertsResponse } from './interfaces';

interface AlertPanelProps {
  data: DashboardAlertsResponse | null;
  loading: boolean;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ data, loading }) => {
  const router = useRouter();
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading || !data) {
    return (
      <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
        <Skeleton width="30%" height="1.5rem" className="mb-3" />
        <Skeleton width="100%" height="5rem" className="mb-2" />
        <Skeleton width="100%" height="5rem" />
      </div>
    );
  }

  const { alerts, total_alerts, danger_count, warning_count, info_count } = data;

  if (total_alerts === 0) {
    return (
      <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
        <div className="flex align-items-center gap-3">
          <div className="w-1rem h-2rem border-round-circle flex align-items-center justify-center flex-shrink-0">
            <i className="pi pi-check-circle text-green-700 text-xl"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-900 m-0">Operasional Berjalan Lancar</h3>
            <p className="text-xs text-600 m-0 mt-1">
              Tidak ada anomali atau peringatan yang membutuhkan tindakan darurat saat ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverity = (level: AlertItem['level']): 'danger' | 'warning' | 'info' => {
    if (level === 'danger') return 'danger';
    if (level === 'warning') return 'warning';
    return 'info';
  };

  const getBorderColor = (level: AlertItem['level']) => {
    if (level === 'danger') return 'border-red-300 bg-red-50';
    if (level === 'warning') return 'border-orange-300 bg-orange-50';
    return 'border-blue-300 bg-blue-50';
  };

  const getIcon = (level: AlertItem['level']) => {
    if (level === 'danger') return 'pi-exclamation-triangle text-red-700';
    if (level === 'warning') return 'pi-exclamation-circle text-orange-700';
    return 'pi-info-circle text-blue-700';
  };

  return (
    <div className="surface-card p-4 border-round-xl border-1 surface-border shadow-1 mb-4">
      {/* Header with Alert Counts */}
      <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-2 mb-3">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-bell text-red-600 text-xl"></i>
          <h2 className="text-lg font-bold text-900 m-0">Perhatian & Tindakan Diperlukan</h2>
          <Tag value={`${total_alerts} Perhatian`} severity="danger" className="ml-2" />
        </div>
        <div className="flex align-items-center gap-2 flex-wrap">
          {danger_count > 0 && <Tag value={`${danger_count} Kritis`} severity="danger" />}
          {warning_count > 0 && <Tag value={`${warning_count} Peringatan`} severity="warning" />}
          {info_count > 0 && <Tag value={`${info_count} Info`} severity="info" />}
        </div>
      </div>

      {/* List of Alerts */}
      <div className="flex flex-column gap-3">
        {alerts.map((alert) => {
          const isExpanded = Boolean(expandedAlerts[alert.id]);
          const hasItems = alert.items && alert.items.length > 0;

          return (
            <div
              key={alert.id}
              className={`p-3 border-round-xl border-1 ${getBorderColor(alert.level)} transition-all transition-duration-150`}
            >
              <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3">
                <div className="flex align-items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <i className={`pi ${getIcon(alert.level)} text-xl`}></i>
                  </div>
                  <div>
                    <div className="flex align-items-center gap-2 flex-wrap">
                      <span className="font-bold text-900 text-sm">{alert.title}</span>
                      <Tag
                        value={`${alert.count} kasus`}
                        severity={getSeverity(alert.level)}
                        className="text-xs"
                      />
                    </div>
                    <p className="text-xs text-700 m-0 mt-1 line-height-3">{alert.message}</p>
                  </div>
                </div>

                <div className="flex align-items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-content-end">
                  {hasItems && (
                    <Button
                      label={isExpanded ? 'Tutup Rincian' : 'Lihat Data'}
                      icon={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`}
                      className="p-button-outlined p-button-sm p-button-secondary text-xs"
                      onClick={() => toggleExpand(alert.id)}
                    />
                  )}
                  <Button
                    label={alert.action_label}
                    icon="pi pi-external-link"
                    className="p-button-sm text-xs font-semibold"
                    severity={getSeverity(alert.level)}
                    onClick={() => router.push(alert.action_route)}
                  />
                </div>
              </div>

              {/* Collapsible Sample Items Preview */}
              {isExpanded && hasItems && (
                <div className="mt-3 pt-3 border-top-1 border-200">
                  <span className="text-xs font-bold text-700 uppercase mb-2 block">
                    Sampel Entitas Terdampak:
                  </span>
                  <div className="grid">
                    {alert.items?.map((item, idx) => (
                      <div key={idx} className="col-12 sm:col-6 lg:col-4">
                        <div className="bg-white p-2 border-round border-1 surface-border text-xs">
                          {item.nomor_kamar && (
                            <div>
                              <strong className="text-primary">Kamar {item.nomor_kamar}</strong>
                              {item.guest_name && ` - ${item.guest_name}`}
                            </div>
                          )}
                          {item.kode_reservasi && (
                            <div className="text-500 font-monospace">Res: {item.kode_reservasi}</div>
                          )}
                          {item.check_out_date && (
                            <div className="text-red-600">Checkout terlewat: {item.check_out_date}</div>
                          )}
                          {item.nama_kasir && (
                            <div>
                              <strong>Kasir:</strong> {item.nama_kasir} ({item.hours_open})
                            </div>
                          )}
                          {item.kode_folio && (
                            <div>
                              <strong>Folio:</strong> {item.kode_folio} - {item.guest_name}
                            </div>
                          )}
                          {item.kode_night_audit && (
                            <div>
                              <strong>Audit:</strong> {item.kode_night_audit} (Status: {item.status})
                            </div>
                          )}
                          {item.issue_type && (
                            <div>
                              <strong>Isu:</strong> {item.issue_type} - {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
