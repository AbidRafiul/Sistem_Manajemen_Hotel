'use client';

import React, { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Divider } from 'primereact/divider';
import { formatDateSystem } from '@/lib/tools/dateTools';
import { formatPaymentDisplay } from '@/lib/tools/paymentTools';

interface DialogShiftDetailProps {
    visible: boolean;
    onHide: () => void;
    detailData: any;
    loading?: boolean;
}

export const formatCurrency = (val: number | string | null | undefined) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(val || 0));
};

export const getSesiBadge = (sesi: string, nama_shift?: string, is_night_audit?: number) => {
    const displayLabel = nama_shift || (sesi === 'pagi' ? 'Sesi A (Pagi)' : sesi === 'sore' ? 'Sesi B (Sore)' : sesi === 'malam' ? 'Sesi C (Malam)' : sesi || 'Sesi Shift');
    const s = (displayLabel + ' ' + (sesi || '')).toLowerCase();

    if (is_night_audit === 1 || s.includes('night') || s.includes('audit') || s.includes('malam') || s === 'c') {
        return <Tag severity="contrast" value={displayLabel} icon="pi pi-moon" className="font-semibold" />;
    } else if (s.includes('sore') || s.includes('siang') || s.includes('evening') || s === 'b') {
        return <Tag severity="warning" value={displayLabel} icon="pi pi-clock" className="font-semibold" />;
    } else if (s.includes('pagi') || s.includes('morning') || s === 'a') {
        return <Tag severity="info" value={displayLabel} icon="pi pi-sun" className="font-semibold" />;
    }
    return <Tag severity="secondary" value={displayLabel} icon="pi pi-calendar" className="font-semibold" />;
};

