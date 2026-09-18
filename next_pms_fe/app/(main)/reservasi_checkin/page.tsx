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
import postData from '@/lib/axios/postData';
import { apiReservationData, apiCabangDropdown, apiCheckinSubmit, apiShiftCurrent } from './components/endpoints';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { formatDateSystem } from '@/lib/tools/dateTools';

const Page = () => {
    const toast = useRef<Toast>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [cabangOptions, setCabangOptions] = useState([]);
    const [filterCabang, setFilterCabang] = useState('');
    const [filterDate, setFilterDate] = useState<Date | null>(new Date());
    const [globalFilter, setGlobalFilter] = useState('');
    const [showFilter, setShowFilter] = useState(true);
    
    // Deposit handling dialog
    const [showDepositDialog, setShowDepositDialog] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
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
        postData(apiCabangDropdown, {}).then(res => {
            setCabangOptions(res.data.data);
            if (res.data.data.length > 0) {
                setFilterCabang(res.data.data[0].kode_cabang);
            }
        }).catch(e => console.error(e));
    }, []);

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
        if (cabangOptions.length > 0) {
            setFilterCabang((cabangOptions[0] as any).kode_cabang);
        }
    };

    const processCheckIn = async (rowData: any) => {
        if (rowData.deposit_amount > 0) {
            if (!shiftAktif) {
                showError(toast, 'Shift kasir belum dibuka. Silakan buka shift terlebih dahulu sebelum memproses check-in dengan deposit.');
                return;
            }
            setSelectedRes(rowData);
            setShiftCode(shiftAktif.kode_cashier_shift); 
            setPaymentMethod('cash');
            setShowDepositDialog(true);
            return;
        }

        doSubmitCheckin(rowData.kode_reservasi_room);
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
        doSubmitCheckin(selectedRes.kode_reservasi_room, {
            payment_method: paymentMethod,
            kode_cashier_shift: shiftCode
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
                            <Dropdown 
                                value={filterCabang} 
                                options={cabangOptions} 
                                onChange={(e) => setFilterCabang(e.value)} 
                                optionLabel="name" 
                                optionValue="kode_cabang" 
                                className="w-14rem text-sm"
                                placeholder="Pilih Cabang"
                            />
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
                header={<div className="flex align-items-center gap-2"><i className="pi pi-wallet text-xl text-primary"></i> <span>Proses Deposit Reservasi</span></div>} 
                visible={showDepositDialog} 
                style={{ width: '450px' }} 
                onHide={() => setShowDepositDialog(false)} 
                breakpoints={{ '960px': '75vw', '641px': '100vw' }}
                footer={(
                    <div className="flex justify-content-end gap-2">
                        <Button label="Batal" icon="pi pi-times" onClick={() => setShowDepositDialog(false)} className="p-button-text" />
                        <Button label="Proses Check-in" icon="pi pi-check" onClick={handleDepositSubmit} loading={loading} />
                    </div>
                )}
            >
                {selectedRes && (
                    <div className="p-fluid">
                        <div className="p-3 border-round bg-yellow-50 border-1 border-yellow-200 mb-4">
                            <div className="flex align-items-center gap-2 mb-2">
                                <i className="pi pi-info-circle text-yellow-600"></i>
                                <span className="font-bold text-yellow-800">Info Pembayaran Deposit</span>
                            </div>
                            <p className="m-0 text-sm">Tamu ini memiliki deposit sebesar <strong>Rp {parseFloat(selectedRes.deposit_amount).toLocaleString('id-ID')}</strong>.</p>
                            <p className="m-0 text-sm mt-1">Deposit akan otomatis dimasukkan ke folio dan shift kasir yang Anda pilih di bawah ini.</p>
                        </div>
                        
                        <div className="field">
                            <label>Shift Kasir</label>
                            <Dropdown 
                                value={shiftCode} 
                                options={shiftAktif ? [{label: shiftAktif.kode_cashier_shift, value: shiftAktif.kode_cashier_shift}] : []} 
                                onChange={(e) => setShiftCode(e.value)} 
                                disabled
                            />
                        </div>
                        <div className="field">
                            <label>Metode Pembayaran</label>
                            <Dropdown 
                                value={paymentMethod} 
                                options={[
                                    {label: 'Cash', value: 'cash'},
                                    {label: 'Transfer Bank', value: 'transfer'},
                                    {label: 'Kartu Kredit', value: 'credit_card'}
                                ]} 
                                onChange={(e) => setPaymentMethod(e.value)} 
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default Page;

