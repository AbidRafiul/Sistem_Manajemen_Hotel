'use client';
import { Toast } from 'primereact/toast';
import { Suspense, useEffect, useRef, useState } from 'react';
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
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { apiReservationData, apiCheckinSubmit, apiShiftCurrent, apiCabangDropdown } from './components/endpoints';
import { showError, showSuccess, formatCurrency } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import CashierPicCard from '@/app/components/payment/CashierPicCard';
// import FrontOfficeNav from '@/app/components/navigation/FrontOfficeNav';
import { buildStandardReferenceNo } from '@/lib/tools/paymentTools';
import DialogReschedule from './components/DialogReschedule';
import DialogCancelRefund from './components/DialogCancelRefund';

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

    // Inisialisasi keyword pencarian jika diarahkan dari halaman booking atau halaman lain (?search=RSVxxx)
    useEffect(() => {
        if (!searchParams) return;
        const searchVal = searchParams.get('search') || searchParams.get('kode_reservasi');
        if (searchVal) {
            setGlobalFilter(searchVal);
        }
    }, [searchParams]);

    // Deposit handling dialog (Check-in)
    const [showDepositDialog, setShowDepositDialog] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any>(null);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'transfer'>('cash');
    const [bankName, setBankName] = useState('BCA');
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftCode, setShiftCode] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

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

    const handleResetFilter = () => {
        setGlobalFilter('');
        setFilterDate(null); // Reset ke semua tanggal
        if (session?.user?.active_kode_cabang) {
            setFilterCabang(session.user.active_kode_cabang);
        }
    };

    const processCheckIn = async (rowData: any) => {
        setSelectedRes(rowData);
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
                showSuccess(toast, `Check-in berhasil! Kamar: ${res.data.data.kode_kamar_assigned}`);
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
            guest_count: selectedRes?.guest_count || 1
        });
    };

    const actionBody = (rowData: any) => {
        return (
            <div className="flex align-items-center justify-content-center gap-2">
                <Button
                    label="Check In"
                    icon="pi pi-sign-in"
                    className="p-button-sm p-button-success font-semibold"
                    onClick={() => processCheckIn(rowData)}
                    disabled={loading}
                />
                <Button
                    icon="pi pi-calendar"
                    tooltip="Ubah Tanggal (Reschedule)"
                    tooltipOptions={{ position: 'top' }}
                    className="p-button-sm p-button-outlined p-button-warning"
                    onClick={() => {
                        setSelectedRes(rowData);
                        setShowRescheduleDialog(true);
                    }}
                    disabled={loading}
                />
                <Button
                    icon="pi pi-times-circle"
                    tooltip="Batalkan / Kebijakan Refund"
                    tooltipOptions={{ position: 'top' }}
                    className="p-button-sm p-button-outlined p-button-danger"
                    onClick={() => {
                        setSelectedRes(rowData);
                        setShowCancelRefundDialog(true);
                    }}
                    disabled={loading}
                />
            </div>
        );
    };

    const statusBody = (rowData: any) => {
        const sev = rowData.room_status === 'confirmed' ? 'success' : 'warning';
        return <Tag severity={sev} value={rowData.room_status ? rowData.room_status.toUpperCase() : 'RESERVED'} />;
    };

    const checkInDateBody = (rowData: any) => {
        if (!rowData.check_in_date) return '-';
        const cinStr = rowData.check_in_date.substring(0, 10);
        const todayStr = formatDateSystem(new Date(), 'yyyy-MM-dd') || '';

        const isToday = Boolean(todayStr && cinStr === todayStr);
        const isPast = Boolean(todayStr && cinStr < todayStr);

        return (
            <div className="flex flex-column align-items-center gap-1">
                <span className="font-semibold text-sm text-900">
                    {formatDateSystem(new Date(rowData.check_in_date), 'dd/MM/yyyy')}
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

    const filteredData = data.filter((item) => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (item.kode_reservasi && item.kode_reservasi.toLowerCase().includes(search)) ||
            (item.guest_name && item.guest_name.toLowerCase().includes(search)) ||
            (item.tipe_kamar_name && item.tipe_kamar_name.toLowerCase().includes(search)) ||
            (item.room_status && item.room_status.toLowerCase().includes(search))
        );
    });

    const headerTemplate = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3 p-1">
            <span className="text-xl font-bold text-900">Daftar Kedatangan Tamu</span>
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
                        placeholder="Cari Data..."
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
                    <p className="text-gray-500 mt-1 mb-0">Daftar seluruh reservasi aktif. Klik Check-in untuk assign kamar, atau gunakan aksi Ubah Tanggal dan Batal/Refund.</p>
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
                value={filteredData}
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
                <Column field="kode_reservasi" header="No. Reservasi" sortable />
                <Column field="guest_name" header="Nama Tamu" sortable />
                <Column field="check_in_date" header="Tgl Check-In" sortable body={checkInDateBody} align="center" />
                <Column field="tipe_kamar_name" header="Tipe Kamar" sortable />
                <Column field="nights" header="Malam" sortable align="center" />
                <Column
                    field="deposit_amount"
                    header="Deposit"
                    sortable
                    body={(r) => r.deposit_amount ? `Rp ${parseFloat(r.deposit_amount).toLocaleString('id-ID')}` : '-'}
                />
                <Column field="room_status" header="Status" sortable body={statusBody} align="center" />
                <Column header="Aksi" body={actionBody} align="center" />
            </DataTable>

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

                    // Sisa Tagihan Berjalan (Hanya Penjumlahan Kamar + Fasilitas Tambahan, TIDAK dikurangi deposit)
                    const sisaTagihanBerjalan = roomSubtotal + extraTotal;

                    const depositPaid = parseFloat(selectedRes.deposit_amount || 0);
                    const isRescheduled = Boolean(selectedRes.special_request && selectedRes.special_request.includes('Reschedule'));

                    return (
                        <div className="p-fluid">
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

                            {/* Card 2: Ringkasan Nilai Item & Tagihan Sementara (Kamar & Fasilitas Tambahan) */}
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

                                {/* 1. Nilai Pokok Sewa Kamar */}
                                <div className="grid text-xs text-700 py-1 border-bottom-1 surface-border">
                                    <div className="col-7">
                                        <span>Sewa Kamar ({nights} Malam @ {formatCurrency(ratePerNight)})</span>
                                    </div>
                                    <div className="col-5 text-right font-semibold text-900">
                                        {formatCurrency(roomSubtotal)}
                                    </div>
                                </div>

                                {/* 2. Fasilitas Tambahan yang Dipesan Saat Booking (Jika Ada) */}
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

                                {/* 3. Sisa Tagihan Berjalan (Murni Kamar + Fasilitas Saja, Tanpa Dikurangi Deposit) */}
                                <div className="grid text-xs pt-2 font-bold border-top-1 surface-border mt-1">
                                    <div className="col-7 text-900 flex align-items-center gap-1">
                                        <i className="pi pi-wallet text-orange-600"></i>
                                        <span>Sisa Tagihan Berjalan</span>
                                    </div>
                                    <div className="col-5 text-right text-base text-orange-700 font-bold">
                                        {formatCurrency(sisaTagihanBerjalan)}
                                    </div>
                                </div>

                                {/* 4. Deposit / Uang Jaminan Tercatat (Sebagai informasi uang jaminan terpisah) */}
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

                            {/* Card 3: Form Deposit Jaminan Kasir Tambahan (Incidental Deposit) */}
                            <div className="p-3 border-round surface-0 border-1 surface-border mb-2">
                                <div className="flex align-items-center justify-content-between mb-2">
                                    <span className="font-bold text-xs text-800 uppercase flex align-items-center gap-1">
                                        <i className="pi pi-shield text-primary"></i>
                                        {depositPaid > 0 ? 'Deposit Tambahan di Kasir (Incidental Deposit)' : 'Penetapan Uang Jaminan / Deposit Kasir'}
                                    </span>
                                </div>

                                {/* Presets Uang Jaminan */}
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