const DialogShiftDetail: React.FC<DialogShiftDetailProps> = ({ visible, onHide, detailData, loading }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const shift = detailData?.shift || {};
    const summary = detailData?.summary || {};
    const checkins = detailData?.checkins || [];
    const checkouts = detailData?.checkouts || [];
    const facilities = detailData?.facilities || [];
    const payments = detailData?.payments || [];
    const paySummary = detailData?.payment_summary || {};

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=850,height=900');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bukti Rekapitulasi Shift Kasir - ${shift.kode_cashier_shift || ''}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                        color: #1f2937;
                        margin: 20px;
                        line-height: 1.4;
                        font-size: 13px;
                    }
                    .header { text-align: center; border-bottom: 2px dashed #9ca3af; padding-bottom: 12px; margin-bottom: 15px; }
                    .header h2 { margin: 0 0 4px 0; font-size: 20px; text-transform: uppercase; }
                    .header h4 { margin: 0 0 4px 0; color: #4b5563; font-weight: normal; }
                    .header p { margin: 0; font-size: 11px; color: #6b7280; }
                    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 15px; background: #f9fafb; padding: 10px; border-radius: 6px; }
                    .meta-col { flex: 1; }
                    .meta-item { margin-bottom: 4px; }
                    .label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
                    .value { font-weight: bold; }
                    .stats-box { display: flex; gap: 10px; margin-bottom: 15px; }
                    .stat-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; text-align: center; }
                    .stat-num { font-size: 18px; font-weight: bold; color: #0284c7; }
                    .stat-title { font-size: 11px; color: #6b7280; margin-top: 2px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
                    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
                    th { background: #f3f4f6; color: #374151; font-weight: 600; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .section-title { font-size: 14px; font-weight: bold; border-left: 4px solid #0284c7; padding-left: 8px; margin: 15px 0 8px 0; }
                    .cash-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin-bottom: 15px; }
                    .cash-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
                    .cash-row.total { font-weight: bold; font-size: 14px; border-top: 1px solid #86efac; padding-top: 6px; margin-top: 6px; }
                    .handover-note { background: #fffbeb; border: 1px solid #fef08a; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-style: italic; }
                    .signature-box { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
                    .signature-col { width: 200px; }
                    .sig-line { margin-top: 50px; border-top: 1px solid #1f2937; padding-top: 4px; font-weight: bold; }
                    @media print {
                        body { margin: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>GRAND MARSTECH HOTEL & RESORT</h2>
                    <h4>BUKTI REKAPITULASI SERAH TERIMA SHIFT KASIR</h4>
                    <p>Cabang: ${shift.cabang_name || 'Semua Cabang'} | Dicetak pada: ${formatDateSystem(new Date(), 'dd-MM-yyyy HH:mm:ss')}</p>
                </div>

                <div class="meta-grid">
                    <div class="meta-col">
                        <div class="meta-item"><span class="label">Kode Shift:</span> <span class="value">${shift.kode_cashier_shift || '-'}</span></div>
                        <div class="meta-item"><span class="label">Petugas Kasir:</span> <span class="value">${shift.cashier_name || shift.cashier_username || '-'}</span></div>
                        <div class="meta-item"><span class="label">Counter / Loket:</span> <span class="value">${shift.nama_counter || '-'}</span></div>
                    </div>
                    <div class="meta-col">
                        <div class="meta-item"><span class="label">Sesi Kerja:</span> <span class="value">${shift.nama_shift || (shift.sesi || 'Pagi').toUpperCase()}</span></div>
                        <div class="meta-item"><span class="label">Waktu Buka:</span> <span class="value">${formatDateSystem(shift.opened_at, 'dd-MM-yyyy HH:mm:ss')}</span></div>
                        <div class="meta-item"><span class="label">Waktu Tutup:</span> <span class="value">${shift.closed_at ? formatDateSystem(shift.closed_at, 'dd-MM-yyyy HH:mm:ss') : 'SEDANG AKTIF'}</span></div>
                    </div>
                </div>

                <div class="stats-box">
                    <div class="stat-card">
                        <div class="stat-num">${summary.total_checkin_kamar || 0} Kamar</div>
                        <div class="stat-title">${summary.total_checkin_pax || 0} Tamu Check-in</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">${summary.total_checkout_kamar || 0} Kamar</div>
                        <div class="stat-title">${summary.total_checkout_pax || 0} Tamu Checkout</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">${summary.total_fasilitas_item || 0} Item</div>
                        <div class="stat-title">Fasilitas (${formatCurrency(summary.total_fasilitas_amount || 0)})</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num">${formatCurrency(summary.total_cash_in || 0)}</div>
                        <div class="stat-title">Penerimaan Tunai (Cash In)</div>
                    </div>
                </div>

                <div class="cash-box">
                    <div class="cash-row"><span>1. Modal Awal Kas (Opening Cash):</span> <span>${formatCurrency(summary.opening_cash || 0)}</span></div>
                    <div class="cash-row"><span>2. Total Penerimaan Kas Tunai:</span> <span>+ ${formatCurrency(summary.total_cash_in || 0)}</span></div>
                    <div class="cash-row"><span>3. Total Penerimaan Non-Tunai (EDC/QRIS/Card):</span> <span>${formatCurrency(summary.total_non_cash_in || 0)}</span></div>
                    <div class="cash-row total"><span>TOTAL KAS SISTEM (Seharusnya di Laci):</span> <span>${formatCurrency(summary.system_cash || 0)}</span></div>
                    <div class="cash-row"><span>4. Uang Fisik Kas Saat Penutupan (Closing Cash):</span> <span>${summary.closing_cash !== null ? formatCurrency(summary.closing_cash) : 'Belum Ditutup'}</span></div>
                    <div class="cash-row total" style="color: ${summary.cash_difference < 0 ? '#b91c1c' : summary.cash_difference > 0 ? '#15803d' : '#1f2937'};">
                        <span>SELISIH KAS (Difference):</span> 
                        <span>${summary.cash_difference !== null ? formatCurrency(summary.cash_difference) : '-'}</span>
                    </div>
                </div>

                ${shift.catatan_handover ? `
                    <div class="handover-note">
                        <strong>Catatan Serah Terima:</strong> "${shift.catatan_handover}"
                    </div>
                ` : ''}

                <div class="section-title">1. Rincian Tamu Check-in (${checkins.length} Kamar)</div>
                <table>
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 30px;">No</th>
                            <th>Waktu</th>
                            <th>No. Kamar</th>
                            <th>Tipe Kamar</th>
                            <th>Nama Tamu</th>
                            <th class="text-center">Pax</th>
                            <th>Jenis</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${checkins.length === 0 ? '<tr><td colspan="7" class="text-center">Tidak ada check-in pada sesi ini</td></tr>' : ''}
                        ${checkins.map((c: any, i: number) => `
                            <tr>
                                <td class="text-center">${i + 1}</td>
                                <td>${formatDateSystem(c.checkin_at, 'HH:mm')}</td>
                                <td><strong>${c.nomor_kamar || c.kode_kamar}</strong></td>
                                <td>${c.nama_tipe_kamar || '-'}</td>
                                <td>${c.nama_tamu || '-'}</td>
                                <td class="text-center">${c.guest_count || 1}</td>
                                <td>${c.booking_type === 'walk_in' ? 'Walk-In' : 'Reservasi'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="section-title">2. Rincian Tamu Checkout (${checkouts.length} Kamar)</div>
                <table>
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 30px;">No</th>
                            <th>Waktu</th>
                            <th>No. Kamar</th>
                            <th>Nama Tamu</th>
                            <th class="text-center">Pax</th>
                            <th class="text-right">Grand Total Tagihan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${checkouts.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada checkout pada sesi ini</td></tr>' : ''}
                        ${checkouts.map((co: any, i: number) => `
                            <tr>
                                <td class="text-center">${i + 1}</td>
                                <td>${formatDateSystem(co.checkout_at, 'HH:mm')}</td>
                                <td><strong>${co.nomor_kamar || co.kode_kamar}</strong></td>
                                <td>${co.nama_tamu || '-'}</td>
                                <td class="text-center">${co.guest_count || 1}</td>
                                <td class="text-right">${formatCurrency(co.grand_total || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="section-title">3. Fasilitas & Layanan Tambahan Terjual (${facilities.length} Transaksi)</div>
                <table>
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 30px;">No</th>
                            <th>Waktu</th>
                            <th>Kamar</th>
                            <th>Item Layanan / Fasilitas</th>
                            <th class="text-center">Qty</th>
                            <th class="text-right">Harga</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${facilities.length === 0 ? '<tr><td colspan="7" class="text-center">Tidak ada penambahan fasilitas pada sesi ini</td></tr>' : ''}
                        ${facilities.map((f: any, i: number) => `
                            <tr>
                                <td class="text-center">${i + 1}</td>
                                <td>${formatDateSystem(f.posted_at, 'HH:mm')}</td>
                                <td>${f.nomor_kamar || '-'}</td>
                                <td>${f.description}</td>
                                <td class="text-center">${f.qty}</td>
                                <td class="text-right">${formatCurrency(f.unit_price)}</td>
                                <td class="text-right">${formatCurrency(f.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="section-title">4. Jurnal Transaksi Pembayaran (${payments.length} Mutasi)</div>
                <table>
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 30px;">No</th>
                            <th>No. Bukti</th>
                            <th>Waktu</th>
                            <th>Kamar & Tamu</th>
                            <th>Metode</th>
                            <th class="text-right">Nominal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.length === 0 ? '<tr><td colspan="6" class="text-center">Tidak ada transaksi pembayaran pada sesi ini</td></tr>' : ''}
                        ${payments.map((p: any, i: number) => `
                            <tr>
                                <td class="text-center">${i + 1}</td>
                                <td>${p.kode_payment}</td>
                                <td>${formatDateSystem(p.paid_at, 'HH:mm')}</td>
                                <td>${p.nomor_kamar ? `Kamar ${p.nomor_kamar} - ` : ''}${p.nama_tamu || '-'}</td>
                                <td>
                                    <strong>${(p.payment_method || '').toUpperCase()}</strong>
                                    ${p.bank_name ? ` (${p.bank_name}${p.card_type ? ' ' + p.card_type.toUpperCase() : ''})` : ''}
                                    ${p.reference_no ? `<br/><small style="color: #64748b; font-size: 8pt;">${p.reference_no}</small>` : ''}
                                </td>
                                <td class="text-right">${formatCurrency(p.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="signature-box">
                    <div class="signature-col">
                        <div>Petugas Kasir Yang Bertugas</div>
                        <div class="sig-line">${shift.cashier_name || shift.cashier_username || '.....................'}</div>
                    </div>
                    <div class="signature-col">
                        <div>Petugas Kasir Pengganti</div>
                        <div class="sig-line">.....................................</div>
                    </div>
                    <div class="signature-col">
                        <div>Duty Manager / Supervisor</div>
                        <div class="sig-line">.....................................</div>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center justify-content-between w-full pr-3">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-receipt text-primary text-2xl"></i>
                        <div>
                            <span className="font-bold text-lg block text-900">
                                Rincian Aktivitas Shift Kasir: {shift.kode_cashier_shift || ''}
                            </span>
                            <span className="text-xs text-500 font-normal">
                                Cabang {shift.cabang_name || '-'} | Loket {shift.nama_counter || '-'}
                            </span>
                        </div>
                    </div>
                    <Button
                        label="Cetak Rekap Shift"
                        icon="pi pi-print"
                        severity="secondary"
                        outlined
                        size="small"
                        onClick={handlePrint}
                    />
                </div>
            }
            visible={visible}
            onHide={onHide}
            style={{ width: '92vw', maxWidth: '1150px' }}
            modal
            maximizable
        >
            <div ref={printRef}>
                {loading ? (
                    <div className="flex justify-content-center align-items-center p-6">
                        <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
                    </div>
                ) : (
                    <div>
                        {/* Header Info Banner */}
                        <div className="surface-card border-round-xl border-1 surface-border p-3 mb-4 shadow-1">
                            <div className="grid align-items-center m-0">
                                <div className="col-12 md:col-3 p-2 border-right-none md:border-right-1 surface-border">
                                    <span className="text-xs text-500 block uppercase font-semibold">Petugas Kasir</span>
                                    <span className="font-bold text-base text-900">{shift.cashier_name || shift.cashier_username || '-'}</span>
                                    <div className="mt-1">{getSesiBadge(shift.sesi, shift.nama_shift, shift.is_night_audit)}</div>
                                </div>
                                <div className="col-12 md:col-3 p-2 border-right-none md:border-right-1 surface-border">
                                    <span className="text-xs text-500 block uppercase font-semibold">Waktu Operasional</span>
                                    <span className="text-xs font-semibold text-700 block">
                                        Buka: {formatDateSystem(shift.opened_at, 'dd/MM/yyyy HH:mm')}
                                    </span>
                                    <span className="text-xs font-semibold text-700 block mt-1">
                                        Tutup: {shift.closed_at ? formatDateSystem(shift.closed_at, 'dd/MM/yyyy HH:mm') : <Tag severity="success" value="AKTIF" className="text-xs" />}
                                    </span>
                                </div>
                                <div className="col-12 md:col-3 p-2 border-right-none md:border-right-1 surface-border">
                                    <span className="text-xs text-500 block uppercase font-semibold">Kas Sistem (Seharusnya)</span>
                                    <span className="font-bold text-lg text-primary block">{formatCurrency(summary.system_cash)}</span>
                                    <span className="text-xs text-500">Modal: {formatCurrency(summary.opening_cash)} + Tunai: {formatCurrency(summary.total_cash_in)}</span>
                                </div>
                                <div className="col-12 md:col-3 p-2">
                                    <span className="text-xs text-500 block uppercase font-semibold">Uang Fisik & Selisih</span>
                                    <span className="font-bold text-base text-900 block">
                                        Fisik: {summary.closing_cash !== null ? formatCurrency(summary.closing_cash) : <span className="text-500 italic">Belum tutup</span>}
                                    </span>
                                    {summary.cash_difference !== null && (
                                        <span className={`text-xs font-bold ${summary.cash_difference === 0 ? 'text-green-600' : summary.cash_difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                            Selisih: {formatCurrency(summary.cash_difference)} {summary.cash_difference === 0 ? '(PAS)' : summary.cash_difference > 0 ? '(LEBIH)' : '(KURANG)'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {shift.catatan_handover && (
                                <div className="mt-3 p-2 bg-yellow-50 border-round border-1 border-yellow-200 text-xs text-yellow-900 flex align-items-center gap-2">
                                    <i className="pi pi-comment text-yellow-700"></i>
                                    <span><strong>Catatan Handover:</strong> {shift.catatan_handover}</span>
                                </div>
                            )}
                        </div>

                        {/* 4 Summary Stat Cards */}
                        <div className="grid mb-4">
                            <div className="col-12 sm:col-6 lg:col-3">
                                <div className="surface-card border-1 surface-border border-round-xl p-3 shadow-1 h-full">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <span className="text-xs uppercase font-bold text-500">Check-in</span>
                                        <div className="w-2rem h-2rem border-round-circle bg-green-100 flex align-items-center justify-content-center">
                                            <i className="pi pi-sign-in text-green-600"></i>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-900 mb-1">{summary.total_checkin_kamar || 0} Kamar</div>
                                    <span className="text-xs text-green-700 font-semibold">{summary.total_checkin_pax || 0} Orang (Pax)</span>
                                </div>
                            </div>

                            <div className="col-12 sm:col-6 lg:col-3">
                                <div className="surface-card border-1 surface-border border-round-xl p-3 shadow-1 h-full">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <span className="text-xs uppercase font-bold text-500">Check-out</span>
                                        <div className="w-2rem h-2rem border-round-circle bg-orange-100 flex align-items-center justify-content-center">
                                            <i className="pi pi-sign-out text-orange-600"></i>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-900 mb-1">{summary.total_checkout_kamar || 0} Kamar</div>
                                    <span className="text-xs text-orange-700 font-semibold">{summary.total_checkout_pax || 0} Orang (Pax)</span>
                                </div>
                            </div>

                            <div className="col-12 sm:col-6 lg:col-3">
                                <div className="surface-card border-1 surface-border border-round-xl p-3 shadow-1 h-full">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <span className="text-xs uppercase font-bold text-500">Fasilitas Tambahan</span>
                                        <div className="w-2rem h-2rem border-round-circle bg-purple-100 flex align-items-center justify-content-center">
                                            <i className="pi pi-sparkles text-purple-600"></i>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-900 mb-1">{summary.total_fasilitas_item || 0} Item</div>
                                    <span className="text-xs text-purple-700 font-semibold">{formatCurrency(summary.total_fasilitas_amount || 0)}</span>
                                </div>
                            </div>

                            <div className="col-12 sm:col-6 lg:col-3">
                                <div className="surface-card border-1 surface-border border-round-xl p-3 shadow-1 h-full">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <span className="text-xs uppercase font-bold text-500">Total Uang Masuk</span>
                                        <div className="w-2rem h-2rem border-round-circle bg-blue-100 flex align-items-center justify-content-center">
                                            <i className="pi pi-wallet text-blue-600"></i>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-900 mb-1">{formatCurrency(summary.total_payment_in || 0)}</div>
                                    <span className="text-xs text-500 font-semibold">Tunai: {formatCurrency(summary.total_cash_in || 0)} | Non-Tunai: {formatCurrency(summary.total_non_cash_in || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Tab Panels */}
                        <TabView>
                            {/* Tab 1: Tamu Check-in */}
                            <TabPanel header={`Tamu Check-in (${checkins.length})`} leftIcon="pi pi-sign-in mr-2">
                                <DataTable
                                    value={checkins}
                                    paginator
                                    rows={5}
                                    emptyMessage="Belum ada tamu check-in pada sesi shift ini."
                                    size="small"
                                    className="p-datatable-sm"
                                >
                                    <Column field="checkin_at" header="Jam" body={(r) => formatDateSystem(r.checkin_at, 'HH:mm')} style={{ width: '80px' }} />
                                    <Column field="nomor_kamar" header="Kamar" body={(r) => <span className="font-bold text-primary">{r.nomor_kamar || r.kode_kamar}</span>} style={{ width: '110px' }} />
                                    <Column field="nama_tipe_kamar" header="Tipe Kamar" />
                                    <Column field="nama_tamu" header="Nama Tamu" className="font-semibold" />
                                    <Column field="guest_count" header="Pax" body={(r) => <Tag severity="info" value={`${r.guest_count || 1} Tamu`} />} style={{ width: '90px' }} />
                                    <Column field="booking_type" header="Jenis" body={(r) => (
                                        <Tag severity={r.booking_type === 'walk_in' ? 'warning' : 'success'} value={r.booking_type === 'walk_in' ? 'Walk-In' : 'Reservasi'} />
                                    )} style={{ width: '110px' }} />
                                    <Column field="deposit_amount" header="Deposit Awal" body={(r) => formatCurrency(r.deposit_amount)} className="text-right" />
                                </DataTable>
                            </TabPanel>

                            {/* Tab 2: Tamu Checkout */}
                            <TabPanel header={`Tamu Check-out (${checkouts.length})`} leftIcon="pi pi-sign-out mr-2">
                                <DataTable
                                    value={checkouts}
                                    paginator
                                    rows={5}
                                    emptyMessage="Belum ada tamu checkout pada sesi shift ini."
                                    size="small"
                                    className="p-datatable-sm"
                                >
                                    <Column field="checkout_at" header="Jam" body={(r) => formatDateSystem(r.checkout_at, 'HH:mm')} style={{ width: '80px' }} />
                                    <Column field="nomor_kamar" header="Kamar" body={(r) => <span className="font-bold text-primary">{r.nomor_kamar || r.kode_kamar}</span>} style={{ width: '110px' }} />
                                    <Column field="nama_tipe_kamar" header="Tipe Kamar" />
                                    <Column field="nama_tamu" header="Nama Tamu" className="font-semibold" />
                                    <Column field="guest_count" header="Pax" body={(r) => <Tag severity="info" value={`${r.guest_count || 1} Tamu`} />} style={{ width: '90px' }} />
                                    <Column field="grand_total" header="Grand Total" body={(r) => formatCurrency(r.grand_total)} className="text-right font-bold" />
                                </DataTable>
                            </TabPanel>

                            {/* Tab 3: Fasilitas Tambahan */}
                            <TabPanel header={`Fasilitas Tambahan (${facilities.length})`} leftIcon="pi pi-sparkles mr-2">
                                <DataTable
                                    value={facilities}
                                    paginator
                                    rows={5}
                                    emptyMessage="Belum ada fasilitas tambahan yang dicatat pada sesi shift ini."
                                    size="small"
                                    className="p-datatable-sm"
                                >
                                    <Column field="posted_at" header="Jam" body={(r) => formatDateSystem(r.posted_at, 'HH:mm')} style={{ width: '80px' }} />
                                    <Column field="nomor_kamar" header="Kamar" body={(r) => r.nomor_kamar ? `Kamar ${r.nomor_kamar}` : '-'} style={{ width: '120px' }} />
                                    <Column field="description" header="Item Fasilitas / Layanan" className="font-semibold" />
                                    <Column field="qty" header="Qty" className="text-center" style={{ width: '70px' }} />
                                    <Column field="unit_price" header="Harga Satuan" body={(r) => formatCurrency(r.unit_price)} className="text-right" />
                                    <Column field="amount" header="Subtotal" body={(r) => formatCurrency(r.amount)} className="text-right font-bold text-primary" />
                                </DataTable>
                            </TabPanel>

                            {/* Tab 4: Jurnal Pembayaran */}
                            <TabPanel header={`Jurnal Mutasi Kas (${payments.length})`} leftIcon="pi pi-dollar mr-2">
                                <div className="surface-50 p-3 border-round-lg mb-3 flex flex-wrap gap-3 align-items-center justify-content-between border-1 surface-border">
                                    <div className="flex gap-4">
                                        <div>
                                            <span className="text-xs text-500 block">Tunai (Cash):</span>
                                            <span className="font-bold text-green-700">{formatCurrency(paySummary.cash)}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-500 block">Debit / Kartu:</span>
                                            <span className="font-bold text-blue-700">{formatCurrency((paySummary.card || 0) + (paySummary.edc || 0))}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-500 block">Transfer / QRIS:</span>
                                            <span className="font-bold text-indigo-700">{formatCurrency(paySummary.transfer || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-500 block font-semibold">Total Uang Diterima Kasir:</span>
                                        <span className="font-bold text-lg text-primary">{formatCurrency(paySummary.total)}</span>
                                    </div>
                                </div>

                                <DataTable
                                    value={payments}
                                    paginator
                                    rows={5}
                                    emptyMessage="Belum ada transaksi pembayaran pada sesi shift ini."
                                    size="small"
                                    className="p-datatable-sm"
                                >
                                    <Column field="kode_payment" header="No. Pembayaran" className="font-semibold" style={{ width: '150px' }} />
                                    <Column field="paid_at" header="Jam" body={(r) => formatDateSystem(r.paid_at, 'HH:mm')} style={{ width: '80px' }} />
                                    <Column field="nomor_kamar" header="Kamar / Tamu" body={(r) => (
                                        <div>
                                            <div className="font-semibold">{r.nomor_kamar ? `Kamar ${r.nomor_kamar}` : '-'}</div>
                                            <div className="text-xs text-500">{r.nama_tamu || '-'}</div>
                                        </div>
                                    )} />
                                    <Column field="payment_method" header="Metode Pembayaran" body={(r) => {
                                        const disp = formatPaymentDisplay(r.payment_method, r.bank_name, r.card_type);
                                        return (
                                            <div>
                                                <Tag
                                                    severity={disp.severity}
                                                    value={disp.label}
                                                    icon={disp.icon}
                                                    className="text-xs px-2 py-1 font-bold"
                                                />
                                                {r.reference_no && (
                                                    <div className="text-xs text-500 mt-1 font-monospace flex align-items-center">
                                                        <i className="pi pi-hashtag mr-1 text-xs text-400"></i>
                                                        <span className="surface-100 px-1 border-round">{r.reference_no}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }} style={{ minWidth: '180px' }} />
                                    <Column field="amount" header="Nominal" body={(r) => formatCurrency(r.amount)} className="text-right font-bold text-primary" style={{ width: '150px' }} />
                                </DataTable>
                            </TabPanel>
                        </TabView>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default DialogShiftDetail;
