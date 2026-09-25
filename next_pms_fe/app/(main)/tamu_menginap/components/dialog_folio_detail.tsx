'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { useReactToPrint } from 'react-to-print';
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

    const header = folioData?.folio;
    const charges = folioData?.charges || [];
    const payments = folioData?.payments || [];
    const isSettled = (header?.balance || 0) <= 0;

    // Direct printable document rendering via react-to-print (prevents printing dialog buttons/footer)
    const handleTriggerPrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `KartuFolio-${header?.kode_folio || 'Tamu'}`,
        pageStyle: `
            @page {
                size: A4 portrait;
                margin: 8mm 10mm;
            }
            @media print {
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    font-size: 11px !important;
                }
                .no-print {
                    display: none !important;
                }
                .print-container {
                    gap: 0.6rem !important;
                    padding: 0 !important;
                }
                .surface-card {
                    padding: 8px 12px !important;
                    margin-bottom: 0 !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 8px !important;
                    box-shadow: none !important;
                }
                .p-datatable-sm .p-datatable-thead > tr > th,
                .p-datatable-sm .p-datatable-tbody > tr > td,
                .p-datatable .p-datatable-thead > tr > th,
                .p-datatable .p-datatable-tbody > tr > td {
                    padding: 4px 8px !important;
                    font-size: 11px !important;
                }
                .text-xl { font-size: 13px !important; }
                .text-2xl { font-size: 15px !important; }
                .text-3xl { font-size: 17px !important; }
                .text-lg { font-size: 12px !important; }
                .text-base { font-size: 11px !important; }
                .text-sm { font-size: 10px !important; }
                .text-xs { font-size: 9px !important; }
                .p-4 { padding: 8px 12px !important; }
                .mb-3 { margin-bottom: 4px !important; }
                .pb-2 { padding-bottom: 3px !important; }
                .py-2 { padding-top: 3px !important; padding-bottom: 3px !important; }
                .pt-3 { padding-top: 4px !important; }
                .mt-2.5 { margin-top: 4px !important; }
            }
        `
    });

    return (
        <>
            <Dialog
                visible={visible}
                onHide={onHide}
                header={
                    <div className="flex align-items-center gap-3">
                        <div className="w-3rem h-3rem border-round-xl bg-primary-50 text-primary flex align-items-center justify-content-center flex-shrink-0 border-1 border-primary-200 shadow-1">
                            <i className="pi pi-receipt text-2xl"></i>
                        </div>
                        <div>
                            <span className="font-bold text-xl text-900 block line-height-2">
                                Kartu Tagihan Folio Tamu (Guest Folio)
                            </span>
                            <span className="text-sm text-600 font-normal block mt-0.5">
                                Rincian lengkap mutasi sewa kamar, tagihan fasilitas tambahan, dan pembayaran tamu
                            </span>
                        </div>
                    </div>
                }
                style={{ width: '96vw', maxWidth: '1100px' }}
                contentStyle={{ overflowX: 'hidden', padding: '1.25rem 1.5rem' }}
                modal
                footer={
                    <div className="flex justify-content-between align-items-center flex-wrap gap-3 pt-3 border-top-1 surface-border no-print">
                        <div className="flex align-items-center gap-3">
                            <Button
                                label="Cetak Folio"
                                icon="pi pi-print"
                                className="p-button-outlined font-bold text-sm px-4"
                                style={{ height: '42px' }}
                                onClick={() => handleTriggerPrint()}
                                disabled={loading || !folioData}
                            />
                            <Button
                                label="Invoice Resmi"
                                icon="pi pi-file-pdf"
                                severity="success"
                                className="font-bold text-sm px-4"
                                style={{ height: '42px' }}
                                onClick={() => setShowInvoiceModal(true)}
                                disabled={loading || !folioData}
                            />
                        </div>
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            className="p-button-secondary font-bold text-sm px-5"
                            style={{ height: '42px' }}
                            onClick={onHide}
                        />
                    </div>
                }
            >
                {loading && <ProgressBar mode="indeterminate" style={{ height: '4px' }} className="mb-3 border-round" />}

                {folioData && (
                    <div ref={printRef} className="flex flex-column p-1 bg-white print-container" style={{ gap: '1rem' }}>
                        {/* Section Header: Informasi Tamu & Folio Card */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3.5 sm:p-4 shadow-sm">
                            <div className="flex flex-column sm:flex-row justify-content-between align-items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-500 font-bold uppercase tracking-wider mb-2">
                                        Tamu &amp; Kamar (PIC Reservasi)
                                    </div>
                                    <div className="text-lg font-bold text-900 flex align-items-center gap-3 flex-wrap mb-2">
                                        <span className="bg-primary-50 text-primary border-round-lg px-3 py-1.5 font-bold text-sm border-1 border-primary-200 shadow-1 inline-flex align-items-center gap-2 white-space-nowrap mr-1">
                                            <i className="pi pi-home text-xs"></i>
                                            <span>
                                                {folioData.rooms && folioData.rooms.length > 1
                                                    ? `Kamar ${folioData.rooms.map((r: any) => r.nomor_kamar).join(', ')}`
                                                    : header?.nomor_kamar
                                                    ? `Kamar ${header.nomor_kamar}`
                                                    : 'Kamar -'}
                                            </span>
                                        </span>
                                        <span className="text-sm font-semibold text-700 inline-flex align-items-center py-1">
                                            {folioData.rooms && folioData.rooms.length > 1
                                                ? [...new Set(folioData.rooms.map((r: any) => r.nama_tipe_kamar || r.nama_tipe))].join(', ')
                                                : header?.nama_tipe_kamar || 'Tipe Kamar'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-semibold text-900 flex align-items-center gap-4 flex-wrap mt-2.5">
                                        <span className="inline-flex align-items-center gap-2">
                                            <i className="pi pi-user text-primary text-sm"></i>
                                            <span>{header?.guest_name || '-'}</span>
                                        </span>
                                        {header?.guest_phone && (
                                            <span className="text-600 font-normal inline-flex align-items-center gap-2 text-xs">
                                                <i className="pi pi-phone text-400 text-xs"></i>
                                                <span>{header.guest_phone}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto text-left sm:text-right flex-shrink-0">
                                    <div className="text-xs text-500 font-bold uppercase tracking-wider mb-1">
                                        Nomor Folio
                                    </div>
                                    <div className="text-xl font-bold text-primary font-mono">
                                        {header?.kode_folio || '-'}
                                    </div>
                                    <div className="text-xs text-600 mt-1.5 inline-flex align-items-center gap-2 justify-content-start sm:justify-content-end font-medium">
                                        <i className="pi pi-calendar text-xs text-400"></i>
                                        <span>
                                            {header?.check_in_date ? formatDateSystem(header.check_in_date, 'dd MMM yyyy') : '-'} s/d{' '}
                                            {header?.check_out_date ? formatDateSystem(header.check_out_date, 'dd MMM yyyy') : '-'}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <Tag
                                            severity={isSettled ? 'success' : 'danger'}
                                            value={isSettled ? '✓ LUNAS (SETTLED)' : `⚠ BELUM LUNAS (Rp ${(header?.balance || 0).toLocaleString('id-ID')})`}
                                            className="text-xs px-3 py-1.5 font-bold border-round-md shadow-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Daftar Kamar Ditempati */}
                        {folioData.rooms && folioData.rooms.length > 0 && (
                            <div className="surface-card border-round-xl border-1 surface-border p-3.5 sm:p-4 shadow-sm">
                                <div className="flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-home text-primary text-base"></i>
                                        <h4 className="m-0 font-bold text-base text-900">Daftar Kamar Ditempati</h4>
                                    </div>
                                    <span className="text-xs bg-primary-50 text-primary border-round-md px-3 py-1 font-bold border-1 border-primary-200">
                                        {folioData.rooms.length} Kamar
                                    </span>
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
                                        headerStyle={{ width: '42%', textAlign: 'left', padding: '10px 14px', fontSize: '12px' }}
                                        bodyStyle={{ width: '42%', textAlign: 'left', padding: '10px 14px' }}
                                        body={(rowData) => (
                                            <div className="flex align-items-center gap-3">
                                                <span
                                                    className="inline-flex align-items-center justify-content-center border-round-lg bg-primary-100 text-primary font-bold text-xs px-3 py-1.5 border-1 border-primary-200 shadow-1 white-space-nowrap flex-shrink-0"
                                                    style={{ minWidth: '3.5rem', minHeight: '2.25rem' }}
                                                >
                                                    {rowData.nomor_kamar}
                                                </span>
                                                <div className="flex flex-column min-w-0">
                                                    <span className="font-bold text-900 text-sm block line-height-2 mb-0.5">
                                                        {rowData.nama_tipe_kamar || rowData.nama_tipe || `Kamar ${rowData.nomor_kamar}`}
                                                    </span>
                                                    <span className="text-xs text-500 font-medium block">
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
                                        headerStyle={{ width: '22%', textAlign: 'center', padding: '10px 14px', fontSize: '12px' }}
                                        bodyStyle={{ width: '22%', textAlign: 'center', padding: '10px 14px' }}
                                        body={(rowData) => {
                                            const isCheckedIn = rowData.status_room === 'checked_in' || rowData.status === 'checked_in';
                                            return (
                                                <div className="inline-flex align-items-center gap-2 justify-content-center">
                                                    <span
                                                        className={`w-2 h-2 border-circle ${isCheckedIn ? 'bg-green-500' : 'bg-orange-500'}`}
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
                                        headerStyle={{ width: '18%', textAlign: 'right', padding: '10px 14px', fontSize: '12px' }}
                                        bodyStyle={{ width: '18%', textAlign: 'right', padding: '10px 14px' }}
                                        body={(rowData) => (
                                            <span className="text-sm text-700 font-medium font-mono">
                                                Rp {Number(rowData.rate_per_night || 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    />
                                    <Column
                                        header="Subtotal Sewa"
                                        align="right"
                                        alignHeader="right"
                                        headerStyle={{ width: '18%', textAlign: 'right', padding: '10px 14px', fontSize: '12px' }}
                                        bodyStyle={{ width: '18%', textAlign: 'right', padding: '10px 14px' }}
                                        body={(rowData) => (
                                            <span className="font-bold text-900 text-sm font-mono">
                                                Rp {Number(rowData.subtotal || rowData.total_charges || rowData.rate_per_night || 0).toLocaleString('id-ID')}
                                            </span>
                                        )}
                                    />
                                </DataTable>
                            </div>
                        )}

                        {/* Section 2: Rincian Tagihan Layanan & Fasilitas (Charges) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3.5 sm:p-4 shadow-sm">
                            <div className="flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-list text-primary text-base"></i>
                                    <h4 className="m-0 font-bold text-base text-900">Rincian Tagihan Layanan &amp; Fasilitas (Charges)</h4>
                                </div>
                                <span className="text-xs bg-primary-50 text-primary border-round-md px-3 py-1 font-bold border-1 border-primary-200">
                                    {charges.length} Item
                                </span>
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
                                    headerStyle={{ width: '18%', textAlign: 'left', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '18%', textAlign: 'left', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-600 font-mono font-medium">
                                            {formatDateSystem(rowData.posted_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Kategori"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '15%', textAlign: 'center', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '15%', textAlign: 'center', padding: '10px 14px' }}
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
                                    align="left"
                                    alignHeader="left"
                                    headerStyle={{ width: '33%', textAlign: 'left', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '33%', textAlign: 'left', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-900 text-sm block">
                                            {rowData.item_name || rowData.description || rowData.nama_charge || rowData.keterangan || 'Layanan Tambahan'}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Qty"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '10%', textAlign: 'center', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '10%', textAlign: 'center', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="text-xs font-bold text-800 bg-surface-100 border-round-md px-2.5 py-1 border-1 surface-border">
                                            {rowData.qty || 1}x
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Harga Satuan"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '12%', textAlign: 'right', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '12%', textAlign: 'right', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-700 font-mono">
                                            Rp {Number(rowData.unit_price || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Jumlah"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '12%', textAlign: 'right', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '12%', textAlign: 'right', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-900 text-sm font-mono">
                                            Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>

                        {/* Section 3: Riwayat Pembayaran (Payments) */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3.5 sm:p-4 shadow-sm">
                            <div className="flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-wallet text-green-600 text-base"></i>
                                    <h4 className="m-0 font-bold text-base text-900">Riwayat Pembayaran Diterima (Payments)</h4>
                                </div>
                                <span className="text-xs bg-green-50 text-green-700 border-round-md px-3 py-1 font-bold border-1 border-green-200">
                                    {payments.length} Pembayaran
                                </span>
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
                                    headerStyle={{ width: '22%', textAlign: 'left', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '22%', textAlign: 'left', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-600 font-mono font-medium">
                                            {formatDateSystem(rowData.paid_at || rowData.created_at, 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Metode"
                                    align="center"
                                    alignHeader="center"
                                    headerStyle={{ width: '18%', textAlign: 'center', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '18%', textAlign: 'center', padding: '10px 14px' }}
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
                                    headerStyle={{ width: '38%', textAlign: 'left', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '38%', textAlign: 'left', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="text-xs text-700 font-medium">
                                            {rowData.reference_no || '-'} {rowData.kode_cashier_shift ? `(${rowData.kode_cashier_shift})` : ''}
                                        </span>
                                    )}
                                />
                                <Column
                                    header="Nominal Bayar"
                                    align="right"
                                    alignHeader="right"
                                    headerStyle={{ width: '22%', textAlign: 'right', padding: '10px 14px', fontSize: '12px' }}
                                    bodyStyle={{ width: '22%', textAlign: 'right', padding: '10px 14px' }}
                                    body={(rowData) => (
                                        <span className="font-bold text-green-700 text-sm font-mono">
                                            Rp {Number(rowData.amount || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                />
                            </DataTable>
                        </div>

                        {/* Section 4: Ringkasan Total Tagihan & Saldo */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3.5 sm:p-4 shadow-sm bg-surface-50">
                            <div className="flex justify-content-between align-items-center py-1.5">
                                <span className="text-sm font-bold text-700">Total Tagihan (Grand Total):</span>
                                <span className="text-base font-bold text-900 font-mono">
                                    Rp {Number(header?.grand_total || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center py-1.5 border-bottom-1 surface-border">
                                <span className="text-sm font-bold text-700">Total Pembayaran Masuk:</span>
                                <span className="text-base font-bold text-green-600 font-mono">
                                    - Rp {Number(header?.total_paid || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="flex justify-content-between align-items-center pt-3 flex-wrap gap-3">
                                <div>
                                    <span className="text-base font-bold text-900 block">
                                        Sisa Tagihan (Saldo / Outstanding):
                                    </span>
                                    <span className="text-xs text-600 font-medium block mt-0.5">
                                        {isSettled
                                            ? 'Tagihan lunas, tidak ada sisa saldo.'
                                            : 'Wajib diselesaikan oleh tamu sebelum checkout.'}
                                    </span>
                                </div>
                                <span
                                    className={`text-xl font-bold font-mono ${
                                        isSettled ? 'text-green-600' : 'text-red-600'
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
