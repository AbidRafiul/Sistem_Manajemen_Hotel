'use client';

import React from 'react';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface CetakInvoiceThermalProps {
    data: any;
    cashierName?: string;
}

const formatCurrency = (val: number | string | undefined | null) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
        Number(val || 0)
    );
};

export const CetakInvoiceThermal = React.forwardRef<HTMLDivElement, CetakInvoiceThermalProps>(
    ({ data, cashierName }, ref) => {
        if (!data) return null;

        const {
            invoice_number,
            issued_at,
            hotel = {},
            guest = {},
            reservation = {},
            summary = {}
        } = data;

        // Mendukung data baik dari root maupun nested breakdown
        const rooms = data.rooms || data.breakdown?.rooms || [];
        const charges = data.charges || data.breakdown?.charges || [];
        const taxDetails = data.tax_breakdown || data.breakdown?.tax_details || [];
        const payments = data.payments || data.breakdown?.payments || [];

        const isSettled = summary.is_settled ?? ((summary.balance ?? 1) <= 0);
        const nights = summary.nights || 1;
        const guestName = guest.full_name || guest.guest_name || '-';
        const guestPhone = guest.phone || guest.guest_phone || '';
        const folioCode = summary.kode_folio || data.folio?.kode_folio || '-';
        const resvCode = reservation.kode_reservasi || '-';

        return (
            <div
                ref={ref}
                className="thermal-receipt-container"
                style={{
                    width: '80mm',
                    maxWidth: '100%',
                    margin: '0 auto',
                    padding: '12px 10px 24px 10px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: "'Courier New', Courier, Monaco, Consolas, monospace",
                    fontSize: '11px',
                    lineHeight: '1.35',
                    boxSizing: 'border-box'
                }}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page {
                            size: 80mm auto;
                            margin: 0mm !important;
                        }
                        body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .thermal-receipt-container {
                            width: 100% !important;
                            max-width: 80mm !important;
                            padding: 8px 6px !important;
                            box-shadow: none !important;
                        }
                    }
                    `
                }} />

                {/* ─── HEADER HOTEL ─── */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {hotel.nama_hotel || 'GRAND MARSTECH HOTEL'}
                    </div>
                    {hotel.alamat && (
                        <div style={{ fontSize: '10px', marginTop: '2px', color: '#111' }}>
                            {hotel.alamat}
                        </div>
                    )}
                    <div style={{ fontSize: '10px', marginTop: '1px', color: '#333' }}>
                        {hotel.telepon ? `Telp: ${hotel.telepon}` : ''}
                        {hotel.telepon && hotel.email ? ' | ' : ''}
                        {hotel.email ? `Email: ${hotel.email}` : ''}
                    </div>
                </div>

                {/* Garis Pembatas Header (Double Line) */}
                <div style={{ borderTop: '2px solid #000', margin: '6px 0 8px 0' }} />

                {/* ─── DOKUMEN & METADATA ─── */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        STRUK PEMBAYARAN HOTEL
                    </div>
                    <div style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        border: '1px solid #000',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        textTransform: 'uppercase'
                    }}>
                        {isSettled ? '✓ LUNAS / SETTLED' : '⚠ BELUM LUNAS'}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>No. Faktur</span>
                        <span style={{ fontWeight: 'bold' }}>{invoice_number || 'INV-DRAFT'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tanggal</span>
                        <span>{issued_at ? formatDateSystem(issued_at, 'dd/MM/yyyy HH:mm') : formatDateSystem(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Kasir/FO</span>
                        <span>{cashierName || 'Front Office'}</span>
                    </div>
                </div>

                {/* Garis Pembatas Putus-putus */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* ─── INFORMASI TAMU & RESERVASI ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Nama Tamu</span>
                        <span style={{ fontWeight: 'bold', textAlign: 'right' }}>{guestName}</span>
                    </div>
                    {guestPhone && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>No. Telepon</span>
                            <span>{guestPhone}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>No. Reservasi</span>
                        <span style={{ fontWeight: 'bold' }}>{resvCode}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>No. Folio</span>
                        <span>{folioCode}</span>
                    </div>
                    {reservation.check_in_date && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Check-In</span>
                            <span>{formatDateSystem(reservation.check_in_date, 'dd/MM/yy HH:mm')}</span>
                        </div>
                    )}
                    {reservation.check_out_date && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Check-Out</span>
                            <span>{formatDateSystem(reservation.check_out_date, 'dd/MM/yy HH:mm')} ({nights} Mlm)</span>
                        </div>
                    )}
                </div>

                {/* Garis Pembatas Putus-putus */}
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* ─── RINCIAN TRANSAKSI (ITEMS) ─── */}
                <div style={{ fontWeight: 'bold', fontSize: '10.5px', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Rincian Transaksi:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10.5px' }}>
                    {/* Item Kamar */}
                    {rooms.map((rm: any, idx: number) => {
                        const roomNights = rm.nights || nights || 1;
                        const roomRate = rm.rate_per_night || 0;
                        const roomSubtotal = rm.subtotal || (roomRate * roomNights);

                        return (
                            <div key={`rm-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                <div style={{ fontWeight: 'bold' }}>
                                    Kamar {rm.nomor_kamar || rm.kode_kamar}
                                    <span style={{ fontWeight: 'normal', fontSize: '10px', marginLeft: '4px' }}>
                                        ({rm.nama_tipe_kamar || rm.nama_tipe || 'Kamar'})
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                                    <span>{roomNights} Mlm x {formatCurrency(roomRate)}</span>
                                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(roomSubtotal)}</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Layanan Tambahan / Extra Charge */}
                    {charges.map((ch: any, idx: number) => (
                        <div key={`ch-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <div style={{ fontWeight: 'bold' }}>
                                {ch.nama_charge || ch.charge_name || 'Layanan Tambahan'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}>
                                <span>{ch.qty || 1}x @ {formatCurrency(ch.unit_price || ch.amount)}</span>
                                <span style={{ fontWeight: 'bold' }}>{formatCurrency(ch.total_amount || ch.amount)}</span>
                            </div>
                        </div>
                    ))}

                    {/* Fallback jika list rooms & charges kosong namun subtotal terisi */}
                    {rooms.length === 0 && charges.length === 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '4px' }}>
                            <span>Sewa Kamar Hotel ({nights} Malam)</span>
                            <span style={{ fontWeight: 'bold' }}>{formatCurrency(summary.subtotal)}</span>
                        </div>
                    )}
                </div>

                {/* Garis Pembatas Putus-putus */}
                <div style={{ borderTop: '1px dashed #000', margin: '8px 0 6px 0' }} />

                {/* ─── PERHITUNGAN FINANSIAL & PAJAK ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal Biaya</span>
                        <span>{formatCurrency(summary.subtotal)}</span>
                    </div>

                    {taxDetails.map((tx: any, idx: number) => (
                        <div key={`tx-${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{tx.name || tx.tax_name} ({tx.percentage || tx.tax_rate}%):</span>
                            <span>+ {formatCurrency(tx.amount || tx.tax_amount)}</span>
                        </div>
                    ))}

                    {/* Pembatas Tebal Sebelum Total */}
                    <div style={{ borderTop: '1px solid #000', margin: '3px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
                        <span>TOTAL TAGIHAN</span>
                        <span>{formatCurrency(summary.grand_total)}</span>
                    </div>

                    {/* Rincian Pembayaran */}
                    {payments.map((p: any, idx: number) => (
                        <div key={`p-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span>Bayar ({String(p.payment_method).toUpperCase()}{p.reference_no ? ` - ${p.reference_no}` : ''}):</span>
                            <span>- {formatCurrency(p.amount)}</span>
                        </div>
                    ))}

                    {payments.length === 0 && Number(summary.total_paid || 0) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                            <span>Total Pembayaran Masuk:</span>
                            <span>- {formatCurrency(summary.total_paid)}</span>
                        </div>
                    )}

                    <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
                        <span>SISA SALDO TAGIHAN</span>
                        <span style={{ fontSize: '12px' }}>{formatCurrency(summary.balance || 0)}</span>
                    </div>
                </div>

                {/* Garis Pembatas Putus-putus */}
                <div style={{ borderTop: '1px dashed #000', margin: '10px 0 8px 0' }} />

                {/* ─── TANDA TANGAN (COMPACT 2-COLUMN) ─── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    textAlign: 'center',
                    marginTop: '8px',
                    fontSize: '10px'
                }}>
                    <div style={{ width: '45%' }}>
                        <div>Tamu Menginap,</div>
                        <div style={{ height: '36px' }} />
                        <div style={{ borderBottom: '1px solid #000', margin: '0 4px' }} />
                        <div style={{ marginTop: '2px', fontWeight: 'bold', fontSize: '9.5px' }}>
                            ( {guestName.length > 15 ? guestName.substring(0, 15) + '..' : guestName} )
                        </div>
                    </div>

                    <div style={{ width: '45%' }}>
                        <div>Kasir / FO,</div>
                        <div style={{ height: '36px' }} />
                        <div style={{ borderBottom: '1px solid #000', margin: '0 4px' }} />
                        <div style={{ marginTop: '2px', fontWeight: 'bold', fontSize: '9.5px' }}>
                            ( {cashierName || 'Front Office'} )
                        </div>
                    </div>
                </div>

                {/* ─── FOOTER PESAN RAMAH ─── */}
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '9.5px', color: '#222' }}>
                    <div style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        *** TERIMA KASIH ***
                    </div>
                    <div style={{ marginTop: '3px' }}>
                        Terima kasih atas kunjungan Anda di
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                        {hotel.nama_hotel || 'Hotel Kami'}
                    </div>
                    <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '9px', color: '#444' }}>
                        Struk ini adalah bukti pembayaran yang sah.
                        <br />
                        Simpan bukti transaksi ini untuk keperluan Anda.
                    </div>
                </div>

                {/* Feed spacer untuk thermal tear bar */}
                <div style={{ height: '20px' }} />
            </div>
        );
    }
);

CetakInvoiceThermal.displayName = 'CetakInvoiceThermal';
export default CetakInvoiceThermal;
