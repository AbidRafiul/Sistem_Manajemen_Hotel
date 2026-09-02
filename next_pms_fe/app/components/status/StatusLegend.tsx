'use client';

import React from 'react';

export interface StatusItem {
    label: string;
    color?: string;
    status?: any;
}

export interface StatusLegendProps {
    items?: StatusItem[];
    title?: string;
}

const defaultItems: StatusItem[] = [
    { label: 'Aktif', color: '#22c55e' },
    { label: 'Tidak Aktif', color: '#ef4444' }
];

const StatusLegend: React.FC<StatusLegendProps> = ({ items = defaultItems, title = 'KETERANGAN STATUS:' }) => {
    return (
        <div className="flex align-items-center gap-3 p-2 px-3 mb-3 border-1 surface-border border-round surface-50 text-sm flex-wrap">
            <div className="flex align-items-center gap-2 font-semibold text-color-secondary">
                <i className="pi pi-info-circle text-blue-500"></i>
                <span>{title}</span>
            </div>
            <div className="flex align-items-center gap-4 flex-wrap">
                {items.map((item, idx) => {
                    const color =
                        item.color ||
                        (item.label.toLowerCase().includes('tidak') || item.label.toLowerCase().includes('non')
                            ? '#ef4444'
                            : '#22c55e');
                    return (
                        <div key={idx} className="flex align-items-center gap-2">
                            <span
                                className="inline-block shadow-1"
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: color,
                                    borderRadius: '4px'
                                }}
                            />
                            <span className="font-semibold text-color text-xs">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusLegend;
