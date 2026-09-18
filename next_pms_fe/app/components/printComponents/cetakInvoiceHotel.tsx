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
    const isSettled = summary.is_settled ?? false;

    return (
        <div ref={ref} className="p-5 text-gray-900 bg-white" style={{ fontFamily: 'monospace', fontSize: '12px', minWidth: '750px' }}>
            {/* Header Nota Invoice */}
            <div className="flex justify-content-between border-bottom-2 border-900 pb-3 mb-4">
                <div>
                    <h3 className="text-xl font-bold tracking-wide uppercase m-0">
                        {hotel.nama_hotel || 'SISTEM MANAJEMEN HOTEL'}
                    </h3>
                    <span className="text-gray-600 text-xs block mt-1">
                        {hotel.alamat || 'Hotel & Hospitality Management System'}
                    </span>
                    <span className="text-gray-500 text-xs block">
                        Telp: {hotel.telepon || '-'} | Email: {hotel.email || '-'}
                    </span>
                </div>
                <div className="text-right flex flex-column justify-content-between">
                    <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider block">Faktur / Invoice</span>
                        <span className="font-bold text-base block text-900">{invoice_number || 'INV-DRAFT'}</span>
                    </div>
                    <div className="mt-2">
                        <span className="text-xs text-gray-500 block">
                            Tanggal: {issued_at ? formatDateSystem(issued_at, 'dd/MM/yyyy HH:mm') : formatDateSystem(new Date(), 'dd/MM/yyyy HH:mm')}
                        </span>
                        <span
                            className="font-bold text-xs uppercase px-2 py-1 border-round inline-block mt-1"
                            style={{
                                backgroundColor: isSettled ? '#dcfce7' : '#fee2e2',
                                color: isSettled ? '#15803d' : '#b91c1c',
                                border: `1px solid ${isSettled ? '#86efac' : '#fca5a5'}`
                            }}
                        >
                            {isSettled ? '✓ LUNAS / SETTLED' : '⚠ BELUM LUNAS'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Informasi Tamu & Menginap */}
            <div className="grid mb-4 leading-relaxed border-bottom-1 border-300 pb-3">
                <div className="col-6 flex flex-column gap-1">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Informasi Tamu</span>
                    <span className="text-sm font-bold text-900">{guest.guest_name || '-'}</span>
                    <span className="text-xs text-gray-600">
                        Identitas: {guest.guest_id_type ? String(guest.guest_id_type).toUpperCase() : 'ID'} - {guest.guest_id_number || '-'}
                    </span>
                    <span className="text-xs text-gray-600">
                        Telepon: {guest.guest_phone || '-'} | Email: {guest.guest_email || '-'}
                    </span>
                </div>
                <div className="col-6 flex flex-column gap-1 text-right">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Detail Reservasi & Folio</span>
                    <span className="text-sm font-bold text-900">
                        Folio: {summary.kode_folio || '-'} (Resv: {reservation.kode_reservasi || '-'})
                    </span>
                    <span className="text-xs text-gray-600">
                        Check-In: {formatDateSystem(reservation.check_in_date, 'dd/MM/yyyy HH:mm')}
                    </span>
                    <span className="text-xs text-gray-600">
                        Check-Out: {formatDateSystem(reservation.check_out_date, 'dd/MM/yyyy HH:mm')} ({summary.nights || 1} Malam)
                    </span>
                </div>
            </div>

            {/* Tabel Detail Item Rincian */}
            <table className="w-full text-left border-collapse border-top-2 border-bottom-2 border-900 mb-4">
                <thead>
                    <tr className="border-bottom-1 border-900 font-bold text-xs uppercase tracking-wider">
                        <th className="py-2 text-center" style={{ width: '5%' }}>No</th>
                        <th className="py-2" style={{ width: '45%' }}>Item / Deskripsi Layanan</th>
                        <th className="py-2 text-center" style={{ width: '15%' }}>Durasi / Qty</th>
                        <th className="py-2 text-right" style={{ width: '15%' }}>Tarif Satuan</th>
                        <th className="py-2 text-right" style={{ width: '20%' }}>Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Baris Kamar */}
                    {(breakdown.rooms || []).map((rm: any, idx: number) => (
                        <tr key={`rm-${idx}`} className="border-bottom-1 border-100 text-xs">
                            <td className="py-2 text-center">{idx + 1}</td>
                            <td className="py-2">
                                <span className="font-bold">Sewa Kamar {rm.nomor_kamar}</span>
                                <span className="text-gray-500 block">Tipe: {rm.nama_tipe || '-'}</span>
                            </td>
                            <td className="py-2 text-center">{summary.nights || 1} Malam</td>
                            <td className="py-2 text-right">{formatCurrency(rm.rate_per_night)}</td>
                            <td className="py-2 text-right font-bold">{formatCurrency(rm.subtotal || rm.rate_per_night)}</td>
                        </tr>
                    ))}

                    {/* Baris Layanan Tambahan */}
                    {(breakdown.charges || []).map((ch: any, idx: number) => {
                        const noStart = (breakdown.rooms || []).length;
                        return (
                            <tr key={`ch-${idx}`} className="border-bottom-1 border-100 text-xs">
                                <td className="py-2 text-center">{noStart + idx + 1}</td>
                                <td className="py-2">
                                    <span className="font-semibold">{ch.nama_charge}</span>
                                    {ch.keterangan && <span className="text-gray-500 block">{ch.keterangan}</span>}
                                </td>
                                <td className="py-2 text-center">{ch.qty}</td>
                                <td className="py-2 text-right">{formatCurrency(ch.unit_price)}</td>
                                <td className="py-2 text-right font-bold">{formatCurrency(ch.total_amount)}</td>
                            </tr>
                        );
                    })}

                    {(!breakdown.rooms || breakdown.rooms.length === 0) && (!breakdown.charges || breakdown.charges.length === 0) && (
                        <tr>
                            <td colSpan={5} className="py-3 text-center text-gray-500">
                                Tidak ada rincian transaksi tagihan.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Ringkasan Finansial & Pajak */}
            <div className="grid justify-content-end mb-4">
                <div className="col-12 md:col-6">
                    <div className="flex flex-column gap-1 text-xs">
                        <div className="flex justify-content-between py-1">
                            <span className="text-gray-600">Subtotal Biaya (Kamar & Fasilitas):</span>
                            <span className="font-semibold">{formatCurrency(summary.subtotal)}</span>
                        </div>

                        {/* Breakdown Pajak Resmi */}
                        {(breakdown.tax_details || []).map((tx: any, idx: number) => (
                            <div key={`tx-${idx}`} className="flex justify-content-between py-1 text-gray-600">
                                <span>{tx.tax_name} ({tx.tax_rate}%):</span>
                                <span>+ {formatCurrency(tx.tax_amount)}</span>
                            </div>
                        ))}

                        <div className="flex justify-content-between py-1 border-top-1 border-900 font-bold text-sm">
                            <span className="uppercase">Total Tagihan (Grand Total):</span>
                            <span className="text-900">{formatCurrency(summary.grand_total)}</span>
                        </div>

                        {/* Pembayaran Masuk */}
                        {(breakdown.payments || []).map((p: any, idx: number) => (
                            <div key={`p-${idx}`} className="flex justify-content-between py-1 text-green-700">
                                <span>
                                    Bayar ({String(p.payment_method).toUpperCase()}
                                    {p.reference_no ? ` - Ref: ${p.reference_no}` : ''}):
                                </span>
                                <span className="font-semibold">- {formatCurrency(p.amount)}</span>
                            </div>
                        ))}

                        <div className="flex justify-content-between py-2 border-top-2 border-900 font-bold text-base mt-1">
                            <span>SISA TAGIHAN (SALDO):</span>
                            <span style={{ color: isSettled ? '#15803d' : '#b91c1c' }}>
                                {formatCurrency(summary.balance)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kolom Tanda Tangan (Format Standar Nota) */}
            <div className="grid mt-5 text-center leading-relaxed pt-2 border-top-1 border-300">
                <div className="col-4 flex flex-column justify-content-between h-7rem">
                    <span className="text-xs font-semibold uppercase tracking-wider">Tamu Menginap,</span>
                    <span className="font-bold border-bottom-1 border-900 pb-1 mx-3">
                        ( {guest.guest_name || '....................'} )
                    </span>
                </div>
                <div className="col-4 flex flex-column justify-content-between h-7rem">
                    <span className="text-xs font-semibold uppercase tracking-wider">Kasir / Front Office,</span>
                    <span className="font-bold border-bottom-1 border-900 pb-1 mx-3">
                        ( .................... )
                    </span>
                </div>
                <div className="col-4 flex flex-column justify-content-between h-7rem">
                    <span className="text-xs font-semibold uppercase tracking-wider">Manajer Operasional,</span>
                    <span className="font-bold border-bottom-1 border-900 pb-1 mx-3">
                        ( .................... )
                    </span>
                </div>
            </div>

            {/* Footer Catatan Nota */}
            <div className="text-center text-gray-500 text-xs mt-4 pt-2 border-top-1 border-100">
                Terima kasih atas kunjungan Anda di {hotel.nama_hotel || 'Hotel Kami'}. Bukti transaksi ini sah dan diterbitkan secara otomatis oleh sistem.
            </div>
        </div>
    );
});

CetakInvoiceHotel.displayName = 'CetakInvoiceHotel';
export default CetakInvoiceHotel;
