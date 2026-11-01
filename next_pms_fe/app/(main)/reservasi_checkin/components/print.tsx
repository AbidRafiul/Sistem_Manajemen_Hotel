'use client';

import PreviewCustom from '@/app/components/printComponents/previewCustom';
import { AddPageInfo } from '@/lib/tools/printTools/accPdf';
import { CustomTableParams, DataRekap } from '@/types/print-tools';
import autoTable from 'jspdf-autotable';
import { useConfig } from '@/layout/context/configcontext';
import { useSession } from 'next-auth/react';

interface PrintProps {
    dataRekap: DataRekap;
    setDataRekap: React.Dispatch<React.SetStateAction<DataRekap>>;
    toast: any;
}

const Print = ({ dataRekap, setDataRekap, toast }: PrintProps) => {
    const { config } = useConfig();
    const { data: session } = useSession();

    const handleCustomTable = async ({ doc, marginTopInMm = 10, marginLeftInMm = 10, marginRightInMm = 10, marginBottomInMm = 10 }: CustomTableParams) => {
        let y = marginTopInMm;

        const userName = session?.user?.username || (session?.user as any)?.name || 'Admin';
        if (!Array.isArray(dataRekap.data) || dataRekap.data.length === 0) return;

        const vaData1 = dataRekap.data;
        const rawHeaders = Object.keys(vaData1[0]);
        const tableHead1 = ['No.', ...rawHeaders];
        const tableData1 = vaData1.map((row, index) => [index + 1, ...rawHeaders.map((key) => row[key])]);

        autoTable(doc, {
            startY: 43 + y,
            head: [tableHead1],
            body: tableData1,
            theme: 'grid',
            margin: {
                top: marginTopInMm,
                left: marginLeftInMm,
                right: marginRightInMm,
                bottom: marginBottomInMm + 10
            },
            styles: {
                lineColor: [220, 220, 220],
                lineWidth: 0.3,
                fillColor: [255, 255, 255],
                textColor: [30, 41, 59],
                fontSize: 7.5,
                cellPadding: 3,
                valign: 'middle'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 8 },
                ...dataRekap?.columnStyles
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [15, 23, 42],
                fontStyle: 'bold',
                halign: 'center',
                lineColor: [220, 220, 220],
                lineWidth: 0.3
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255]
            },
            didDrawPage: () => {
                AddPageInfo({ doc, userName, marginRightInMm });
            }
        });

        const finalY = (doc as any).lastAutoTable?.finalY || (doc as any).previousAutoTable?.finalY || y;
        y = finalY;

        return y;
    };

    return (
        <PreviewCustom
            dataRekap={dataRekap}
            setDataRekap={setDataRekap}
            toast={toast}
            handleCustomTable={handleCustomTable}
            pdfOnly={false}
            companyConfig={config}
        />
    );
};

export default Print;
