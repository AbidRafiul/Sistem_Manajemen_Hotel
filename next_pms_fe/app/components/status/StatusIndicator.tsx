'use client';

import React from 'react';
import { Tooltip } from 'primereact/tooltip';

export interface StatusIndicatorProps {
    status: number | string | boolean | null | undefined;
    label?: string;
    customColor?: string;
    size?: string;
}

export const getStatusDetails = (status: any, fallbackLabel?: string) => {
    if (fallbackLabel) {
        const isNeg =
            fallbackLabel.toLowerCase().includes('tidak') ||
            fallbackLabel.toLowerCase().includes('non') ||
            fallbackLabel.toLowerCase().includes('inact');
        return {
            label: fallbackLabel,
            color: isNeg ? '#ef4444' : '#22c55e'
        };
    }

    if (
        status === 1 ||
        status === '1' ||
        status === true ||
        status === 'Aktif' ||
        status === 'Active' ||
        status === 'vacant' ||
        status === 'clean'
    ) {
        let label = 'Aktif';
        if (status === 'vacant') label = 'Vacant';
        if (status === 'clean') label = 'Clean';
        if (status === 'Active') label = 'Aktif';
        return { label, color: '#22c55e' };
    } else if (
        status === 0 ||
        status === '0' ||
        status === false ||
        status === 'Tidak Aktif' ||
        status === 'Non-Aktif' ||
        status === 'Inactive' ||
        status === 'occupied' ||
        status === 'out_of_order'
    ) {
        let label = 'Tidak Aktif';
        if (status === 'occupied') label = 'Occupied';
        if (status === 'out_of_order') label = 'Out of Order';
        if (status === 'Non-Aktif' || status === 'Tidak Aktif' || status === 'Inactive') label = 'Tidak Aktif';
        return { label, color: '#ef4444' };
    } else if (status === 'dirty' || status === 'pending') {
        let label = status === 'dirty' ? 'Dirty' : 'Pending';
        return { label, color: '#f59e0b' };
    }

    return {
        label: String(status ?? 'N/A'),
        color: '#9ca3af'
    };
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, customColor, size = '26px' }) => {
    const details = getStatusDetails(status, label);
    const displayLabel = label || details.label;
    const displayColor = customColor || details.color;

    return (
        <div className="flex justify-content-center align-items-center w-full">
            <Tooltip target=".status-indicator-tooltip" position="top" />
            <div
                className="status-indicator-tooltip cursor-pointer shadow-1 flex justify-content-center align-items-center"
                data-pr-tooltip={displayLabel}
                aria-label={`Status ${displayLabel}`}
                style={{
                    width: size,
                    height: size,
                    backgroundColor: displayColor,
                    borderRadius: '6px',
                    transition: 'transform 0.15s ease-in-out, opacity 0.15s ease-in-out'
                }}
            >
                <i className="pi pi-chevron-down text-white" style={{ fontSize: '10px' }} />
            </div>
        </div>
    );
};

export default StatusIndicator;
