/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File untuk mengekspor data ke format XLSX menggunakan ExcelJS
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

import { XLSXProps } from '@/types/print-tools';
import ExcelJS from 'exceljs';
import { getNavbarLogoDataUrl } from './accPdf';
import { formatDateSystem } from '../dateTools';

const resolveColumnAlignment = (
    colIndexZeroBased: number,
    headerName: string,
    columnStyles?: Record<string, any>,
    sampleValue?: any
): 'left' | 'center' | 'right' => {
    const explicitAlign = columnStyles?.[colIndexZeroBased]?.halign;
    if (explicitAlign === 'left' || explicitAlign === 'center' || explicitAlign === 'right') {
        return explicitAlign;
    }

    const h = headerName.toLowerCase();
    if (h === 'no' || h === 'no.') return 'center';
    if (
        h.includes('status') ||
        h.includes('vip') ||
        h.includes('jenis') ||
        h.includes('kewarganegaraan') ||
        h.includes('telepon') ||
        h.includes('tanggal') ||
        h.includes('tgl') ||
        h.includes('malam') ||
        h.includes('kode') ||
        h.includes('kamar')
    ) {
        return 'center';
    }
    if (
        h.includes('total') ||
        h.includes('tarif') ||
        h.includes('harga') ||
        h.includes('biaya') ||
        h.includes('deposit') ||
        h.includes('pengeluaran') ||
        h.includes('saldo') ||
        (typeof sampleValue === 'string' && sampleValue.trim().startsWith('Rp'))
    ) {
        return 'right';
    }

    return 'left';
};

