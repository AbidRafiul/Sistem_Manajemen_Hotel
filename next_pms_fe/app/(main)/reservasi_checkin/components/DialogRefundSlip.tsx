'use client';

import React, { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { formatCurrency } from '@/lib/tools/generalTools';

interface DialogRefundSlipProps {
    visible: boolean;
    onHide: () => void;
    reservation: any;
    hotelName?: string;
    hotelAddress?: string;
    hotelPhone?: string;
    currentUserName?: string;
}

export const DialogRefundSlip: React.FC<DialogRefundSlipProps> = ({
    visible,
    onHide,
    reservation,
    hotelName = 'Grand Marstech Hotel & Resort',
    hotelAddress = 'Jl. Diponegoro No. 88, Magetan, Jawa Timur',
    hotelPhone = '0351-890123',
    currentUserName = 'Kasir Front Office'
}) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!reservation) return null;

    const depositAmount = parseFloat(reservation.deposit_amount || 0);
    const penaltyAmount = parseFloat(reservation.cancellation_penalty || 0);
    const refundPayments = reservation.refund_payments || [];
    const calculatedRefund = refundPayments.reduce(
        (sum: number, p: any) => sum + Math.abs(parseFloat(p.amount || 0)),
        0
    );
    const effectiveRefund = calculatedRefund > 0 ? calculatedRefund : Math.max(0, depositAmount - penaltyAmount);

    const firstRefundPay = refundPayments[0] || null;
    const paymentMethod = (firstRefundPay?.payment_method || 'transfer').toUpperCase();
    const bankName = firstRefundPay?.bank_name || '';
    const referenceNo = firstRefundPay?.reference_no || '';

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bukti Refund - ${reservation.kode_reservasi}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 11pt;
                        color: #1e293b;
                        margin: 20px 30px;
                        line-height: 1.4;
                    }
                    .header-box {
                        border-bottom: 2px solid #0f172a;
                        padding-bottom: 8px;
                        margin-bottom: 14px;
                    }
                    .title {
                        text-align: center;
                        font-size: 14pt;
                        font-weight: bold;
                        text-transform: uppercase;
                        margin: 12px 0 4px;
                        color: #0f172a;
                    }
                    .subtitle {
                        text-align: center;
                        font-size: 9pt;
                        color: #64748b;
                        margin-bottom: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 12px;
                    }
                    table.info-table td {
                        padding: 4px 6px;
                        font-size: 10pt;
                    }
                    table.fin-table {
                        border: 1px solid #cbd5e1;
                    }
                    table.fin-table th, table.fin-table td {
                        border: 1px solid #cbd5e1;
                        padding: 6px 8px;
                        font-size: 10pt;
                    }
                    table.fin-table th {
                        background-color: #f1f5f9;
                        font-weight: bold;
                    }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .highlight-box {
                        background-color: #f8fafc;
                        border: 1px dashed #94a3b8;
                        padding: 10px;
                        border-radius: 6px;
                        margin: 12px 0;
                        font-size: 10pt;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 35px;
                        text-align: center;
                    }
                    .sig-col {
                        width: 30%;
                    }
                    .sig-line {
                        margin-top: 50px;
                        border-bottom: 1px solid #0f172a;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-receipt text-xl text-primary font-bold"></i>
                    <span className="font-bold text-lg text-900">Slip Bukti Pengembalian Dana (Refund Receipt)</span>
                </div>
            }
            visible={visible}
            style={{ width: '700px', maxWidth: '95vw' }}
            breakpoints={{ '960px': '85vw', '641px': '95vw' }}
            onHide={onHide}
            modal
            footer={
                <div className="flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top-1 surface-border">
                    <Button
                        label="Tutup"
                        icon="pi pi-times"
                        className="p-button-outlined p-button-sm px-3"
                        onClick={onHide}
                    />
                    <Button
                        label="Cetak Slip Bukti Refund"
                        icon="pi pi-print"
                        className="p-button-sm font-bold shadow-1 px-3"
                        severity="success"
                        onClick={handlePrint}
                    />
                </div>
            }
        >
            <div ref={printRef} className="p-3 surface-card border-1 surface-border border-round-xl">
                {/* Header Slip Hotel */}
                <div className="header-box pb-2 border-bottom-2 border-900 mb-3">
                    <div className="flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                            <h2 className="font-bold text-lg m-0 text-900 uppercase tracking-wide">{hotelName}</h2>
                            <span className="text-xs text-600 block mt-1">{hotelAddress}</span>
                            <span className="text-xs text-500 block">No. Telp: {hotelPhone}</span>
                        </div>
                        <div className="text-right">
                            <Tag severity="danger" value="PEMBATALAN & REFUND" className="font-bold text-xs" />
                            <span className="text-xs text-500 block mt-1">
                                Tgl Cetak: {formatDateSystem(new Date(), 'dd/MM/yyyy HH:mm')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-center my-3">
                    <h3 className="font-bold text-base m-0 text-900 uppercase">
                        TANDA TERIMA PENGEMBALIAN DANA (REFUND RECEIPT)
                    </h3>
                    <span className="text-xs text-500 font-mono block mt-1">
                        No. Bukti: {firstRefundPay?.kode_payment || `REF-${reservation.kode_reservasi}`}
                    </span>
                </div>

                {/* Info Reservasi & Tamu */}
                <div className="surface-50 p-3 border-round-lg border-1 surface-border mb-3 text-xs flex flex-column gap-2">
                    <div className="grid">
                        <div className="col-12 sm:col-6">
                            <span className="text-500 block">No. Reservasi:</span>
                            <strong className="text-900 text-sm font-mono">{reservation.kode_reservasi}</strong>
                        </div>
                        <div className="col-12 sm:col-6">
                            <span className="text-500 block">Kode Folio:</span>
                            <strong className="text-900 font-mono">{reservation.kode_folio || '-'}</strong>
                        </div>
                        <div className="col-12 sm:col-6">
                            <span className="text-500 block">Nama Tamu / Pemesan:</span>
                            <strong className="text-900 text-sm">{reservation.guest_name || '-'}</strong>
                        </div>
                        <div className="col-12 sm:col-6">
                            <span className="text-500 block">No. Telepon / HP:</span>
                            <strong className="text-900">{reservation.guest_phone || '-'}</strong>
                        </div>
                        <div className="col-12 sm:col-6">
                            <span className="text-500 block">Jadwal Menginap:</span>
                            <span className="text-800">
                                {formatDateSystem(reservation.check_in_date, 'dd/MM/yyyy')} s.d {formatDateSystem(reservation.check_out_date, 'dd/MM/yyyy')} ({reservation.nights || 1} Malam)
                            </span>
                        </div>
                        <div className="col-12 sm:col-6">
                            <span className="text-500 block">Kamar Dipesan:</span>
                            <span className="text-800 font-semibold">
                                {reservation.room_types_summary || reservation.tipe_kamar_name || 'Kamar Hotel'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rincian Finansial Refund */}
                <table className="w-full text-xs border-collapse border-1 surface-border mb-3 fin-table">
                    <thead>
                        <tr className="surface-100 text-800 font-bold border-bottom-1 surface-border">
                            <th className="p-2 text-left">Deskripsi Transaksi</th>
                            <th className="p-2 text-right" style={{ width: '150px' }}>Nominal (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-bottom-1 surface-border">
                            <td className="p-2 text-700">Total Deposit Awal yang Telah Dibayar Tamu</td>
                            <td className="p-2 text-right font-semibold text-900">{formatCurrency(depositAmount)}</td>
                        </tr>
                        <tr className="border-bottom-1 surface-border">
                            <td className="p-2 text-red-600">
                                Potongan Denda Pembatalan / Biaya Administrasi
                            </td>
                            <td className="p-2 text-right font-semibold text-red-600">
                                - {formatCurrency(penaltyAmount)}
                            </td>
                        </tr>
                        <tr className="surface-100 font-bold border-top-2 border-900 text-sm">
                            <td className="p-2 text-900 uppercase">Total Dana Bersih yang Dikembalikan (Refund):</td>
                            <td className="p-2 text-right text-green-700 text-base">{formatCurrency(effectiveRefund)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Metode Pencairan & Alasan */}
                <div className="highlight-box bg-blue-50 border-1 border-blue-200 border-round-lg p-3 text-xs mb-3">
                    <div className="grid">
                        <div className="col-12 sm:col-6">
                            <span className="text-600 block">Metode Pengembalian:</span>
                            <strong className="text-blue-900 text-sm">
                                {paymentMethod} {bankName ? `(${bankName})` : ''}
                            </strong>
                        </div>
                        <div className="col-12 sm:col-6">
                            <span className="text-600 block">No. Referensi / No. Rekening Tujuan:</span>
                            <strong className="text-blue-900 font-mono text-sm">{referenceNo || '-'}</strong>
                        </div>
                        <div className="col-12 mt-2">
                            <span className="text-600 block">Alasan Pembatalan & Catatan:</span>
                            <span className="text-800 font-medium italic block bg-white p-2 border-round border-1 border-200 mt-1">
                                &quot;{reservation.cancellation_reason || 'Permintaan pembatalan tamu'}&quot;
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tanda Tangan Tiga Pihak */}
                <div className="grid text-center text-xs mt-4 pt-3 signatures">
                    <div className="col-4 sig-col flex flex-column justify-content-between" style={{ minHeight: '90px' }}>
                        <span className="text-600 font-semibold">Tamu Penerima Dana,</span>
                        <div className="border-bottom-1 border-900 pb-1 mx-2 sig-line font-bold text-900">
                            ( {reservation.guest_name || '....................'} )
                        </div>
                    </div>
                    <div className="col-4 sig-col flex flex-column justify-content-between" style={{ minHeight: '90px' }}>
                        <span className="text-600 font-semibold">Petugas Kasir Front Desk,</span>
                        <div className="border-bottom-1 border-900 pb-1 mx-2 sig-line font-bold text-900">
                            ( {currentUserName || 'Kasir FO'} )
                        </div>
                    </div>
                    <div className="col-4 sig-col flex flex-column justify-content-between" style={{ minHeight: '90px' }}>
                        <span className="text-600 font-semibold">Duty Manager / Supervisor,</span>
                        <div className="border-bottom-1 border-900 pb-1 mx-2 sig-line font-bold text-900">
                            ( ................................... )
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};
export default DialogRefundSlip;

