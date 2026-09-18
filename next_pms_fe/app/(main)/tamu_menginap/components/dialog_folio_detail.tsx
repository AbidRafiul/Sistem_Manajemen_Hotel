'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import postData from '@/lib/axios/postData';
import { apiFolioDetail } from './endpoints';
import { formatDateSystem } from '@/lib/tools/dateTools';

import DialogInvoice from '@/app/components/dialogComponents/dialog_invoice';

interface DialogFolioDetailProps {
    visible: boolean;
    onHide: () => void;
    roomData: any;
}

export const DialogFolioDetail: React.FC<DialogFolioDetailProps> = ({ visible, onHide, roomData }) => {
    const [loading, setLoading] = useState(false);
    const [folioData, setFolioData] = useState<any>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const fetchFolioDetail = async () => {
        if (!roomData?.kode_reservasi_room && !roomData?.kode_folio) return;
        setLoading(true);
        try {
            const res = await postData(apiFolioDetail, {
                kode_reservasi_room: roomData.kode_reservasi_room,
                kode_folio: roomData.kode_folio
            });
            if (res?.data?.data) {
                setFolioData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load folio details', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchFolioDetail();
        } else {
            setFolioData(null);
        }
    }, [visible, roomData]);

    const handlePrint = () => {
        window.print();
    };

    const header = folioData?.folio;
    const charges = folioData?.charges || [];
    const payments = folioData?.payments || [];

    const isSettled = (header?.balance || 0) <= 0;

    return (
        <>
            <Dialog
                visible={visible}
                onHide={onHide}
                header={
                    <div className="flex align-items-center gap-3">
                        <div className="w-3rem h-3rem border-round-xl bg-primary-50 text-primary flex align-items-center justify-content-center flex-shrink-0 border-1 border-primary-200">
                            <i className="pi pi-receipt text-2xl"></i>
                        </div>
                        <div>
                            <span className="font-bold text-xl text-900 block line-height-2">
                                Kartu Tagihan Folio Tamu (Guest Folio)
                            </span>
                            <span className="text-sm text-600 font-normal">
                                Rincian lengkap mutasi sewa kamar, tagihan fasilitas tambahan, dan pembayaran tamu
                            </span>
                        </div>
                    </div>
                }
                style={{ width: '96vw', maxWidth: '1100px' }}
                contentStyle={{ overflowX: 'hidden', padding: '2rem 2.5rem' }}
                modal
                footer={
                    <div className="flex justify-content-between align-items-center flex-wrap gap-3 pt-3 border-top-1 surface-border">
                        <div className="flex align-items-center gap-3">
                            <Button
                                label="Cetak Folio"
                                icon="pi pi-print"
                                className="p-button-outlined font-bold text-sm px-4"
                                style={{ height: '46px' }}
                                onClick={handlePrint}
                                disabled={loading || !folioData}
                            />
                            <Button
                                label="Invoice Resmi"
                                icon="pi pi-file-pdf"
                                severity="success"
                                className="font-bold text-sm px-4"
                                style={{ height: '46px' }}
                                onClick={() => setShowInvoiceModal(true)}
                                disabled={loading || !folioData}
                            />
                        </div>
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            className="p-button-secondary font-bold text-sm px-5"
                            style={{ height: '46px' }}
                            onClick={onHide}
                        />
                    </div>
                }
            >
                {loading && <ProgressBar mode="indeterminate" style={{ height: '4px' }} className="mb-3 border-round" />}

                {folioData && (
                    <div ref={printRef} className="flex flex-column" style={{ gap: '2rem' }}>
                        {/* Section Header: Informasi Tamu & Folio Card */}
                        <div className="surface-card border-round-xl border-1 surface-border p-4 sm:p-4 shadow-sm pb-4 border-bottom-1">
                            <div className="grid align-items-center">
                                <div className="col-12 sm:col-7">
                                    <div className="text-xs text-500 font-bold uppercase tracking-wider mb-1.5">
                                        Tamu &amp; Kamar (PIC Reservasi)
                                    </div>
                                    <div className="text-xl font-bold text-900 flex align-items-center gap-2.5 flex-wrap">
                                        <span className="bg-primary-50 text-primary border-round-lg px-3 py-1 font-bold text-base border-1 border-primary-100">
                                            {folioData.rooms && folioData.rooms.length > 1
                                                ? `Kamar ${folioData.rooms.map((r: any) => r.nomor_kamar).join(', ')}`
                                                : header?.nomor_kamar
                                                ? `Kamar ${header.nomor_kamar}`
                                                : 'Kamar -'}
                                        </span>
                                        <span className="text-base font-medium text-700">
                                            {folioData.rooms && folioData.rooms.length > 1
                                                ? [...new Set(folioData.rooms.map((r: any) => r.nama_tipe_kamar || r.nama_tipe))].join(', ')
                                                : header?.nama_tipe_kamar || 'Tipe Kamar'}
                                        </span>
                                    </div>
                                    <div className="text-base font-semibold text-900 mt-2.5 flex align-items-center gap-4 flex-wrap">
                                        <span className="inline-flex align-items-center">
                                            <i className="pi pi-user mr-2 text-primary text-base"></i>
                                            {header?.guest_name || '-'}
                                        </span>
                                        {header?.guest_phone && (
                                            <span className="text-600 font-normal inline-flex align-items-center text-sm">
                                                <i className="pi pi-phone mr-1.5 text-400 text-sm"></i>
                                                {header.guest_phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12 sm:col-5 text-left sm:text-right mt-3 sm:mt-0">
                                    <div className="text-xs text-500 font-bold uppercase tracking-wider mb-1">
                                        Nomor Folio
                                    </div>
                                    <div className="text-lg font-bold text-primary font-mono">
                                        {header?.kode_folio || '-'}
                                    </div>
                                    <div className="text-sm text-600 mt-1 inline-flex align-items-center gap-1.5 justify-content-start sm:justify-content-end font-medium">
                                        <i className="pi pi-calendar text-sm text-400"></i>
                                        <span>
                                            {header?.check_in_date ? formatDateSystem(header.check_in_date, 'dd MMM yyyy') : '-'} s/d{' '}
                                            {header?.check_out_date ? formatDateSystem(header.check_out_date, 'dd MMM yyyy') : '-'}
                                        </span>
                                    </div>
                                    <div className="mt-2.5">
                                        <Tag
                                            severity={isSettled ? 'success' : 'danger'}
                                            value={isSettled ? 'LUNAS (SETTLED)' : `BELUM LUNAS (Rp ${(header?.balance || 0).toLocaleString('id-ID')})`}
                                            className="text-sm px-3.5 py-1.5 font-bold border-round-md"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Daftar Kamar Ditempati */}
                        {folioData.rooms && folioData.rooms.length > 0 && (
                            <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-sm pb-4 border-bottom-1">
                                <div className="font-bold text-lg text-900 mb-3.5 flex align-items-center justify-content-between">
                                    <div className="flex align-items-center gap-2.5">
                                        <i className="pi pi-home text-primary text-lg"></i>
                                        <span>Daftar Kamar Ditempati</span>
                                        <span className="text-xs bg-primary-50 text-primary border-round-md px-2.5 py-1 font-bold">
                                            {folioData.rooms.length} Kamar
                                        </span>
                                    </div>
                                </div>
                                <DataTable
                                    value={folioData.rooms}
                                    stripedRows
                                    className="p-datatable-sm"
                                    responsiveLayout="scroll"
                                >
                                    <Column
                                        header="Kamar & Tipe"
                                        align="left"
                                        alignHeader="left"
                                        headerStyle={{ width: '38%', textAlign: 'left', padding: '14px 16px', fontSize: '14px' }}
                                        bodyStyle={{ width: '38%', textAlign: 'left', padding: '14px 16px' }}
                                        body={(rowData) => (
                                            <div className="flex align-items-center gap-3">
                                                <span className="w-2.5rem h-2.5rem border-round-lg bg-primary-100 text-primary font-bold flex align-items-center justify-content-center text-base">
                                                    {rowData.nomor_kamar}
                                                </span>
                                                <div>
                                                    <span className="font-bold text-900 text-base block">
                                                        {rowData.nama_tipe_kamar || rowData.nama_tipe || `Kamar ${rowData.nomor_kamar}`}
                                                    </span>
                                                    <span className="text-xs text-500 font-medium">
                                                        Kamar #{rowData.nomor_kamar}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    />
                                    <Column
                                        header="Status"
                                        align="center"
                                        alignHeader="center"
                                        headerStyle={{ width: '22%', textAlign: 'center', padding: '14px 16px', fontSize: '14px' }}
                                        bodyStyle={{ width: '22%', textAlign: 'center', padding: '14px 16px' }}
                                        body={(rowData) => {
                                            const isCheckedIn = rowData.status_room === 'checked_in' || rowData.status === 'checked_in';
                                            return (
                                                <div className="inline-flex align-items-center gap-2 justify-content-center">
                                                    <span
                                                        className={`w-2.5 h-2.5 border-circle ${isCheckedIn ? 'bg-green-500' : 'bg-orange-500'}`}
                                                    ></span>
                                                    <Tag
                                                        severity={isCheckedIn ? 'success' : 'warning'}
                                                        value={isCheckedIn ? 'Occupied (Checked In)' : String(rowData.status_room || rowData.status || '-').toUpperCase()}
                                                        className="text-xs px-3 py-1 font-semibold"
                                                    />
                                                </div>
                                            );
                                        }}
                                    />
                                    <Column
                                        header="Tarif / Malam"
                                        align="right"
                                        alignHeader="right"
                                        headerStyle={{ width: '20%', textAlign: 'right', padding: '14px 16px', fontSize: '14px' }}
                                        bodyStyle={{ width: '20%', textAlign: 'right', padding: '14px 16px' }}
                                        body={(rowData) => (
                                            <span className="text-base text-700 font-medium font-mono">
                                                Rp {Number(rowData.rate_per_night || 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        header="Subtotal Sewa"
                                        align="right"
                                        alignHeader="right"
                                        headerStyle={{ width: '20%', textAlign: 'right', padding: '14px 16px', fontSize: '14px' }}
                                        bodyStyle={{ width: '20%', textAlign: 'right', padding: '14px 16px' }}
                                        body={(rowData) => (
                                            <span className="font-bold text-900 text-base font-mono">
                                                Rp {Number(rowData.subtotal || rowData.total_charges || rowData.rate_per_night || 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    />
                                </DataTable>
                            </div>
                        )}

                        {/* Section 2: Rincian Tagihan Layanan & Fasilitas (Charges) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-sm pb-4 border-bottom-1">
                            <div className="font-bold text-lg text-900 mb-3.5 flex align-items-center justify-content-between">
                                <div className="flex align-items-center gap-2.5">
                                    <i className="pi pi-list text-primary text-lg"></i>
                                    <span>Rincian Tagihan Layanan &amp; Fasilitas (Charges)</span>
                                    <span className="text-xs bg-primary-50 text-primary border-round-md px-2.5 py-1 font-bold">
                                        {charges.length} Item
                                    </span>
                                </div>
                            </div>
                            <DataTable
                                value={charges}
                                stripedRows
                                className="p-datatable-sm"
                                emptyMessage="Belum ada tagihan fasilitas atau layanan tambahan."
                                responsiveLayout="scroll"
                            >
                                <Column
                                    header="Waktu Posting"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '18%', textAlign: 'left', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '18%', textAlign: 'left', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="text-sm text-600 font-mono font-medium">
                                            {formatDateSystem(rowData.posted_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Kategori"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '15%', textAlign: 'center', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '15%', textAlign: 'center', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <Tag
                                            severity={
                                                rowData.charge_type === 'room'
                                                    ? 'info'
                                                    : rowData.charge_type === 'restaurant'
                                                    ? 'warning'
                                                    : rowData.charge_type === 'laundry'
                                                    ? 'contrast'
                                                    : 'secondary'
                                            }
                                            value={rowData.charge_type?.toUpperCase() || 'OTHER'}
                                            className="text-xs px-2.5 py-1 font-semibold"
                                        />
                                    )}
                                />
                                <Column
                                    header="Keterangan / Item"
                                    field="description"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '33%', textAlign: 'left', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '33%', textAlign: 'left', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-900 text-base">
                                            {rowData.description}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Qty"
                                    field="qty"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '10%', textAlign: 'center', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '10%', textAlign: 'center', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="text-sm font-bold text-800 bg-surface-100 border-round-md px-2.5 py-1">
                                            {rowData.qty || 1}x
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Harga Satuan"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '12%', textAlign: 'right', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '12%', textAlign: 'right', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="text-base text-700 font-mono">
                                            Rp {Number(rowData.unit_price || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Jumlah"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '12%', textAlign: 'right', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '12%', textAlign: 'right', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-900 text-base font-mono">
                                            Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>

                        {/* Section 3: Riwayat Pembayaran (Payments) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-4 shadow-sm pb-4 border-bottom-1">
                            <div className="font-bold text-lg text-900 mb-3.5 flex align-items-center justify-content-between">
                                <div className="flex align-items-center gap-2.5">
                                    <i className="pi pi-wallet text-green-600 text-lg"></i>
                                    <span>Riwayat Pembayaran Diterima (Payments)</span>
                                    <span className="text-xs bg-green-50 text-green-700 border-round-md px-2.5 py-1 font-bold">
                                        {payments.length} Pembayaran
                                    </span>
                                </div>
                            </div>
                            <DataTable
                                value={payments}
                                stripedRows
                                className="p-datatable-sm"
                                emptyMessage="Belum ada pembayaran yang tercatat pada folio ini."
                                responsiveLayout="scroll"
                            >
                                <Column
                                    header="Waktu Bayar"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '22%', textAlign: 'left', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '22%', textAlign: 'left', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="text-sm text-600 font-mono font-medium">
                                            {formatDateSystem(rowData.paid_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Metode"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '18%', textAlign: 'center', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '18%', textAlign: 'center', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <Tag
                                            severity="success"
                                            value={rowData.payment_method?.toUpperCase()}
                                            className="text-xs px-3 py-1 font-bold"
                                        />
                                    )}
                                />
                                <Column
                                    header="No. Referensi / Shift"
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '38%', textAlign: 'left', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '38%', textAlign: 'left', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="text-base text-700 font-medium">
                                            {rowData.reference_no || '-'} {rowData.kode_cashier_shift ? `(${rowData.kode_cashier_shift})` : ''}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Nominal Bayar"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '22%', textAlign: 'right', padding: '14px 16px', fontSize: '14px' }}
                                    bodyStyle={{ width: '22%', textAlign: 'right', padding: '14px 16px' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-green-700 text-base font-mono">
                                            Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>

                        {/* Section 4: Ringkasan Total Tagihan & Saldo (Card Terpisah) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-4 sm:p-5 shadow-1 bg-surface-50">
                            <div className="flex justify-content-between align-items-center py-2.5">
                                <span className="text-base font-bold text-700">Total Tagihan (Grand Total):</span>
                                <span className="text-lg sm:text-xl font-bold text-900 font-mono">
                                    Rp {Number(header?.grand_total || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center py-2.5 border-bottom-1 surface-border">
                                <span className="text-base font-bold text-700">Total Pembayaran Masuk:</span>
                                <span className="text-lg sm:text-xl font-bold text-green-600 font-mono">
                                    - Rp {Number(header?.total_paid || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center pt-3.5 flex-wrap gap-3">
                                <div>
                                    <span className="text-lg sm:text-xl font-bold text-900 block">
                                        Sisa Tagihan (Saldo / Outstanding):
                                    </span>
                                    <span className="text-sm text-600 font-medium">
                                        {isSettled
                                            ? 'Tagihan lunas, tidak ada sisa saldo.'
                                            : 'Wajib diselesaikan oleh tamu sebelum checkout.'}
                                    </span>
                                </div>
                                <span
                                    className={`text-2xl sm:text-3xl font-bold font-mono px-4 py-2 border-round-xl ${
                                        isSettled
                                            ? 'text-green-700 bg-green-50 border-1 border-green-200'
                                            : 'text-red-600 bg-red-50 border-1 border-red-200'
                                    }`}
                                >
                                    Rp {Number(header?.balance || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>

            <DialogInvoice
                visible={showInvoiceModal}
                onHide={() => setShowInvoiceModal(false)}
                kodeFolio={header?.kode_folio || roomData?.kode_folio}
                kodeReservasi={header?.kode_reservasi || roomData?.kode_reservasi}
            />
        </>
    );
};

export default DialogFolioDetail;
