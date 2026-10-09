'use client';

import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { apiCheckoutSearch, apiCheckoutSubmit, apiShiftCurrent, apiRequestInspection, apiCancelInspection } from './components/endpoints';
import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';
import StatusIndicator from '@/app/components/status/StatusIndicator';
import StatusLegend from '@/app/components/status/StatusLegend';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
// import FrontOfficeNav from '@/app/components/navigation/FrontOfficeNav';
import { buildStandardReferenceNo } from '@/lib/tools/paymentTools';

const CheckoutContent = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [submitLoad, setSubmitLoad] = useState(false);

    const [rooms, setRooms] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roomTypeFilter, setRoomTypeFilter] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Pagination state
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [shiftAktif, setShiftAktif] = useState<any>(null);

    // Checkout modal state
    const [checkoutDialogVisible, setCheckoutDialogVisible] = useState(false);

    // Dual-Path Inspection Mode state ('direct' | 'inspection')
    const [checkoutFlowMode, setCheckoutFlowMode] = useState<'direct' | 'inspection'>('direct');
    const [requestingInspection, setRequestingInspection] = useState(false);
    const [cancelingInspection, setCancelingInspection] = useState(false);

    // Payment form state
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'transfer'>('cash');
    const [bankName, setBankName] = useState<string>('BCA');
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
    const [referenceNo, setReferenceNo] = useState('');

    // Invoice & Success modal states
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [lastCheckoutResult, setLastCheckoutResult] = useState<any>(null);
    const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
    const [activeInvoiceFolio, setActiveInvoiceFolio] = useState<string>('');
    const [activeInvoiceNumber, setActiveInvoiceNumber] = useState<string>('');

    const fetchShift = async () => {
        try {
            const res = await postData(apiShiftCurrent, {});
            setShiftAktif(res?.data?.data || null);
        } catch (error) {
            console.error('Failed to fetch shift', error);
        }
    };

    const searchRooms = async (keyword: string = '') => {
        setLoading(true);
        try {
            const res = await postData(apiCheckoutSearch, {
                keyword,
                kode_cabang: session?.user?.active_kode_cabang
            });
            const list = res?.data?.data || [];
            setRooms(list);

            // If selectedRoom is still active, re-sync its data
            if (selectedRoom) {
                const updated = list.find((r: any) => r.kode_folio === selectedRoom.kode_folio);
                if (updated) {
                    setSelectedRoom(updated);
                    if (updated.balance > 0) {
                        setPaymentAmount(updated.balance);
                    }
                }
            }
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mencari kamar siap checkout');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestInspection = async () => {
        if (!selectedRoom) return;
        const targetKamar = selectedRoom.kode_kamar || selectedRoom.rooms?.[0]?.kode_kamar;
        const targetResRoom = selectedRoom.kode_reservasi_room || selectedRoom.rooms?.[0]?.kode_reservasi_room;

        setRequestingInspection(true);
        try {
            const res = await postData(apiRequestInspection, {
                kode_kamar: targetKamar,
                kode_reservasi_room: targetResRoom,
                kode_cabang: session?.user?.active_kode_cabang || selectedRoom.kode_cabang,
                priority: 'urgent',
                notes: `Pemeriksaan kamar checkout untuk tamu ${selectedRoom.guest_name}`
            });

            showSuccess(toast, res?.data?.message || 'Permintaan cek kamar berhasil dikirim ke Housekeeping.');
            await searchRooms(searchKeyword);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal meminta cek kamar');
        } finally {
            setRequestingInspection(false);
        }
    };

    const handleCancelInspection = async () => {
        if (!selectedRoom?.active_inspection_task?.kode_housekeeping_task) return;

        setCancelingInspection(true);
        try {
            const res = await postData(apiCancelInspection, {
                kode_housekeeping_task: selectedRoom.active_inspection_task.kode_housekeeping_task,
                cancel_reason: 'Dibatalkan oleh kasir FO (Express checkout override)'
            });

            showSuccess(toast, res?.data?.message || 'Inspeksi kamar dibatalkan. Lanjut checkout langsung.');
            setCheckoutFlowMode('direct');
            await searchRooms(searchKeyword);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal membatalkan inspeksi');
        } finally {
            setCancelingInspection(false);
        }
    };

    useEffect(() => {
        fetchShift();
        if (session?.user?.active_kode_cabang) {
            const initialSearch = searchParams?.get('search') || searchParams?.get('keyword') || '';
            if (initialSearch) {
                setSearchKeyword(initialSearch);
                searchRooms(initialSearch);
            } else {
                searchRooms();
            }
        }
    }, [session?.user?.active_kode_cabang, searchParams]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchKeyword(val);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            searchRooms(val);
            setFirst(0);
        }, 400);
    };

    const handleResetFilter = () => {
        setSearchKeyword('');
        setStatusFilter('');
        setRoomTypeFilter('');
        setFirst(0);
        searchRooms('');
    };

    const handleSelectRoom = (room: any) => {
        setSelectedRoom(room);
        if (room) {
            const allIds = (room.rooms || [room]).map((r: any) => r.kode_reservasi_room).filter(Boolean);
            setSelectedRoomIds(allIds);
            if (room.balance > 0) {
                setPaymentAmount(room.balance);
            } else {
                setPaymentAmount(null);
            }
            if (room.active_inspection_task && room.active_inspection_task.status !== 'canceled') {
                setCheckoutFlowMode('inspection');
            } else {
                setCheckoutFlowMode('direct');
            }
        } else {
            setSelectedRoomIds([]);
            setPaymentAmount(null);
            setCheckoutFlowMode('direct');
        }
        setReferenceNo('');
    };

    // Filtered rooms based on dropdowns
    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            const isSettled = r.is_settled || Number(r.balance || 0) <= 0;
            if (statusFilter === 'settled' && !isSettled) return false;
            if (statusFilter === 'unsettled' && isSettled) return false;
            if (roomTypeFilter && r.nama_tipe !== roomTypeFilter) return false;
            return true;
        });
    }, [rooms, statusFilter, roomTypeFilter]);

    // Distinct room types for dropdown filter
    const roomTypeOptions = useMemo(() => {
        const set = new Set<string>();
        rooms.forEach((r) => {
            if (r.nama_tipe) set.add(r.nama_tipe);
        });
        return [
            { label: 'Semua Tipe Kamar', value: '' },
            ...Array.from(set).map((t) => ({ label: t, value: t }))
        ];
    }, [rooms]);

    const statusOptions = [
        { label: 'Semua Status Tagihan', value: '' },
        { label: 'Lunas', value: 'settled' },
        { label: 'Belum Lunas', value: 'unsettled' }
    ];

    const handleCheckout = async (withPayment: boolean = false) => {
        if (!selectedRoom) return;

        const targetIds = selectedRoomIds.length > 0
            ? selectedRoomIds
            : (selectedRoom.rooms || [selectedRoom]).map((r: any) => r.kode_reservasi_room).filter(Boolean);

        if (targetIds.length === 0) {
            showError(toast, 'Pilih minimal satu kamar untuk checkout');
            return;
        }

        const outstanding = Number(selectedRoom.balance || 0);

        if (withPayment || outstanding > 0) {
            const payVal = paymentAmount !== null && paymentAmount !== undefined ? paymentAmount : outstanding;
            if (!payVal || payVal <= 0) {
                showError(toast, 'Nominal pembayaran tidak valid');
                return;
            }

            if (paymentMethod === 'cash' && !shiftAktif) {
                showError(toast, 'Shift kasir belum dibuka. Buka shift kasir terlebih dahulu untuk pembayaran tunai.');
                return;
            }
        }

        setSubmitLoad(true);
        try {
            const payload: any = {
                kode_folio: selectedRoom.kode_folio,
                kode_reservasi_rooms: targetIds,
                kode_reservasi_room: targetIds[0],
                kode_cabang: session?.user?.active_kode_cabang || selectedRoom.kode_cabang,
                kode_cashier_shift: shiftAktif?.kode_cashier_shift || undefined,
                inspection_mode: checkoutFlowMode === 'inspection' ? 'with_inspection' : 'skipped'
            };

            if (withPayment || outstanding > 0) {
                payload.payment = [
                    {
                        payment_method: paymentMethod,
                        bank_name: (paymentMethod === 'card' || paymentMethod === 'transfer') ? bankName : undefined,
                        card_type: paymentMethod === 'card' ? cardType : undefined,
                        amount: paymentAmount !== null ? paymentAmount : outstanding,
                        kode_cashier_shift: shiftAktif?.kode_cashier_shift || undefined,
                        reference_no: buildStandardReferenceNo(paymentMethod, referenceNo, bankName, cardType) || undefined
                    }
                ];
            }

            const res = await postData(apiCheckoutSubmit, payload);
            const resData = res?.data?.data || {};

            showSuccess(toast, res?.data?.message || 'Checkout kamar berhasil diproses!');

            setLastCheckoutResult({
                ...selectedRoom,
                nomor_kamar: resData.nomor_kamar || selectedRoom.nomor_kamar,
                room_count: resData.room_count || targetIds.length,
                invoice_number: resData.invoice_number || selectedRoom.invoice_number,
                rooms_checked_out: resData.rooms_checked_out || [],
                is_folio_closed: resData.is_folio_closed
            });
            setActiveInvoiceFolio(selectedRoom.kode_folio);
            setActiveInvoiceNumber(resData.invoice_number || selectedRoom.invoice_number || '');
            setCheckoutDialogVisible(false);
            setSuccessDialogVisible(true);

            // Reset selection & refresh table
            setSelectedRoom(null);
            setSelectedRoomIds([]);
            setPaymentAmount(null);
            setReferenceNo('');
            searchRooms();
        } catch (error: any) {
            const errMsg = error?.response?.data?.message || 'Gagal memproses checkout';
            showError(toast, errMsg);

            if (errMsg.includes('belum lunas: Rp')) {
                const match = errMsg.match(/Rp\s*([\d.,]+)/);
                if (match && match[1]) {
                    const amountStr = match[1].replace(/[^\d]/g, '');
                    const amountNum = parseInt(amountStr, 10);
                    if (!isNaN(amountNum)) {
                        setPaymentAmount(amountNum);
                    }
                }
            }
        } finally {
            setSubmitLoad(false);
        }
    };

    const formatCurrency = (val: number | string | undefined | null) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
            Number(val || 0)
        );
    };

    const isSelectedSettled = selectedRoom ? selectedRoom.is_settled || Number(selectedRoom.balance || 0) <= 0 : false;
    const selectedBalance = selectedRoom ? Math.max(0, Number(selectedRoom.balance || 0)) : 0;

    // Body templates matching Master Tamu conventions
    const roomBodyTemplate = (rowData: any) => {
        const count = rowData.room_count || rowData.rooms?.length || 1;
        return (
            <div className="flex flex-column gap-1">
                <div className="flex align-items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-primary">
                        Kamar {rowData.nomor_kamar}
                    </span>
                    {count > 1 && (
                        <Tag severity="info" value={`${count} Kamar`} className="text-xs font-bold" />
                    )}
                </div>
                <span className="text-xs text-500 font-normal">{rowData.nama_tipe}</span>
            </div>
        );
    };

    const guestBodyTemplate = (rowData: any) => (
        <div>
            <div className="font-semibold text-900">{rowData.guest_name}</div>
            <div className="text-xs text-500">{rowData.guest_phone || '-'}</div>
        </div>
    );

    const stayScheduleBodyTemplate = (rowData: any) => (
        <div className="text-xs">
            <div>In: {formatDateSystem(rowData.check_in_date, 'dd/MM/yyyy HH:mm')}</div>
            <div className="text-500">Out: {formatDateSystem(rowData.check_out_date, 'dd/MM/yyyy HH:mm')}</div>
        </div>
    );

    const billingStatusBodyTemplate = (rowData: any) => {
        const isSettled = rowData.is_settled || Number(rowData.balance || 0) <= 0;
        return isSettled ? (
            <Tag severity="success" value="LUNAS" icon="pi pi-check" />
        ) : (
            <Tag severity="danger" value="BELUM LUNAS" icon="pi pi-exclamation-circle" />
        );
    };

    const inspectionStatusBodyTemplate = (rowData: any) => {
        const st = rowData.inspection_status || 'not_requested';
        if (st === 'in_progress') {
            return <Tag severity="warning" value="Sedang Dicek" icon="pi pi-spin pi-spinner" className="text-xs" />;
        } else if (st === 'clear') {
            return <Tag severity="success" value="Clear (Aman)" icon="pi pi-check" className="text-xs" />;
        } else if (st === 'with_charges') {
            return <Tag severity="danger" value="Ada Tambahan" icon="pi pi-exclamation-triangle" className="text-xs" />;
        }
        return <Tag severity="secondary" value="Tanpa Cek" className="text-xs" />;
    };

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex justify-content-center gap-1">
            <Button
                icon="pi pi-sign-out"
                outlined
                severity="success"
                className="p-button-sm"
                onClick={() => {
                    handleSelectRoom(rowData);
                    setCheckoutDialogVisible(true);
                }}
                tooltip="Proses Checkout"
            />
            <Button
                icon="pi pi-eye"
                outlined
                severity="info"
                className="p-button-sm"
                onClick={() => {
                    handleSelectRoom(rowData);
                    setCheckoutDialogVisible(true);
                }}
                tooltip="Rincian Folio & Tagihan"
            />
            <Button
                icon="pi pi-file-pdf"
                outlined
                severity="secondary"
                className="p-button-sm"
                onClick={() => {
                    setActiveInvoiceFolio(rowData.kode_folio);
                    setActiveInvoiceNumber(rowData.invoice_number || '');
                    setInvoiceModalVisible(true);
                }}
                tooltip="Invoice Resmi"
            />
        </div>
    );

    // Table Header Template matching Master Tamu pattern
    const headerTemplate = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="text-xl font-bold">Daftar Kamar Siap Checkout</span>
                <div className="flex align-items-center gap-2 ml-auto w-full md:w-auto">
                    <IconField iconPosition="left" className="w-full md:w-20rem">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={searchKeyword}
                            className="w-full"
                            placeholder="Cari Kamar / Tamu / Folio..."
                            onChange={handleSearchChange}
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

            <div className="flex flex-wrap align-items-center gap-2 pt-2 border-top-1 surface-border">
                <Dropdown
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(e) => {
                        setStatusFilter(e.value);
                        setFirst(0);
                    }}
                    placeholder="Status Tagihan"
                    className="p-inputtext-sm w-full md:w-13rem"
                />
                <Dropdown
                    value={roomTypeFilter}
                    options={roomTypeOptions}
                    onChange={(e) => {
                        setRoomTypeFilter(e.value);
                        setFirst(0);
                    }}
                    placeholder="Tipe Kamar"
                    className="p-inputtext-sm w-full md:w-13rem"
                />
            </div>
        </div>
    );

    return (
        <div className="p-0">
            <Toast ref={toast} position="top-right" />
            {/* <FrontOfficeNav /> */}

            {/* Master Tamu Styled Card */}
            <div className="card">
                {/* Page Title & Subtitle */}
                <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center mb-4 gap-2">
                    <div className="flex flex-column">
                        <h3 className="text-2xl font-semibold flex align-items-center gap-2 m-0">
                            <i className="pi pi-sign-out text-blue-600 text-3xl"></i>Checkout & Penyelesaian Tagihan
                        </h3>
                        <p className="text-gray-500 m-0 mt-1">
                            Kelola checkout kamar, pelunasan sisa tagihan folio, dan penerbitan invoice resmi tamu.
                        </p>
                    </div>
                    <div className="inline-flex align-items-center gap-2 px-3 py-2 border-round-lg surface-ground border-1 surface-border">
                        <i className="pi pi-building text-primary font-bold"></i>
                        <span className="text-xs text-500 font-medium">Cabang Aktif:</span>
                        <span className="text-sm font-semibold text-900">
                            {session?.user?.active_kode_cabang || '-'} {session?.user?.active_branch_name ? `(${session.user.active_branch_name})` : ''}
                        </span>
                    </div>
                </div>

                {/* Toolbar Buttons with Dividers */}
                <div className="flex flex-row flex-wrap align-items-center gap-2 mb-3">
                    <Button
                        size="small"
                        label="Checkout Terpilih"
                        icon="pi pi-sign-out"
                        outlined
                        severity="success"
                        disabled={!selectedRoom}
                        onClick={() => setCheckoutDialogVisible(true)}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Cetak Invoice"
                        icon="pi pi-file-pdf"
                        outlined
                        severity="info"
                        disabled={!selectedRoom}
                        onClick={() => {
                            if (selectedRoom) {
                                setActiveInvoiceFolio(selectedRoom.kode_folio);
                                setActiveInvoiceNumber(selectedRoom.invoice_number || '');
                                setInvoiceModalVisible(true);
                            }
                        }}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Daftar Tamu Menginap"
                        icon="pi pi-users"
                        outlined
                        severity="secondary"
                        onClick={() => router.push('/tamu_menginap')}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Dashboard Reservasi"
                        icon="pi pi-th-large"
                        outlined
                        severity="warning"
                        onClick={() => router.push('/reservasi_dashboard')}
                    />
                    <Divider layout="vertical" />
                    <Button
                        size="small"
                        label="Refresh"
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => searchRooms(searchKeyword)}
                        loading={loading}
                    />
                </div>

                {/* Status Legend matching Master Tamu */}
                <StatusLegend items={[{ label: 'Lunas', color: '#22c55e' }, { label: 'Belum Lunas', color: '#ef4444' }]} />

                {/* Master Tamu Styled DataTable */}
                <DataTable
                    value={filteredRooms}
                    scrollable
                    paginator
                    first={first}
                    rows={rows}
                    totalRecords={filteredRooms.length}
                    onPage={(e) => {
                        setFirst(e.first);
                        setRows(e.rows);
                    }}
                    selectionMode="single"
                    selection={selectedRoom}
                    onSelectionChange={(e) => handleSelectRoom(e.value)}
                    dataKey="kode_folio"
                    header={headerTemplate}
                    loading={loading}
                    emptyMessage="Tidak ada data kamar siap checkout"
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data checkout"
                    stripedRows
                    rowHover
                >
                    <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                    <Column
                        field="is_settled"
                        header="Status"
                        align="center"
                        body={(rowData) => {
                            const isSettled = rowData.is_settled || Number(rowData.balance || 0) <= 0;
                            return <StatusIndicator status={isSettled ? 1 : 0} label={isSettled ? 'Lunas' : 'Belum Lunas'} />;
                        }}
                        style={{ minWidth: '5rem', width: '5rem' }}
                    />
                    <Column
                        field="nomor_kamar"
                        header="Kamar"
                        body={roomBodyTemplate}
                        sortable
                        style={{ minWidth: '12rem' }}
                    />
                    <Column
                        field="kode_folio"
                        header="Kode Folio"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="guest_name"
                        header="Nama Tamu (PIC)"
                        body={guestBodyTemplate}
                        sortable
                        style={{ minWidth: '15rem' }}
                    />
                    <Column
                        field="nama_tipe"
                        header="Tipe Kamar"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="check_in_date"
                        header="Jadwal Menginap"
                        body={stayScheduleBodyTemplate}
                        sortable
                        style={{ minWidth: '14rem' }}
                    />
                    <Column
                        field="total_charges"
                        header="Total Tagihan"
                        body={(r) => (
                            <span className="font-semibold text-900">
                                {formatCurrency(r.total_charges || r.current_grand_total)}
                            </span>
                        )}
                        align="right"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="balance"
                        header="Sisa Saldo"
                        body={(r) => {
                            const bal = Number(r.balance || 0);
                            return (
                                <span className={`font-bold ${bal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(bal)}
                                </span>
                            );
                        }}
                        align="right"
                        sortable
                        style={{ minWidth: '11rem' }}
                    />
                    <Column
                        field="is_settled"
                        header="Status Tagihan"
                        body={billingStatusBodyTemplate}
                        align="center"
                        sortable
                        style={{ minWidth: '10rem' }}
                    />
                    <Column
                        field="inspection_status"
                        header="Cek Kamar"
                        body={inspectionStatusBodyTemplate}
                        align="center"
                        sortable
                        style={{ minWidth: '9rem' }}
                    />
                    <Column
                        header="Aksi"
                        body={actionBodyTemplate}
                        align="center"
                        frozen
                        alignFrozen="right"
                        style={{ minWidth: '10rem' }}
                    />
                </DataTable>
            </div>

            {/* Modal Dialog: Proses Checkout & Pelunasan Folio */}
            <Dialog
                visible={checkoutDialogVisible}
                onHide={() => setCheckoutDialogVisible(false)}
                header={
                    <div className="flex align-items-center gap-3">
                        <div className="w-2.5rem h-2.5rem border-round-xl bg-primary-50 text-primary flex align-items-center justify-content-center flex-shrink-0 border-1 border-primary-200 shadow-1">
                            <i className="pi pi-sign-out text-xl"></i>
                        </div>
                        <div>
                            <span className="font-bold text-lg text-900 block line-height-2">
                                Proses Checkout &amp; Pelunasan Folio
                            </span>
                            <span className="text-xs text-500 font-normal block">
                                Administrasi pembayaran kasir dan serah terima kamar tamu
                            </span>
                        </div>
                    </div>
                }
                style={{ width: '720px' }}
                breakpoints={{ '960px': '85vw', '641px': '95vw' }}
                modal
                closable
                footer={
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top-1 surface-border">
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            className="p-button-outlined p-button-sm"
                            onClick={() => setCheckoutDialogVisible(false)}
                        />
                        <div className="flex gap-2">
                            {selectedRoom && (
                                <Button
                                    label="Pratinjau Invoice"
                                    icon="pi pi-file-pdf"
                                    className="p-button-outlined p-button-sm font-semibold"
                                    severity="info"
                                    onClick={() => {
                                        setActiveInvoiceFolio(selectedRoom.kode_folio);
                                        setActiveInvoiceNumber(selectedRoom.invoice_number || '');
                                        setInvoiceModalVisible(true);
                                    }}
                                />
                            )}
                            {isSelectedSettled ? (
                                <Button
                                    label={
                                        selectedRoomIds.length > 1
                                            ? `Konfirmasi Checkout (${selectedRoomIds.length} Kamar)`
                                            : `Konfirmasi Checkout (Kamar ${selectedRoom?.nomor_kamar})`
                                    }
                                    icon="pi pi-check"
                                    severity="success"
                                    className="p-button-sm font-bold shadow-1"
                                    onClick={() => handleCheckout(false)}
                                    loading={submitLoad}
                                    disabled={selectedRoomIds.length === 0}
                                />
                            ) : (
                                <Button
                                    label={
                                        selectedRoomIds.length > 1
                                            ? `Bayar ${formatCurrency(paymentAmount || selectedBalance)} & Checkout (${selectedRoomIds.length} Kamar)`
                                            : `Bayar ${formatCurrency(paymentAmount || selectedBalance)} & Checkout`
                                    }
                                    icon="pi pi-credit-card"
                                    severity="warning"
                                    className="p-button-sm font-bold shadow-1"
                                    onClick={() => handleCheckout(true)}
                                    loading={submitLoad}
                                    disabled={(paymentMethod === 'cash' && !shiftAktif) || selectedRoomIds.length === 0}
                                />
                            )}
                        </div>
                    </div>
                }
            >
                {selectedRoom && (
                    <div className="flex flex-column gap-3 pt-2">
                        {/* ── Section 1: Informasi Tamu & Kamar ── */}
                        <div className="surface-50 border-1 surface-border border-round-xl p-3">
                            <div className="flex justify-content-between align-items-center mb-2.5">
                                <span className="text-xs font-bold text-color-secondary uppercase letter-spacing-1">
                                    Informasi Tamu &amp; Kamar
                                </span>
                                <div className="flex align-items-center gap-2">
                                    <span className="text-xs font-mono font-bold px-2 py-1 bg-white border-round border-1 surface-border text-800">
                                        Folio: {selectedRoom.kode_folio}
                                    </span>
                                    {selectedRoom.kode_reservasi && (
                                        <span className="text-xs font-mono font-semibold px-2 py-1 bg-primary-50 text-primary border-round border-1 border-primary-200">
                                            {selectedRoom.kode_reservasi}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex align-items-center gap-3">
                                <div className="w-3.5rem h-3.5rem border-round-xl bg-primary text-white font-bold text-xl flex align-items-center justify-content-center shadow-1 flex-shrink-0">
                                    {selectedRoom.room_count > 1 ? `${selectedRoom.room_count}K` : selectedRoom.nomor_kamar}
                                </div>
                                <div className="flex flex-column gap-1 flex-grow-1">
                                    <div className="flex align-items-center justify-content-between flex-wrap gap-1">
                                        <span className="text-lg font-bold text-900">{selectedRoom.guest_name}</span>
                                        {selectedRoom.nama_tipe && (
                                            <span className="text-xs font-semibold text-700 bg-white px-2 py-0.5 border-round border-1 surface-border">
                                                {selectedRoom.nama_tipe}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex align-items-center gap-3 text-xs text-600 flex-wrap">
                                        <span>
                                            <i className="pi pi-key mr-1 text-primary"></i>
                                            Kamar: <strong>{selectedRoom.nomor_kamar}</strong>
                                        </span>
                                        {selectedRoom.check_in_date && selectedRoom.check_out_date && (
                                            <span>
                                                <i className="pi pi-calendar mr-1 text-primary"></i>
                                                {formatDateSystem(selectedRoom.check_in_date, 'dd/MM/yyyy')} — {formatDateSystem(selectedRoom.check_out_date, 'dd/MM/yyyy')}
                                            </span>
                                        )}
                                        {selectedRoom.guest_phone && (
                                            <span>
                                                <i className="pi pi-phone mr-1 text-primary"></i>
                                                {selectedRoom.guest_phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Room Checkout Selector */}
                        {selectedRoom.rooms && selectedRoom.rooms.length > 1 && (
                            <div className="surface-50 border-1 surface-border border-round-xl p-3">
                                <div className="flex justify-content-between align-items-center mb-2">
                                    <span className="text-xs font-bold text-color-secondary uppercase letter-spacing-1">
                                        Pilih Kamar yang Di-Checkout ({selectedRoomIds.length} dari {selectedRoom.rooms.length} Kamar)
                                    </span>
                                    <Button
                                        label={selectedRoomIds.length === selectedRoom.rooms.length ? 'Batal Semua' : 'Pilih Semua'}
                                        className="p-button-text p-button-sm text-xs p-0 font-semibold"
                                        onClick={() => {
                                            if (selectedRoomIds.length === selectedRoom.rooms.length) {
                                                setSelectedRoomIds([]);
                                            } else {
                                                setSelectedRoomIds(selectedRoom.rooms.map((r: any) => r.kode_reservasi_room));
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-column gap-2 max-h-10rem overflow-y-auto">
                                    {selectedRoom.rooms.map((rm: any, idx: number) => {
                                        const isChecked = selectedRoomIds.includes(rm.kode_reservasi_room);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex align-items-center justify-content-between p-2.5 border-round-lg cursor-pointer transition-colors ${isChecked ? 'bg-primary-50 border-1 border-primary-300' : 'surface-100 border-1 surface-border'
                                                    }`}
                                                onClick={() => {
                                                    if (isChecked) {
                                                        setSelectedRoomIds(selectedRoomIds.filter((id) => id !== rm.kode_reservasi_room));
                                                    } else {
                                                        setSelectedRoomIds([...selectedRoomIds, rm.kode_reservasi_room]);
                                                    }
                                                }}
                                            >
                                                <div className="flex align-items-center gap-2">
                                                    <i
                                                        className={`pi ${isChecked ? 'pi-check-circle text-primary font-bold' : 'pi-circle text-400'} text-base`}
                                                    ></i>
                                                    <span className="font-bold text-900">Kamar {rm.nomor_kamar}</span>
                                                    <span className="text-xs text-500">({rm.nama_tipe || selectedRoom.nama_tipe})</span>
                                                </div>
                                                <span className="text-xs font-semibold text-700">{formatCurrency(rm.rate_per_night)}/mlm</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Section 2: Pilihan Alur Checkout ── */}
                        <div className="surface-50 border-1 surface-border border-round-xl p-3">
                            <div className="flex justify-content-between align-items-center mb-2.5 flex-wrap gap-2">
                                <span className="text-xs font-bold text-color-secondary uppercase letter-spacing-1 flex align-items-center gap-1.5">
                                    <i className="pi pi-compass text-primary"></i> Pilihan Alur Checkout
                                </span>
                                {selectedRoom.inspection_status && selectedRoom.inspection_status !== 'not_requested' && (
                                    <Tag
                                        severity={
                                            selectedRoom.inspection_status === 'in_progress' ? 'warning' :
                                            selectedRoom.inspection_status === 'clear' ? 'success' :
                                            'danger'
                                        }
                                        value={
                                            selectedRoom.inspection_status === 'in_progress' ? 'Sedang Diperiksa HK' :
                                            selectedRoom.inspection_status === 'clear' ? 'Inspeksi: Kamar Clear' :
                                            'Inspeksi: Ada Biaya Tambahan'
                                        }
                                        icon={
                                            selectedRoom.inspection_status === 'in_progress' ? 'pi pi-spin pi-spinner' :
                                            selectedRoom.inspection_status === 'clear' ? 'pi pi-check' :
                                            'pi pi-exclamation-triangle'
                                        }
                                        className="text-xs font-bold"
                                    />
                                )}
                            </div>

                            {/* Option Selection Cards */}
                            <div className="grid grid-nogutter gap-2.5 mb-1">
                                <div
                                    className={`col p-3 border-round-xl cursor-pointer border-2 transition-all transition-duration-200 ${
                                        checkoutFlowMode === 'direct'
                                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-1'
                                            : 'bg-white border-200 hover:border-300'
                                    }`}
                                    onClick={() => setCheckoutFlowMode('direct')}
                                >
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <div className="w-2.5rem h-2.5rem border-circle bg-blue-100 text-blue-700 flex align-items-center justify-content-center">
                                            <i className="pi pi-bolt font-bold text-base"></i>
                                        </div>
                                        <i className={`pi ${checkoutFlowMode === 'direct' ? 'pi-check-circle text-blue-600 font-bold text-lg' : 'pi-circle text-400'}`}></i>
                                    </div>
                                    <div className="font-bold text-sm text-900 mb-1">Checkout Langsung</div>
                                    <p className="text-xs text-600 m-0 line-height-3">
                                        Express / VIP. Pelunasan tanpa menunggu Housekeeping.
                                    </p>
                                </div>

                                <div
                                    className={`col p-3 border-round-xl cursor-pointer border-2 transition-all transition-duration-200 ${
                                        checkoutFlowMode === 'inspection'
                                            ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-1'
                                            : 'bg-white border-200 hover:border-300'
                                    }`}
                                    onClick={() => setCheckoutFlowMode('inspection')}
                                >
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <div className="w-2.5rem h-2.5rem border-circle bg-orange-100 text-orange-700 flex align-items-center justify-content-center">
                                            <i className="pi pi-search-plus font-bold text-base"></i>
                                        </div>
                                        <i className={`pi ${checkoutFlowMode === 'inspection' ? 'pi-check-circle text-orange-600 font-bold text-lg' : 'pi-circle text-400'}`}></i>
                                    </div>
                                    <div className="font-bold text-sm text-900 mb-1">Cek Kamar (Room Check)</div>
                                    <p className="text-xs text-600 m-0 line-height-3">
                                        HK cek minibar, linen, &amp; barang tertinggal tamu.
                                    </p>
                                </div>
                            </div>

                            {/* Section Details if Mode Inspection is active */}
                            {checkoutFlowMode === 'inspection' && (
                                <div className="bg-white p-3 border-round-xl border-1 surface-border mt-2.5">
                                    {(!selectedRoom.active_inspection_task || selectedRoom.active_inspection_task.status === 'canceled') ? (
                                        <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-2">
                                            <div>
                                                <span className="font-bold text-sm text-900 block">Pemeriksaan Kamar Belum Diminta</span>
                                                <small className="text-600">Panggil petugas Housekeeping untuk mengecek kondisi kamar dan minibar.</small>
                                            </div>
                                            <Button
                                                label="Panggil Cek Kamar"
                                                icon="pi pi-send"
                                                severity="warning"
                                                size="small"
                                                className="font-bold text-xs"
                                                loading={requestingInspection}
                                                onClick={handleRequestInspection}
                                            />
                                        </div>
                                    ) : (selectedRoom.active_inspection_task.status === 'assigned' || selectedRoom.active_inspection_task.status === 'in_progress') ? (
                                        <div className="flex flex-column gap-2">
                                            <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                                                <div className="flex align-items-center gap-2">
                                                    <i className="pi pi-spin pi-spinner text-orange-600 text-xl"></i>
                                                    <div>
                                                        <span className="font-bold text-sm text-900">Sedang Diperiksa Petugas HK</span>
                                                        <small className="text-500 block">
                                                            PIC: <strong>{selectedRoom.active_inspection_task.pic_name || 'Petugas HK'}</strong> &bull; Dimulai: {formatDateSystem(selectedRoom.active_inspection_task.created_at, 'HH:mm')}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        icon="pi pi-refresh"
                                                        size="small"
                                                        outlined
                                                        severity="info"
                                                        tooltip="Perbarui Status Cek Kamar"
                                                        onClick={() => searchRooms(searchKeyword)}
                                                    />
                                                    <Button
                                                        label="Batal / Lewati"
                                                        icon="pi pi-times"
                                                        size="small"
                                                        text
                                                        severity="danger"
                                                        loading={cancelingInspection}
                                                        tooltip="Batalkan inspeksi & checkout langsung"
                                                        onClick={handleCancelInspection}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-xs text-orange-700 bg-orange-50 p-2 border-round-lg border-1 border-orange-200">
                                                * Mohon tunggu sejenak sementara tim Housekeeping mengonfirmasi minibar &amp; kondisi linen di kamar.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-column gap-2">
                                            <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                                                <div className="flex align-items-center gap-2">
                                                    <i className="pi pi-check-circle text-green-600 text-xl"></i>
                                                    <div>
                                                        <span className="font-bold text-sm text-900">Pemeriksaan Kamar Selesai</span>
                                                        <small className="text-500 block">
                                                            Diperiksa oleh: <strong>{selectedRoom.active_inspection_task.pic_name || 'Petugas HK'}</strong>
                                                        </small>
                                                    </div>
                                                </div>
                                                <Tag
                                                    severity={selectedRoom.active_inspection_task.inspection_result === 'with_charges' ? 'danger' : 'success'}
                                                    value={selectedRoom.active_inspection_task.inspection_result === 'with_charges' ? 'Ada Biaya Tambahan' : 'Kamar Clear'}
                                                    className="font-bold"
                                                />
                                            </div>

                                            {/* Findings details if with_charges */}
                                            {selectedRoom.active_inspection_task.inspection_details && (
                                                <div className="surface-50 p-2.5 border-round-lg text-xs mt-1 border-1 surface-border">
                                                    {selectedRoom.active_inspection_task.inspection_details.minibar_items?.length > 0 && (
                                                        <div className="mb-1 text-700">
                                                            <strong>Konsumsi Minibar:</strong> {selectedRoom.active_inspection_task.inspection_details.minibar_items.map((m: any) => `${m.item_name} (${m.qty}x)`).join(', ')}
                                                        </div>
                                                    )}
                                                    {selectedRoom.active_inspection_task.inspection_details.damaged_items?.length > 0 && (
                                                        <div className="mb-1 text-red-700">
                                                            <strong>Denda Kerusakan:</strong> {selectedRoom.active_inspection_task.inspection_details.damaged_items.map((d: any) => d.item_name).join(', ')}
                                                        </div>
                                                    )}
                                                    {selectedRoom.active_inspection_task.inspection_details.total_additional_charges > 0 && (
                                                        <div className="font-bold text-green-700 mt-1">
                                                            Total Tambahan: {formatCurrency(selectedRoom.active_inspection_task.inspection_details.total_additional_charges)} (Otomatis masuk ke tagihan folio)
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lost and Found Alert Banner if item left behind */}
                            {selectedRoom.active_inspection_task?.inspection_details?.lost_and_found && (
                                <div className="p-3 border-round-xl bg-orange-100 border-2 border-orange-500 text-orange-900 text-xs mt-2.5 flex align-items-center gap-3 shadow-1">
                                    <i className="pi pi-bell text-orange-600 text-2xl flex-shrink-0 animate-pulse"></i>
                                    <div>
                                        <div className="font-bold text-sm text-orange-900">
                                            ⚠️ PERHATIAN: BARANG TAMU TERTINGGAL (LOST &amp; FOUND)!
                                        </div>
                                        <div className="text-xs text-orange-800 mt-1 font-medium">
                                            Housekeeping menemukan: <strong>{selectedRoom.active_inspection_task.inspection_details.lost_and_found.item_description}</strong>
                                        </div>
                                        <div className="text-xs text-orange-700 italic mt-0.5">
                                            Segera serahkan barang ini ke tamu di lobi sebelum tamu meninggalkan hotel!
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Section 3: Status Tagihan ── */}
                        {isSelectedSettled ? (
                            <div className="p-3 border-round-xl bg-green-50 border-1 border-green-300 text-green-900 flex align-items-center gap-3">
                                <div className="w-2.5rem h-2.5rem border-round-lg bg-green-100 text-green-700 flex align-items-center justify-content-center flex-shrink-0">
                                    <i className="pi pi-check-circle text-xl font-bold"></i>
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-green-900">Status Tagihan: LUNAS / SETTLED</div>
                                    <div className="text-xs text-green-700 mt-0.5 line-height-3">
                                        Seluruh biaya tagihan kamar dan fasilitas telah terselesaikan. Kamar siap di-checkout langsung.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 border-round-xl bg-red-50 border-1 border-red-300 text-red-900 flex align-items-center gap-3">
                                <div className="w-2.5rem h-2.5rem border-round-lg bg-red-100 text-red-700 flex align-items-center justify-content-center flex-shrink-0">
                                    <i className="pi pi-exclamation-triangle text-xl font-bold"></i>
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-red-900">Status Tagihan: BELUM LUNAS</div>
                                    <div className="text-xs text-red-700 mt-0.5 line-height-3">
                                        Terdapat sisa tagihan sebesar <strong className="text-red-900 font-bold bg-white px-1.5 py-0.5 border-round border-1 surface-border">{formatCurrency(selectedBalance)}</strong> yang harus dilunasi sebelum checkout disetujui.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Section 4: Rincian Biaya & Riwayat Pembayaran ── */}
                        <TabView className="checkout-tabview">
                            <TabPanel header="Rincian Biaya" leftIcon="pi pi-list mr-2">
                                <div className="flex flex-column gap-2 max-h-12rem overflow-y-auto pr-1">
                                    <div className="text-xs font-bold text-color-secondary uppercase mb-1">
                                        Kamar Ditempati ({selectedRoom.rooms?.length || 1} Kamar):
                                    </div>
                                    {(selectedRoom.rooms || [selectedRoom]).map((rm: any, idx: number) => {
                                        const tipeKamar = rm.nama_tipe || selectedRoom.nama_tipe;
                                        const roomAmount = rm.subtotal || rm.total_charges || rm.rate_per_night || selectedRoom.subtotal || selectedRoom.current_grand_total;
                                        return (
                                            <div key={idx} className="flex justify-content-between align-items-center text-sm border-bottom-1 surface-border py-1.5">
                                                <div className="flex align-items-center gap-2">
                                                    <span className="font-semibold text-900">Kamar {rm.nomor_kamar}</span>
                                                    {tipeKamar && (
                                                        <span className="text-xs text-600 bg-surface-100 px-2 py-0.5 border-round">
                                                            {tipeKamar}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-900 text-sm">
                                                    {formatCurrency(roomAmount)}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {selectedRoom.charges && selectedRoom.charges.length > 0 && (
                                        <>
                                            <div className="text-xs font-bold text-color-secondary uppercase mt-2 mb-1">Layanan Tambahan:</div>
                                            {selectedRoom.charges.map((ch: any, idx: number) => (
                                                <div key={idx} className="flex justify-content-between align-items-center text-sm border-bottom-1 surface-border py-1.5">
                                                    <span>
                                                        {ch.nama_charge} <span className="text-xs text-500 font-semibold">x{ch.qty}</span>
                                                    </span>
                                                    <span className="font-bold text-900 text-sm">{formatCurrency(ch.total_amount)}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {selectedRoom.tax_details && selectedRoom.tax_details.length > 0 && (
                                        <>
                                            <div className="text-xs font-bold text-color-secondary uppercase mt-2 mb-1">Pajak &amp; Layanan:</div>
                                            {selectedRoom.tax_details.map((tx: any, idx: number) => (
                                                <div key={idx} className="flex justify-content-between align-items-center text-sm border-bottom-1 surface-border py-1">
                                                    <span className="text-600">
                                                        {tx.tax_name} ({tx.tax_rate}%)
                                                    </span>
                                                    <span className="text-700 font-semibold">{formatCurrency(tx.tax_amount)}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </TabPanel>

                            <TabPanel header="Riwayat Pembayaran" leftIcon="pi pi-credit-card mr-2">
                                <div className="flex flex-column gap-2 max-h-12rem overflow-y-auto pr-1">
                                    {(!selectedRoom.payments || selectedRoom.payments.length === 0) ? (
                                        <div className="text-center text-500 text-xs py-3">Belum ada riwayat pembayaran pada folio ini.</div>
                                    ) : (
                                        selectedRoom.payments.map((p: any, idx: number) => (
                                            <div key={idx} className="surface-50 p-2.5 border-round-lg text-xs flex justify-content-between align-items-center border-1 surface-border">
                                                <div>
                                                    <span className="font-bold uppercase text-primary text-sm">{p.payment_method}</span>
                                                    <span className="text-500 ml-2 font-medium">{formatDateSystem(p.payment_date, 'dd/MM/yyyy HH:mm')}</span>
                                                    {p.reference_no && <div className="text-500 mt-1 font-mono">Ref: {p.reference_no}</div>}
                                                </div>
                                                <span className="font-bold text-green-700 text-base">{formatCurrency(p.amount)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabPanel>
                        </TabView>

                        {/* ── Section 5: Ringkasan Keuangan ── */}
                        <div className="surface-100 p-3.5 border-round-xl border-1 surface-border">
                            <div className="flex justify-content-between align-items-center text-sm py-1.5">
                                <span className="text-700">Subtotal Biaya</span>
                                <span className="font-bold text-900">{formatCurrency(selectedRoom.subtotal || selectedRoom.current_grand_total)}</span>
                            </div>
                            <div className="flex justify-content-between align-items-center text-sm py-1.5">
                                <span className="text-700">Pajak &amp; Service Charge</span>
                                <span className="font-bold text-900">{formatCurrency(selectedRoom.total_tax)}</span>
                            </div>
                            <Divider className="my-1.5" />
                            <div className="flex justify-content-between align-items-center text-base py-1.5 font-bold">
                                <span className="text-900">Total Tagihan (Grand Total)</span>
                                <span className="text-primary text-lg font-black">{formatCurrency(selectedRoom.total_charges || selectedRoom.current_grand_total)}</span>
                            </div>
                            <div className="flex justify-content-between align-items-center text-sm py-1.5">
                                <span className="text-green-700 font-semibold">Total Pembayaran Masuk</span>
                                <span className="font-bold text-green-700">- {formatCurrency(selectedRoom.total_paid)}</span>
                            </div>
                            <Divider className="my-1.5" />
                            <div className={`flex justify-content-between align-items-center p-3 border-round-xl mt-1 ${
                                isSelectedSettled ? 'bg-green-100 text-green-900 border-1 border-green-300' : 'bg-red-100 text-red-900 border-1 border-red-300'
                            }`}>
                                <div className="flex flex-column">
                                    <span className="text-xs uppercase font-bold tracking-wider">
                                        {isSelectedSettled ? 'Status Folio' : 'Sisa Tagihan (Saldo Akhir)'}
                                    </span>
                                    <span className="text-xs text-700 font-medium">
                                        {isSelectedSettled ? 'Tagihan lunas, siap checkout' : 'Wajib diselesaikan di kasir'}
                                    </span>
                                </div>
                                <span className={`text-2xl font-black ${isSelectedSettled ? 'text-green-700' : 'text-red-700'}`}>
                                    {formatCurrency(selectedBalance)}
                                </span>
                            </div>
                        </div>

                        {/* ── Section 6: Form Pelunasan Kasir jika Belum Lunas ── */}
                        {!isSelectedSettled && (
                            <div className="surface-50 p-3.5 border-round-xl border-1 surface-border p-fluid">
                                <div className="text-xs font-bold text-color-secondary uppercase mb-3 letter-spacing-1 flex align-items-center gap-1.5">
                                    <i className="pi pi-credit-card text-primary"></i> Formulir Pelunasan Kasir
                                </div>

                                <div className="field mb-3">
                                    <label className="text-sm font-bold text-800 block mb-2">
                                        Nominal Pembayaran Pelunasan <span className="text-red-500">*</span>
                                    </label>
                                    <InputNumber
                                        value={paymentAmount !== null ? paymentAmount : selectedBalance}
                                        onValueChange={(e) => setPaymentAmount(e.value as number | null)}
                                        mode="currency"
                                        currency="IDR"
                                        locale="id-ID"
                                        placeholder="Jumlah bayar"
                                        className="w-full"
                                        inputClassName="font-bold text-xl py-2.5 text-900"
                                    />
                                    <small className="text-600 text-xs mt-1.5 block">
                                        Total sisa tagihan belum lunas: <strong className="text-900">Rp {selectedBalance.toLocaleString('id-ID')}</strong>
                                    </small>
                                </div>

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
                                    totalAmount={paymentAmount !== null ? paymentAmount : selectedBalance}
                                    compact={true}
                                />

                                {paymentMethod === 'cash' && !shiftAktif && (
                                    <div className="p-3 border-round-lg bg-red-50 text-red-700 border-1 border-red-300 text-xs mt-2 flex align-items-center gap-2">
                                        <i className="pi pi-exclamation-triangle text-base text-red-600"></i>
                                        <span>Shift kasir belum aktif! Buka sesi shift kasir terlebih dahulu untuk penerimaan pembayaran tunai.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Dialog>

            {/* Post-Checkout Success Dialog */}
            <Dialog
                visible={successDialogVisible}
                onHide={() => setSuccessDialogVisible(false)}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-check-circle text-green-600 text-2xl"></i>
                        <span className="font-bold text-lg">Checkout Berhasil Diproses</span>
                    </div>
                }
                style={{ width: '90vw', maxWidth: '520px' }}
                modal
                closable={false}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Cetak Struk Checkout (Thermal)"
                            icon="pi pi-print"
                            severity="success"
                            className="font-bold shadow-2"
                            onClick={() => {
                                setSuccessDialogVisible(false);
                                setInvoiceModalVisible(true);
                            }}
                        />
                        <Button
                            label="Selesai"
                            icon="pi pi-times"
                            className="p-button-outlined"
                            onClick={() => setSuccessDialogVisible(false)}
                        />
                    </div>
                }
            >
                {lastCheckoutResult && (
                    <div className="flex flex-column gap-3 text-center py-2">
                        <div className="w-4rem h-4rem border-circle bg-green-100 text-green-600 flex align-items-center justify-content-center mx-auto">
                            <i className="pi pi-check text-3xl"></i>
                        </div>
                        <div>
                            <h5 className="font-bold text-900 m-0">
                                {lastCheckoutResult.room_count > 1
                                    ? `${lastCheckoutResult.room_count} Kamar Berhasil Checkout`
                                    : `Kamar ${lastCheckoutResult.nomor_kamar} Berhasil Checkout`}
                            </h5>
                            <span className="text-sm text-500">{lastCheckoutResult.guest_name}</span>
                        </div>

                        <div className="surface-50 border-1 surface-border border-round-xl p-3 text-left text-sm flex flex-column gap-2">
                            <div className="flex justify-content-between">
                                <span className="text-500">Nomor Invoice:</span>
                                <span className="font-bold text-900">{activeInvoiceNumber || 'Terdaftar'}</span>
                            </div>
                            <div className="flex justify-content-between">
                                <span className="text-500">Kode Folio:</span>
                                <span className="font-mono text-700">{lastCheckoutResult.kode_folio}</span>
                            </div>
                            <div className="flex justify-content-between">
                                <span className="text-500">Kamar Di-Checkout:</span>
                                <span className="font-semibold text-primary">{lastCheckoutResult.nomor_kamar}</span>
                            </div>
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-500">Status Fisik Kamar:</span>
                                <Tag severity="warning" value="DIRTY / CLEANING" icon="pi pi-clock" />
                            </div>
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-500">Tugas Housekeeping:</span>
                                <span className="text-xs text-green-700 font-semibold">
                                    <i className="pi pi-check-circle mr-1"></i>
                                    {lastCheckoutResult.room_count > 1
                                        ? `${lastCheckoutResult.room_count} Tugas Otomatis Dibuat`
                                        : 'Otomatis Ditugaskan'}
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-500 m-0">
                            Seluruh kamar yang dipilih telah dialihkan statusnya ke pembersihan Housekeeping dan saldo tagihan folio telah dituntaskan.
                        </p>
                    </div>
                )}
            </Dialog>

            {/* Official Invoice Dialog */}
            <DialogInvoice
                visible={invoiceModalVisible}
                onHide={() => setInvoiceModalVisible(false)}
                kodeFolio={activeInvoiceFolio}
                invoiceNumber={activeInvoiceNumber}
                autoPrint={true}
            />
        </div>
    );
};

const CheckoutPage = () => {
    return (
        <Suspense fallback={<div className="p-4 text-center">Memuat modul checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
};

export default CheckoutPage;
