'use client';

import { Toast } from 'primereact/toast';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { apiReservationData, apiCheckinSubmit, apiShiftCurrent, apiCabangDropdown, apiCancelSubmit } from './components/endpoints';
import { showError, showSuccess, formatCurrency } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import CashierPicCard from '@/app/components/payment/CashierPicCard';
// import FrontOfficeNav from '@/app/components/navigation/FrontOfficeNav';
import { buildStandardReferenceNo } from '@/lib/tools/paymentTools';
import DialogReschedule from './components/DialogReschedule';
import DialogCancelRefund from './components/DialogCancelRefund';

interface GroupedReservation {
    kode_reservasi: string;
    kode_cabang: string;
    waktu_checkin?: string;
    waktu_checkout?: string;
    kode_tamu: string;
    guest_name: string;
    guest_phone?: string;
    guest_email?: string;
    guest_id_number?: string;
    check_in_date: string;
    check_out_date: string;
    special_request?: string;
    res_status: string;
    deposit_amount: number;
    kode_folio?: string;
    folio_subtotal?: number;
    folio_tax_amount?: number;
    folio_service_charge?: number;
    folio_grand_total?: number;
    charges?: any[];
    rooms: any[];
    total_rooms: number;
    checked_in_rooms: number;
    cancelled_rooms: number;
    pending_rooms: number;
    room_types_summary: string;
    nights: number;
}

