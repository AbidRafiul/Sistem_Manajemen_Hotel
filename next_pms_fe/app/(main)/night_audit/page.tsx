'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { useSession } from 'next-auth/react';

import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

import {
  apiNightAuditStatus,
  apiNightAuditPreCheck,
  apiNightAuditStart,
  apiNightAuditRuns,
  apiNightAuditPostings,
  apiNightAuditReport,
  apiNightAuditRetryFailed,
  apiNightAuditReopen,
  apiNightAuditNoShow,
  apiCabangDropdown
} from './components/endpoints';

import {
  NightAuditStatus,
  NightAuditRun,
  PreCheckResult,
  NightAuditItem
} from './components/types';

import DialogPreCheck from './components/dialog_precheck';
import DialogAuditDetail, { formatCurrency } from './components/dialog_audit_detail';
import DialogReports from './components/dialog_reports';

export default function NightAuditPage() {
  const toast = useRef<Toast>(null);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'staff';
  const roleLower = (userRole || '').toLowerCase().trim();

  // Klasifikasi RBAC hierarki enterprise sesuai arsitektur sistem
  const isCorporate = [
    'superadmin',
    'master',
    'admin',
    'corporate_manager',
    'director',
    'owner',
    'holding_admin',
    'auditor_holding'
  ].includes(roleLower);

  const isRegional = [
    'regional_manager',
    'area_auditor',
    'kepala_wilayah',
    'regional_director'
  ].includes(roleLower);

  const isCluster =
    !isCorporate &&
    !isRegional &&
    Boolean(session?.user?.can_switch_branch && (session?.user?.allowed_branches?.length ?? 0) > 1);

  const canSwitchBranch = isCorporate || isRegional || isCluster;

  // Wewenang role eksekusi Night Audit (sesuai backend start.js)
  const authorizedAuditRoles = [
    'superadmin',
    'master',
    'corporate_manager',
    'regional_manager',
    'general_manager',
    'hotel_manager',
    'duty_manager',
    'night_auditor',
    'finance_manager',
    'accounting',
    'front_office_manager',
    'admin',
    'branch_manager'
  ];
  const canExecuteAudit = authorizedAuditRoles.includes(roleLower);
  const canReopenAudit = [
    'superadmin',
    'master',
    'admin',
    'corporate_manager',
    'general_manager',
    'branch_manager'
  ].includes(roleLower);

  // Branch & System State
  const [cabangList, setCabangList] = useState<any[]>([]);
  const [selectedCabang, setSelectedCabang] = useState<string>(
    session?.user?.active_kode_cabang || session?.user?.default_kode_cabang || ''
  );
  const [auditStatus, setAuditStatus] = useState<NightAuditStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);

  // Runs History
  const [runs, setRuns] = useState<NightAuditRun[]>([]);
  const [runsLoading, setRunsLoading] = useState<boolean>(false);

  // Pre-Check Modal State
  const [preCheckVisible, setPreCheckVisible] = useState<boolean>(false);
  const [preCheckData, setPreCheckData] = useState<PreCheckResult | null>(null);
  const [preCheckLoading, setPreCheckLoading] = useState<boolean>(false);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  // Execution Modal & Progress State
  const [confirmExecuteVisible, setConfirmExecuteVisible] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<string>('');

  // Details Modal State
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [selectedRun, setSelectedRun] = useState<NightAuditRun | null>(null);
  const [postings, setPostings] = useState<NightAuditItem[]>([]);
  const [postingsLoading, setPostingsLoading] = useState<boolean>(false);
  const [retryLoading, setRetryLoading] = useState<boolean>(false);

  // Snapshot Reports Modal State
  const [reportVisible, setReportVisible] = useState<boolean>(false);
  const [reportRun, setReportRun] = useState<NightAuditRun | null>(null);
  const [reportSnapshots, setReportSnapshots] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  // Reopen Modal State
  const [reopenVisible, setReopenVisible] = useState<boolean>(false);
  const [reopenRun, setReopenRun] = useState<NightAuditRun | null>(null);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenLoading, setReopenLoading] = useState<boolean>(false);

  // Sinkronisasi dengan active branch session (misal saat beralih cabang via Topbar)
  useEffect(() => {
    if (session?.user?.active_kode_cabang) {
      setSelectedCabang(session.user.active_kode_cabang);
    }
  }, [session?.user?.active_kode_cabang]);

  // 1. Fetch Cabang List Berdasarkan Hak Akses RBAC & Session
  const fetchCabangList = useCallback(async () => {
    try {
      let finalBranches: any[] = [];

      // A. Jika user berhak corporate, ambil seluruh cabang dari API
      if (isCorporate) {
        const res = await postData(apiCabangDropdown, {});
        const rawList = res?.data?.data;
        if (Array.isArray(rawList) && rawList.length > 0) {
          finalBranches = rawList.map((c: any) => ({
            label: c.nama_hotel ? `${c.kode_cabang} - ${c.nama_hotel}` : c.label || c.kode_cabang,
            value: c.kode_cabang,
            kode_cabang: c.kode_cabang,
            nama_hotel: c.nama_hotel || c.name || '',
            nama_wilayah: c.nama_wilayah || ''
          }));
        }
      }

      // B. Jika non-corporate atau API kosong, utamakan session allowed_branches
      if (finalBranches.length === 0 && session?.user?.allowed_branches && session.user.allowed_branches.length > 0) {
        finalBranches = session.user.allowed_branches.map((b: any) => ({
          label: `${b.kode_cabang} - ${b.nama_hotel || b.kode_cabang}`,
          value: b.kode_cabang,
          kode_cabang: b.kode_cabang,
          nama_hotel: b.nama_hotel || '',
          nama_wilayah: b.nama_wilayah || ''
        }));
      }

      // C. Fallback jika cabang masih belum terisi
      if (finalBranches.length === 0) {
        finalBranches = [
          {
            label: 'CAB0001 - Grand Marstech Hotel & Resort Magetan',
            value: 'CAB0001',
            kode_cabang: 'CAB0001',
            nama_hotel: 'Grand Marstech Hotel & Resort Magetan'
          },
          {
            label: 'CAB0002 - Grand Marstech Resort & Spa Batu',
            value: 'CAB0002',
            kode_cabang: 'CAB0002',
            nama_hotel: 'Grand Marstech Resort & Spa Batu'
          }
        ];
      }

      // Filter jika Regional (hanya cabang di wilayah user)
      if (isRegional && session?.user?.wilayah_name) {
        const regionalFiltered = finalBranches.filter(
          (b) => !b.nama_wilayah || b.nama_wilayah.toLowerCase() === session.user.wilayah_name?.toLowerCase()
        );
        if (regionalFiltered.length > 0) {
          finalBranches = regionalFiltered;
        }
      }

      // Filter jika Cluster (hanya allowed_kode_cabang user)
      if (isCluster && session?.user?.allowed_kode_cabang && session.user.allowed_kode_cabang.length > 0) {
        const clusterFiltered = finalBranches.filter((b) =>
          session.user.allowed_kode_cabang?.includes(b.kode_cabang)
        );
        if (clusterFiltered.length > 0) {
          finalBranches = clusterFiltered;
        }
      }

      // Jika user Unit Terkunci (tidak bisa switch branch), batasi hanya pada cabang aktif session
      if (!canSwitchBranch) {
        const unitKode = session?.user?.active_kode_cabang || session?.user?.default_kode_cabang;
        if (unitKode) {
          const unitFiltered = finalBranches.filter((b) => b.kode_cabang === unitKode);
          if (unitFiltered.length > 0) {
            finalBranches = unitFiltered;
          }
        }
      }

      setCabangList(finalBranches);

      // Inisialisasi selectedCabang dengan aman tanpa menimpa pilihan manual user
      setSelectedCabang((prev) => {
        if (prev && finalBranches.some((b) => b.kode_cabang === prev)) {
          return prev;
        }
        const sessionActive = session?.user?.active_kode_cabang || session?.user?.default_kode_cabang;
        if (sessionActive && finalBranches.some((b) => b.kode_cabang === sessionActive)) {
          return sessionActive;
        }
        return finalBranches[0]?.kode_cabang || '';
      });
    } catch {
      if (session?.user?.allowed_branches && session.user.allowed_branches.length > 0) {
        const mapped = session.user.allowed_branches.map((b: any) => ({
          label: `${b.kode_cabang} - ${b.nama_hotel || b.kode_cabang}`,
          value: b.kode_cabang,
          kode_cabang: b.kode_cabang,
          nama_hotel: b.nama_hotel || ''
        }));
        setCabangList(mapped);
        setSelectedCabang((prev) => prev || session?.user?.active_kode_cabang || mapped[0].kode_cabang);
      }
    }
  }, [session, isCorporate, isRegional, isCluster, canSwitchBranch]);

  // 2. Fetch Night Audit Status & History Runs
  const fetchStatusAndRuns = useCallback(async () => {
    if (!selectedCabang) return;
    setStatusLoading(true);
    setRunsLoading(true);

    try {
      // Status endpoint
      const statusRes = await postData(apiNightAuditStatus, { kode_cabang: selectedCabang });
      if (statusRes?.data?.status === '00' && statusRes.data.data) {
        setAuditStatus(statusRes.data.data);
      }

      // Runs history endpoint
      const runsRes = await postData(apiNightAuditRuns, {
        kode_cabang: selectedCabang,
        limit: 30
      });
      if (runsRes?.data?.status === '00' && runsRes.data.data) {
        setRuns(Array.isArray(runsRes.data.data) ? runsRes.data.data : []);
      }
    } catch (err: any) {
      showError(toast, err.message || 'Gagal memuat status Night Audit');
    } finally {
      setStatusLoading(false);
      setRunsLoading(false);
    }
  }, [selectedCabang]);

  useEffect(() => {
    fetchCabangList();
  }, [fetchCabangList]);

  useEffect(() => {
    if (selectedCabang) {
      fetchStatusAndRuns();
    }
  }, [selectedCabang, fetchStatusAndRuns]);

  // 3. Pre-Audit Check Handler
  const handleRunPreCheck = async () => {
    setPreCheckLoading(true);
    setPreCheckVisible(true);
    setAcknowledged(false);

    try {
      const res = await postData(apiNightAuditPreCheck, { kode_cabang: selectedCabang });
      if (res?.data?.status === '00' && res.data.data) {
        setPreCheckData(res.data.data);
      } else {
        showError(toast, res?.data?.message || 'Gagal melakukan pengecekan pre-audit');
      }
    } catch (err: any) {
      showError(toast, err.message || 'Gagal menghubungi server');
    } finally {
      setPreCheckLoading(false);
    }
  };

  // 4. Mark No-Show Handler directly from Pre-check
  const handleMarkNoShow = async (reservationCode: string) => {
    try {
      const res = await postData(apiNightAuditNoShow, {
        kode_reservasi: reservationCode,
        kode_reservation: reservationCode,
        kode_cabang: selectedCabang,
        no_show_fee: 0,
        notes: 'Ditandai No-Show dari Pre-Audit Check modal'
      });
      if (res?.data?.status === '00') {
        showSuccess(toast, `Reservasi ${reservationCode} berhasil ditandai No-Show`);
        // Refresh pre-check
        handleRunPreCheck();
      } else {
        showError(toast, res?.data?.message || 'Gagal memproses No-Show');
      }
    } catch (err: any) {
      showError(toast, err.message || 'Gagal menandai no-show');
    }
  };

  // 5. Open Execution Confirmation
  const handleOpenConfirmExecute = () => {
    setPreCheckVisible(false);
    setConfirmExecuteVisible(true);
  };

  // 6. Execute Night Audit
  const handleExecuteNightAudit = async () => {
    setIsExecuting(true);
    setExecutionStep('Memvalidasi integritas & mengunci transaksi sistem...');

    try {
      setTimeout(() => {
        setExecutionStep('Memposting room charge, pajak, dan service per kamar in-house...');
      }, 700);

      const res = await postData(apiNightAuditStart, {
        kode_cabang: selectedCabang,
        warnings_acknowledged: acknowledged ? 1 : 0,
        idempotency_key: `FE-NA-${Date.now()}`
      });

      if (res?.data?.status === '00' && res.data.data) {
        const d = res.data.data;
        setExecutionStep('Selesai! Rollover tanggal bisnis & membuat snapshot laporan...');
        showSuccess(
          toast,
          `Night Audit Berhasil! Business Date maju ke ${d.next_business_date}. Total diposting: ${d.summary?.total_posted || 0} kamar.`
        );
        setConfirmExecuteVisible(false);
        await fetchStatusAndRuns();

        // Otomatis buka snapshot laporan audit terkini
        if (d.kode_night_audit) {
          handleViewReports({
            id: 0,
            kode_night_audit: d.kode_night_audit,
            kode_cabang: selectedCabang,
            business_date: d.audited_business_date,
            status: d.status,
            total_in_house: d.summary?.total_in_house || 0,
            total_posted: d.summary?.total_posted || 0,
            total_failed: d.summary?.total_failed || 0,
            total_room_revenue: d.summary?.total_room_revenue || 0,
            total_tax: d.summary?.total_tax || 0,
            total_service: d.summary?.total_service || 0,
            started_at: formatDateSystem() || new Date().toISOString(),
            room_charge_posted: 1,
            business_date_updated: 1,
            daily_report_generated: 1,
            transaction_locked: 0
          });
        }
      } else {
        showError(toast, res?.data?.message || 'Night Audit gagal dijalankan');
      }
    } catch (err: any) {
      showError(toast, err.message || 'Terjadi kesalahan sistem saat mengeksekusi Night Audit');
    } finally {
      setIsExecuting(false);
    }
  };

  // 7. View Posting Details
  const handleViewDetails = async (run: NightAuditRun) => {
    setSelectedRun(run);
    setDetailVisible(true);
    setPostingsLoading(true);

    try {
      const res = await postData(apiNightAuditPostings(run.kode_night_audit), {});
      if (res?.data?.status === '00' && res.data.data) {
        const list = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data.data?.postings)
          ? res.data.data.postings
          : [];
        setPostings(list);
      } else {
        showError(toast, res?.data?.message || 'Gagal memuat rincian posting');
      }
    } catch (err: any) {
      showError(toast, err.message || 'Gagal memuat rincian posting');
    } finally {
      setPostingsLoading(false);
    }
  };

  // 8. View Snapshot Reports
  const handleViewReports = async (run: NightAuditRun) => {
    setReportRun(run);
    setReportVisible(true);
    setReportLoading(true);

    try {
      const res = await postData(apiNightAuditReport(run.kode_night_audit, 'all'), {});
      if (res?.data?.status === '00' && res.data.data) {
        const snapData = res.data.data.report || res.data.data.reports || res.data.data;
        setReportSnapshots(snapData);
      } else {
        showError(toast, res?.data?.message || 'Gagal memuat laporan snapshot');
      }
    } catch (err: any) {
      showError(toast, err.message || 'Gagal memuat laporan snapshot');
    } finally {
      setReportLoading(false);
    }
  };

  // 9. Retry Failed Items
  const handleRetryFailed = async (auditCode: string | number) => {
    setRetryLoading(true);
    try {
      const res = await postData(apiNightAuditRetryFailed(auditCode), {});
      if (res?.data?.status === '00') {
        showSuccess(
          toast,
          `Posting ulang selesai: ${res.data.data?.total_reposted || 0} berhasil, ${res.data.data?.total_still_failed || 0} masih gagal.`
        );
        if (selectedRun) {
          handleViewDetails(selectedRun);
        }
        fetchStatusAndRuns();
      } else {
        showError(toast, res?.data?.message || 'Gagal mengulang posting');
      }
    } catch (err: any) {
      showError(toast, err.message || 'Gagal mengulang posting');
    } finally {
      setRetryLoading(false);
    }
  };

  // 10. Reopen Audit Modal & Submit
  const handleOpenReopenDialog = (run: NightAuditRun) => {
    setReopenRun(run);
    setReopenReason('');
    setReopenVisible(true);
  };

  const handleSubmitReopen = async () => {
    if (!reopenRun) return;
    if (!reopenReason || reopenReason.trim().length < 5) {
      showError(toast, 'Harap isi alasan pembukaan kembali audit dengan jelas (min 5 karakter)');
      return;
    }

    setReopenLoading(true);
    try {
      const res = await postData(apiNightAuditReopen(reopenRun.kode_night_audit), {
        reason: reopenReason
      });

      if (res?.data?.status === '00') {
        showSuccess(
          toast,
          `Audit ${reopenRun.kode_night_audit} berhasil dibuka kembali (Reopened). Business date dikembalikan ke ${res.data.data?.restored_business_date}. Seluruh posting dibalikkan secara aman!`
        );
        setReopenVisible(false);
        setDetailVisible(false);
        fetchStatusAndRuns();
      } else {
        showError(toast, res?.data?.message || 'Gagal membuka kembali audit');
      }
    } catch (err: any) {
      showError(toast, err.message || 'Gagal memproses pembatalan audit');
    } finally {
      setReopenLoading(false);
    }
  };

  // Helper Template Status Badge
  const statusBadgeTemplate = (run: NightAuditRun) => {
    switch (run.status) {
      case 'completed':
        return <Tag severity="success" value="COMPLETED" icon="pi pi-check-circle" rounded />;
      case 'completed_with_exceptions':
        return (
          <Tag
            severity="warning"
            value="WITH EXCEPTIONS"
            icon="pi pi-exclamation-triangle"
            rounded
          />
        );
      case 'running':
        return <Tag severity="info" value="RUNNING" icon="pi pi-spin pi-spinner" rounded />;
      case 'failed':
        return <Tag severity="danger" value="FAILED" icon="pi pi-times-circle" rounded />;
      case 'reopened':
        return <Tag severity="contrast" value="REOPENED" icon="pi pi-undo" rounded />;
      default:
        return <Tag severity="secondary" value={run.status} rounded />;
    }
  };

  const currentBranchObj = cabangList.find((b) => b.kode_cabang === selectedCabang);
  const currentBranchLabel =
    currentBranchObj?.nama_hotel || session?.user?.active_branch_name || selectedCabang || 'Cabang Aktif';

  return (
    <div className="grid">
      <Toast ref={toast} />

      {/* TOP HEADER & PROPERTY SELECTOR */}
      <div className="col-12">
        <div className="surface-card p-4 border-round-xl shadow-1 flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
          <div className="flex align-items-center gap-3">
            <div className="surface-100 p-3 border-round-xl text-primary">
              <i className="pi pi-moon text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-900 m-0">Night Audit & Daily Rollover</h1>
              <p className="text-xs text-500 m-0 mt-1">
                Proses penutupan hari, posting biaya kamar & pajak otomatis, rekonsiliasi kasir, dan penyesuaian tanggal bisnis.
              </p>
            </div>
          </div>

          <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center gap-3 w-full md:w-auto">
            {/* Indikator Scope Hierarki RBAC */}
            <div className="flex flex-column align-items-start sm:align-items-end">
              <span className="text-xs text-500 font-semibold mb-1">
                TINGKAT OTORITAS (RBAC)
              </span>
              <div>
                {isCorporate ? (
                  <span title="Akses Tingkat Holding: Memiliki wewenang audit ke seluruh properti hotel">
                    <Tag
                      icon="pi pi-building"
                      severity="info"
                      value="Holding (Semua Cabang)"
                      rounded
                    />
                  </span>
                ) : isRegional ? (
                  <span title={`Akses Tingkat Regional: Wewenang audit seluruh cabang di wilayah ${session?.user?.wilayah_name || ''}`}>
                    <Tag
                      icon="pi pi-map-marker"
                      severity="warning"
                      value={`Regional (${session?.user?.wilayah_name || 'Wilayah Aktif'})`}
                      rounded
                    />
                  </span>
                ) : isCluster ? (
                  <span title="Akses Tingkat Cluster: Wewenang audit multi-cabang penugasan">
                    <Tag
                      icon="pi pi-sitemap"
                      severity="success"
                      value={`Cluster (${session?.user?.allowed_branches?.length || cabangList.length} Cabang)`}
                      rounded
                    />
                  </span>
                ) : (
                  <span title="Akses Terkunci: Wewenang dibatasi khusus untuk properti hotel penugasan ini">
                    <Tag
                      icon="pi pi-lock"
                      severity="secondary"
                      value={`Unit Terkunci (${session?.user?.active_kode_cabang || selectedCabang})`}
                      rounded
                    />
                  </span>
                )}
              </div>
            </div>

            {/* Pemilih Cabang: Dropdown jika canSwitchBranch, Label Statis jika Unit Terkunci */}
            <div className="w-full sm:w-18rem md:w-20rem">
              <div className="flex justify-content-between align-items-center mb-1">
                <span className="text-xs text-500 font-semibold">CABANG / PROPERTI</span>
                {!canSwitchBranch && (
                  <span className="text-xs text-orange-600 font-medium">
                    <i className="pi pi-lock mr-1" />
                    Terkunci
                  </span>
                )}
              </div>
              {canSwitchBranch ? (
                <Dropdown
                  value={selectedCabang}
                  options={Array.isArray(cabangList) ? cabangList : []}
                  optionLabel="label"
                  optionValue="kode_cabang"
                  onChange={(e) => {
                    if (e.value) setSelectedCabang(e.value);
                  }}
                  placeholder="Pilih Cabang"
                  className="w-full"
                  disabled={auditStatus?.is_running}
                  tooltip="Pilih properti hotel untuk meninjau status dan menjalankan Night Audit."
                  tooltipOptions={{ position: 'bottom' }}
                />
              ) : (
                <div
                  className="flex align-items-center gap-2 bg-white px-3 py-2 border-round-lg border-1 surface-border"
                  style={{ minHeight: '38px' }}
                >
                  <i className="pi pi-building text-primary font-bold" />
                  <span className="text-sm font-bold text-900 truncate">
                    {session?.user?.active_kode_cabang || selectedCabang || '-'} - {session?.user?.active_branch_name || currentBranchLabel}
                  </span>
                </div>
              )}
            </div>
            <Button
              icon="pi pi-refresh"
              className="p-button-outlined p-button-secondary mt-3"
              tooltip="Segarkan Status"
              onClick={fetchStatusAndRuns}
              loading={statusLoading}
            />
          </div>
        </div>
      </div>

      {/* SYSTEM STATUS HERO CARD */}
      <div className="col-12">
        <div className="surface-card p-4 border-round-xl shadow-1">
          <div className="grid align-items-center">
            {/* Left: Current Business Date */}
            <div className="col-12 md:col-4 border-bottom-1 md:border-bottom-0 md:border-right-1 surface-border pr-0 md:pr-4">
              <span className="text-xs font-bold text-500 uppercase tracking-wide block mb-1">
                BUSINESS DATE OPERASIONAL
              </span>
              <div className="flex align-items-center gap-3">
                <span className="text-3xl font-black text-900 font-mono">
                  {auditStatus?.current_business_date || '...'}
                </span>
                <Tag
                  severity={auditStatus?.is_locked ? 'danger' : 'success'}
                  value={auditStatus?.is_locked ? 'LOCKED' : 'ACTIVE'}
                  icon={auditStatus?.is_locked ? 'pi pi-lock' : 'pi pi-check'}
                  rounded
                />
              </div>
              <div className="text-xs text-500 mt-2 flex align-items-center gap-2">
                <i className="pi pi-calendar" />
                <span>
                  Kalender Server: <strong>{new Date().toISOString().split('T')[0]}</strong>
                </span>
              </div>
              <div className="text-xs text-600 mt-1 flex align-items-center gap-2">
                <i className="pi pi-clock text-primary" />
                <span>Auto-Scheduler: <strong>02:00 WIB</strong> (Background Daemon)</span>
              </div>
            </div>

            {/* Middle: Last Audit Snapshot */}
            <div className="col-12 md:col-5 px-0 md:px-4 py-3 md:py-0">
              <span className="text-xs font-bold text-500 uppercase tracking-wide block mb-1">
                AUDIT TERAKHIR
              </span>
              {auditStatus?.last_audit ? (
                <div>
                  <div className="flex align-items-center gap-2 mb-1">
                    <span className="font-bold text-base text-900">
                      {auditStatus.last_audit.kode_night_audit}
                    </span>
                    {statusBadgeTemplate(auditStatus.last_audit)}
                  </div>
                  <div className="text-xs text-600">
                    Business Date: <strong>{auditStatus.last_audit.business_date}</strong> &bull; Total Diposting:{' '}
                    <strong>{auditStatus.last_audit.total_posted} Kamar</strong> (
                    {formatCurrency(auditStatus.last_audit.total_room_revenue)})
                  </div>
                </div>
              ) : (
                <div className="text-xs text-400 italic">Belum ada riwayat audit untuk cabang ini.</div>
              )}
            </div>

            {/* Right: Primary Action Buttons */}
            <div className="col-12 md:col-3 flex flex-column gap-2 justify-content-center">
              <Button
                label="Pre-Audit System Check"
                icon="pi pi-shield"
                className="p-button-outlined p-button-primary font-semibold"
                onClick={handleRunPreCheck}
                loading={preCheckLoading}
                disabled={!canExecuteAudit || auditStatus?.is_running}
                tooltip={
                  !canExecuteAudit
                    ? `Role '${userRole}' tidak memiliki wewenang eksekusi Night Audit.`
                    : 'Pemeriksaan kesiapan transaksi & checkout sebelum audit'
                }
                tooltipOptions={{ position: 'bottom' }}
              />
              <Button
                label="Jalankan Night Audit"
                icon="pi pi-play"
                className="p-button-primary font-bold shadow-2"
                onClick={handleRunPreCheck}
                disabled={!canExecuteAudit || auditStatus?.is_running}
                tooltip={
                  !canExecuteAudit
                    ? `Role '${userRole}' tidak memiliki wewenang eksekusi Night Audit.`
                    : 'Eksekusi posting biaya kamar & rollover tanggal bisnis'
                }
                tooltipOptions={{ position: 'bottom' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AUDIT RUNS HISTORY TABLE */}
      <div className="col-12">
        <div className="surface-card p-4 border-round-xl shadow-1">
          <div className="flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="text-lg font-bold text-900 m-0">Riwayat Audit (Audit Trail Runs)</h2>
              <p className="text-xs text-500 m-0">Catatan penutupan hari dan posting yang telah dilakukan</p>
            </div>
            <div className="text-xs text-500">Menampilkan {runs.length} audit terakhir</div>
          </div>

          <DataTable
            value={Array.isArray(runs) ? runs : []}
            loading={runsLoading}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            emptyMessage="Belum ada riwayat Night Audit."
            className="p-datatable-sm"
            responsiveLayout="scroll"
          >
            <Column
              field="kode_night_audit"
              header="Kode Audit"
              sortable
              body={(r) => <span className="font-mono font-bold text-primary">{r.kode_night_audit}</span>}
              style={{ width: '150px' }}
            />
            <Column
              field="business_date"
              header="Business Date"
              sortable
              body={(r) => <span className="font-bold text-800">{r.business_date}</span>}
              style={{ width: '130px' }}
            />
            <Column
              field="status"
              header="Status"
              body={statusBadgeTemplate}
              style={{ width: '160px' }}
            />
            <Column
              field="total_posted"
              header="Posting Kamar"
              sortable
              body={(r) => (
                <span>
                  <strong className="text-green-600">{r.total_posted}</strong> / {r.total_in_house}{' '}
                  {r.total_failed > 0 && <span className="text-red-600 font-bold">({r.total_failed} gagal)</span>}
                </span>
              )}
              style={{ textAlign: 'center', width: '150px' }}
            />
            <Column
              field="total_room_revenue"
              header="Room Revenue"
              sortable
              body={(r) => formatCurrency(r.total_room_revenue)}
              style={{ textAlign: 'right', width: '160px' }}
            />
            <Column
              field="started_at"
              header="Waktu Audit"
              sortable
              body={(r) => (
                <div className="text-xs">
                  <div>Mulai: {r.started_at ? formatDateSystem(r.started_at) : '-'}</div>
                  <div className="text-500">
                    Selesai: {r.completed_at ? formatDateSystem(r.completed_at) : '-'}
                  </div>
                </div>
              )}
            />
            <Column
              header="Aksi"
              style={{ width: '190px', textAlign: 'center' }}
              body={(r: NightAuditRun) => (
                <div className="flex gap-2 justify-content-center">
                  <Button
                    icon="pi pi-list"
                    className="p-button-rounded p-button-text p-button-secondary p-button-sm"
                    tooltip="Rincian Posting Kamar"
                    onClick={() => handleViewDetails(r)}
                  />
                  <Button
                    icon="pi pi-file-pdf"
                    className="p-button-rounded p-button-text p-button-info p-button-sm"
                    tooltip="Snapshot Laporan Harian"
                    onClick={() => handleViewReports(r)}
                  />
                  {r.total_failed > 0 && (
                    <Button
                      icon="pi pi-refresh"
                      className="p-button-rounded p-button-text p-button-warning p-button-sm"
                      tooltip="Retry Item Gagal"
                      onClick={() => handleRetryFailed(r.kode_night_audit)}
                    />
                  )}
                  {canReopenAudit && r.status === 'completed' && (
                    <Button
                      icon="pi pi-undo"
                      className="p-button-rounded p-button-text p-button-danger p-button-sm"
                      tooltip="Reopen Audit (Manager Only)"
                      onClick={() => handleOpenReopenDialog(r)}
                    />
                  )}
                </div>
              )}
            />
          </DataTable>
        </div>
      </div>

      {/* PRE-CHECK MODAL */}
      <DialogPreCheck
        visible={preCheckVisible}
        onHide={() => setPreCheckVisible(false)}
        preCheckData={preCheckData}
        loading={preCheckLoading}
        acknowledged={acknowledged}
        setAcknowledged={setAcknowledged}
        onProceedToAudit={handleOpenConfirmExecute}
        onRefreshCheck={handleRunPreCheck}
        onMarkNoShow={handleMarkNoShow}
      />

      {/* CONFIRM EXECUTE AUDIT MODAL */}
      <Dialog
        visible={confirmExecuteVisible}
        onHide={() => !isExecuting && setConfirmExecuteVisible(false)}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-exclamation-triangle text-orange-500 text-2xl" />
            <span className="text-xl font-bold">Konfirmasi Eksekusi Night Audit</span>
          </div>
        }
        style={{ width: '90vw', maxWidth: '560px' }}
        modal
        footer={
          !isExecuting && (
            <div className="flex justify-content-end gap-2">
              <Button
                label="Batal"
                icon="pi pi-times"
                className="p-button-text p-button-secondary"
                onClick={() => setConfirmExecuteVisible(false)}
              />
              <Button
                label="Mulai Night Audit Sekarang"
                icon="pi pi-check"
                className="p-button-primary font-bold"
                onClick={handleExecuteNightAudit}
              />
            </div>
          )
        }
      >
        {isExecuting ? (
          <div className="py-5 text-center flex flex-column align-items-center">
            <i className="pi pi-spin pi-spinner text-primary text-5xl mb-3" />
            <div className="text-lg font-bold text-900 mb-2">Night Audit Sedang Berjalan</div>
            <p className="text-xs text-600 mb-3">{executionStep}</p>
            <ProgressBar mode="indeterminate" style={{ height: '6px', width: '80%' }} />
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-700 mb-3">
              Anda akan menjalankan proses Night Audit untuk cabang <strong>{selectedCabang}</strong> pada Business Date{' '}
              <strong className="text-primary font-mono">{auditStatus?.current_business_date}</strong>.
            </p>
            <div className="surface-100 p-3 border-round text-xs text-700 flex flex-column gap-2 mb-3">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-check text-green-600" />
                <span>Memposting tarif kamar, pajak, dan service secara otomatis ke folio tamu in-house.</span>
              </div>
              <div className="flex align-items-center gap-2">
                <i className="pi pi-check text-green-600" />
                <span>Membuat snapshot laporan keuangan (Daily Revenue, Trial Balance, Guest List).</span>
              </div>
              <div className="flex align-items-center gap-2">
                <i className="pi pi-check text-green-600" />
                <span>Memajukan Business Date operasional sebesar +1 hari.</span>
              </div>
            </div>
            <p className="text-xs text-red-600 font-semibold m-0">
              Perhatian: Proses ini bersifat resmi dan dicatat di audit log. Pastikan seluruh kasir shift telah ditutup.
            </p>
          </div>
        )}
      </Dialog>

      {/* DETAIL POSTING MODAL */}
      <DialogAuditDetail
        visible={detailVisible}
        onHide={() => setDetailVisible(false)}
        run={selectedRun}
        items={postings}
        loading={postingsLoading}
        onRetryFailed={handleRetryFailed}
        onOpenReopenDialog={handleOpenReopenDialog}
        retryLoading={retryLoading}
      />

      {/* SNAPSHOT REPORTS MODAL */}
      <DialogReports
        visible={reportVisible}
        onHide={() => setReportVisible(false)}
        run={reportRun}
        snapshots={reportSnapshots}
        loading={reportLoading}
      />

      {/* REOPEN AUDIT MODAL */}
      <Dialog
        visible={reopenVisible}
        onHide={() => !reopenLoading && setReopenVisible(false)}
        header={
          <div className="flex align-items-center gap-2 text-red-600">
            <i className="pi pi-undo text-2xl" />
            <span className="text-xl font-bold">Reopen Night Audit (Override Manager)</span>
          </div>
        }
        style={{ width: '90vw', maxWidth: '550px' }}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Batal"
              icon="pi pi-times"
              className="p-button-text p-button-secondary"
              onClick={() => setReopenVisible(false)}
              disabled={reopenLoading}
            />
            <Button
              label="Buka Kembali & Balikkan Posting"
              icon="pi pi-undo"
              className="p-button-danger font-bold"
              onClick={handleSubmitReopen}
              loading={reopenLoading}
            />
          </div>
        }
      >
        <div className="py-2">
          <div className="bg-red-50 border-1 border-red-200 p-3 border-round-lg text-xs text-red-900 mb-3">
            <div className="font-bold mb-1">Peringatan Tindakan Kritis:</div>
            Reopen audit akan membatalkan status audit, <strong>membalikkan seluruh transaksi charge</strong> yang telah diposting dengan adjustment reversal, dan mengembalikan tanggal bisnis ke tanggal sebelum audit.
          </div>

          <label htmlFor="reopen_reason" className="text-xs font-bold text-900 block mb-1">
            Alasan Pembukaan Kembali (Wajib Diisi):
          </label>
          <InputTextarea
            id="reopen_reason"
            rows={4}
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Contoh: Ada koreksi rate kamar VIP dan checkout tertinggal yang harus diselesaikan..."
            className="w-full text-sm"
          />
        </div>
      </Dialog>
    </div>
  );
}
