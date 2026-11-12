/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File untuk menampilkan header, footer, dan informasi halaman pada dokumen PDF menggunakan jsPDF dan autoTable.
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-08-03)
 * @version 1.0.1
 */

import { AddPageInfoProps, FooterProps, HeaderLaporanProps } from '@/types/print-tools';
import { formatDateSystem } from '../dateTools';
import autoTable from 'jspdf-autotable';
import { CompanyConfig } from '@/types/general';

const NAVBAR_LOGO_PATH = '/layout/images/logo.png';
let cachedNavbarLogoDataUrl: string | null = null;

export const getNavbarLogoDataUrl = async (): Promise<string | null> => {
    if (cachedNavbarLogoDataUrl) {
        return cachedNavbarLogoDataUrl;
    }

    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const response = await fetch(NAVBAR_LOGO_PATH);
        if (response.ok) {
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error('Gagal membaca blob logo'));
                    }
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
            });
            cachedNavbarLogoDataUrl = dataUrl;
            return dataUrl;
        }
    } catch (err) {
        console.warn('Gagal memuat logo via fetch, mencoba fallback Image:', err);
    }

    return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth || 128;
                canvas.height = image.naturalHeight || 128;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(image, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    cachedNavbarLogoDataUrl = dataUrl;
                    resolve(dataUrl);
                    return;
                }
            } catch (e) {
                console.warn('Fallback canvas logo gagal:', e);
            }
            resolve(null);
        };
        image.onerror = () => resolve(null);
        image.src = NAVBAR_LOGO_PATH;
    });
};

export const HeaderLaporan = async ({ doc, marginTopInMm = 10, marginLeftInMm = 10, marginRightInMm = 10, judulLaporan, periodeLaporan, companyConfig }: HeaderLaporanProps & { companyConfig: CompanyConfig | null }): Promise<void> => {
    const pageWidth = doc.internal.pageSize.width;
    const namaPerusahaan = companyConfig?.msNamaPerusahaan || 'Grand Marstech Hotel & Resort';
    const alamat = companyConfig?.msAlamatPerusahaan || 'Jl. Diponegoro No. 88, Magetan, Jawa Timur';
    const telepon = companyConfig?.msTeleponPerusahaan || '-';

    const topY = marginTopInMm;
    const layout = {
        imageSize: 15.5,
        imageX: marginLeftInMm,
        imageY: topY,
        textStartX: marginLeftInMm + 19,
        companyNameY: topY + 4.8,
        addressY: topY + 9.8,
        phoneY: topY + 14.3,
        lineY: topY + 19,
        titleBaseY: topY + 27.5,
        periodeBaseY: topY + 33
    };

    // Selalu gunakan logo utama Microva dari navbar (/layout/images/logo.png)
    const logoDataUrl = await getNavbarLogoDataUrl();
    const imgSource = logoDataUrl || companyConfig?.msLogoPerusahaan || '';

    if (imgSource?.trim()) {
        try {
            doc.addImage(imgSource, 'PNG', layout.imageX, layout.imageY, layout.imageSize, layout.imageSize);
        } catch (error: any) {
            console.warn('Logo gagal ditambahkan : ', error?.message);
        }
    }

    // Identitas Perusahaan / Kop Surat (Rata Kiri di Samping Logo Microva)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);
    doc.text(namaPerusahaan ?? '', layout.textStartX, layout.companyNameY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(alamat ?? '', layout.textStartX, layout.addressY);
    doc.text(`No. Telp : ${telepon ?? '-'}`, layout.textStartX, layout.phoneY);

    // Garis Kop Surat Ganda (Sejajar Penuh dengan Margin Tabel Kiri & Kanan)
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.7);
    doc.line(marginLeftInMm, layout.lineY, pageWidth - marginRightInMm, layout.lineY);

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.line(marginLeftInMm, layout.lineY + 1, pageWidth - marginRightInMm, layout.lineY + 1);

    // Judul Laporan & Subjudul Periode
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(judulLaporan || '', pageWidth / 2, layout.titleBaseY, { align: 'center' });

    if (periodeLaporan) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(periodeLaporan, pageWidth / 2, layout.periodeBaseY, { align: 'center' });
    }

    doc.setTextColor(0, 0, 0);
};

export const AddPageInfo = ({ doc, userName, marginRightInMm = 10 }: AddPageInfoProps): void => {
    const options: Intl.DateTimeFormatOptions = {
        hour12: false,
        timeZone: 'Asia/Jakarta'
    };

    const currentDate = new Date().toLocaleString('id-ID', options);
    const pageInfo = `Page ${doc.internal.getCurrentPageInfo().pageNumber}`;
    const userInfo = `${userName} | ${currentDate}`;

    const { width: pageWidth, height: pageHeight } = doc.internal.pageSize;

    const pageTextX = pageWidth - marginRightInMm;
    const pageTextY = pageHeight - 10;

    doc.setFontSize(8);
    doc.text(pageInfo, pageTextX, pageTextY, { align: 'right' });
    doc.text(userInfo, pageTextX, pageTextY + 5, { align: 'right' });
};

export const Footer = async ({ doc, marginLeft, marginTop, marginRight, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2, lastY, companyConfig }: FooterProps & { companyConfig: CompanyConfig | null }) => {
    const kotaPerusahaan = companyConfig?.msKotaPerusahaan || '-';
    const namaPerusahaan = companyConfig?.msNamaPerusahaan || 'Smart-Fix';
    const today = new Date();

    const vaData = [
        [jabatan1 ? 'Mengetahui,' : 'Disetujui Oleh,', '', `${kotaPerusahaan}, ${formatDateSystem(today)}`],
        [jabatan1 || 'Petugas Verifikasi', '', namaPerusahaan],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
        [namaPetugas1 ? `( ${namaPetugas1} )` : '( .......................................... )', '', namaPetugas2 ? `( ${namaPetugas2} )` : '( .......................................... )'],
        [namaPetugas1 ? '' : '', '', jabatan2 || '']
    ];

    const finalY = lastY ?? doc?.autoTable.previous?.finalY ?? 20;

    autoTable(doc, {
        body: vaData,
        startY: finalY + 15,
        theme: 'plain',
        margin: {
            top: marginTop,
            left: marginLeft,
            right: marginRight
        },
        styles: {
            fontSize: 9.5,
            valign: 'middle',
            textColor: [71, 85, 105],
            cellPadding: 1,
            font: 'helvetica'
        },

        columnStyles: {
            0: { cellWidth: 65, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 65, halign: 'center' }
        },
        didParseCell: (data) => {
            if (data.row.index === 5) {
                // data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [15, 23, 42];
                data.cell.styles.fontSize = 10;
            }

            if (data.row.index <= 1) {
                // data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [30, 41, 59]; // Slate-800
            }
        }
    });
};