const CheckinContent = () => {
    const toast = useRef<Toast>(null);
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterCabang, setFilterCabang] = useState('');
    const [cabangOptions, setCabangOptions] = useState<any[]>([]);
    const [filterDate, setFilterDate] = useState<Date | null>(null); // Default: semua tanggal
    const [globalFilter, setGlobalFilter] = useState('');
    const [showFilter, setShowFilter] = useState(false); // Default: panel filter tertutup agar layar lega
    const [expandedRows, setExpandedRows] = useState<any>(null);

    // Inisialisasi keyword pencarian jika diarahkan dari halaman booking atau halaman lain (?search=RSVxxx)
    useEffect(() => {
        if (!searchParams) return;
        const searchVal = searchParams.get('search') || searchParams.get('kode_reservasi');
        if (searchVal) {
            setGlobalFilter(searchVal);
        }
    }, [searchParams]);

    // Deposit handling dialog (Check-in Individu)
    const [showDepositDialog, setShowDepositDialog] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any>(null);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'transfer'>('cash');
    const [bankName, setBankName] = useState('BCA');
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftCode, setShiftCode] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    // Early Check-In state (Single)
    const [isEarlyCheckin, setIsEarlyCheckin] = useState(false);
    const [applyEarlyCheckinFee, setApplyEarlyCheckinFee] = useState(true);
    const [earlyCheckinFeeAmount, setEarlyCheckinFeeAmount] = useState<number>(150000);

    // Group Check-in Dialog
    const [showGroupCheckinDialog, setShowGroupCheckinDialog] = useState(false);
    const [selectedGroupRes, setSelectedGroupRes] = useState<GroupedReservation | null>(null);
    const [groupCheckinLoading, setGroupCheckinLoading] = useState(false);

    // Early Check-In state (Group)
    const [isEarlyCheckinGroup, setIsEarlyCheckinGroup] = useState(false);
    const [applyEarlyCheckinFeeGroup, setApplyEarlyCheckinFeeGroup] = useState(true);
    const [earlyCheckinFeeAmountGroup, setEarlyCheckinFeeAmountGroup] = useState<number>(150000);

    // Partial Room Cancellation Dialog
    const [showCancelSingleRoomDialog, setShowCancelSingleRoomDialog] = useState(false);
    const [selectedRoomToCancel, setSelectedRoomToCancel] = useState<{ group: GroupedReservation; room: any } | null>(null);
    const [cancelSingleReason, setCancelSingleReason] = useState('Permintaan Tamu (Guest Request)');
    const [cancelSingleNotes, setCancelSingleNotes] = useState('');
    const [cancelSingleLoading, setCancelSingleLoading] = useState(false);

    // Dialog Reschedule & Cancel Refund
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
    const [showCancelRefundDialog, setShowCancelRefundDialog] = useState(false);

    const fetchCabang = async () => {
        try {
            const res = await postData(apiCabangDropdown, {});
            if (res?.data?.data && Array.isArray(res.data.data)) {
                setCabangOptions(res.data.data.map((c: any) => ({
                    label: `${c.kode_cabang} - ${c.nama_cabang || c.nama_hotel}`,
                    value: c.kode_cabang
                })));
            }
        } catch (error) {
            console.error("Failed to fetch cabang", error);
        }
    };

    const fetchShift = async () => {
        try {
            const res = await postData(apiShiftCurrent, {});
            setShiftAktif(res.data.data);
        } catch (error) {
            console.error("Failed to fetch shift", error);
        }
    };

    useEffect(() => {
        fetchShift();
        fetchCabang();
        if (session?.user?.active_kode_cabang) {
            setFilterCabang(session.user.active_kode_cabang);
        }
    }, [session?.user?.active_kode_cabang]);

    useEffect(() => {
        if (filterCabang) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterCabang, filterDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const payload: any = {
                kode_cabang: filterCabang,
                status: ['reserved', 'confirmed', 'booked']
            };
            if (filterDate) {
                payload.check_in_date = formatDateSystem(filterDate, "yyyy-MM-dd");
            }
            const res = await postData(apiReservationData, payload);
            setData(res.data.data || []);
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Gagal memuat data reservasi");
        } finally {
            setLoading(false);
        }
    };

    // Group flat room records into Master Reservations
    const groupedData: GroupedReservation[] = useMemo(() => {
        const map = new Map<string, GroupedReservation>();

        for (const item of data) {
            const key = item.kode_reservasi;
            if (!map.has(key)) {
                map.set(key, {
                    kode_reservasi: item.kode_reservasi,
                    kode_cabang: item.kode_cabang,
                    waktu_checkin: item.waktu_checkin || '14:00:00',
                    waktu_checkout: item.waktu_checkout || '12:00:00',
                    kode_tamu: item.kode_tamu,
                    guest_name: item.guest_name,
                    guest_phone: item.guest_phone,
                    guest_email: item.guest_email,
                    guest_id_number: item.guest_id_number,
                    check_in_date: item.check_in_date,
                    check_out_date: item.check_out_date,
                    special_request: item.special_request,
                    res_status: item.res_status,
                    deposit_amount: parseFloat(item.deposit_amount || 0),
                    kode_folio: item.kode_folio,
                    folio_subtotal: item.folio_subtotal,
                    folio_tax_amount: item.folio_tax_amount,
                    folio_service_charge: item.folio_service_charge,
                    folio_grand_total: item.folio_grand_total,
                    charges: item.charges || [],
                    rooms: [],
                    total_rooms: 0,
                    checked_in_rooms: 0,
                    cancelled_rooms: 0,
                    pending_rooms: 0,
                    room_types_summary: '',
                    nights: parseInt(item.nights, 10) || 1
                });
            }

            const group = map.get(key)!;
            group.rooms.push(item);
            group.total_rooms += 1;
            if (item.room_status === 'checked_in') {
                group.checked_in_rooms += 1;
            } else if (item.room_status === 'cancelled') {
                group.cancelled_rooms += 1;
            } else {
                group.pending_rooms += 1;
            }
        }

        for (const group of map.values()) {
            const typeCount: Record<string, number> = {};
            for (const rm of group.rooms) {
                if (rm.room_status !== 'cancelled') {
                    const tName = rm.tipe_kamar_name || 'Kamar';
                    typeCount[tName] = (typeCount[tName] || 0) + 1;
                }
            }
            const activeSummary = Object.entries(typeCount)
                .map(([name, count]) => `${count}x ${name}`)
                .join(', ');

            group.room_types_summary = activeSummary || 'Semua Kamar Dibatalkan';
        }

        return Array.from(map.values());
    }, [data]);

    const filteredGroupedData = useMemo(() => {
        if (!globalFilter) return groupedData;
        const search = globalFilter.toLowerCase();
        return groupedData.filter((item) => {
            const matchRes = item.kode_reservasi && item.kode_reservasi.toLowerCase().includes(search);
            const matchGuest = item.guest_name && item.guest_name.toLowerCase().includes(search);
            const matchTypes = item.room_types_summary && item.room_types_summary.toLowerCase().includes(search);
            const matchStatus = item.res_status && item.res_status.toLowerCase().includes(search);
            const matchRooms = item.rooms.some((r: any) =>
                (r.nomor_kamar && String(r.nomor_kamar).toLowerCase().includes(search)) ||
                (r.tipe_kamar_name && r.tipe_kamar_name.toLowerCase().includes(search)) ||
                (r.room_status && r.room_status.toLowerCase().includes(search))
            );
            return matchRes || matchGuest || matchTypes || matchStatus || matchRooms;
        });
    }, [groupedData, globalFilter]);

    const handleResetFilter = () => {
        setGlobalFilter('');
        setFilterDate(null); // Reset ke semua tanggal
        if (session?.user?.active_kode_cabang) {
            setFilterCabang(session.user.active_kode_cabang);
        }
    };

    const processCheckIn = async (roomData: any) => {
        const cinStr = roomData.check_in_date ? roomData.check_in_date.substring(0, 10) : '';
        const todayStr = formatDateSystem(new Date(), 'yyyy-MM-dd') || '';
        if (cinStr > todayStr) {
            showError(toast, `Jadwal check-in belum tiba. Reservasi ini dijadwalkan tiba pada tanggal ${formatDateSystem(new Date(roomData.check_in_date), 'dd/MM/yyyy')}. Silakan gunakan menu Reschedule jika tamu memajukan tanggal menginap.`);
            return;
        }

        const stdTime = roomData.waktu_checkin || '14:00:00';
        const nowTime = formatDateSystem(new Date(), 'HH:mm:ss') || '';
        const isEarly = Boolean(cinStr === todayStr && nowTime < stdTime);

        setSelectedRes(roomData);
        setIsEarlyCheckin(isEarly);
        setApplyEarlyCheckinFee(true);
        setEarlyCheckinFeeAmount(150000);

        setShiftCode(shiftAktif?.kode_cashier_shift || '');
        setPaymentMethod('cash');
        setBankName('');
        setCardType('debit');
        setReferenceNo('');
        setDepositAmount(0);
        setShowDepositDialog(true);
    };

    const doSubmitCheckin = async (kode_reservasi_room: string, payloadDeposit: any = {}) => {
        setLoading(true);
        try {
            const res = await postData(apiCheckinSubmit, {
                kode_reservasi_room,
                ...payloadDeposit
            });
            if (res.data.status === '00') {
                showSuccess(toast, `Check-in berhasil! Kamar: ${res.data.data.kode_kamar_assigned}${res.data.data.is_early_checkin ? ' (Early Check-In)' : ''}`);
                setShowDepositDialog(false);
                loadData();
            } else {
                showError(toast, res.data.message);
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Gagal check-in");
        } finally {
            setLoading(false);
        }
    };

    const handleDepositSubmit = () => {
        if (depositAmount > 0 && !shiftAktif) {
            showError(toast, 'Shift kasir belum dibuka. Silakan buka shift terlebih dahulu sebelum memproses check-in dengan deposit.');
            return;
        }
        const stdRef = depositAmount > 0 ? buildStandardReferenceNo(paymentMethod, bankName, cardType, referenceNo) : null;

        doSubmitCheckin(selectedRes.kode_reservasi_room, {
            payment_method: depositAmount > 0 ? (paymentMethod || 'cash') : null,
            bank_name: depositAmount > 0 ? (bankName || null) : null,
            card_type: depositAmount > 0 && paymentMethod === 'card' ? (cardType || 'debit') : null,
            reference_no: stdRef,
            kode_cashier_shift: depositAmount > 0 ? (shiftCode || shiftAktif?.kode_cashier_shift || null) : null,
            deposit_amount: depositAmount > 0 ? depositAmount : 0,
            guest_count: selectedRes?.guest_count || 1,
            is_early_checkin: isEarlyCheckin,
            apply_early_checkin_fee: isEarlyCheckin ? applyEarlyCheckinFee : false,
            early_checkin_amount: isEarlyCheckin && applyEarlyCheckinFee ? earlyCheckinFeeAmount : 0
        });
    };

    // Group Check-in Handlers
    const openGroupCheckin = (group: GroupedReservation) => {
        const cinStr = group.check_in_date ? group.check_in_date.substring(0, 10) : '';
        const todayStr = formatDateSystem(new Date(), 'yyyy-MM-dd') || '';
        if (cinStr > todayStr) {
            showError(toast, `Jadwal check-in belum tiba. Reservasi ini dijadwalkan tiba pada tanggal ${formatDateSystem(new Date(group.check_in_date), 'dd/MM/yyyy')}. Silakan gunakan menu Reschedule jika tamu memajukan tanggal menginap.`);
            return;
        }

        const pending = group.rooms.filter((r) => r.room_status !== 'checked_in' && r.room_status !== 'cancelled');
        if (pending.length === 0) {
            showError(toast, 'Semua kamar pada reservasi ini sudah di-check-in atau dibatalkan.');
            return;
        }

        const stdTime = group.waktu_checkin || '14:00:00';
        const nowTime = formatDateSystem(new Date(), 'HH:mm:ss') || '';
        const isEarly = Boolean(cinStr === todayStr && nowTime < stdTime);

        setSelectedGroupRes(group);
        setIsEarlyCheckinGroup(isEarly);
        setApplyEarlyCheckinFeeGroup(true);
        setEarlyCheckinFeeAmountGroup(150000);

        setShiftCode(shiftAktif?.kode_cashier_shift || '');
        setDepositAmount(0);
        setPaymentMethod('cash');
        setBankName('');
        setCardType('debit');
        setReferenceNo('');
        setShowGroupCheckinDialog(true);
    };

    const handleGroupCheckinSubmit = async () => {
        if (!selectedGroupRes) return;
        const pendingRooms = selectedGroupRes.rooms.filter((r: any) => r.room_status !== 'checked_in' && r.room_status !== 'cancelled');
        if (pendingRooms.length === 0) return;

        if (depositAmount > 0 && !shiftAktif) {
            showError(toast, 'Shift kasir belum dibuka. Buka shift terlebih dahulu sebelum menerima uang jaminan.');
            return;
        }

        setGroupCheckinLoading(true);
        let successCount = 0;
        let failedRooms: string[] = [];

        const stdRef = depositAmount > 0 ? buildStandardReferenceNo(paymentMethod, bankName, cardType, referenceNo) : null;

        for (let i = 0; i < pendingRooms.length; i++) {
            const room = pendingRooms[i];
            const payloadDeposit = (i === 0 && depositAmount > 0) ? {
                payment_method: paymentMethod || 'cash',
                bank_name: bankName || null,
                card_type: paymentMethod === 'card' ? (cardType || 'debit') : null,
                reference_no: stdRef,
                kode_cashier_shift: shiftCode || shiftAktif?.kode_cashier_shift || null,
                deposit_amount: depositAmount
            } : {};

            try {
                const res = await postData(apiCheckinSubmit, {
                    kode_reservasi_room: room.kode_reservasi_room,
                    ...payloadDeposit,
                    is_early_checkin: isEarlyCheckinGroup,
                    apply_early_checkin_fee: isEarlyCheckinGroup ? applyEarlyCheckinFeeGroup : false,
                    early_checkin_amount: isEarlyCheckinGroup && applyEarlyCheckinFeeGroup ? earlyCheckinFeeAmountGroup : 0
                });
                if (res.data.status === '00') {
                    successCount++;
                } else {
                    failedRooms.push(`${room.tipe_kamar_name || room.kode_reservasi_room}: ${res.data.message}`);
                }
            } catch (err: any) {
                failedRooms.push(`${room.tipe_kamar_name || room.kode_reservasi_room}: ${err?.response?.data?.message || err.message}`);
            }
        }

        setGroupCheckinLoading(false);
        setShowGroupCheckinDialog(false);

        if (successCount > 0) {
            showSuccess(toast, `Berhasil check-in ${successCount} kamar untuk reservasi ${selectedGroupRes.kode_reservasi}!${isEarlyCheckinGroup ? ' (Disertai Early Check-In)' : ''}`);
            loadData();
        }
        if (failedRooms.length > 0) {
            showError(toast, `Gagal check-in pada beberapa kamar: ${failedRooms.join('; ')}`);
        }
    };

    // Partial Single Room Cancel Handlers
    const handleCancelSingleRoomClick = (group: GroupedReservation, rm: any) => {
        const activeRooms = group.rooms.filter((r) => r.room_status !== 'cancelled');
        if (activeRooms.length <= 1) {
            // Kamar aktif terakhir -> Arahkan ke pembatalan reservasi penuh beserta kebijakan refund
            setSelectedRes(rm);
            setShowCancelRefundDialog(true);
        } else {
            // Pembatalan parsial hanya untuk kamar ini
            setSelectedRoomToCancel({ group, room: rm });
            setCancelSingleReason('Permintaan Tamu (Guest Request)');
            setCancelSingleNotes('');
            setShowCancelSingleRoomDialog(true);
        }
    };

    const handleCancelSingleRoomSubmit = async () => {
        if (!selectedRoomToCancel) return;
        setCancelSingleLoading(true);
        try {
            const res = await postData(apiCancelSubmit, {
                kode_reservasi: selectedRoomToCancel.group.kode_reservasi,
                kode_reservasi_room: selectedRoomToCancel.room.kode_reservasi_room,
                cancellation_reason: cancelSingleReason,
                notes: cancelSingleNotes
            });

            if (res.data?.status === '00') {
                showSuccess(toast, res.data.message || 'Kamar berhasil dibatalkan dari reservasi');
                setShowCancelSingleRoomDialog(false);
                loadData();
            } else {
                showError(toast, res.data?.message || 'Gagal membatalkan kamar');
            }
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || e.message || 'Gagal membatalkan kamar');
        } finally {
            setCancelSingleLoading(false);
        }
    };

    const resNumberBody = (group: GroupedReservation) => {
        return (
            <div className="flex flex-column gap-1">
                <div className="flex align-items-center gap-2">
                    <span className="font-bold text-sm text-900">{group.kode_reservasi}</span>
                    {group.total_rooms > 1 ? (
                        <Tag severity="info" value={`${group.total_rooms} Kamar`} className="text-xs px-2 py-0" />
                    ) : (
                        <Tag severity="secondary" value="1 Kamar" className="text-xs px-2 py-0" />
                    )}
                </div>
                {group.special_request && (
                    <span className="text-xs text-500 line-clamp-1" title={group.special_request}>
                        <i className="pi pi-comment mr-1"></i>
                        {group.special_request}
                    </span>
                )}
            </div>
        );
    };

    const guestNameBody = (group: GroupedReservation) => {
        return (
            <div className="flex flex-column">
                <span className="font-semibold text-sm text-900">{group.guest_name}</span>
                <div className="flex align-items-center gap-2 text-xs text-500 mt-1">
                    {group.guest_phone && (
                        <span>
                            <i className="pi pi-phone text-xs mr-1"></i>
                            {group.guest_phone}
                        </span>
                    )}
                    {group.guest_id_number && (
                        <span>
                            <i className="pi pi-id-card text-xs mr-1"></i>
                            {group.guest_id_number}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const checkInDateBody = (group: GroupedReservation) => {
        if (!group.check_in_date) return '-';
        const cinStr = group.check_in_date.substring(0, 10);
        const todayStr = formatDateSystem(new Date(), 'yyyy-MM-dd') || '';

        const isToday = Boolean(todayStr && cinStr === todayStr);
        const isPast = Boolean(todayStr && cinStr < todayStr);

        return (
            <div className="flex flex-column align-items-center gap-1">
                <span className="font-semibold text-sm text-900">
                    {formatDateSystem(new Date(group.check_in_date), 'dd/MM/yyyy')}
                </span>
                {isToday && (
                    <Tag severity="success" value="Hari Ini" className="text-xs px-2 py-0" />
                )}
                {isPast && (
                    <Tag severity="warning" value="Lewat Jadwal" className="text-xs px-2 py-0" />
                )}
                {!isToday && !isPast && (
                    <Tag severity="info" value="Mendatang" className="text-xs px-2 py-0" />
                )}
            </div>
        );
    };

    const roomsSummaryBody = (group: GroupedReservation) => {
        const activeCount = group.total_rooms - group.cancelled_rooms;
        return (
            <div className="flex flex-column gap-1">
                <span className="text-sm font-medium text-800 line-clamp-2" title={group.room_types_summary}>
                    {group.room_types_summary}
                </span>
                <div className="flex align-items-center gap-1 mt-1 flex-wrap">
                    <Tag
                        severity={
                            group.pending_rooms === 0 && group.checked_in_rooms > 0
                                ? 'success'
                                : group.checked_in_rooms > 0
                                ? 'warning'
                                : 'secondary'
                        }
                        value={`${group.checked_in_rooms}/${activeCount} Checked-In`}
                        className="text-xs px-2 py-0"
                    />
                    {group.cancelled_rooms > 0 && (
                        <Tag
                            severity="danger"
                            value={`${group.cancelled_rooms} Batal`}
                            className="text-xs px-2 py-0"
                        />
                    )}
                </div>
            </div>
        );
    };

    const statusGroupBody = (group: GroupedReservation) => {
        const activeCount = group.total_rooms - group.cancelled_rooms;
        if (activeCount === 0) {
            return <Tag severity="danger" value="CANCELLED" />;
        }
        if (group.pending_rooms === 0 && group.checked_in_rooms > 0) {
            return <Tag severity="success" value="SELESAI (CHECKED-IN)" />;
        }
        if (group.checked_in_rooms > 0) {
            return <Tag severity="warning" value={`PARTIAL (${group.checked_in_rooms}/${activeCount})`} />;
        }
        const sev = group.res_status === 'confirmed' ? 'success' : 'warning';
        return <Tag severity={sev} value={(group.res_status || 'BOOKED').toUpperCase()} />;
    };

    const parentActionBody = (group: GroupedReservation) => {
        const isAllCheckedIn = group.pending_rooms === 0 && group.checked_in_rooms > 0;
        const isSingleRoom = group.total_rooms === 1;

        const cinStr = group.check_in_date ? group.check_in_date.substring(0, 10) : '';
        const todayStr = formatDateSystem(new Date(), 'yyyy-MM-dd') || '';
        const isFuture = Boolean(todayStr && cinStr > todayStr);

        return (
            <div className="flex align-items-center justify-content-center gap-2">
                {isAllCheckedIn ? (
                    <Tag severity="success" value="Selesai" icon="pi pi-check" className="px-2 py-1 font-semibold" />
                ) : isSingleRoom ? (
                    <Button
                        label="Check In"
                        icon="pi pi-sign-in"
                        className="p-button-sm p-button-success font-semibold"
                        onClick={() => processCheckIn(group.rooms[0])}
                        disabled={loading || isFuture}
                        tooltip={isFuture ? `Belum jadwal check-in (Jadwal: ${formatDateSystem(new Date(group.check_in_date), 'dd/MM/yyyy')}). Gunakan tombol Reschedule (🗓️) jika ingin memajukan kedatangan.` : undefined}
                        tooltipOptions={{ position: 'top' }}
                    />
                ) : (
                    <Button
                        label="Check-in Semua"
                        icon="pi pi-users"
                        className="p-button-sm p-button-success font-semibold"
                        tooltip={isFuture ? `Belum jadwal check-in (Jadwal: ${formatDateSystem(new Date(group.check_in_date), 'dd/MM/yyyy')}). Gunakan tombol Reschedule (🗓️) jika ingin memajukan kedatangan.` : `Check-in langsung ${group.pending_rooms} kamar yang tersisa`}
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => openGroupCheckin(group)}
                        disabled={loading || group.pending_rooms === 0 || isFuture}
                    />
                )}
                <Button
                    icon="pi pi-calendar"
                    tooltip="Ubah Tanggal (Reschedule Rombongan)"
                    tooltipOptions={{ position: 'top' }}
                    className="p-button-sm p-button-outlined p-button-warning"
                    onClick={() => {
                        setSelectedRes(group.rooms[0]);
                        setShowRescheduleDialog(true);
                    }}
                    disabled={loading}
                />
                <Button
                    icon="pi pi-times-circle"
                    tooltip="Batalkan Seluruh Reservasi / Refund"
                    tooltipOptions={{ position: 'top' }}
                    className="p-button-sm p-button-outlined p-button-danger"
                    onClick={() => {
                        setSelectedRes(group.rooms[0]);
                        setShowCancelRefundDialog(true);
                    }}
                    disabled={loading}
                />
            </div>
        );
    };

    // Sub-Table for Row Expansion
    const rowExpansionTemplate = (group: GroupedReservation) => {
        const activeCount = group.total_rooms - group.cancelled_rooms;
        const cinStr = group.check_in_date ? group.check_in_date.substring(0, 10) : '';
        const todayStr = formatDateSystem(new Date(), 'yyyy-MM-dd') || '';
        const isFuture = Boolean(todayStr && cinStr > todayStr);

        return (
            <div className="p-3 surface-50 border-round-xl border-1 surface-border my-2 mx-1 shadow-1">
                <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-building text-primary font-bold text-lg"></i>
                        <span className="font-bold text-900 text-sm">
                            Rincian Unit Kamar ({group.rooms.length} Kamar) — Reservasi {group.kode_reservasi}
                        </span>
                        <Tag
                            severity={group.pending_rooms === 0 && group.checked_in_rooms > 0 ? 'success' : group.checked_in_rooms > 0 ? 'warning' : 'info'}
                            value={`${group.checked_in_rooms} dari ${activeCount} Kamar Selesai`}
                            className="text-xs"
                        />
                        {group.cancelled_rooms > 0 && (
                            <Tag severity="danger" value={`${group.cancelled_rooms} Kamar Dibatalkan`} className="text-xs" />
                        )}
                    </div>
                    {group.pending_rooms > 1 && (
                        <Button
                            label="Check-in Semua Kamar"
                            icon="pi pi-check-circle"
                            size="small"
                            severity="success"
                            outlined
                            className="text-xs"
                            onClick={() => openGroupCheckin(group)}
                            loading={loading}
                            disabled={loading || isFuture}
                            tooltip={isFuture ? `Belum jadwal check-in (${formatDateSystem(new Date(group.check_in_date), 'dd/MM/yyyy')})` : undefined}
                            tooltipOptions={{ position: 'top' }}
                        />
                    )}
                </div>

                <DataTable
                    value={group.rooms}
                    className="p-datatable-sm"
                    responsiveLayout="scroll"
                    emptyMessage="Tidak ada data kamar."
                >
                    <Column
                        header="No"
                        body={(_, { rowIndex }) => <span className="text-xs text-500 font-semibold">{rowIndex + 1}</span>}
                        style={{ width: '3rem' }}
                        align="center"
                    />
                    <Column
                        header="Tipe Kamar"
                        body={(rm) => (
                            <div className="flex flex-column">
                                <span className="font-bold text-sm text-900">{rm.tipe_kamar_name || rm.nama_tipe}</span>
                                <span className="text-xs text-500">Kode: {rm.kode_tipe_kamar}</span>
                            </div>
                        )}
                    />
                    <Column
                        header="Kamar Fisik"
                        body={(rm) => (
                            <div className="flex align-items-center gap-1">
                                {rm.nomor_kamar ? (
                                    <Tag severity="info" value={`Kamar ${rm.nomor_kamar}`} className="font-semibold" />
                                ) : (
                                    <Tag severity="secondary" value="Auto-Assign saat Check-in" className="text-xs" />
                                )}
                            </div>
                        )}
                    />
                    <Column
                        header="Tarif / Malam"
                        body={(rm) => (
                            <span className="text-sm font-semibold text-800">
                                {formatCurrency(parseFloat(rm.rate_per_night || 0))}
                            </span>
                        )}
                    />
                    <Column
                        header="Status Kamar"
                        align="center"
                        body={(rm) => {
                            const isCheckedIn = rm.room_status === 'checked_in';
                            const isCancelled = rm.room_status === 'cancelled';
                            return (
                                <Tag
                                    severity={isCheckedIn ? 'success' : isCancelled ? 'danger' : 'warning'}
                                    value={isCheckedIn ? 'CHECKED-IN' : isCancelled ? 'CANCELLED' : (rm.room_status || 'BOOKED').toUpperCase()}
                                />
                            );
                        }}
                    />
                    <Column
                        header="Aksi"
                        align="center"
                        style={{ minWidth: '13rem' }}
                        body={(rm) => {
                            const isCheckedIn = rm.room_status === 'checked_in';
                            const isCancelled = rm.room_status === 'cancelled';

                            if (isCheckedIn) {
                                return (
                                    <div className="flex align-items-center justify-content-center gap-1 text-green-700 text-xs font-semibold">
                                        <i className="pi pi-check"></i>
                                        <span>Sudah Check-In</span>
                                    </div>
                                );
                            }

                            if (isCancelled) {
                                return (
                                    <Tag severity="danger" value="Dibatalkan" icon="pi pi-times" className="text-xs" />
                                );
                            }

                            const cinStrRoom = rm.check_in_date ? rm.check_in_date.substring(0, 10) : (group.check_in_date ? group.check_in_date.substring(0, 10) : '');
                            const todayStr = formatDateSystem(new Date(), 'yyyy-MM-dd') || '';
                            const isRoomFuture = Boolean(todayStr && cinStrRoom > todayStr);

                            return (
                                <div className="flex align-items-center justify-content-center gap-1">
                                    <Button
                                        label="Check In"
                                        icon="pi pi-sign-in"
                                        className="p-button-sm p-button-success font-semibold text-xs py-1 px-2"
                                        onClick={() => processCheckIn(rm)}
                                        disabled={loading || isRoomFuture}
                                        tooltip={isRoomFuture ? `Belum jadwal check-in (${formatDateSystem(new Date(rm.check_in_date || group.check_in_date), 'dd/MM/yyyy')})` : undefined}
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                    <Button
                                        icon="pi pi-calendar"
                                        tooltip="Ubah Tanggal / Kamar"
                                        tooltipOptions={{ position: 'top' }}
                                        className="p-button-sm p-button-outlined p-button-warning text-xs p-1"
                                        onClick={() => {
                                            setSelectedRes(rm);
                                            setShowRescheduleDialog(true);
                                        }}
                                        disabled={loading}
                                    />
                                    <Button
                                        icon="pi pi-times-circle"
                                        tooltip="Batalkan Kamar Ini"
                                        tooltipOptions={{ position: 'top' }}
                                        className="p-button-sm p-button-outlined p-button-danger text-xs p-1"
                                        onClick={() => handleCancelSingleRoomClick(group, rm)}
                                        disabled={loading}
                                    />
                                </div>
                            );
                        }}
                    />
                </DataTable>
            </div>
        );
    };

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3 p-1">
            <div className="flex align-items-center gap-2">
                <span className="text-xl font-bold text-900">Daftar Kedatangan Tamu</span>
                <Button
                    type="button"
                    label={expandedRows && Object.keys(expandedRows).length > 0 ? "Tutup Rincian" : "Buka Rincian"}
                    icon={expandedRows && Object.keys(expandedRows).length > 0 ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                    size="small"
                    outlined
                    className="p-button-secondary text-xs ml-2"
                    onClick={() => {
                        if (expandedRows && Object.keys(expandedRows).length > 0) {
                            setExpandedRows(null);
                        } else {
                            const all: any = {};
                            filteredGroupedData.forEach((g) => {
                                all[g.kode_reservasi] = true;
                            });
                            setExpandedRows(all);
                        }
                    }}
                    tooltip="Buka/Tutup seluruh rincian kamar rombongan"
                    tooltipOptions={{ position: 'bottom' }}
                />
            </div>
            <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                <Button
                    type="button"
                    label="Filter"
                    icon="pi pi-filter"
                    outlined={!showFilter}
                    className={showFilter ? 'p-button-primary' : 'p-button-secondary'}
                    onClick={() => setShowFilter(!showFilter)}
                />
                <IconField iconPosition="left" className="w-full md:w-18rem">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Cari No. Res / Tamu / Tipe..."
                        className="w-full"
                    />
                </IconField>
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    outlined
                    severity="danger"
                    tooltip="Reset Filter"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={handleResetFilter}
                />
            </div>
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} position="top-right" />
            {/* <FrontOfficeNav /> */}

            <div className="flex justify-content-between align-items-start mb-4">
                <div className="flex flex-column">
                    <h3 className="text-2xl font-semibold flex align-items-center gap-2 m-0">
                        <i className="pi pi-sign-in text-blue-600 text-3xl"></i>Kedatangan Tamu (Arrivals)
                    </h3>
                    <p className="text-gray-500 mt-1 mb-0">
                        Daftar seluruh reservasi aktif berdasarkan data induk booking. Buka rincian untuk melihat status kamar, check-in, ubah jadwal, atau batalkan kamar individual.
                    </p>
                </div>
            </div>

            {showFilter && (
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 p-3 surface-50 border-round border-1 surface-border mb-4 animation-duration-200 fadein">
                    <div className="flex flex-wrap align-items-center gap-3">
                        <div className="flex flex-wrap align-items-center gap-2">
                            <span className="text-sm font-bold text-700">Pilih Tanggal:</span>
                            <Calendar
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.value as Date)}
                                dateFormat="dd/mm/yy"
                                showIcon
                                showButtonBar
                                placeholder="Semua Tanggal"
                                className="w-12rem text-sm"
                            />
                            <Button
                                type="button"
                                label="Semua"
                                size="small"
                                outlined={filterDate !== null}
                                severity="secondary"
                                className="p-button-sm text-xs px-2 py-1"
                                onClick={() => setFilterDate(null)}
                                tooltip="Tampilkan Semua Tanggal"
                            />
                            <Button
                                type="button"
                                label="Hari Ini"
                                size="small"
                                outlined={!filterDate || formatDateSystem(filterDate, 'yyyy-MM-dd') !== (formatDateSystem(new Date(), 'yyyy-MM-dd') || '')}
                                className="p-button-sm text-xs px-2 py-1"
                                onClick={() => setFilterDate(new Date())}
                                tooltip="Filter Tanggal Hari Ini"
                            />
                        </div>
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm font-bold text-700">Cabang:</span>
                            {session?.user?.role === 'superadmin' || session?.user?.can_switch_branch || cabangOptions.length > 1 ? (
                                <Dropdown
                                    value={filterCabang}
                                    options={cabangOptions}
                                    onChange={(e) => setFilterCabang(e.value)}
                                    placeholder="Pilih Cabang"
                                    className="text-sm w-16rem"
                                />
                            ) : (
                                <div className="flex align-items-center gap-2 bg-white px-3 py-2 border-round-lg border-1 surface-border">
                                    <i className="pi pi-building text-primary font-bold"></i>
                                    <span className="text-sm font-bold text-900">
                                        {session?.user?.active_kode_cabang || filterCabang || '-'} - {session?.user?.active_branch_name || 'Cabang Aktif'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex align-items-center gap-2 ml-auto">
                        <Button
                            size="small"
                            label="Refresh"
                            icon="pi pi-refresh"
                            outlined
                            onClick={() => loadData()}
                            loading={loading}
                        />
                    </div>
                </div>
            )}

            <DataTable
                value={filteredGroupedData}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                dataKey="kode_reservasi"
                loading={loading}
                emptyMessage="Data Kosong"
                scrollable
                responsiveLayout="scroll"
                header={headerTemplate}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50, 100]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                className="p-datatable-sm"
            >
                <Column expander style={{ width: '3.5rem' }} />
                <Column field="kode_reservasi" header="No. Reservasi" sortable body={resNumberBody} />
                <Column field="guest_name" header="Nama Tamu" sortable body={guestNameBody} />
                <Column field="check_in_date" header="Tgl Check-In" sortable body={checkInDateBody} align="center" />
                <Column header="Rincian Kamar" body={roomsSummaryBody} />
                <Column field="nights" header="Malam" sortable align="center" style={{ width: '5.5rem' }} />
                <Column
                    field="deposit_amount"
                    header="Total Deposit"
                    sortable
                    body={(r) => r.deposit_amount ? formatCurrency(r.deposit_amount) : '-'}
                />
                <Column field="res_status" header="Status" sortable body={statusGroupBody} align="center" />
                <Column header="Aksi" body={parentActionBody} align="center" style={{ minWidth: '13rem' }} />
            </DataTable>

            {/* Modal Dialog Check-In Kamar Individu */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-sign-in text-xl text-primary font-bold"></i>
                        <span className="font-bold text-lg text-900">Konfirmasi Kedatangan & Check-In</span>
                    </div>
                }
                visible={showDepositDialog}
                style={{ width: '580px', maxWidth: '95vw' }}
                onHide={() => setShowDepositDialog(false)}
                breakpoints={{ '960px': '80vw', '641px': '95vw' }}
                footer={(
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button
                            label="Batal"
                            icon="pi pi-times"
                            onClick={() => setShowDepositDialog(false)}
                            className="p-button-text p-button-secondary"
                            disabled={loading}
                        />
                        <Button
                            label="Proses Check-in"
                            icon="pi pi-check"
                            onClick={handleDepositSubmit}
                            loading={loading}
                            severity="success"
                            className="font-semibold"
                        />
                    </div>
                )}
            >
                {selectedRes && (() => {
                    const nights = parseInt(selectedRes.nights, 10) || 1;
                    const ratePerNight = parseFloat(selectedRes.rate_per_night || 0);
                    const roomSubtotal = ratePerNight * nights;

                    // Fasilitas tambahan dari charges folio (charge_type bukan 'room')
                    const extraCharges = (selectedRes.charges || []).filter((c: any) => c.charge_type !== 'room');
                    const extraTotal = extraCharges.reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);

                    // Perhitungan Biaya Early Check-In jika berlaku
                    const earlyFeePreview = (isEarlyCheckin && applyEarlyCheckinFee) ? (earlyCheckinFeeAmount || 0) : 0;

                    // Sisa Tagihan Berjalan (Kamar + Fasilitas Tambahan + Early Check-In, TIDAK dikurangi deposit)
                    const sisaTagihanBerjalan = roomSubtotal + extraTotal + earlyFeePreview;

                    const depositPaid = parseFloat(selectedRes.deposit_amount || 0);
                    const isRescheduled = Boolean(selectedRes.special_request && selectedRes.special_request.includes('Reschedule'));

                    return (
                        <div className="p-fluid">
                            {/* Card Early Check-In Alert & Pilihan Biaya */}
                            {isEarlyCheckin && (
                                <div className="p-3 border-round bg-amber-50 border-1 border-amber-300 mb-3 shadow-1">
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <span className="font-bold text-xs text-amber-900 uppercase flex align-items-center gap-1">
                                            <i className="pi pi-clock text-amber-700"></i>
                                            Terdeteksi Early Check-In (Kedatangan Lebih Awal)
                                        </span>
                                        <Tag severity="warning" value={`Standar: ${selectedRes?.waktu_checkin ? selectedRes.waktu_checkin.substring(0, 5) : '14:00'}`} className="text-xs" />
                                    </div>
                                    <p className="text-xs text-amber-900 m-0 mb-3 line-height-2">
                                        Tamu tiba pk. {formatDateSystem(new Date(), 'HH:mm')} WIB (sebelum jam standar check-in hotel). Sesuai standar operasional perhotelan, pilih kebijakan biaya Early Check-In:
                                    </p>

                                    <div className="surface-0 p-3 border-round border-1 border-amber-200">
                                        <div className="flex align-items-center mb-2">
                                            <input
                                                type="radio"
                                                id="single_early_fee_yes"
                                                name="single_early_fee"
                                                checked={applyEarlyCheckinFee}
                                                onChange={() => setApplyEarlyCheckinFee(true)}
                                                className="cursor-pointer"
                                                style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                                            />
                                            <label htmlFor="single_early_fee_yes" className="ml-2 text-xs font-bold text-900 cursor-pointer">
                                                Terapkan Biaya Early Check-In (Amenity Layanan Kamar)
                                            </label>
                                        </div>

                                        {applyEarlyCheckinFee && (
                                            <div className="ml-4 pl-2 border-left-2 border-amber-500 my-2">
                                                <label className="text-xs font-semibold text-700 block mb-1">
                                                    Tarif Amenity Early Check-In (Rp):
                                                </label>
                                                <InputNumber
                                                    value={earlyCheckinFeeAmount}
                                                    onValueChange={(e) => setEarlyCheckinFeeAmount(e.value ?? 150000)}
                                                    mode="currency"
                                                    currency="IDR"
                                                    locale="id-ID"
                                                    min={0}
                                                    className="w-full text-xs"
                                                />
                                                <small className="text-500 block mt-1">
                                                    *Biaya ini akan otomatis dibukukan ke tagihan folio tamu sebagai amenity layanan kamar (AMN-009).
                                                </small>
                                            </div>
                                        )}

                                        <div className="flex align-items-center mt-2">
                                            <input
                                                type="radio"
                                                id="single_early_fee_no"
                                                name="single_early_fee"
                                                checked={!applyEarlyCheckinFee}
                                                onChange={() => setApplyEarlyCheckinFee(false)}
                                                className="cursor-pointer"
                                                style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                                            />
                                            <label htmlFor="single_early_fee_no" className="ml-2 text-xs font-medium text-700 cursor-pointer">
                                                Bebas Biaya / Complimentary (VIP Guest, Loyalty, atau Kebijakan Manager)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Card 1: Identitas Tamu & Jadwal Menginap */}
                            <div className="p-3 border-round bg-blue-50 border-1 border-blue-200 mb-3">
                                <div className="flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <span className="font-bold text-900 block text-base">{selectedRes.guest_name || selectedRes.full_name}</span>
                                        <span className="text-xs text-600">ID Tamu: {selectedRes.kode_tamu || '-'} • Reservasi: {selectedRes.kode_reservasi || selectedRes.kode_reservation}</span>
                                    </div>
                                    <Tag severity="info" value={`${nights} Malam`} className="text-xs" />
                                </div>
                                <div className="text-xs text-700 flex flex-wrap gap-2 justify-content-between align-items-center">
                                    <span>Kamar: <strong>{selectedRes.nomor_kamar ? `No. ${selectedRes.nomor_kamar}` : 'Auto-Assign'}</strong> ({selectedRes.tipe_kamar_name || selectedRes.nama_tipe})</span>
                                    <span>
                                        Check-In: <strong>{selectedRes.check_in_date ? formatDateSystem(selectedRes.check_in_date, 'dd/MM/yyyy') : '-'}</strong> s/d <strong>{selectedRes.check_out_date ? formatDateSystem(selectedRes.check_out_date, 'dd/MM/yyyy') : '-'}</strong>
                                    </span>
                                </div>
                                {isRescheduled && (
                                    <div className="mt-2 pt-2 border-top-1 border-blue-200 flex flex-wrap align-items-center justify-content-between gap-2 text-xs">
                                        <div className="flex align-items-center gap-1 text-blue-900">
                                            <i className="pi pi-calendar-plus text-primary font-bold"></i>
                                            <span><strong>Jadwal Hasil Reschedule:</strong> {nights} Malam Menginap</span>
                                        </div>
                                        <Tag severity="warning" value="Rescheduled" className="text-xs font-semibold px-2 py-0" />
                                    </div>
                                )}
                            </div>

                            {/* Card 2: Ringkasan Nilai Item & Tagihan Sementara */}
                            <div className="p-3 border-round surface-50 border-1 surface-border mb-3">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold text-xs text-800 uppercase flex align-items-center gap-1">
                                        <i className="pi pi-receipt text-primary"></i>
                                        Rincian Tagihan Kamar & Fasilitas
                                    </span>
                                    <Tag
                                        severity="warning"
                                        value="Tagihan Berjalan"
                                        className="text-xs"
                                    />
                                </div>

                                <div className="grid text-xs text-700 py-1 border-bottom-1 surface-border">
                                    <div className="col-7">
                                        <span>Sewa Kamar ({nights} Malam @ {formatCurrency(ratePerNight)})</span>
                                    </div>
                                    <div className="col-5 text-right font-semibold text-900">
                                        {formatCurrency(roomSubtotal)}
                                    </div>
                                </div>

                                {extraCharges.length > 0 ? (
                                    extraCharges.map((fc: any, idx: number) => (
                                        <div key={idx} className="grid text-xs text-700 py-1 border-bottom-1 surface-border">
                                            <div className="col-7 flex align-items-center gap-1">
                                                <i className="pi pi-plus-circle text-blue-500"></i>
                                                <span>{fc.description || 'Fasilitas Tambahan'}</span>
                                            </div>
                                            <div className="col-5 text-right font-semibold text-900">
                                                {formatCurrency(fc.amount)}
                                            </div>
                                        </div>
                                    ))
                                ) : extraTotal > 0 ? (
                                    <div className="grid text-xs text-700 py-1 border-bottom-1 surface-border">
                                        <div className="col-7 flex align-items-center gap-1">
                                            <i className="pi pi-plus-circle text-blue-500"></i>
                                            <span>Fasilitas Tambahan (Booking)</span>
                                        </div>
                                        <div className="col-5 text-right font-semibold text-900">
                                            {formatCurrency(extraTotal)}
                                        </div>
                                    </div>
                                ) : null}

                                {isEarlyCheckin && applyEarlyCheckinFee && (
                                    <div className="grid text-xs text-amber-800 py-1 border-bottom-1 surface-border bg-amber-50 px-1 border-round">
                                        <div className="col-7 flex align-items-center gap-1 font-semibold">
                                            <i className="pi pi-clock text-amber-600"></i>
                                            <span>Amenity: Early Check-In Surcharge</span>
                                        </div>
                                        <div className="col-5 text-right font-bold text-amber-900">
                                            {formatCurrency(earlyCheckinFeeAmount)}
                                        </div>
                                    </div>
                                )}

                                <div className="grid text-xs pt-2 font-bold border-top-1 surface-border mt-1">
                                    <div className="col-7 text-900 flex align-items-center gap-1">
                                        <i className="pi pi-wallet text-orange-600"></i>
                                        <span>Sisa Tagihan Berjalan</span>
                                    </div>
                                    <div className="col-5 text-right text-base text-orange-700 font-bold">
                                        {formatCurrency(sisaTagihanBerjalan)}
                                    </div>
                                </div>

                                {depositPaid > 0 && (
                                    <div className="grid text-xs text-green-700 py-1 border-top-1 surface-border mt-2 align-items-center bg-green-50 px-2 border-round">
                                        <div className="col-7 flex align-items-center gap-1">
                                            <i className="pi pi-shield text-green-600"></i>
                                            <span className="font-semibold">Deposit / Uang Jaminan Tercatat:</span>
                                        </div>
                                        <div className="col-5 text-right font-bold text-green-800">
                                            {formatCurrency(depositPaid)}
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-500 mt-2 flex align-items-start gap-1 font-italic">
                                    <i className="pi pi-info-circle mt-1 text-primary"></i>
                                    <span>
                                        Sisa tagihan berjalan merupakan total biaya kamar dan fasilitas tambahan saja (tidak dikurangi deposit). Uang jaminan/deposit dipegang kasir dan pelunasan akhir dilakukan saat Check-Out.
                                    </span>
                                </div>
                            </div>

                            {/* Card 3: Form Deposit Jaminan Kasir Tambahan */}
                            <div className="p-3 border-round surface-0 border-1 surface-border mb-2">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold text-xs text-800 uppercase flex align-items-center gap-1">
                                        <i className="pi pi-shield text-primary"></i>
                                        {depositPaid > 0 ? 'Deposit Tambahan di Kasir (Incidental Deposit)' : 'Penetapan Uang Jaminan / Deposit Kasir'}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <label className="text-xs font-semibold text-color-secondary uppercase mb-1 block">
                                        {depositPaid > 0 ? 'Pilihan Cepat Tambah Uang Jaminan' : 'Pilihan Cepat Deposit (Uang Jaminan)'}
                                    </label>
                                    <div className="grid">
                                        {[
                                            { label: 'Tanpa Tambahan', val: 0 },
                                            { label: 'Rp 100.000', val: 100000 },
                                            { label: 'Rp 200.000', val: 200000 },
                                            { label: 'Rp 500.000', val: 500000 },
                                        ].map((p) => (
                                            <div key={p.val} className="col-6 sm:col-3">
                                                <div
                                                    className={`p-2 text-center border-round cursor-pointer text-xs font-bold transition-all select-none ${depositAmount === p.val
                                                            ? 'bg-green-600 text-white shadow-1'
                                                            : 'surface-100 hover:surface-200 text-700 border-1 surface-border'
                                                        }`}
                                                    onClick={() => setDepositAmount(p.val)}
                                                >
                                                    {p.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="field mb-3">
                                    <label className="font-semibold text-sm">
                                        {depositPaid > 0 ? 'Nominal Deposit Kasir Tambahan (Rp)' : 'Nominal Uang Jaminan / Deposit (Rp)'}
                                    </label>
                                    <InputNumber
                                        value={depositAmount}
                                        onValueChange={(e) => setDepositAmount(e.value ?? 0)}
                                        mode="currency"
                                        currency="IDR"
                                        locale="id-ID"
                                        min={0}
                                        placeholder="Rp 0"
                                        className="w-full"
                                    />
                                    <small className="text-color-secondary">
                                        Uang jaminan dicatat sebagai titipan kasir untuk fasilitas berbayar dan dapat dikembalikan saat check-out jika tidak ada pemakaian.
                                    </small>
                                </div>

                                {depositAmount > 0 && (
                                    <>
                                        <div className="mb-3">
                                            <PaymentMethodSelector
                                                value={{
                                                    method: paymentMethod,
                                                    bank_name: bankName,
                                                    card_type: cardType,
                                                    reference_no: referenceNo
                                                }}
                                                onChange={(detail) => {
                                                    setPaymentMethod(detail.method);
                                                    if (detail.bank_name) setBankName(detail.bank_name);
                                                    if (detail.card_type) setCardType(detail.card_type);
                                                    setReferenceNo(detail.reference_no || '');
                                                }}
                                                totalAmount={depositAmount}
                                                compact={true}
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <CashierPicCard
                                                sessionUser={session?.user}
                                                activeShift={shiftAktif}
                                                kodeCabang={filterCabang}
                                                onShiftUpdated={(s) => {
                                                    setShiftAktif(s);
                                                    if (s?.kode_cashier_shift) {
                                                        setShiftCode(s.kode_cashier_shift);
                                                    }
                                                }}
                                                toast={toast}
                                                compact={true}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Dialog>

            {/* Modal Dialog Check-In Rombongan (Group Check-in) */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-users text-xl text-primary font-bold"></i>
                        <span className="font-bold text-lg text-900">
                            Check-In Rombongan (Group Check-in)
                        </span>
                    </div>
                }
                visible={showGroupCheckinDialog}
                style={{ width: '650px', maxWidth: '95vw' }}
                onHide={() => !groupCheckinLoading && setShowGroupCheckinDialog(false)}
                breakpoints={{ '960px': '85vw', '641px': '95vw' }}
                footer={(
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button
                            label="Batal"
                            icon="pi pi-times"
                            onClick={() => setShowGroupCheckinDialog(false)}
                            className="p-button-text p-button-secondary"
                            disabled={groupCheckinLoading}
                        />
                        <Button
                            label={`Proses Check-in (${selectedGroupRes?.rooms.filter(r => r.room_status !== 'checked_in' && r.room_status !== 'cancelled').length || 0} Kamar)`}
                            icon="pi pi-check"
                            onClick={handleGroupCheckinSubmit}
                            loading={groupCheckinLoading}
                            severity="success"
                            className="font-semibold"
                        />
                    </div>
                )}
            >
                {selectedGroupRes && (() => {
                    const pendingRooms = selectedGroupRes.rooms.filter((r: any) => r.room_status !== 'checked_in' && r.room_status !== 'cancelled');
                    const depositPaid = selectedGroupRes.deposit_amount;

                    return (
                        <div className="p-fluid">
                            {/* Card Early Check-In Alert & Pilihan Biaya Group */}
                            {isEarlyCheckinGroup && (
                                <div className="p-3 border-round bg-amber-50 border-1 border-amber-300 mb-3 shadow-1">
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <span className="font-bold text-xs text-amber-900 uppercase flex align-items-center gap-1">
                                            <i className="pi pi-clock text-amber-700"></i>
                                            Terdeteksi Early Check-In Rombongan
                                        </span>
                                        <Tag severity="warning" value={`Standar: ${selectedGroupRes?.waktu_checkin ? selectedGroupRes.waktu_checkin.substring(0, 5) : '14:00'}`} className="text-xs" />
                                    </div>
                                    <p className="text-xs text-amber-900 m-0 mb-3 line-height-2">
                                        Rombongan tamu tiba pk. {formatDateSystem(new Date(), 'HH:mm')} WIB (sebelum jam standar check-in hotel). Sesuai standar operasional perhotelan, tentukan kebijakan biaya Early Check-In untuk {pendingRooms.length} kamar:
                                    </p>

                                    <div className="surface-0 p-3 border-round border-1 border-amber-200">
                                        <div className="flex align-items-center mb-2">
                                            <input
                                                type="radio"
                                                id="group_early_fee_yes"
                                                name="group_early_fee"
                                                checked={applyEarlyCheckinFeeGroup}
                                                onChange={() => setApplyEarlyCheckinFeeGroup(true)}
                                                className="cursor-pointer"
                                                style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                                            />
                                            <label htmlFor="group_early_fee_yes" className="ml-2 text-xs font-bold text-900 cursor-pointer">
                                                Terapkan Biaya Early Check-In per Kamar (Amenity Layanan Kamar)
                                            </label>
                                        </div>

                                        {applyEarlyCheckinFeeGroup && (
                                            <div className="ml-4 pl-2 border-left-2 border-amber-500 my-2">
                                                <label className="text-xs font-semibold text-700 block mb-1">
                                                    Tarif Amenity Early Check-In per Kamar (Rp):
                                                </label>
                                                <InputNumber
                                                    value={earlyCheckinFeeAmountGroup}
                                                    onValueChange={(e) => setEarlyCheckinFeeAmountGroup(e.value ?? 150000)}
                                                    mode="currency"
                                                    currency="IDR"
                                                    locale="id-ID"
                                                    min={0}
                                                    className="w-full text-xs"
                                                />
                                                <div className="flex justify-content-between align-items-center mt-2 p-2 bg-amber-50 border-round text-xs font-semibold text-amber-900">
                                                    <span>Total Biaya Early Check-In ({pendingRooms.length} Kamar):</span>
                                                    <span>{formatCurrency((earlyCheckinFeeAmountGroup || 0) * pendingRooms.length)}</span>
                                                </div>
                                                <small className="text-500 block mt-1">
                                                    *Biaya ini akan otomatis dibukukan ke masing-masing folio kamar sebagai amenity layanan kamar (AMN-009).
                                                </small>
                                            </div>
                                        )}

                                        <div className="flex align-items-center mt-2">
                                            <input
                                                type="radio"
                                                id="group_early_fee_no"
                                                name="group_early_fee"
                                                checked={!applyEarlyCheckinFeeGroup}
                                                onChange={() => setApplyEarlyCheckinFeeGroup(false)}
                                                className="cursor-pointer"
                                                style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                                            />
                                            <label htmlFor="group_early_fee_no" className="ml-2 text-xs font-medium text-700 cursor-pointer">
                                                Bebas Biaya / Complimentary (VIP Rombongan, Corporate Agreement, atau Izin Manager)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-3 border-round bg-blue-50 border-1 border-blue-200 mb-3">
                                <div className="flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <span className="font-bold text-900 block text-base">{selectedGroupRes.guest_name}</span>
                                        <span className="text-xs text-600">ID Tamu: {selectedGroupRes.kode_tamu || '-'} • Reservasi: {selectedGroupRes.kode_reservasi}</span>
                                    </div>
                                    <Tag severity="info" value={`${selectedGroupRes.nights} Malam`} className="text-xs" />
                                </div>
                                <div className="text-xs text-700 flex flex-wrap gap-2 justify-content-between align-items-center">
                                    <span>Check-In: <strong>{selectedGroupRes.check_in_date ? formatDateSystem(selectedGroupRes.check_in_date, 'dd/MM/yyyy') : '-'}</strong> s/d <strong>{selectedGroupRes.check_out_date ? formatDateSystem(selectedGroupRes.check_out_date, 'dd/MM/yyyy') : '-'}</strong></span>
                                    <span>Total Rombongan: <strong>{selectedGroupRes.total_rooms} Kamar</strong></span>
                                </div>
                            </div>

                            <div className="p-3 border-round surface-50 border-1 surface-border mb-3">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold text-xs text-800 uppercase flex align-items-center gap-1">
                                        <i className="pi pi-list text-primary"></i>
                                        Kamar yang Akan Di-Check-in ({pendingRooms.length} Kamar)
                                    </span>
                                    <Tag severity="warning" value="Auto-Assign Kamar Bersih" className="text-xs" />
                                </div>

                                <div className="border-1 surface-border border-round overflow-hidden bg-white mb-2 max-h-15rem overflow-y-auto">
                                    {pendingRooms.map((rm: any, idx: number) => (
                                        <div
                                            key={rm.kode_reservasi_room || idx}
                                            className={`p-2 flex align-items-center justify-content-between text-xs ${idx < pendingRooms.length - 1 ? 'border-bottom-1 surface-border' : ''}`}
                                        >
                                            <div className="flex align-items-center gap-2">
                                                <span className="font-bold text-primary">{idx + 1}.</span>
                                                <div>
                                                    <span className="font-semibold text-900">{rm.tipe_kamar_name || rm.nama_tipe}</span>
                                                    <span className="text-500 block">Tarif: {formatCurrency(parseFloat(rm.rate_per_night || 0))}/malam</span>
                                                </div>
                                            </div>
                                            <div>
                                                {rm.nomor_kamar ? (
                                                    <Tag severity="info" value={`Kamar ${rm.nomor_kamar}`} />
                                                ) : (
                                                    <span className="text-500 font-italic">Auto-Assign</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {depositPaid > 0 && (
                                    <div className="flex align-items-center justify-content-between p-2 bg-green-50 border-round text-xs text-green-800 font-medium">
                                        <span className="flex align-items-center gap-1">
                                            <i className="pi pi-shield text-green-600"></i>
                                            Deposit Reservasi Tercatat:
                                        </span>
                                        <span className="font-bold">{formatCurrency(depositPaid)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-round surface-0 border-1 surface-border mb-2">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold text-xs text-800 uppercase flex align-items-center gap-1">
                                        <i className="pi pi-shield text-primary"></i>
                                        Deposit Kasir Tambahan (Opsional)
                                    </span>
                                </div>

                                <div className="field mb-3">
                                    <label className="font-semibold text-xs text-700">Nominal Deposit Kasir Tambahan (Rp)</label>
                                    <InputNumber
                                        value={depositAmount}
                                        onValueChange={(e) => setDepositAmount(e.value ?? 0)}
                                        mode="currency"
                                        currency="IDR"
                                        locale="id-ID"
                                        min={0}
                                        placeholder="Rp 0"
                                        className="w-full"
                                    />
                                    <small className="text-color-secondary">Biarkan Rp 0 jika tidak ada penerimaan uang jaminan kasir baru.</small>
                                </div>

                                {depositAmount > 0 && (
                                    <>
                                        <div className="mb-3">
                                            <PaymentMethodSelector
                                                value={{
                                                    method: paymentMethod,
                                                    bank_name: bankName,
                                                    card_type: cardType,
                                                    reference_no: referenceNo
                                                }}
                                                onChange={(detail) => {
                                                    setPaymentMethod(detail.method);
                                                    if (detail.bank_name) setBankName(detail.bank_name);
                                                    if (detail.card_type) setCardType(detail.card_type);
                                                    setReferenceNo(detail.reference_no || '');
                                                }}
                                                totalAmount={depositAmount}
                                                compact={true}
                                            />
                                        </div>
                                        <div className="mb-2">
                                            <CashierPicCard
                                                sessionUser={session?.user}
                                                activeShift={shiftAktif}
                                                kodeCabang={filterCabang}
                                                onShiftUpdated={(s) => {
                                                    setShiftAktif(s);
                                                    if (s?.kode_cashier_shift) setShiftCode(s.kode_cashier_shift);
                                                }}
                                                toast={toast}
                                                compact={true}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Dialog>

            {/* Modal Dialog Batalkan Satu Unit Kamar (Partial Room Cancellation) */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-times-circle text-xl text-red-600 font-bold"></i>
                        <span className="font-bold text-lg text-900">Batalkan Unit Kamar</span>
                    </div>
                }
                visible={showCancelSingleRoomDialog}
                style={{ width: '520px', maxWidth: '95vw' }}
                onHide={() => !cancelSingleLoading && setShowCancelSingleRoomDialog(false)}
                footer={
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button
                            label="Batal"
                            icon="pi pi-times"
                            onClick={() => setShowCancelSingleRoomDialog(false)}
                            className="p-button-text p-button-secondary"
                            disabled={cancelSingleLoading}
                        />
                        <Button
                            label="Konfirmasi Batal Kamar"
                            icon="pi pi-check"
                            severity="danger"
                            onClick={handleCancelSingleRoomSubmit}
                            loading={cancelSingleLoading}
                            className="font-semibold"
                        />
                    </div>
                }
            >
                {selectedRoomToCancel && (
                    <div className="p-fluid">
                        <div className="p-3 border-round bg-red-50 border-1 border-red-200 mb-3">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <div>
                                    <span className="font-bold text-red-900 block text-base">
                                        {selectedRoomToCancel.room.tipe_kamar_name || selectedRoomToCancel.room.nama_tipe}
                                    </span>
                                    <span className="text-xs text-600">
                                        Reservasi: {selectedRoomToCancel.group.kode_reservasi} • a/n {selectedRoomToCancel.group.guest_name}
                                    </span>
                                </div>
                                {selectedRoomToCancel.room.nomor_kamar ? (
                                    <Tag severity="info" value={`Kamar ${selectedRoomToCancel.room.nomor_kamar}`} className="text-xs" />
                                ) : (
                                    <Tag severity="secondary" value="Auto-Assign" className="text-xs" />
                                )}
                            </div>
                            <div className="text-xs text-700 flex justify-content-between align-items-center pt-2 border-top-1 border-red-200">
                                <span>Tarif per Malam:</span>
                                <strong className="text-900">
                                    {formatCurrency(parseFloat(selectedRoomToCancel.room.rate_per_night || 0))}
                                </strong>
                            </div>
                        </div>

                        <div className="p-2 mb-3 bg-blue-50 border-round border-1 border-blue-200 text-xs text-blue-800 flex align-items-start gap-2">
                            <i className="pi pi-info-circle mt-1 flex-shrink-0 text-blue-600"></i>
                            <span>
                                Hanya unit kamar ini yang akan dibatalkan dan nomor kamarnya dilepas kembali ke inventaris hotel. Kamar lainnya pada reservasi ini tetap aktif berjalan normal.
                            </span>
                        </div>

                        <div className="field mb-3">
                            <label className="font-semibold text-xs text-700">Alasan Pembatalan</label>
                            <Dropdown
                                value={cancelSingleReason}
                                options={[
                                    { label: 'Permintaan Tamu (Guest Request)', value: 'Permintaan Tamu (Guest Request)' },
                                    { label: 'Pengurangan Jumlah Anggota / Delegasi', value: 'Pengurangan Jumlah Delegasi' },
                                    { label: 'Perubahan Jadwal Perjalanan', value: 'Perubahan Jadwal Perjalanan' },
                                    { label: 'Tamu Berhalangan Hadir / Sakit', value: 'Tamu Berhalangan Hadir / Sakit' },
                                    { label: 'Kesalahan Pemesanan Tipe Kamar', value: 'Kesalahan Pemesanan' },
                                    { label: 'Lainnya', value: 'Lainnya' }
                                ]}
                                onChange={(e) => setCancelSingleReason(e.value)}
                                placeholder="Pilih Alasan"
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="field mb-2">
                            <label className="font-semibold text-xs text-700">Catatan Tambahan (Opsional)</label>
                            <InputTextarea
                                value={cancelSingleNotes}
                                onChange={(e) => setCancelSingleNotes(e.target.value)}
                                rows={2}
                                placeholder="Contoh: Batal kamar nomor 102 karena anggota delegasi ada agenda mendadak"
                                className="w-full text-sm"
                            />
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Modal Dialog Ubah Tanggal (Reschedule) */}
            <DialogReschedule
                visible={showRescheduleDialog}
                onHide={() => setShowRescheduleDialog(false)}
                reservation={selectedRes}
                toast={toast}
                onSuccess={() => loadData()}
            />

            {/* Modal Dialog Batalkan Reservasi & Kebijakan Refund */}
            <DialogCancelRefund
                visible={showCancelRefundDialog}
                onHide={() => setShowCancelRefundDialog(false)}
                reservation={selectedRes}
                toast={toast}
                onSuccess={() => loadData()}
                shiftAktif={shiftAktif}
                sessionUser={session?.user}
                kodeCabang={filterCabang}
                onShiftUpdated={(s) => {
                    setShiftAktif(s);
                    if (s?.kode_cashier_shift) setShiftCode(s.kode_cashier_shift);
                }}
            />
        </div>
    );
};

const Page = () => {
    return (
        <Suspense fallback={<div className="p-4 text-center">Memuat daftar kedatangan...</div>}>
            <CheckinContent />
        </Suspense>
    );
};

export default Page;