export const exportToXLSX = async <T>({
    data,
    fileName,
    removeFields = ['File' as keyof T],
    judulLaporan,
    periodeLaporan,
    companyConfig,
    columnStyles,
    adjust,
    disableHeader = false,
    disableFooter = false
}: XLSXProps<T>): Promise<void> => {
    try {
        if (!data || data.length === 0) {
            console.log('Data kosong');
            return;
        }

        const cleanedData = data.map((row) => {
            const copy = { ...(row as Record<string, any>) };
            removeFields.forEach((f) => {
                delete copy[f as string];
            });
            return copy;
        });

        const rawHeaders = Object.keys(cleanedData[0] as Record<string, any>);
        const hasNoColumn = rawHeaders.some((h) => h.trim().toLowerCase() === 'no' || h.trim().toLowerCase() === 'no.');
        const headers = hasNoColumn ? rawHeaders : ['No.', ...rawHeaders];
        const totalCols = Math.max(headers.length, 3);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = companyConfig?.msNamaPerusahaan || 'Grand Marstech PMS';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Laporan Data', {
            pageSetup: {
                paperSize: 9, // A4
                orientation: adjust?.orientation === 'landscape' ? 'landscape' : 'portrait',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                margins: {
                    left: 0.4,
                    right: 0.4,
                    top: 0.5,
                    bottom: 0.5,
                    header: 0.2,
                    footer: 0.2
                }
            },
            views: [{ showGridLines: true }]
        });

        let currentRow = 1;

        // =============================================================
        // 1. KOP DOKUMEN PERUSAHAAN + LOGO MICROVA (SEPERTI PDF)
        // =============================================================
        if (!disableHeader) {
            const namaPerusahaan = companyConfig?.msNamaPerusahaan || 'Grand Marstech Hotel & Resort';
            const alamat = companyConfig?.msAlamatPerusahaan || 'Jl. Diponegoro No. 88, Magetan, Jawa Timur';
            const telepon = companyConfig?.msTeleponPerusahaan || '0351-890123';
            const reportTitle = judulLaporan || 'Laporan Operasional Hotel';
            const reportPeriode = periodeLaporan || `Dicetak pada: ${formatDateSystem(new Date(), 'dd/MM/yyyy HH:mm')}`;

            // Sisipkan Logo Microva (/layout/images/logo.png) di Kolom A Baris 1-3
            const logoDataUrl = await getNavbarLogoDataUrl();
            const imgSource = logoDataUrl || companyConfig?.msLogoPerusahaan || '';
            if (imgSource && imgSource.startsWith('data:image')) {
                try {
                    const imageId = workbook.addImage({
                        base64: imgSource,
                        extension: 'png'
                    });
                    worksheet.addImage(imageId, {
                        tl: { col: 0.15, row: 0.18 },
                        ext: { width: 54, height: 54 }
                    });
                } catch (e) {
                    console.warn('Gagal menyisipkan logo ke Excel:', e);
                }
            }

            // Baris 1: Nama Perusahaan / Hotel
            const row1 = worksheet.getRow(1);
            row1.height = 18;
            worksheet.mergeCells(1, 2, 1, totalCols);
            const cellCompName = worksheet.getCell(1, 2);
            cellCompName.value = namaPerusahaan;
            cellCompName.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } };
            cellCompName.alignment = { vertical: 'bottom', horizontal: 'left' };

            // Baris 2: Alamat Perusahaan
            const row2 = worksheet.getRow(2);
            row2.height = 15;
            worksheet.mergeCells(2, 2, 2, totalCols);
            const cellAddress = worksheet.getCell(2, 2);
            cellAddress.value = alamat;
            cellAddress.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } };
            cellAddress.alignment = { vertical: 'middle', horizontal: 'left' };

            // Baris 3: Nomor Telepon
            const row3 = worksheet.getRow(3);
            row3.height = 15;
            worksheet.mergeCells(3, 2, 3, totalCols);
            const cellPhone = worksheet.getCell(3, 2);
            cellPhone.value = `No. Telp : ${telepon}`;
            cellPhone.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
            cellPhone.alignment = { vertical: 'top', horizontal: 'left' };

            // Baris 4: Garis Pembatas Kop Surat Ganda (Double Line seperti PDF)
            const row4 = worksheet.getRow(4);
            row4.height = 6;
            for (let c = 1; c <= totalCols; c++) {
                worksheet.getCell(4, c).border = {
                    bottom: { style: 'double', color: { argb: 'FF1E293B' } }
                };
            }

            // Baris 5: Spacer
            const row5 = worksheet.getRow(5);
            row5.height = 8;

            // Baris 6: Judul Laporan (Centered)
            const row6 = worksheet.getRow(6);
            row6.height = 22;
            worksheet.mergeCells(6, 1, 6, totalCols);
            const cellTitle = worksheet.getCell(6, 1);
            cellTitle.value = reportTitle;
            cellTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } };
            cellTitle.alignment = { vertical: 'middle', horizontal: 'center' };

            // Baris 7: Sub-judul Periode Laporan (Centered)
            const row7 = worksheet.getRow(7);
            row7.height = 16;
            worksheet.mergeCells(7, 1, 7, totalCols);
            const cellPeriode = worksheet.getCell(7, 1);
            cellPeriode.value = reportPeriode;
            cellPeriode.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF64748B' } };
            cellPeriode.alignment = { vertical: 'middle', horizontal: 'center' };

            // Baris 8: Spacer sebelum Kop Daftar Tabel
            const row8 = worksheet.getRow(8);
            row8.height = 8;

            currentRow = 9;
        }

        // =============================================================
        // 2. KOP DAFTAR TABEL (HEADER) & BARIS DATA
        // =============================================================
        const headerRowIndex = currentRow;
        const headerRow = worksheet.getRow(headerRowIndex);
        headerRow.height = 26;

        headers.forEach((headerText, idx) => {
            const cell = headerRow.getCell(idx + 1);
            cell.value = headerText;
            cell.font = {
                name: 'Calibri',
                size: 10,
                bold: true,
                color: { argb: 'FF0F172A' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF1F5F9' } // Slate-100 senada dengan Kop Tabel PDF
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF94A3B8' } },
                bottom: { style: 'medium', color: { argb: 'FF334155' } },
                left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
        });

        currentRow++;

        // Baris Data
        cleanedData.forEach((rowObj, rowIdx) => {
            const excelRow = worksheet.getRow(currentRow);
            excelRow.height = 20;

            const isEvenRow = rowIdx % 2 === 1;
            const rowValues = hasNoColumn
                ? rawHeaders.map((key) => rowObj[key] ?? '')
                : [rowIdx + 1, ...rawHeaders.map((key) => rowObj[key] ?? '')];

            rowValues.forEach((val, colIdx) => {
                const cell = excelRow.getCell(colIdx + 1);
                cell.value = val;
                cell.font = {
                    name: 'Calibri',
                    size: 9.5,
                    color: { argb: 'FF1E293B' }
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: isEvenRow ? 'FFF8FAFC' : 'FFFFFFFF' }
                };

                const hAlign = resolveColumnAlignment(colIdx, headers[colIdx], columnStyles, val);
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: hAlign,
                    wrapText: false
                };

                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            });

            currentRow++;
        });

        const lastDataRowIndex = currentRow - 1;

        // Aktifkan AutoFilter & Freeze Panes pada Kop Daftar Tabel
        worksheet.autoFilter = {
            from: { row: headerRowIndex, column: 1 },
            to: { row: lastDataRowIndex, column: headers.length }
        };
        worksheet.views = [
            {
                state: 'frozen',
                xSplit: 0,
                ySplit: headerRowIndex,
                showGridLines: true
            }
        ];

        // =============================================================
        // 3. FOOTER PENGESAHAN / TANDA TANGAN (SEPERTI PDF)
        // =============================================================
        if (!disableFooter) {
            const kotaPerusahaan = companyConfig?.msKotaPerusahaan || 'Magetan';
            const namaPerusahaan = companyConfig?.msNamaPerusahaan || 'Grand Marstech Hotel & Resort';
            const jabatan1 = adjust?.position1 || 'Petugas Verifikasi';
            const jabatan2 = adjust?.position2 || '';
            const namaPetugas1 = adjust?.officerName1 ? `( ${adjust.officerName1} )` : '( .......................................... )';
            const namaPetugas2 = adjust?.officerName2 ? `( ${adjust.officerName2} )` : '( .......................................... )';

            const footerStartRow = lastDataRowIndex + 3;
            const leftEndCol = Math.min(2, totalCols);
            const rightStartCol = Math.max(totalCols - 1, leftEndCol + 1);

            // Baris 1 Footer: Mengetahui & Kota, Tanggal
            worksheet.mergeCells(footerStartRow, 1, footerStartRow, leftEndCol);
            const fLeft1 = worksheet.getCell(footerStartRow, 1);
            fLeft1.value = adjust?.position1 ? 'Mengetahui,' : 'Disetujui Oleh,';
            fLeft1.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
            fLeft1.alignment = { horizontal: 'center', vertical: 'middle' };

            if (rightStartCol <= totalCols) {
                worksheet.mergeCells(footerStartRow, rightStartCol, footerStartRow, totalCols);
                const fRight1 = worksheet.getCell(footerStartRow, rightStartCol);
                fRight1.value = `${kotaPerusahaan}, ${formatDateSystem(new Date())}`;
                fRight1.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
                fRight1.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            // Baris 2 Footer: Jabatan 1 & Nama Perusahaan
            worksheet.mergeCells(footerStartRow + 1, 1, footerStartRow + 1, leftEndCol);
            const fLeft2 = worksheet.getCell(footerStartRow + 1, 1);
            fLeft2.value = jabatan1;
            fLeft2.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };
            fLeft2.alignment = { horizontal: 'center', vertical: 'middle' };

            if (rightStartCol <= totalCols) {
                worksheet.mergeCells(footerStartRow + 1, rightStartCol, footerStartRow + 1, totalCols);
                const fRight2 = worksheet.getCell(footerStartRow + 1, rightStartCol);
                fRight2.value = namaPerusahaan;
                fRight2.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };
                fRight2.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            // Baris Nama Petugas (setelah jarak tanda tangan 3 baris)
            const signRow = footerStartRow + 5;
            worksheet.mergeCells(signRow, 1, signRow, leftEndCol);
            const fSignLeft = worksheet.getCell(signRow, 1);
            fSignLeft.value = namaPetugas1;
            fSignLeft.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
            fSignLeft.alignment = { horizontal: 'center', vertical: 'middle' };

            if (rightStartCol <= totalCols) {
                worksheet.mergeCells(signRow, rightStartCol, signRow, totalCols);
                const fSignRight = worksheet.getCell(signRow, rightStartCol);
                fSignRight.value = namaPetugas2;
                fSignRight.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
                fSignRight.alignment = { horizontal: 'center', vertical: 'middle' };

                if (jabatan2) {
                    worksheet.mergeCells(signRow + 1, rightStartCol, signRow + 1, totalCols);
                    const fPosRight = worksheet.getCell(signRow + 1, rightStartCol);
                    fPosRight.value = jabatan2;
                    fPosRight.font = { name: 'Calibri', size: 9, color: { argb: 'FF475569' } };
                    fPosRight.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            }
        }

        // =============================================================
        // 4. AUTO-FIT LEBAR KOLOM PROPORSIONAL
        // =============================================================
        headers.forEach((header, index) => {
            const column = worksheet.getColumn(index + 1);
            if (index === 0 && (header.toLowerCase() === 'no' || header.toLowerCase() === 'no.')) {
                // Kolom A memuat Logo Microva (54px) dan Nomor Urut
                column.width = 9.5;
                return;
            }

            let maxLen = header.length;
            cleanedData.forEach((row: any) => {
                const cellValue = row[header];
                if (cellValue !== undefined && cellValue !== null) {
                    const cellLen = cellValue.toString().length;
                    if (cellLen > maxLen) {
                        maxLen = cellLen;
                    }
                }
            });

            column.width = Math.min(Math.max(maxLen + 5, 14), 45);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const downloadUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

        document.body.appendChild(anchor);
        anchor.click();

        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Error ExcelJS: ', error);
    }
};
