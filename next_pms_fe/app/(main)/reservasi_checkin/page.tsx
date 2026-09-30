'use client';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
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
import { apiReservationData, apiCheckinSubmit, apiShiftCurrent } from './components/endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import CashierPicCard from '@/app/components/payment/CashierPicCard';
import FrontOfficeNav from '@/app/components/navigation/FrontOfficeNav';
import { buildStandardReferenceNo } from '@/lib/tools/paymentTools';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterCabang, setFilterCabang] = useState('');
    const [filterDate, setFilterDate] = useState<Date | null>(new Date());
    const [globalFilter, setGlobalFilter] = useState('');
    const [showFilter, setShowFilter] = useState(true);
    
    // Deposit handling dialog
    const [showDepositDialog, setShowDepositDialog] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any>(null);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'transfer'>('cash');
    const [bankName, setBankName] = useState('BCA');
    const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
    const [referenceNo, setReferenceNo] = useState('');
    const [shiftCode, setShiftCode] = useState('');
    const [shiftAktif, setShiftAktif] = useState<any>(null);

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
            const res = await postData(apiReservationData, {
                kode_cabang: filterCabang,
                check_in_date: filterDate ? formatDateSystem(filterDate, "yyyy-MM-dd") : null,
                status: ['reserved', 'confirmed', 'booked']
            });
            setData(res.data.data || []);
        } catch (e: any) {
            showError(toast, e?.response?.data?.message || "Gagal memuat data reservasi");
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilter = () => {
        setGlobalFilter('');
        setFilterDate(new Date());
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
        setDepositAmount(parseFloat(rowData.deposit_amount || 0));
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
            kode_cashier_shift: shiftCode || shiftAktif?.kode_cashier_shift || null,
            deposit_amount: depositAmount,
            guest_count: selectedRes?.guest_count || 1
        });
    };

    const actionBody = (rowData: any) => {
        return (
            <Button 
                label="Check In" 
                icon="pi pi-sign-in" 
                className="p-button-sm p-button-success" 
                onClick={() => processCheckIn(rowData)} 
                disabled={loading}
            />
        );
    };

    const statusBody = (rowData: any) => {
        const sev = rowData.room_status === 'confirmed' ? 'success' : 'warning';
        return <Tag severity={sev} value={rowData.room_status ? rowData.room_status.toUpperCase() : 'RESERVED'} />;
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
                    outlined
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
            <FrontOfficeNav />
            
            <div className="flex justify-content-between align-items-start mb-4">
                <div className="flex flex-column">
                    <h3 className="text-2xl font-semibold flex align-items-center gap-2 m-0">
                        <i className="pi pi-sign-in text-blue-600 text-3xl"></i>Kedatangan Tamu (Arrivals)
                    </h3>
                    <p className="text-gray-500 mt-1 mb-0">Daftar tamu yang akan check-in. Klik Check-in untuk assign kamar dan membuka folio.</p>
                </div>
            </div>

            {showFilter && (
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 p-3 surface-50 border-round border-1 surface-border mb-4 animation-duration-200 fadein">
                    <div className="flex flex-wrap align-items-center gap-3">
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm font-bold text-700">Pilih Tanggal:</span>
                            <Calendar 
                                value={filterDate} 
                                onChange={(e) => setFilterDate(e.value as Date)} 
                                dateFormat="dd/mm/yy" 
                                showIcon 
                                className="w-11rem text-sm"
                            />
                        </div>
                        <div className="flex align-items-center gap-2">
                            <span className="text-sm font-bold text-700">Cabang:</span>
                            <div className="flex align-items-center gap-2 bg-white px-3 py-2 border-round-lg border-1 surface-border">
                                <i className="pi pi-building text-primary font-bold"></i>
                                <span className="text-sm font-bold text-900">
                                    {session?.user?.active_kode_cabang || filterCabang || '-'} - {session?.user?.active_branch_name || 'Cabang Aktif'}
                                </span>
                            </div>
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
                header={<div className="flex align-items-center gap-2"><i className="pi pi-shield text-xl text-primary"></i> <span>Konfirmasi Check-In & Deposit</span></div>} 
                visible={showDepositDialog} 
                style={{ width: '500px' }} 
                onHide={() => setShowDepositDialog(false)} 
                breakpoints={{ '960px': '75vw', '641px': '100vw' }}
                footer={(
                    <div className="flex justify-content-end gap-2">
                        <Button label="Batal" icon="pi pi-times" onClick={() => setShowDepositDialog(false)} className="p-button-text" />
                        <Button label="Proses Check-in" icon="pi pi-check" onClick={handleDepositSubmit} loading={loading} severity="success" />
                    </div>
                )}
            >
                {selectedRes && (
                    <div className="p-fluid">
                        <div className="p-3 border-round bg-blue-50 border-1 border-blue-200 mb-3">
                            <div className="flex justify-content-between align-items-start mb-2">
                                <div>
                                    <span className="font-bold text-900 block text-base">{selectedRes.full_name}</span>
                                    <span className="text-xs text-500">ID Tamu: {selectedRes.kode_tamu} • Reservasi: {selectedRes.kode_reservation}</span>
                                </div>
                                <Tag severity="info" value={`${selectedRes.nights || 1} Malam`} />
                            </div>
                            <div className="text-xs text-700">
                                <span>Kamar: <strong>{selectedRes.nomor_kamar ? `No. ${selectedRes.nomor_kamar}` : 'Auto-Assign'}</strong> ({selectedRes.nama_tipe})</span>
                            </div>
                        </div>

                        {/* Status Deposit Reservasi */}
                        {parseFloat(selectedRes.deposit_amount || 0) > 0 ? (
                            <div className="p-2 border-round bg-green-50 border-1 border-green-300 mb-3 flex align-items-center gap-2">
                                <i className="pi pi-check-circle text-green-700 text-lg"></i>
                                <div className="text-xs">
                                    <span className="font-bold text-green-900">Deposit Tercatat di Reservasi: Rp {parseFloat(selectedRes.deposit_amount).toLocaleString('id-ID')}</span>
                                    <span className="text-green-800 block">Tamu telah menyetor uang jaminan saat membuat reservasi.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 border-round surface-50 border-1 surface-border mb-3 flex align-items-center gap-2">
                                <i className="pi pi-info-circle text-blue-500 text-lg"></i>
                                <span className="text-xs text-color-secondary">Reservasi ini belum memiliki deposit awal. Silakan tetapkan uang jaminan di bawah.</span>
                            </div>
                        )}

                        {/* Presets Uang Jaminan */}
                        <div className="mb-3">
                            <label className="text-xs font-semibold text-color-secondary uppercase mb-1 block">Pilihan Cepat Deposit (Uang Jaminan)</label>
                            <div className="grid">
                                {[
                                    { label: 'Tanpa Deposit', val: 0 },
                                    { label: 'Rp 100.000', val: 100000 },
                                    { label: 'Rp 200.000', val: 200000 },
                                    { label: 'Rp 500.000', val: 500000 },
                                ].map((p) => (
                                    <div key={p.val} className="col-6 sm:col-3">
                                        <div
                                            className={`p-2 text-center border-round cursor-pointer text-xs font-bold transition-all select-none ${
                                                depositAmount === p.val
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
                            <label className="font-semibold text-sm">Nominal Uang Jaminan / Deposit (Rp)</label>
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
                            <small className="text-color-secondary">Uang jaminan disimpan di kasir dan tercatat pada folio transaksi tamu.</small>
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
                )}
            </Dialog>
        </div>
    );
};

export default Page;

