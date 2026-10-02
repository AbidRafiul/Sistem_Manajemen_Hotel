'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useFormik } from 'formik';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import {
    apiShiftCurrent,
    apiShiftOpen,
    apiShiftClose,
    apiShiftDetail,
    apiShiftHistory,
    apiCabangDropdown,
    apiCashierCounterDropdown,
    apiMasterShiftDropdown
} from './components/endpoints';
import DialogShiftDetail, { formatCurrency, getSesiBadge } from './components/dialog_shift_detail';
import { formatPaymentDisplay } from '@/lib/tools/paymentTools';
// import FrontOfficeNav from '@/app/components/navigation/FrontOfficeNav';

interface ShiftStats {
    total_checkin_kamar: number;
    total_checkin_pax: number;
    walkin_kamar: number;
    walkin_pax: number;
    reservasi_kamar: number;
    reservasi_pax: number;
    total_checkout_kamar: number;
    total_checkout_pax: number;
    opening_cash: number;
    total_cash_in: number;
    total_non_cash_in: number;
    total_payment_in: number;
    system_cash: number;
    total_fasilitas_item: number;
    total_fasilitas_amount: number;
}

interface ShiftData {
    kode_cashier_shift: string;
    kode_cabang: string;
    kode_cashier_counter: string;
    sesi: string;
    nama_shift?: string;
    is_night_audit?: number;
    nama_counter: string;
    cabang_name: string;
    opening_cash: string | number;
    opened_at: string;
    user_id: number;
    cashier_username?: string;
    cashier_name?: string;
    stats?: ShiftStats;
}

