import React from 'react';
import { formatDateSystem } from '@/lib/tools/dateTools';

interface CetakInvoiceHotelProps {
    data: any;
}

const formatCurrency = (val: number | string | undefined | null) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
        Number(val || 0)
    );
};

export const CetakInvoiceHotel = React.forwardRef<HTMLDivElement, CetakInvoiceHotelProps>(({ data }, ref) => {
    if (!data) return null;

    const { invoice_number, issued_at, hotel = {}, guest = {}, reservation = {}, summary = {}, breakdown = {} } = data;
    const isSettled = summary.is_settled ?? ((summary.balance ?? 1) <= 0);

    const rooms = data.rooms || breakdown.rooms || [];
    const charges = data.charges || breakdown.charges || [];
    const taxDetails = data.tax_breakdown || breakdown.tax_details || [];
    const payments = data.payments || breakdown.payments || [];

    // Robust guest info extraction to support all API payload shapes
    const guestName = guest.full_name || guest.guest_name || guest.nama_tamu || reservation.guest_name || summary.guest_name || '-';
    const guestPhone = guest.phone || guest.guest_phone || guest.no_hp || reservation.guest_phone || '-';
    const guestEmail = guest.email || guest.guest_email || reservation.guest_email || '-';
    const guestIdType = (guest.id_type || guest.guest_id_type || 'ID').toUpperCase();
    const guestIdNumber = guest.id_number || guest.guest_id_number || '-';

    const hotelName = hotel.nama_hotel || hotel.nama_perusahaan || 'GRAND MARSTECH HOTEL & RESORT';
    const hotelAddress = hotel.alamat || hotel.alamat_perusahaan || 'Jl. Diponegoro No. 88, Magetan, Jawa Timur';
    const hotelPhone = hotel.telepon || hotel.phone || '0351-890123';
    const hotelEmail = hotel.email || '-';

    return (
        <div 
            ref={ref} 
            className="p-4 text-gray-900 bg-white shadow-1 border-round-xl print-compact-container" 
            style={{ 
                fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', 
                fontSize: '11.5px', 
                lineHeight: 1.45,
                minWidth: '720px',
                color: '#1e293b'
            }}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 6mm 8mm !important;
                    }
                    html, body {
                        height: 100%;
                        background: #ffffff !important;
                        overflow: hidden !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-compact-container {
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        min-width: 100% !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                `
            }} />

            {/* Header Nota Invoice / Faktur */}
            <div className="flex justify-content-between align-items-start border-bottom-2 border-900 pb-2 mb-3">
                <div>
                    <h2 className="text-xl font-bold tracking-wide uppercase m-0 text-900" style={{ letterSpacing: '0.5px' }}>
                        {hotelName}
                    </h2>
                    <span className="text-gray-600 text-xs block mt-1">
                        {hotelAddress}
                    </span>
                    <span className="text-gray-500 text-xs block mt-1">
                        Telp: {hotelPhone} {hotelEmail && hotelEmail !== '-' ? ` | Email: ${hotelEmail}` : ''}
                    </span>
                </div>
                <div className="text-right">
                    <div className="mb-1">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Faktur / Invoice</span>
                        <span className="font-extrabold text-lg block text-primary">{invoice_number || 'INV-DRAFT'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-600 block">
                            Tanggal: <strong>{issued_at ? formatDateSystem(issued_at, 'dd/MM/yyyy HH:mm') : formatDateSystem(new Date(), 'dd/MM/yyyy HH:mm')}</strong>
                        </span>
                        <span
                            className="font-bold text-xs uppercase px-2 py-1 border-round-md inline-block mt-1 shadow-1"
                            style={{
                                backgroundColor: isSettled ? '#dcfce7' : '#fee2e2',
                                color: isSettled ? '#15803d' : '#b91c1c',
                                border: `1.5px solid ${isSettled ? '#86efac' : '#fca5a5'}`
                            }}
                        >
                            {isSettled ? '✓ LUNAS / SETTLED' : '⚠ BELUM LUNAS'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Flex 2-Kolom Informasi Tamu & Detail Reservasi (Side-by-Side 50%) */}
            <div className="flex flex-row justify-content-between gap-3 mb-3">
                <div className="w-6 p-2 border-1 surface-border border-round-lg surface-50">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 pb-1 border-bottom-1 surface-border flex align-items-center gap-1.5">
                        <i className="pi pi-user text-primary text-xs"></i>
                        <span>Informasi Tamu</span>
                    </div>
                    <div className="text-sm font-bold text-900 mb-1">{guestName}</div>
                    <div className="text-xs text-gray-700 mb-0.5">
                        <span className="font-semibold text-gray-600">Identitas:</span> {guestIdType} - {guestIdNumber}
                    </div>
                    <div className="text-xs text-gray-700">
                        <span className="font-semibold text-gray-600">Telepon:</span> {guestPhone} | <span className="font-semibold text-gray-600">Email:</span> {guestEmail}
                    </div>
                </div>

                <div className="w-6 p-2 border-1 surface-border border-round-lg surface-50 text-right">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 pb-1 border-bottom-1 surface-border flex align-items-center justify-content-end gap-1.5">
                        <i className="pi pi-bookmark text-primary text-xs"></i>
                        <span>Detail Reservasi & Folio</span>
                    </div>
                    <div className="text-sm font-bold text-900 mb-1">
                        Folio: {summary.kode_folio || data.kode_folio || '-'} <span className="text-xs text-gray-500 font-normal">(Resv: {reservation.kode_reservasi || '-'})</span>
                    </div>
                    <div className="text-xs text-gray-700 mb-0.5">
                        <span className="font-semibold text-gray-600">Check-In:</span> {reservation.check_in_date ? formatDateSystem(reservation.check_in_date, 'dd/MM/yyyy HH:mm') : '-'}
                    </div>
                    <div className="text-xs text-gray-700">
                        <span className="font-semibold text-gray-600">Check-Out:</span> {reservation.check_out_date ? formatDateSystem(reservation.check_out_date, 'dd/MM/yyyy HH:mm') : '-'} ({summary.nights || reservation.nights || 1} Malam)
                    </div>
                </div>
            </div>

            {/* Tabel Detail Item Rincian & Ringkasan Finansial (Sejajar Rata Kiri dengan Tabel) */}
            <table className="w-full text-left border-collapse border-top-2 border-bottom-2 border-900 mb-3">
                <thead>
                    <tr className="surface-100 border-bottom-2 border-900 font-bold text-xs uppercase tracking-wider text-800">
                        <th className="py-1.5 px-2 text-center" style={{ width: '6%' }}>No</th>
                        <th className="py-1.5 px-2" style={{ width: '44%' }}>Item / Deskripsi Layanan</th>
                        <th className="py-1.5 px-2 text-center" style={{ width: '15%' }}>Durasi / Qty</th>
                        <th className="py-1.5 px-2 text-right" style={{ width: '15%' }}>Tarif Satuan</th>
                        <th className="py-1.5 px-2 text-right" style={{ width: '20%' }}>Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Baris Kamar */}
                    {rooms.map((rm: any, idx: number) => {
                        const roomNights = rm.nights || summary.nights || 1;
                        const roomRate = rm.rate_per_night || 0;
                        const roomSubtotal = rm.subtotal || (roomRate * roomNights);

                        return (
                            <tr key={`rm-${idx}`} className="border-bottom-1 border-200 text-xs">
                                <td className="py-1.5 px-2 text-center">{idx + 1}</td>
                                <td className="py-1.5 px-2">
                                    <span className="font-bold text-900 block">Sewa Kamar {rm.nomor_kamar || rm.kode_kamar}</span>
                                    <span className="text-gray-500 block">Tipe: {rm.nama_tipe_kamar || rm.nama_tipe || '-'}</span>
                                </td>
                                <td className="py-1.5 px-2 text-center font-medium">{roomNights} Malam</td>
                                <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(roomRate)}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-900">{formatCurrency(roomSubtotal)}</td>
                            </tr>
                        );
                    })}

                    {/* Baris Layanan Tambahan */}
                    {charges.map((ch: any, idx: number) => {
                        const noStart = rooms.length;
                        const itemTitle = ch.nama_charge || ch.charge_name || ch.item_name || ch.deskripsi || ch.keterangan || (ch.charge_type ? `Charge: ${ch.charge_type}` : 'Layanan Tambahan');
                        return (
                            <tr key={`ch-${idx}`} className="border-bottom-1 border-200 text-xs">
                                <td className="py-1.5 px-2 text-center">{noStart + idx + 1}</td>
                                <td className="py-1.5 px-2">
                                    <span className="font-semibold text-900 block">{itemTitle}</span>
                                    {(ch.keterangan || ch.description) && (ch.keterangan !== itemTitle && ch.description !== itemTitle) && (
                                        <span className="text-gray-500 block">{ch.keterangan || ch.description}</span>
                                    )}
                                </td>
                                <td className="py-1.5 px-2 text-center font-medium">{ch.qty || 1}</td>
                                <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(ch.unit_price || ch.amount)}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-900">{formatCurrency(ch.total_amount || ch.amount)}</td>
                            </tr>
                        );
                    })}

                    {rooms.length === 0 && charges.length === 0 && (
                        <tr>
                            <td colSpan={5} className="py-3 text-center text-gray-500 italic">
                                Tidak ada rincian transaksi tagihan.
                            </td>
                        </tr>
                    )}
                </tbody>

                {/* Footer Ringkasan Finansial (Rata Kiri Sejajar dengan Kolom Tabel) */}
                <tfoot className="border-top-2 border-900">
                    <tr className="text-xs text-gray-700 border-bottom-1 border-100">
                        <td colSpan={4} className="py-1 px-2 text-left font-medium">Subtotal Biaya (Kamar & Layanan):</td>
                        <td className="py-1 px-2 text-right font-semibold text-900">{formatCurrency(summary.subtotal)}</td>
                    </tr>

                    {/* Breakdown Pajak Resmi */}
                    {taxDetails.map((tx: any, idx: number) => (
                        <tr key={`tx-${idx}`} className="text-xs text-gray-700 border-bottom-1 border-100">
                            <td colSpan={4} className="py-1 px-2 text-left font-medium">{tx.name || tx.tax_name} ({tx.percentage || tx.tax_rate}%):</td>
                            <td className="py-1 px-2 text-right font-medium text-900">+ {formatCurrency(tx.amount || tx.tax_amount)}</td>
                        </tr>
                    ))}

                    <tr className="text-xs font-bold border-top-1 border-900 surface-50 text-900">
                        <td colSpan={4} className="py-1.5 px-2 text-left uppercase">TOTAL TAGIHAN (GRAND TOTAL):</td>
                        <td className="py-1.5 px-2 text-right text-sm text-900">{formatCurrency(summary.grand_total)}</td>
                    </tr>

                    {/* Pembayaran Masuk */}
                    {payments.map((p: any, idx: number) => (
                        <tr key={`p-${idx}`} className="text-xs text-green-700 border-bottom-1 border-100">
                            <td colSpan={4} className="py-1 px-2 text-left font-medium">
                                Bayar ({String(p.payment_method).toUpperCase()}
                                {p.reference_no ? ` - Ref: ${p.reference_no}` : ''}):
                            </td>
                            <td className="py-1 px-2 text-right font-bold">- {formatCurrency(p.amount)}</td>
                        </tr>
                    ))}

                    <tr className="text-sm font-bold border-top-2 border-bottom-2 border-900 surface-100">
                        <td colSpan={4} className="py-2 px-2 text-left uppercase text-900">SISA TAGIHAN (SALDO):</td>
                        <td className="py-2 px-2 text-right text-base" style={{ color: isSettled ? '#15803d' : '#b91c1c' }}>
                            {formatCurrency(summary.balance)}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Kolom Tanda Tangan (Format Standar Nota Hotel - Ukuran Ringkas 1 Halaman A4) */}
            <div className="grid mt-3 text-center leading-relaxed pt-2 border-top-1 border-300">
                <div className="col-4 flex flex-column justify-content-between" style={{ height: '4.5rem' }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-700">Tamu Menginap,</span>
                    <span className="font-bold border-bottom-1 border-900 pb-0.5 mx-2 text-900">
                        ( {guestName !== '-' ? guestName : '....................'} )
                    </span>
                </div>
                <div className="col-4 flex flex-column justify-content-between" style={{ height: '4.5rem' }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-700">Kasir / Front Office,</span>
                    <span className="font-bold border-bottom-1 border-900 pb-0.5 mx-2 text-900">
                        ( .................... )
                    </span>
                </div>
                <div className="col-4 flex flex-column justify-content-between" style={{ height: '4.5rem' }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-700">Manajer Operasional,</span>
                    <span className="font-bold border-bottom-1 border-900 pb-0.5 mx-2 text-900">
                        ( .................... )
                    </span>
                </div>
            </div>

            {/* Footer Catatan Nota */}
            <div className="text-center text-gray-500 text-xs mt-3 pt-2 border-top-1 border-200">
                Terima kasih atas kunjungan Anda di <strong>{hotelName}</strong>. Bukti transaksi ini sah dan diterbitkan secara otomatis oleh sistem.
            </div>
        </div>
    );
});

CetakInvoiceHotel.displayName = 'CetakInvoiceHotel';
export default CetakInvoiceHotel;