const SESI_OPTIONS = [
    { label: 'Sesi A – Shift Pagi', sublabel: '07:00 – 15:00', value: 'pagi', icon: 'pi pi-sun', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Sesi B – Shift Sore', sublabel: '15:00 – 23:00', value: 'sore', icon: 'pi pi-clock', color: '#f97316', bg: '#fff7ed' },
    { label: 'Sesi C – Shift Malam', sublabel: '23:00 – 07:00', value: 'malam', icon: 'pi pi-moon', color: '#6366f1', bg: '#eef2ff' },
];

// Reusable stat row helper
const StatRow = ({ label, value, valueClass = '', border = true }: { label: string; value: React.ReactNode; valueClass?: string; border?: boolean }) => (
    <div className={`flex justify-content-between align-items-center py-2 ${border ? 'border-bottom-1 surface-border' : ''}`}>
        <span className="text-500 text-xs">{label}</span>
        <span className={`font-semibold text-sm ${valueClass}`}>{value}</span>
    </div>
);

const getCurrentSesiSuggest = (): string => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 15) return 'pagi';
    if (hour >= 15 && hour < 23) return 'sore';
    return 'malam';
};

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    // View states
    const [activeMainView, setActiveMainView] = useState<'workspace' | 'history'>('workspace');
    const [activeSection, setActiveSection] = useState<'checkin' | 'checkout' | 'kas' | 'fasilitas' | 'pembayaran'>('checkin');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [shiftAktif, setShiftAktif] = useState<ShiftData | null>(null);
    const [activeShiftDetail, setActiveShiftDetail] = useState<any>(null);
    const [counterOptions, setCounterOptions] = useState<any[]>([]);
    const [masterShiftOptions, setMasterShiftOptions] = useState<any[]>([]);
    const [submitLoad, setSubmitLoad] = useState(false);

    // Live Timer State
    const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

    // Close Shift Dialog State
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closeSummary, setCloseSummary] = useState<any>(null);

    // Shift Detail Dialog State (Reusable for current and past history)
    const [detailDialogVisible, setDetailDialogVisible] = useState(false);
    const [selectedDetailData, setSelectedDetailData] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // History Table State
    const [historyRows, setHistoryRows] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPerPage, setHistoryPerPage] = useState(10);
    const [historyTotal, setHistoryTotal] = useState(0);

    // Form open shift
    const formikOpen = useFormik({
        initialValues: {
            kode_cabang: '',
            kode_cashier_counter: '',
            sesi: getCurrentSesiSuggest(),
            opening_cash: 1000000
        },
        validate: (data) => {
            let errors: any = {};
            if (!data.kode_cabang) errors.kode_cabang = 'Cabang wajib dipilih';
            if (!data.kode_cashier_counter) errors.kode_cashier_counter = 'Counter wajib dipilih';
            if (!data.sesi) errors.sesi = 'Sesi kerja wajib dipilih';
            if (data.opening_cash < 0) errors.opening_cash = 'Uang modal awal tidak valid';
            return errors;
        },
        onSubmit: async (values) => {
            setSubmitLoad(true);
            try {
                const res = await postData(apiShiftOpen, values);
                showSuccess(toast, res.data.message || 'Shift kasir berhasil dibuka!');
                await fetchCurrentShift();
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('shiftUpdated'));
            } catch (error: any) {
                showError(toast, error?.response?.data?.message || 'Gagal buka shift');
            } finally {
                setSubmitLoad(false);
            }
        }
    });

    // Form close shift
    const formikClose = useFormik({
        initialValues: {
            closing_cash: 0,
            catatan_handover: ''
        },
        onSubmit: async (values) => {
            if (!shiftAktif) return;
            setSubmitLoad(true);
            try {
                const res = await postData(apiShiftClose, {
                    kode_cashier_shift: shiftAktif.kode_cashier_shift,
                    closing_cash: values.closing_cash,
                    catatan_handover: values.catatan_handover
                });

                const dataClose = res.data.data;
                setCloseSummary(dataClose);
                setShowCloseModal(false);
                await fetchCurrentShift();
                await fetchHistory();
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('shiftUpdated'));
            } catch (error: any) {
                showError(toast, error?.response?.data?.message || 'Gagal tutup shift');
            } finally {
                setSubmitLoad(false);
            }
        }
    });

    // Fetch active shift & detail
    const fetchCurrentShift = async () => {
        setLoading(true);
        try {
            const res = await postData(apiShiftCurrent, {});
            const currentData = res?.data?.data || null;
            setShiftAktif(currentData);

            if (currentData?.kode_cashier_shift) {
                // Pre-fill close form closing_cash with system cash estimate
                const estCash = currentData.stats?.system_cash || currentData.opening_cash;
                formikClose.setFieldValue('closing_cash', estCash);

                // Fetch comprehensive shift detail
                try {
                    const detailRes = await postData(apiShiftDetail, {
                        kode_cashier_shift: currentData.kode_cashier_shift
                    });
                    setActiveShiftDetail(detailRes?.data?.data || null);
                } catch (e) {
                    console.error('Failed to load active shift detail', e);
                }
            } else {
                setActiveShiftDetail(null);
            }
        } catch (error: any) {
            console.error('Gagal memuat status shift aktif', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch cashier counters
    const getCounter = async (kode_cabang: string) => {
        try {
            const res = await postData(apiCashierCounterDropdown, {
                kode_cabang,
                is_active: 1,
                perPage: 100,
                page: 1
            });
            const list = res.data.data || [];
            setCounterOptions(list);
            if (list.length > 0 && !formikOpen.values.kode_cashier_counter) {
                formikOpen.setFieldValue('kode_cashier_counter', list[0].kode_counter);
            }
        } catch (e) { }
    };

    // Fetch master shifts from database
    const getMasterShifts = async (kode_cabang: string) => {
        try {
            const res = await postData(apiMasterShiftDropdown, { kode_cabang });
            const list = res.data.data || [];
            setMasterShiftOptions(list);
            if (list.length > 0) {
                // Auto-suggest shift according to current hour or first shift
                const currentHour = new Date().getHours();
                const matched = list.find((s: any) => {
                    const startH = parseInt((s.waktu_mulai || '00:00:00').split(':')[0]);
                    const endH = parseInt((s.waktu_selesai || '23:59:59').split(':')[0]);
                    if (startH < endH) {
                        return currentHour >= startH && currentHour < endH;
                    }
                    return currentHour >= startH || currentHour < endH;
                }) || list[0];

                formikOpen.setFieldValue('sesi', matched.kode_shift);
                if (matched.default_opening_cash !== undefined) {
                    formikOpen.setFieldValue('opening_cash', Number(matched.default_opening_cash));
                }
            }
        } catch (e) { }
    };

    // Fetch past shift history
    const fetchHistory = async () => {
        setHistoryLoading(true);
        const branchCode = session?.user?.active_kode_cabang || session?.user?.default_kode_cabang;
        try {
            const res = await postData(apiShiftHistory, {
                kode_cabang: branchCode,
                search: historySearch,
                page: historyPage,
                perPage: historyPerPage
            });
            setHistoryRows(res?.data?.data || []);
            setHistoryTotal(res?.data?.pagination?.totalData || 0);
        } catch (e) {
            console.error('Gagal memuat riwayat shift', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Open detail modal for specific shift
    const handleViewDetail = async (shiftCode: string) => {
        setDetailLoading(true);
        setDetailDialogVisible(true);
        try {
            const res = await postData(apiShiftDetail, {
                kode_cashier_shift: shiftCode
            });
            setSelectedDetailData(res?.data?.data || null);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat rincian shift');
            setDetailDialogVisible(false);
        } finally {
            setDetailLoading(false);
        }
    };

    // Initial mount fetch
    useEffect(() => {
        fetchCurrentShift();
    }, []);

    // Update Live Shift Running Timer
    useEffect(() => {
        if (!shiftAktif?.opened_at) return;

        const updateTimer = () => {
            const start = new Date(shiftAktif.opened_at).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, now - start);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const pad = (n: number) => n.toString().padStart(2, '0');
            setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [shiftAktif?.opened_at]);

    // On branch change or mount
    useEffect(() => {
        const branchCode = session?.user?.active_kode_cabang || session?.user?.default_kode_cabang;
        if (branchCode) {
            formikOpen.setFieldValue('kode_cabang', branchCode);
            getCounter(branchCode);
            getMasterShifts(branchCode);
            fetchCurrentShift();
            fetchHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.active_kode_cabang, session?.user?.default_kode_cabang]);

    // Re-fetch history when search/page changes
    useEffect(() => {
        if (activeMainView === 'history') {
            fetchHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMainView, historyPage, historyPerPage]);

    // Quick cash presets for opening
    const setOpeningCashPreset = (amount: number) => {
        formikOpen.setFieldValue('opening_cash', amount);
    };

    // Quick fill system cash for closing
    const fillSystemCash = () => {
        const estCash = shiftAktif?.stats?.system_cash ?? (parseFloat(shiftAktif?.opening_cash as any) || 0);
        formikClose.setFieldValue('closing_cash', estCash);
    };

    // Calculation for close modal difference
    const closingDifference = useMemo(() => {
        if (!shiftAktif) return 0;
        const systemCash = shiftAktif.stats?.system_cash ?? (parseFloat(shiftAktif.opening_cash as any) || 0);
        return (formikClose.values.closing_cash || 0) - systemCash;
    }, [shiftAktif, formikClose.values.closing_cash]);

    const stats = shiftAktif?.stats;

    // Filtered lists for active shift roster tables
    const filteredCheckins = useMemo(() => {
        const list = activeShiftDetail?.checkins || [];
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter((item: any) =>
            (item.nomor_kamar && item.nomor_kamar.toLowerCase().includes(q)) ||
            (item.nama_tamu && item.nama_tamu.toLowerCase().includes(q)) ||
            (item.nama_tipe_kamar && item.nama_tipe_kamar.toLowerCase().includes(q)) ||
            (item.booking_type && item.booking_type.toLowerCase().includes(q))
        );
    }, [activeShiftDetail?.checkins, searchQuery]);

    const filteredCheckouts = useMemo(() => {
        const list = activeShiftDetail?.checkouts || [];
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter((item: any) =>
            (item.nomor_kamar && item.nomor_kamar.toLowerCase().includes(q)) ||
            (item.nama_tamu && item.nama_tamu.toLowerCase().includes(q)) ||
            (item.nama_tipe_kamar && item.nama_tipe_kamar.toLowerCase().includes(q))
        );
    }, [activeShiftDetail?.checkouts, searchQuery]);

    const filteredFacilities = useMemo(() => {
        const list = activeShiftDetail?.facilities || [];
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter((item: any) =>
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.nomor_kamar && item.nomor_kamar.toLowerCase().includes(q)) ||
            (item.nama_tamu && item.nama_tamu.toLowerCase().includes(q))
        );
    }, [activeShiftDetail?.facilities, searchQuery]);

    const filteredPayments = useMemo(() => {
        const list = activeShiftDetail?.payments || [];
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter((item: any) =>
            (item.kode_payment && item.kode_payment.toLowerCase().includes(q)) ||
            (item.payment_method && item.payment_method.toLowerCase().includes(q)) ||
            (item.nomor_kamar && item.nomor_kamar.toLowerCase().includes(q)) ||
            (item.nama_tamu && item.nama_tamu.toLowerCase().includes(q)) ||
            (item.reference_no && item.reference_no.toLowerCase().includes(q))
        );
    }, [activeShiftDetail?.payments, searchQuery]);

    // Sub-navigation tab config
    const subNavTabs = [
        { key: 'checkin' as const, icon: 'pi pi-sign-in', label: 'Check-In', count: activeShiftDetail?.checkins?.length ?? 0, color: '#16a34a' },
        { key: 'checkout' as const, icon: 'pi pi-sign-out', label: 'Check-Out', count: activeShiftDetail?.checkouts?.length ?? 0, color: '#ea580c' },
        { key: 'kas' as const, icon: 'pi pi-wallet', label: 'Kas & Rekon', count: null as null, color: '#2563eb' },
        { key: 'fasilitas' as const, icon: 'pi pi-sparkles', label: 'Fasilitas', count: activeShiftDetail?.facilities?.length ?? 0, color: '#9333ea' },
        { key: 'pembayaran' as const, icon: 'pi pi-dollar', label: 'Mutasi Kas', count: activeShiftDetail?.payments?.length ?? 0, color: '#0891b2' },
    ];

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                {/* <FrontOfficeNav /> */}

                <div className="card p-0" style={{ overflow: 'hidden', borderRadius: '16px' }}>

                    {/* ── Page Header ── */}
                    <div
                        className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 px-4 py-3"
                        style={{ borderBottom: '1px solid var(--surface-border)' }}
                    >
                        <div className="flex align-items-center gap-3">
                            <div
                                className="flex align-items-center justify-content-center border-round-xl"
                                style={{ width: '2.6rem', height: '2.6rem', background: 'var(--primary-50)' }}
                            >
                                <i className="pi pi-desktop" style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }} />
                            </div>
                            <div>
                                <h4 className="m-0 font-bold text-900" style={{ fontSize: '1.05rem' }}>
                                    Shift Kasir Front Desk
                                </h4>
                                <p className="text-500 text-xs mt-1 mb-0">
                                    Sesi operasional kasir, rekonsiliasi kas, dan pemantauan transaksi terintegrasi.
                                </p>
                            </div>
                        </div>

                        {/* Mode Switcher Pill */}
                        <div className="flex align-items-center gap-2">
                            {shiftAktif && (
                                <span className="text-xs text-500 hidden sm:inline-flex align-items-center gap-1">
                                    <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
                                    Live
                                </span>
                            )}
                            <div className="p-1 inline-flex border-round-3xl border-1 surface-border" style={{ background: 'var(--surface-100)' }}>
                                <button
                                    type="button"
                                    onClick={() => setActiveMainView('workspace')}
                                    className={`p-link px-3 py-2 border-round-3xl font-semibold text-xs transition-all flex align-items-center gap-2 ${activeMainView === 'workspace' ? 'bg-primary text-white shadow-1' : 'text-600 hover:text-900'}`}
                                >
                                    <i className="pi pi-desktop text-xs" />
                                    <span>{shiftAktif ? 'Sesi Berjalan' : 'Buka Shift'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveMainView('history'); fetchHistory(); }}
                                    className={`p-link px-3 py-2 border-round-3xl font-semibold text-xs transition-all flex align-items-center gap-2 ${activeMainView === 'history' ? 'bg-primary text-white shadow-1' : 'text-600 hover:text-900'}`}
                                >
                                    <i className="pi pi-history text-xs" />
                                    <span>Riwayat</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── MAIN CONTENT ── */}
                    <div className="p-4">

                        {/* ===================== VIEW: RIWAYAT ===================== */}
                        {activeMainView === 'history' ? (
                            <div>
                                <div className="flex flex-column sm:flex-row justify-content-between align-items-center mb-3 gap-2">
                                    <div className="p-inputgroup w-full sm:max-w-20rem">
                                        <span className="p-inputgroup-addon"><i className="pi pi-search" /></span>
                                        <InputText
                                            placeholder="Cari kode shift / kasir..."
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
                                            className="text-sm"
                                        />
                                        <Button label="Cari" onClick={fetchHistory} size="small" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button label="Kembali" icon="pi pi-arrow-left" outlined size="small" onClick={() => setActiveMainView('workspace')} />
                                        <Button label="Refresh" icon="pi pi-refresh" outlined severity="secondary" size="small" onClick={fetchHistory} loading={historyLoading} />
                                    </div>
                                </div>

                                <div className="surface-border border-1 border-round-xl overflow-hidden shadow-1">
                                    <DataTable
                                        value={historyRows}
                                        loading={historyLoading}
                                        emptyMessage="Belum ada riwayat shift kasir tercatat."
                                        paginator
                                        rows={historyPerPage}
                                        totalRecords={historyTotal}
                                        lazy
                                        first={(historyPage - 1) * historyPerPage}
                                        onPage={(e) => {
                                            setHistoryPage((e.page || 0) + 1);
                                            setHistoryPerPage(e.rows || 10);
                                        }}
                                        size="small"
                                        className="p-datatable-sm"
                                        rowHover
                                        responsiveLayout="scroll"
                                        tableStyle={{ minWidth: '78rem' }}
                                    >
                                        <Column
                                            field="kode_cashier_shift"
                                            header="Kode Shift"
                                            body={(r) => (
                                                <div className="flex align-items-center gap-1">
                                                    <i className="pi pi-hashtag text-400" style={{ fontSize: '0.65rem' }} />
                                                    <span className="font-bold text-primary" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                        {r.kode_cashier_shift}
                                                    </span>
                                                </div>
                                            )}
                                            style={{ minWidth: '135px', width: '135px' }}
                                        />
                                        <Column
                                            field="sesi"
                                            header="Sesi"
                                            align="center"
                                            alignHeader="center"
                                            headerStyle={{ textAlign: 'center' }}
                                            body={(r) => getSesiBadge(r.sesi, r.nama_shift, r.is_night_audit)}
                                            style={{ minWidth: '130px', width: '130px' }}
                                        />
                                        <Column
                                            field="cashier_name"
                                            header="Kasir & Counter"
                                            body={(r) => (
                                                <div>
                                                    <div className="font-semibold text-900 text-sm">{r.cashier_name || r.cashier_username || '-'}</div>
                                                    <div className="text-xs text-500 mt-1 flex align-items-center gap-1">
                                                        <i className="pi pi-desktop text-400" style={{ fontSize: '0.65rem' }} />
                                                        <span>{r.nama_counter || '-'}</span>
                                                    </div>
                                                </div>
                                            )}
                                            style={{ minWidth: '170px' }}
                                        />
                                        <Column
                                            field="opened_at"
                                            header="Waktu Buka / Tutup"
                                            body={(r) => (
                                                <div className="text-xs" style={{ whiteSpace: 'nowrap' }}>
                                                    <div className="flex align-items-center gap-2">
                                                        <span className="inline-flex align-items-center justify-content-center border-circle bg-green-50 text-green-600" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.65rem' }}>
                                                            <i className="pi pi-sign-in" />
                                                        </span>
                                                        <span className="font-medium text-700">{formatDateSystem(r.opened_at, 'dd/MM/yyyy HH:mm')}</span>
                                                    </div>
                                                    <div className="flex align-items-center gap-2 mt-1">
                                                        <span className="inline-flex align-items-center justify-content-center border-circle bg-orange-50 text-orange-600" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.65rem' }}>
                                                            <i className="pi pi-sign-out" />
                                                        </span>
                                                        {r.closed_at ? (
                                                            <span className="text-600">{formatDateSystem(r.closed_at, 'dd/MM/yyyy HH:mm')}</span>
                                                        ) : (
                                                            <Tag severity="success" value="Aktif" className="text-xs py-0 px-2 font-normal" />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            style={{ minWidth: '175px', width: '175px' }}
                                        />
                                        <Column
                                            field="total_checkin_kamar"
                                            header="Check-in"
                                            align="center"
                                            alignHeader="center"
                                            headerStyle={{ textAlign: 'center' }}
                                            body={(r) => (
                                                <div className="flex flex-column align-items-center">
                                                    <span className="font-bold text-green-700 text-sm">
                                                        {r.total_checkin_kamar || 0} <span className="text-xs text-500 font-normal">kamar</span>
                                                    </span>
                                                    <span className="text-xs text-500">{r.total_checkin_pax || 0} tamu</span>
                                                </div>
                                            )}
                                            style={{ minWidth: '115px', width: '115px' }}
                                        />
                                        <Column
                                            field="total_checkout_kamar"
                                            header="Checkout"
                                            align="center"
                                            alignHeader="center"
                                            headerStyle={{ textAlign: 'center' }}
                                            body={(r) => (
                                                <div className="flex flex-column align-items-center">
                                                    <span className="font-bold text-orange-700 text-sm">
                                                        {r.total_checkout_kamar || 0} <span className="text-xs text-500 font-normal">kamar</span>
                                                    </span>
                                                    <span className="text-xs text-500">{r.total_checkout_pax || 0} tamu</span>
                                                </div>
                                            )}
                                            style={{ minWidth: '115px', width: '115px' }}
                                        />
                                        <Column
                                            field="system_cash"
                                            header="Kas Sistem"
                                            align="right"
                                            alignHeader="right"
                                            headerStyle={{ textAlign: 'right' }}
                                            body={(r) => (
                                                <span className="text-sm font-semibold text-900">
                                                    {formatCurrency(r.system_cash)}
                                                </span>
                                            )}
                                            style={{ minWidth: '130px', width: '130px' }}
                                        />
                                        <Column
                                            field="closing_cash"
                                            header="Kas Fisik"
                                            align="right"
                                            alignHeader="right"
                                            headerStyle={{ textAlign: 'right' }}
                                            body={(r) => (
                                                r.closing_cash !== null ? (
                                                    <span className="text-sm font-semibold text-800">
                                                        {formatCurrency(r.closing_cash)}
                                                    </span>
                                                ) : (
                                                    <span className="text-400 font-medium">–</span>
                                                )
                                            )}
                                            style={{ minWidth: '130px', width: '130px' }}
                                        />
                                        <Column
                                            field="cash_difference"
                                            header="Selisih"
                                            align="right"
                                            alignHeader="right"
                                            headerStyle={{ textAlign: 'right' }}
                                            body={(r) => {
                                                if (r.cash_difference === null) return <span className="text-400 font-medium">–</span>;
                                                const diff = Number(r.cash_difference);
                                                if (diff === 0) {
                                                    return (
                                                        <Tag severity="success" value="Rp 0" className="text-xs font-semibold px-2" />
                                                    );
                                                }
                                                return (
                                                    <Tag
                                                        severity={diff > 0 ? 'info' : 'danger'}
                                                        value={formatCurrency(diff)}
                                                        className="text-xs font-semibold px-2"
                                                    />
                                                );
                                            }}
                                            style={{ minWidth: '125px', width: '125px' }}
                                        />
                                        <Column
                                            field="status"
                                            header="Status"
                                            align="center"
                                            alignHeader="center"
                                            headerStyle={{ textAlign: 'center' }}
                                            body={(r) => (
                                                <Tag
                                                    severity={r.status === 'open' ? 'success' : 'secondary'}
                                                    value={r.status === 'open' ? 'OPEN' : 'CLOSED'}
                                                    className="text-xs font-bold"
                                                />
                                            )}
                                            style={{ minWidth: '95px', width: '95px' }}
                                        />
                                        <Column
                                            header="Aksi"
                                            align="center"
                                            alignHeader="center"
                                            headerStyle={{ textAlign: 'center' }}
                                            body={(r) => (
                                                <Button
                                                    label="Rincian"
                                                    icon="pi pi-receipt"
                                                    outlined
                                                    size="small"
                                                    className="py-1 px-2 text-xs"
                                                    onClick={() => handleViewDetail(r.kode_cashier_shift)}
                                                />
                                            )}
                                            style={{ minWidth: '100px', width: '100px' }}
                                        />
                                    </DataTable>
                                </div>
                            </div>
                        ) : loading ? (
                            /* ── Skeleton Loading ── */
                            <div className="grid">
                                <div className="col-12">
                                    <Skeleton height="5.5rem" className="mb-3 border-round-xl" />
                                </div>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="col-12 sm:col-6 lg:col-3">
                                        <Skeleton height="7.5rem" className="border-round-xl" />
                                    </div>
                                ))}
                                <div className="col-12">
                                    <Skeleton height="14rem" className="border-round-xl" />
                                </div>
                            </div>
                        ) : !shiftAktif ? (
                            /* ================= VIEW 2: FORM BUKA SHIFT BARU ================= */
                            <div className="grid justify-content-center my-3">
                                <div className="col-12 md:col-8 lg:col-6">
                                    <div className="surface-card border-round-2xl border-1 surface-border p-4 shadow-2">
                                        <div className="flex align-items-center gap-3 mb-4 pb-3 border-bottom-1 surface-border">
                                            <div className="w-3rem h-3rem border-round-circle bg-primary-50 text-primary flex align-items-center justify-content-center">
                                                <i className="pi pi-lock-open text-2xl font-bold"></i>
                                            </div>
                                            <div>
                                                <h5 className="m-0 font-bold text-900">Buka Sesi Shift Kasir</h5>
                                                <p className="text-xs text-500 m-0 mt-1">Pilih loket & sesi kerja, lalu masukkan modal awal kas fisik di laci kasir.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={formikOpen.handleSubmit} className="p-fluid">
                                            {/* Cabang */}
                                            <div className="field mb-3">
                                                <label className="font-semibold text-xs text-600 block mb-1">
                                                    <i className="pi pi-building mr-1" />Cabang Operasional
                                                </label>
                                                <div
                                                    className="flex align-items-center gap-2 px-3 py-2 border-round-lg"
                                                    style={{ background: 'var(--surface-100)', border: '1px solid var(--surface-border)' }}
                                                >
                                                    <i className="pi pi-map-marker text-primary text-sm" />
                                                    <span className="font-semibold text-sm text-800">
                                                        {session?.user?.active_kode_cabang || '–'}&nbsp;–&nbsp;{session?.user?.active_branch_name || 'Semua Cabang'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Loket Counter */}
                                            <div className="field mb-3">
                                                <div className="flex justify-content-between align-items-center mb-1">
                                                    <label htmlFor="kode_cashier_counter" className="font-semibold text-xs text-700 m-0">
                                                        Loket / Cashier Counter <span className="text-red-500">*</span>
                                                    </label>
                                                    <span className="text-xs text-500">
                                                        {counterOptions.length} loket aktif
                                                    </span>
                                                </div>
                                                <Dropdown
                                                    id="kode_cashier_counter"
                                                    name="kode_cashier_counter"
                                                    value={formikOpen.values.kode_cashier_counter}
                                                    options={counterOptions}
                                                    optionLabel="name"
                                                    optionValue="kode_counter"
                                                    onChange={(e) => formikOpen.setFieldValue('kode_cashier_counter', e.value)}
                                                    placeholder={counterOptions.length === 0 ? "Belum ada loket aktif di cabang ini" : "Pilih Loket Kasir"}
                                                    className={`text-sm ${formikOpen.errors.kode_cashier_counter && formikOpen.touched.kode_cashier_counter ? 'p-invalid' : ''}`}
                                                />
                                                {formikOpen.errors.kode_cashier_counter && formikOpen.touched.kode_cashier_counter && (
                                                    <small className="p-error">{formikOpen.errors.kode_cashier_counter}</small>
                                                )}
                                                {counterOptions.length === 0 && (
                                                    <small className="text-orange-600 block mt-1 text-xs">
                                                        <i className="pi pi-exclamation-triangle mr-1" />
                                                        Belum ada loket kasir aktif untuk cabang ini. Daftarkan loket terlebih dahulu di menu Master Shift Kasir.
                                                    </small>
                                                )}
                                            </div>

                                            {/* Sesi Shift – Visual Card Picker */}
                                            <div className="field mb-3">
                                                <label className="font-semibold text-xs text-600 block mb-2">
                                                    <i className="pi pi-clock mr-1" />Sesi Kerja Shift <span className="text-red-500">*</span>
                                                </label>
                                                <div className="grid grid-nogutter gap-2">
                                                    {masterShiftOptions.length > 0 ? (
                                                        masterShiftOptions.map((opt: any) => {
                                                            const selected = formikOpen.values.sesi === opt.kode_shift || formikOpen.values.sesi === opt.nama_shift;
                                                            const isNight = opt.is_night_audit === 1;
                                                            const themeColor = isNight ? '#6366f1' : (opt.urutan === 1 ? '#f59e0b' : '#f97316');
                                                            const themeBg = isNight ? '#eef2ff' : (opt.urutan === 1 ? '#fffbeb' : '#fff7ed');
                                                            const icon = isNight ? 'pi pi-moon' : (opt.urutan === 1 ? 'pi pi-sun' : 'pi pi-clock');
                                                            const timeLabel = `${opt.waktu_mulai ? opt.waktu_mulai.substring(0, 5) : '07:00'} – ${opt.waktu_selesai ? opt.waktu_selesai.substring(0, 5) : '15:00'}`;

                                                            return (
                                                                <div
                                                                    key={opt.kode_shift || opt.id}
                                                                    onClick={() => {
                                                                        formikOpen.setFieldValue('sesi', opt.kode_shift);
                                                                        if (opt.default_opening_cash !== undefined) {
                                                                            formikOpen.setFieldValue('opening_cash', Number(opt.default_opening_cash));
                                                                        }
                                                                    }}
                                                                    className="cursor-pointer border-round-xl p-3 flex-1 flex flex-column align-items-center text-center transition-all transition-duration-200"
                                                                    style={{
                                                                        minWidth: '130px',
                                                                        border: selected ? `2px solid ${themeColor}` : '1.5px solid var(--surface-border)',
                                                                        background: selected ? themeBg : 'var(--surface-card)',
                                                                        boxShadow: selected ? `0 0 0 3px ${themeColor}22` : 'none',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="border-round-circle flex align-items-center justify-content-center mb-2"
                                                                        style={{ width: '2.2rem', height: '2.2rem', background: selected ? themeColor : 'var(--surface-100)', color: selected ? '#fff' : themeColor }}
                                                                    >
                                                                        <i className={icon} style={{ fontSize: '1rem' }} />
                                                                    </div>
                                                                    <span className="font-bold text-xs" style={{ color: selected ? themeColor : 'var(--text-color)' }}>
                                                                        {opt.nama_shift}
                                                                    </span>
                                                                    <span className="text-500 mt-1" style={{ fontSize: '0.68rem' }}>
                                                                        {timeLabel}
                                                                    </span>
                                                                    {isNight && (
                                                                        <Tag severity="warning" value="Night Audit" className="mt-2 text-xs py-0 px-2" />
                                                                    )}
                                                                    <span className="text-teal-700 font-semibold mt-1" style={{ fontSize: '0.65rem' }}>
                                                                        Modal: {formatCurrency(opt.default_opening_cash)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        SESI_OPTIONS.map((opt) => {
                                                            const selected = formikOpen.values.sesi === opt.value;
                                                            return (
                                                                <div
                                                                    key={opt.value}
                                                                    onClick={() => formikOpen.setFieldValue('sesi', opt.value)}
                                                                    className="cursor-pointer border-round-xl p-3 flex-1 flex flex-column align-items-center text-center transition-all transition-duration-200"
                                                                    style={{
                                                                        border: selected ? `2px solid ${opt.color}` : '1.5px solid var(--surface-border)',
                                                                        background: selected ? opt.bg : 'var(--surface-card)',
                                                                        boxShadow: selected ? `0 0 0 3px ${opt.color}22` : 'none',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="border-round-circle flex align-items-center justify-content-center mb-2"
                                                                        style={{ width: '2.2rem', height: '2.2rem', background: selected ? opt.color : 'var(--surface-100)', color: selected ? '#fff' : opt.color }}
                                                                    >
                                                                        <i className={opt.icon} style={{ fontSize: '1rem' }} />
                                                                    </div>
                                                                    <span className="font-bold text-xs" style={{ color: selected ? opt.color : 'var(--text-color)' }}>{opt.label}</span>
                                                                    <span className="text-400 mt-1" style={{ fontSize: '0.65rem' }}>{opt.sublabel}</span>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <small className="text-500 block mt-2 text-xs">
                                                    <i className="pi pi-info-circle mr-1" />
                                                    {masterShiftOptions.length > 0
                                                        ? 'Jadwal shift operasional terdaftar pada cabang aktif. Modal awal kas otomatis disesuaikan.'
                                                        : `Disarankan otomatis sesuai jam (${new Date().getHours()}:00).`}
                                                </small>
                                            </div>

                                            {/* Modal Awal (Cash) */}
                                            <div className="field mb-4">
                                                <label htmlFor="opening_cash" className="font-semibold text-xs text-700">
                                                    Modal Kas Awal di Laci (Opening Cash) <span className="text-red-500">*</span>
                                                </label>
                                                <InputNumber
                                                    id="opening_cash"
                                                    value={formikOpen.values.opening_cash}
                                                    onValueChange={(e) => formikOpen.setFieldValue('opening_cash', e.value)}
                                                    mode="currency"
                                                    currency="IDR"
                                                    locale="id-ID"
                                                    min={0}
                                                    className={formikOpen.errors.opening_cash && formikOpen.touched.opening_cash ? 'p-invalid' : ''}
                                                />
                                                {/* Preset Chips */}
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {[500000, 1000000, 2000000].map(amt => (
                                                        <button
                                                            key={amt}
                                                            type="button"
                                                            onClick={() => setOpeningCashPreset(amt)}
                                                            className="p-link text-xs px-3 py-1 border-round-3xl font-semibold transition-all"
                                                            style={{
                                                                border: `1px solid ${formikOpen.values.opening_cash === amt ? 'var(--primary-color)' : 'var(--surface-border)'}`,
                                                                background: formikOpen.values.opening_cash === amt ? 'var(--primary-50)' : 'transparent',
                                                                color: formikOpen.values.opening_cash === amt ? 'var(--primary-color)' : 'var(--text-color-secondary)',
                                                            }}
                                                        >
                                                            Rp {(amt / 1000).toFixed(0)}K
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                label="Buka Sesi Shift Sekarang"
                                                icon="pi pi-check-circle"
                                                type="submit"
                                                loading={submitLoad}
                                                className="w-full py-3 font-bold text-sm"
                                            />
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ================= VIEW 3: SESI KASIR BERJALAN (COMMAND CENTER) ================= */
                            <div>
                                {/* 1. Sleek Hero Banner */}
                                <div className="surface-card border-round-2xl border-1 surface-border p-3 md:p-4 mb-4 shadow-1 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex flex-column lg:flex-row justify-content-between align-items-start lg:align-items-center gap-3">
                                        {/* Left: Info Shift */}
                                        <div className="flex align-items-center gap-3">
                                            {/* <div className="w-3rem h-3rem border-round-circle bg-green-500 text-white flex align-items-center justify-content-center shadow-2 flex-shrink-0">
                                            <i className="pi pi-user-check text-xl"></i>
                                        </div> */}
                                            <div>
                                                <div className="flex align-items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-xl font-bold text-900">{shiftAktif.kode_cashier_shift}</span>
                                                    <Tag severity="success" value="AKTIF" icon="pi pi-circle-fill text-xs mr-1 animate-pulse" className="font-bold text-xs" />
                                                    {getSesiBadge(shiftAktif.sesi, shiftAktif.nama_shift, shiftAktif.is_night_audit)}
                                                </div>
                                                <div className="text-xs text-600 flex align-items-center gap-2 flex-wrap">
                                                    <span><strong>Kasir:</strong> {shiftAktif.cashier_name || shiftAktif.cashier_username || session?.user?.name || '-'}</span>
                                                    <span>•</span>
                                                    <span><strong>Loket:</strong> {shiftAktif.nama_counter}</span>
                                                    <span>•</span>
                                                    <span><strong>Buka:</strong> {formatDateSystem(shiftAktif.opened_at, 'HH:mm')} WIB</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Timer & Unified Actions */}
                                        <div className="flex align-items-center gap-2 w-full lg:w-auto justify-content-between lg:justify-content-end">
                                            <div className="text-center px-3 py-2 bg-white border-round-xl border-1 surface-border shadow-1">
                                                <span className="text-xs text-500 uppercase block font-semibold" style={{ fontSize: '0.65rem' }}>Durasi Bekerja</span>
                                                <span className="text-base font-bold font-mono text-primary">{elapsedTime}</span>
                                            </div>
                                            <Button
                                                icon="pi pi-refresh"
                                                outlined
                                                severity="secondary"
                                                tooltip="Perbarui Data Sesi"
                                                tooltipOptions={{ position: 'top' }}
                                                onClick={fetchCurrentShift}
                                                loading={loading}
                                                className="p-button-sm"
                                            />
                                            <Button
                                                label="Cetak Slip Sesi"
                                                icon="pi pi-print"
                                                outlined
                                                size="small"
                                                onClick={() => handleViewDetail(shiftAktif.kode_cashier_shift)}
                                            />
                                            <Button
                                                label="Tutup & Serah Terima"
                                                icon="pi pi-lock"
                                                severity="danger"
                                                size="small"
                                                className="font-bold"
                                                onClick={() => setShowCloseModal(true)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. KPI Cards – click-to-navigate tabs */}
                                <div className="grid mb-4">
                                    {/* Card 1: Check-in */}
                                    <div className="col-12 sm:col-6 lg:col-3">
                                        <div
                                            onClick={() => { setActiveSection('checkin'); setSearchQuery(''); }}
                                            className={`surface-card border-round-xl p-3 shadow-1 h-full flex flex-column justify-content-between cursor-pointer transition-all transition-duration-200 hover:shadow-3 ${activeSection === 'checkin' ? 'border-2' : 'border-1 surface-border'}`}
                                            style={activeSection === 'checkin' ? { borderColor: '#16a34a', background: '#f0fdf4' } : {}}
                                        >
                                            <div className="flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <p className="text-xs uppercase font-bold text-500 m-0 mb-1">Tamu Check-In</p>
                                                    <div className="text-2xl font-bold text-900">
                                                        {stats?.total_checkin_kamar || 0} <span className="text-sm font-normal text-500">Kamar</span>
                                                    </div>
                                                    <div className="text-xs font-semibold mt-1" style={{ color: '#16a34a' }}>
                                                        {stats?.total_checkin_pax || 0} Tamu (Pax)
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 flex align-items-center justify-content-center border-round-lg" style={{ width: '2.4rem', height: '2.4rem', background: '#dcfce7', color: '#16a34a' }}>
                                                    <i className="pi pi-sign-in" />
                                                </div>
                                            </div>
                                            <div className="border-top-1 surface-border pt-2 text-xs text-500 flex justify-content-between">
                                                <span>Walk-In: <strong>{stats?.walkin_kamar || 0}</strong></span>
                                                <span>Reservasi: <strong>{stats?.reservasi_kamar || 0}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Check-out */}
                                    <div className="col-12 sm:col-6 lg:col-3">
                                        <div
                                            onClick={() => { setActiveSection('checkout'); setSearchQuery(''); }}
                                            className={`surface-card border-round-xl p-3 shadow-1 h-full flex flex-column justify-content-between cursor-pointer transition-all transition-duration-200 hover:shadow-3 ${activeSection === 'checkout' ? 'border-2' : 'border-1 surface-border'}`}
                                            style={activeSection === 'checkout' ? { borderColor: '#ea580c', background: '#fff7ed' } : {}}
                                        >
                                            <div className="flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <p className="text-xs uppercase font-bold text-500 m-0 mb-1">Tamu Check-Out</p>
                                                    <div className="text-2xl font-bold text-900">
                                                        {stats?.total_checkout_kamar || 0} <span className="text-sm font-normal text-500">Kamar</span>
                                                    </div>
                                                    <div className="text-xs font-semibold mt-1" style={{ color: '#ea580c' }}>
                                                        {stats?.total_checkout_pax || 0} Tamu (Pax)
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 flex align-items-center justify-content-center border-round-lg" style={{ width: '2.4rem', height: '2.4rem', background: '#ffedd5', color: '#ea580c' }}>
                                                    <i className="pi pi-sign-out" />
                                                </div>
                                            </div>
                                            <div className="border-top-1 surface-border pt-2 text-xs text-500">
                                                Pelunasan &amp; pengembalian kunci
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: Kas Laci Fisik */}
                                    <div className="col-12 sm:col-6 lg:col-3">
                                        <div
                                            onClick={() => { setActiveSection('kas'); setSearchQuery(''); }}
                                            className={`surface-card border-round-xl p-3 shadow-1 h-full flex flex-column justify-content-between cursor-pointer transition-all transition-duration-200 hover:shadow-3 ${activeSection === 'kas' ? 'border-2' : 'border-1 surface-border'}`}
                                            style={activeSection === 'kas' ? { borderColor: '#2563eb', background: '#eff6ff' } : {}}
                                        >
                                            <div className="flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <p className="text-xs uppercase font-bold text-500 m-0 mb-1">Kas Laci (Fisik)</p>
                                                    <div className="text-lg font-bold" style={{ color: '#2563eb' }}>
                                                        {formatCurrency(stats?.system_cash || 0)}
                                                    </div>
                                                    <div className="text-xs text-500 mt-1">
                                                        Modal: {formatCurrency(stats?.opening_cash || 0)}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 flex align-items-center justify-content-center border-round-lg" style={{ width: '2.4rem', height: '2.4rem', background: '#dbeafe', color: '#2563eb' }}>
                                                    <i className="pi pi-wallet" />
                                                </div>
                                            </div>
                                            <div className="border-top-1 surface-border pt-2 text-xs flex justify-content-between" style={{ color: '#2563eb' }}>
                                                <span>Non-Tunai:</span>
                                                <span className="font-bold">{formatCurrency(stats?.total_non_cash_in || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 4: Fasilitas Terjual */}
                                    <div className="col-12 sm:col-6 lg:col-3">
                                        <div
                                            onClick={() => { setActiveSection('fasilitas'); setSearchQuery(''); }}
                                            className={`surface-card border-round-xl p-3 shadow-1 h-full flex flex-column justify-content-between cursor-pointer transition-all transition-duration-200 hover:shadow-3 ${activeSection === 'fasilitas' ? 'border-2' : 'border-1 surface-border'}`}
                                            style={activeSection === 'fasilitas' ? { borderColor: '#9333ea', background: '#faf5ff' } : {}}
                                        >
                                            <div className="flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <p className="text-xs uppercase font-bold text-500 m-0 mb-1">Fasilitas Tambahan</p>
                                                    <div className="text-2xl font-bold text-900">
                                                        {stats?.total_fasilitas_item || 0} <span className="text-sm font-normal text-500">Item</span>
                                                    </div>
                                                    <div className="text-xs font-semibold mt-1" style={{ color: '#9333ea' }}>
                                                        {formatCurrency(stats?.total_fasilitas_amount || 0)}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 flex align-items-center justify-content-center border-round-lg" style={{ width: '2.4rem', height: '2.4rem', background: '#f3e8ff', color: '#9333ea' }}>
                                                    <i className="pi pi-sparkles" />
                                                </div>
                                            </div>
                                            <div className="border-top-1 surface-border pt-2 text-xs text-500">
                                                Extra bed, laundry, resto, spa, dll
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Streamlined Workspace Container */}
                                <div className="surface-card border-round-2xl border-1 surface-border p-3 md:p-4 shadow-1">
                                    {/* Section Sub-Navigation Pills & Live Search */}
                                    <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3 mb-3 pb-3 border-bottom-1 surface-border">
                                        <div className="flex align-items-center gap-1 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => { setActiveSection('checkin'); setSearchQuery(''); }}
                                                className={`p-link px-3 py-2 border-round-lg text-xs font-bold transition-all flex align-items-center gap-2 ${activeSection === 'checkin' ? 'bg-primary text-white' : 'surface-100 text-700 hover:surface-200'}`}
                                            >
                                                <i className="pi pi-sign-in"></i>
                                                <span>Check-In ({activeShiftDetail?.checkins?.length || 0})</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setActiveSection('checkout'); setSearchQuery(''); }}
                                                className={`p-link px-3 py-2 border-round-lg text-xs font-bold transition-all flex align-items-center gap-2 ${activeSection === 'checkout' ? 'bg-primary text-white' : 'surface-100 text-700 hover:surface-200'}`}
                                            >
                                                <i className="pi pi-sign-out"></i>
                                                <span>Check-Out ({activeShiftDetail?.checkouts?.length || 0})</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setActiveSection('kas'); setSearchQuery(''); }}
                                                className={`p-link px-3 py-2 border-round-lg text-xs font-bold transition-all flex align-items-center gap-2 ${activeSection === 'kas' ? 'bg-primary text-white' : 'surface-100 text-700 hover:surface-200'}`}
                                            >
                                                <i className="pi pi-wallet"></i>
                                                <span>Kas Laci & Rekon</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setActiveSection('fasilitas'); setSearchQuery(''); }}
                                                className={`p-link px-3 py-2 border-round-lg text-xs font-bold transition-all flex align-items-center gap-2 ${activeSection === 'fasilitas' ? 'bg-primary text-white' : 'surface-100 text-700 hover:surface-200'}`}
                                            >
                                                <i className="pi pi-sparkles"></i>
                                                <span>Fasilitas ({activeShiftDetail?.facilities?.length || 0})</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setActiveSection('pembayaran'); setSearchQuery(''); }}
                                                className={`p-link px-3 py-2 border-round-lg text-xs font-bold transition-all flex align-items-center gap-2 ${activeSection === 'pembayaran' ? 'bg-primary text-white' : 'surface-100 text-700 hover:surface-200'}`}
                                            >
                                                <i className="pi pi-dollar"></i>
                                                <span>Mutasi Kas ({activeShiftDetail?.payments?.length || 0})</span>
                                            </button>
                                        </div>

                                        {/* Live Search Box */}
                                        {activeSection !== 'kas' && (
                                            <div className="p-inputgroup w-full sm:w-16rem">
                                                <span className="p-inputgroup-addon bg-transparent py-1"><i className="pi pi-search text-xs"></i></span>
                                                <InputText
                                                    placeholder="Filter daftar..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="p-inputtext-sm text-xs py-1"
                                                />
                                                {searchQuery && (
                                                    <Button icon="pi pi-times" text size="small" onClick={() => setSearchQuery('')} />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* SECTION BODY */}
                                    {activeSection === 'checkin' && (
                                        /* Tab Check-in Table */
                                        <DataTable
                                            value={filteredCheckins}
                                            paginator
                                            rows={6}
                                            emptyMessage="Belum ada tamu check-in pada sesi shift ini."
                                            size="small"
                                            className="p-datatable-sm"
                                        >
                                            <Column field="checkin_at" header="Jam" body={(r) => formatDateSystem(r.checkin_at, 'HH:mm')} style={{ width: '80px' }} />
                                            <Column field="nomor_kamar" header="No. Kamar" body={(r) => <span className="font-bold text-primary">{r.nomor_kamar || r.kode_kamar}</span>} style={{ width: '110px' }} />
                                            <Column field="nama_tipe_kamar" header="Tipe Kamar" />
                                            <Column field="nama_tamu" header="Nama Tamu" className="font-semibold" />
                                            <Column field="guest_count" header="Pax" body={(r) => <Tag severity="info" value={`${r.guest_count || 1} Tamu`} />} style={{ width: '90px' }} />
                                            <Column field="booking_type" header="Jenis" body={(r) => (
                                                <Tag severity={r.booking_type === 'walk_in' ? 'warning' : 'success'} value={r.booking_type === 'walk_in' ? 'Walk-In' : 'Reservasi'} />
                                            )} style={{ width: '110px' }} />
                                            <Column field="deposit_amount" header="Deposit Awal" body={(r) => formatCurrency(r.deposit_amount)} className="text-right" />
                                        </DataTable>
                                    )}

                                    {activeSection === 'checkout' && (
                                        /* Tab Check-out Table */
                                        <DataTable
                                            value={filteredCheckouts}
                                            paginator
                                            rows={6}
                                            emptyMessage="Belum ada tamu checkout pada sesi shift ini."
                                            size="small"
                                            className="p-datatable-sm"
                                        >
                                            <Column field="checkout_at" header="Jam" body={(r) => formatDateSystem(r.checkout_at, 'HH:mm')} style={{ width: '80px' }} />
                                            <Column field="nomor_kamar" header="No. Kamar" body={(r) => <span className="font-bold text-primary">{r.nomor_kamar || r.kode_kamar}</span>} style={{ width: '110px' }} />
                                            <Column field="nama_tipe_kamar" header="Tipe Kamar" />
                                            <Column field="nama_tamu" header="Nama Tamu" className="font-semibold" />
                                            <Column field="guest_count" header="Pax" body={(r) => <Tag severity="info" value={`${r.guest_count || 1} Tamu`} />} style={{ width: '90px' }} />
                                            <Column field="grand_total" header="Grand Total Tagihan" body={(r) => formatCurrency(r.grand_total)} className="text-right font-bold" />
                                        </DataTable>
                                    )}

                                    {activeSection === 'kas' && (
                                        /* Tab Rekap Kas & Rekonsiliasi Drawer */
                                        <div className="grid">
                                            <div className="col-12 md:col-6">
                                                <div className="surface-50 p-4 border-round-xl border-1 surface-border h-full flex flex-column justify-content-between">
                                                    <div>
                                                        <h6 className="font-bold text-900 mb-3 flex align-items-center gap-2">
                                                            <i className="pi pi-money-bill text-green-600 font-bold"></i>
                                                            Perhitungan Kas Laci Fisik (Cash Drawer)
                                                        </h6>
                                                        <div className="flex justify-content-between py-2 border-bottom-1 surface-border text-sm">
                                                            <span className="text-600">Modal Kas Awal (Opening Cash):</span>
                                                            <span className="font-bold">{formatCurrency(stats?.opening_cash || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-content-between py-2 border-bottom-1 surface-border text-sm">
                                                            <span className="text-600">Penerimaan Kas Tunai Shift Ini:</span>
                                                            <span className="font-bold text-green-700">+ {formatCurrency(stats?.total_cash_in || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-content-between py-3 font-bold text-base bg-green-50 border-round px-3 mt-3 border-1 border-green-200">
                                                            <span className="text-green-950">Total Kas Seharusnya di Laci:</span>
                                                            <span className="text-green-900 text-lg">{formatCurrency(stats?.system_cash || 0)}</span>
                                                        </div>
                                                    </div>
                                                    <small className="text-500 block mt-3">
                                                        💡 Seluruh uang tunai fisik yang ada di laci saat penutupan shift harus cocok dengan Total Kas Seharusnya di atas.
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="col-12 md:col-6">
                                                <div className="surface-50 p-4 border-round-xl border-1 surface-border h-full flex flex-column justify-content-between">
                                                    <div>
                                                        <h6 className="font-bold text-900 mb-3 flex align-items-center gap-2">
                                                            <i className="pi pi-credit-card text-blue-600 font-bold"></i>
                                                            Penerimaan Non-Tunai & Mutasi Bank
                                                        </h6>
                                                        <div className="flex justify-content-between py-2 border-bottom-1 surface-border text-sm">
                                                            <span className="text-600">Total Non-Tunai (EDC/QRIS/Card):</span>
                                                            <span className="font-bold text-blue-700">{formatCurrency(stats?.total_non_cash_in || 0)}</span>
                                                        </div>
                                                        <div className="flex justify-content-between py-2 border-bottom-1 surface-border text-sm">
                                                            <span className="text-600">Total Seluruh Transaksi Masuk:</span>
                                                            <span className="font-bold text-primary">{formatCurrency(stats?.total_payment_in || 0)}</span>
                                                        </div>
                                                        <div className="mt-3 p-3 bg-blue-50 border-round border-1 border-blue-200">
                                                            <span className="text-xs text-blue-900 block font-semibold">
                                                                💡 Cocokkan struk settlement EDC dan bukti notifikasi QRIS/transfer dengan daftar pada tab Mutasi Kas.
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        label="Lihat Semua Riwayat Mutasi Kas"
                                                        icon="pi pi-arrow-right"
                                                        size="small"
                                                        outlined
                                                        className="w-full mt-3"
                                                        onClick={() => setActiveSection('pembayaran')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeSection === 'fasilitas' && (
                                        /* Tab Fasilitas Table */
                                        <DataTable
                                            value={filteredFacilities}
                                            paginator
                                            rows={6}
                                            emptyMessage="Belum ada fasilitas tambahan yang dicatat pada sesi shift ini."
                                            size="small"
                                            className="p-datatable-sm"
                                            rowHover
                                            responsiveLayout="scroll"
                                        >
                                            <Column field="posted_at" header="Jam" align="center" alignHeader="center" headerStyle={{ textAlign: 'center' }} body={(r) => formatDateSystem(r.posted_at, 'HH:mm')} style={{ width: '80px' }} />
                                            <Column field="nomor_kamar" header="Kamar" body={(r) => r.nomor_kamar ? `Kamar ${r.nomor_kamar}` : '-'} style={{ width: '120px' }} />
                                            <Column field="description" header="Item Layanan / Fasilitas" className="font-semibold" />
                                            <Column field="qty" header="Qty" align="center" alignHeader="center" headerStyle={{ textAlign: 'center' }} style={{ width: '70px' }} />
                                            <Column field="unit_price" header="Harga Satuan" align="right" alignHeader="right" headerStyle={{ textAlign: 'right' }} body={(r) => formatCurrency(r.unit_price)} className="text-right" style={{ width: '130px' }} />
                                            <Column field="amount" header="Subtotal" align="right" alignHeader="right" headerStyle={{ textAlign: 'right' }} body={(r) => formatCurrency(r.amount)} className="text-right font-bold text-primary" style={{ width: '140px' }} />
                                        </DataTable>
                                    )}

                                    {activeSection === 'pembayaran' && (
                                        /* Tab Pembayaran Table */
                                        <DataTable
                                            value={filteredPayments}
                                            paginator
                                            rows={6}
                                            emptyMessage="Belum ada transaksi pembayaran pada sesi shift ini."
                                            size="small"
                                            className="p-datatable-sm"
                                            rowHover
                                            responsiveLayout="scroll"
                                        >
                                            <Column field="kode_payment" header="No. Bukti" className="font-semibold" style={{ width: '150px' }} />
                                            <Column field="paid_at" header="Jam" align="center" alignHeader="center" headerStyle={{ textAlign: 'center' }} body={(r) => formatDateSystem(r.paid_at, 'HH:mm')} style={{ width: '80px' }} />
                                            <Column field="nomor_kamar" header="Kamar / Tamu" body={(r) => (
                                                <div>
                                                    <div className="font-semibold">{r.nomor_kamar ? `Kamar ${r.nomor_kamar}` : '-'}</div>
                                                    <div className="text-xs text-500">{r.nama_tamu || '-'}</div>
                                                </div>
                                            )} />
                                            <Column field="payment_method" header="Metode" align="center" alignHeader="center" headerStyle={{ textAlign: 'center' }} body={(r) => {
                                                const disp = formatPaymentDisplay(r.payment_method, r.bank_name, r.card_type);
                                                return (
                                                    <Tag
                                                        severity={disp.severity}
                                                        value={disp.label}
                                                        icon={disp.icon}
                                                        className="text-xs px-2 py-1 font-bold"
                                                    />
                                                );
                                            }} style={{ minWidth: '150px' }} />
                                            <Column field="reference_no" header="No. Ref / Kartu" body={(r) => r.reference_no || '-'} />
                                            <Column field="amount" header="Nominal" align="right" alignHeader="right" headerStyle={{ textAlign: 'right' }} body={(r) => formatCurrency(r.amount)} className="text-right font-bold text-primary" style={{ width: '140px' }} />
                                        </DataTable>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>{/* end p-4 content */}
                </div>{/* end card */}
            </div>{/* end col-12 */}

            {/* ================= MODAL FORM TUTUP SHIFT (INTUITIVE & GUIDED) ================= */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-lock text-red-500 text-xl font-bold"></i>
                        <span className="font-bold text-900">Serah Terima & Tutup Sesi Shift Kasir</span>
                    </div>
                }
                visible={showCloseModal}
                onHide={() => setShowCloseModal(false)}
                style={{ width: '520px' }}
                breakpoints={{ '960px': '75vw', '641px': '92vw' }}
                modal
            >
                {shiftAktif && (
                    <form onSubmit={formikClose.handleSubmit} className="p-fluid">
                        <div className="surface-100 p-3 border-round-xl mb-3">
                            <div className="flex justify-content-between mb-1">
                                <span className="text-500 text-xs">Petugas:</span>
                                <span className="font-bold text-sm">{shiftAktif.cashier_name || shiftAktif.cashier_username || session?.user?.name || '-'}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span className="text-500 text-xs">Sesi Kerja:</span>
                                <span className="font-semibold text-xs text-primary">{(shiftAktif.sesi || 'Pagi').toUpperCase()}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span className="text-500 text-xs">Modal Kas Awal:</span>
                                <span className="font-semibold text-sm">{formatCurrency(shiftAktif.opening_cash)}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span className="text-500 text-xs">Penerimaan Tunai:</span>
                                <span className="font-semibold text-sm text-green-700">+ {formatCurrency(stats?.total_cash_in || 0)}</span>
                            </div>
                            <div className="flex justify-content-between pt-2 border-top-1 surface-border font-bold">
                                <span>Kas Seharusnya di Laci:</span>
                                <span className="text-primary text-base">{formatCurrency(stats?.system_cash || 0)}</span>
                            </div>
                        </div>

                        {/* Input Uang Fisik Laci + 1-Click System Cash Fill */}
                        <div className="field mb-3">
                            <div className="flex justify-content-between align-items-center mb-1">
                                <label htmlFor="closing_cash" className="font-semibold text-xs text-700 m-0">
                                    Hitung Uang Fisik di Laci Kasir (Cash) <span className="text-red-500">*</span>
                                </label>
                                <Button
                                    type="button"
                                    label="⚡ Samakan dengan Sistem"
                                    text
                                    className="p-0 text-xs text-primary font-bold"
                                    onClick={fillSystemCash}
                                />
                            </div>
                            <InputNumber
                                id="closing_cash"
                                value={formikClose.values.closing_cash}
                                onValueChange={(e) => formikClose.setFieldValue('closing_cash', e.value)}
                                mode="currency"
                                currency="IDR"
                                locale="id-ID"
                                min={0}
                                className="w-full"
                                autoFocus
                            />

                            {/* Live Reconciliation Difference Box */}
                            <div className={`mt-2 p-2 border-round-lg text-xs font-bold flex align-items-center justify-content-between ${closingDifference === 0 ? 'bg-green-50 text-green-800 border-1 border-green-300' : closingDifference > 0 ? 'bg-blue-50 text-blue-800 border-1 border-blue-300' : 'bg-red-50 text-red-800 border-1 border-red-300'}`}>
                                <span>Status Selisih Kas:</span>
                                <span>
                                    {formatCurrency(closingDifference)} {closingDifference === 0 ? '✓ (SEIMBANG / PAS)' : closingDifference > 0 ? '(LEBIH)' : '(KURANG)'}
                                </span>
                            </div>
                        </div>

                        <div className="field mb-4">
                            <label htmlFor="catatan_handover" className="font-semibold text-xs text-700">
                                Catatan Handover / Pesan Serah Terima (Opsional)
                            </label>
                            <InputTextarea
                                id="catatan_handover"
                                value={formikClose.values.catatan_handover}
                                onChange={formikClose.handleChange}
                                rows={2}
                                placeholder="Contoh: Kamar 202 titip kunci, EDC Mandiri habis kertas..."
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="flex justify-content-end gap-2">
                            <Button label="Batal" type="button" severity="secondary" outlined onClick={() => setShowCloseModal(false)} />
                            <Button label="Tutup & Cetak Handover" icon="pi pi-check" severity="danger" type="submit" loading={submitLoad} />
                        </div>
                    </form>
                )}
            </Dialog>

            {/* ================= MODAL SUMMARY PENUTUPAN SHIFT ================= */}
            <Dialog
                header="Ringkasan Penutupan Sesi Shift Kasir"
                visible={!!closeSummary}
                onHide={() => setCloseSummary(null)}
                style={{ width: '480px' }}
                breakpoints={{ '960px': '75vw', '641px': '92vw' }}
                modal
                closable={false}
                footer={
                    <div className="flex justify-content-between align-items-center w-full">
                        <Button
                            label="Lihat Rincian / Cetak"
                            icon="pi pi-print"
                            outlined
                            onClick={() => {
                                const sc = closeSummary?.kode_cashier_shift;
                                setCloseSummary(null);
                                if (sc) handleViewDetail(sc);
                            }}
                        />
                        <Button
                            label="Selesai"
                            icon="pi pi-check"
                            onClick={() => setCloseSummary(null)}
                            autoFocus
                        />
                    </div>
                }
            >
                {closeSummary && (
                    <div className="m-0 text-center">
                        <i className={`pi ${closeSummary.cash_difference === 0 ? 'pi-check-circle text-green-500' : 'pi-exclamation-triangle text-orange-500'} mb-3`} style={{ fontSize: '3rem' }}></i>
                        <h5 className="mb-1 font-bold text-900">Shift Berhasil Ditutup</h5>
                        <p className="text-xs text-500 mb-3">{closeSummary.kode_cashier_shift} ({getSesiBadge(closeSummary.sesi)})</p>

                        <div className="text-left surface-100 p-3 border-round mb-3">
                            <div className="flex justify-content-between mb-2">
                                <span className="text-500 text-xs">Total Check-in:</span>
                                <span className="font-bold text-xs">{closeSummary.total_checkin_kamar || 0} Kamar ({closeSummary.total_checkin_pax || 0} Pax)</span>
                            </div>
                            <div className="flex justify-content-between mb-2">
                                <span className="text-500 text-xs">Total Check-out:</span>
                                <span className="font-bold text-xs">{closeSummary.total_checkout_kamar || 0} Kamar ({closeSummary.total_checkout_pax || 0} Pax)</span>
                            </div>
                            <div className="flex justify-content-between mb-2">
                                <span className="text-500 text-xs">Fasilitas Terjual:</span>
                                <span className="font-bold text-xs">{closeSummary.total_fasilitas_item || 0} Item ({formatCurrency(closeSummary.total_fasilitas_amount || 0)})</span>
                            </div>
                            <hr className="my-2 border-top-1 surface-border" />
                            <div className="flex justify-content-between mb-2">
                                <span className="text-500 text-xs">Kas Sistem (Seharusnya):</span>
                                <span className="font-bold">{formatCurrency(closeSummary.system_cash)}</span>
                            </div>
                            <div className="flex justify-content-between mb-2">
                                <span className="text-500 text-xs">Fisik Kas Laci (Closing):</span>
                                <span className="font-bold">{formatCurrency(closeSummary.closing_cash)}</span>
                            </div>
                            <div className="flex justify-content-between align-items-center pt-2 border-top-1 surface-border">
                                <span className="font-bold text-sm">Selisih Kas:</span>
                                <span className={`font-bold text-sm ${closeSummary.cash_difference < 0 ? 'text-red-500' : closeSummary.cash_difference > 0 ? 'text-blue-500' : 'text-green-500'}`}>
                                    {formatCurrency(closeSummary.cash_difference)} {closeSummary.cash_difference === 0 ? '(SEIMBANG)' : closeSummary.cash_difference > 0 ? '(LEBIH)' : '(KURANG)'}
                                </span>
                            </div>
                        </div>

                        {closeSummary.catatan_handover && (
                            <p className="text-xs text-left bg-yellow-50 p-2 border-round border-1 border-yellow-200 text-yellow-900 m-0">
                                <strong>Catatan Handover:</strong> {closeSummary.catatan_handover}
                            </p>
                        )}
                    </div>
                )}
            </Dialog>

            {/* ================= REUSABLE SHIFT DETAIL & PRINT DIALOG ================= */}
            <DialogShiftDetail
                visible={detailDialogVisible}
                onHide={() => {
                    setDetailDialogVisible(false);
                    setSelectedDetailData(null);
                }}
                detailData={selectedDetailData}
                loading={detailLoading}
            />
        </div>
    );
};

export default Page;
