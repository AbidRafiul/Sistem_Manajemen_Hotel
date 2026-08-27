'use client';

/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file iconPicker.tsx
 * @description Komponen untuk memilih icon PrimeIcons via search/grid atau input manual
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-27
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-27)
 * @version 1.0.1
 */

import { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { IconPickerProps } from '../interfaces';

const PRIME_ICONS = [
    'pi-home', 'pi-th-large', 'pi-bars', 'pi-tag', 'pi-tags',
    'pi-star', 'pi-star-fill', 'pi-heart', 'pi-heart-fill',
    'pi-user', 'pi-users', 'pi-user-plus', 'pi-user-minus', 'pi-user-edit',
    'pi-building', 'pi-briefcase', 'pi-map-marker', 'pi-map',
    'pi-calendar', 'pi-calendar-plus', 'pi-calendar-times', 'pi-calendar-minus',
    'pi-clock', 'pi-history',
    'pi-file', 'pi-file-pdf', 'pi-file-excel', 'pi-file-word',
    'pi-folder', 'pi-folder-open',
    'pi-inbox', 'pi-send', 'pi-envelope', 'pi-at',
    'pi-bell', 'pi-bell-slash',
    'pi-cog', 'pi-sliders-h', 'pi-sliders-v', 'pi-wrench', 'pi-database',
    'pi-server', 'pi-desktop', 'pi-mobile', 'pi-tablet',
    'pi-chart-bar', 'pi-chart-line', 'pi-chart-pie',
    'pi-dollar', 'pi-money-bill', 'pi-credit-card', 'pi-percentage', 'pi-shopping-cart',
    'pi-shopping-bag', 'pi-ticket', 'pi-barcode', 'pi-qrcode',
    'pi-print', 'pi-download', 'pi-upload', 'pi-cloud', 'pi-cloud-upload', 'pi-cloud-download',
    'pi-image', 'pi-images', 'pi-camera', 'pi-video',
    'pi-check', 'pi-check-circle', 'pi-times', 'pi-times-circle',
    'pi-plus', 'pi-plus-circle', 'pi-minus', 'pi-minus-circle',
    'pi-trash', 'pi-pencil', 'pi-eye', 'pi-eye-slash',
    'pi-search', 'pi-filter', 'pi-sort', 'pi-sort-up', 'pi-sort-down',
    'pi-refresh', 'pi-sync', 'pi-undo', 'pi-redo',
    'pi-arrow-up', 'pi-arrow-down', 'pi-arrow-left', 'pi-arrow-right',
    'pi-angle-up', 'pi-angle-down', 'pi-angle-left', 'pi-angle-right',
    'pi-chevron-up', 'pi-chevron-down', 'pi-chevron-left', 'pi-chevron-right',
    'pi-info-circle', 'pi-exclamation-circle', 'pi-exclamation-triangle', 'pi-question-circle',
    'pi-lock', 'pi-lock-open', 'pi-shield', 'pi-key',
    'pi-link', 'pi-external-link', 'pi-share-alt', 'pi-copy', 'pi-clone',
    'pi-list', 'pi-align-left', 'pi-align-center', 'pi-align-right', 'pi-align-justify',
    'pi-table', 'pi-id-card', 'pi-address-book',
    'pi-window-maximize', 'pi-window-minimize', 'pi-expand', 'pi-compress',
    'pi-globe', 'pi-wifi', 'pi-sitemap', 'pi-ethernet',
    'pi-car', 'pi-truck', 'pi-box', 'pi-gift', 'pi-bookmark', 'pi-bookmark-fill',
    'pi-flag', 'pi-flag-fill', 'pi-ban', 'pi-thumbs-up', 'pi-thumbs-down',
    'pi-moon', 'pi-sun', 'pi-bolt', 'pi-power-off', 'pi-sign-out', 'pi-sign-in',
];

const IconPicker = ({ value, onChange }: IconPickerProps) => {
    const op = useRef<OverlayPanel>(null);
    const [search, setSearch] = useState('');

    const filteredIcons = search
        ? PRIME_ICONS.filter((ic) => ic.includes(search.toLowerCase().replace('pi-', '')))
        : PRIME_ICONS;

    const handleSelect = (iconName: string) => {
        onChange(`pi pi-fw ${iconName}`);
        op.current?.hide();
        setSearch('');
    };

    const displayIcon = value ? value.trim() : '';

    return (
        <div className="flex flex-column gap-1 w-full">
            <label className="font-semibold text-sm">
                Icon <span className="text-color-secondary text-xs font-normal">(contoh: pi pi-fw pi-home)</span>
            </label>
            <div className="flex gap-2 align-items-center w-full">
                {/* Preview icon */}
                <div
                    className="flex align-items-center justify-content-center border-1 border-300 border-round"
                    style={{ width: '2.5rem', height: '2.5rem', minWidth: '2.5rem', background: 'var(--surface-100)' }}
                >
                    {displayIcon
                        ? <i className={displayIcon} style={{ fontSize: '1.1rem' }} />
                        : <i className="pi pi-question text-color-secondary" style={{ fontSize: '0.9rem' }} />
                    }
                </div>

                {/* Manual input */}
                <InputText
                    value={value}
                    placeholder="pi pi-fw pi-home"
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full"
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />

                {/* Browse button */}
                <Button
                    type="button"
                    icon="pi pi-th-large"
                    outlined
                    tooltip="Pilih Icon"
                    tooltipOptions={{ position: 'top' }}
                    onClick={(e) => op.current?.toggle(e)}
                    style={{ minWidth: '2.5rem' }}
                />
            </div>

            <OverlayPanel ref={op} style={{ width: '360px' }}>
                <div className="flex flex-column gap-2">
                    <InputText
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari icon... (contoh: home, user, file)"
                        className="w-full"
                        autoFocus
                    />
                    <div
                        className="flex flex-wrap gap-1"
                        style={{ maxHeight: '260px', overflowY: 'auto' }}
                    >
                        {filteredIcons.map((iconName) => (
                            <div
                                key={iconName}
                                onClick={() => handleSelect(iconName)}
                                title={`pi pi-fw ${iconName}`}
                                className="flex align-items-center justify-content-center border-round cursor-pointer"
                                style={{
                                    width: '2.2rem',
                                    height: '2.2rem',
                                    border: value === `pi pi-fw ${iconName}` ? '2px solid var(--primary-color)' : '1px solid var(--surface-300)',
                                    background: value === `pi pi-fw ${iconName}` ? 'var(--primary-50)' : 'transparent',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-200)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = value === `pi pi-fw ${iconName}` ? 'var(--primary-50)' : 'transparent')}
                            >
                                <i className={`pi ${iconName}`} style={{ fontSize: '1rem' }} />
                            </div>
                        ))}
                        {filteredIcons.length === 0 && (
                            <p className="text-color-secondary text-sm p-2">Icon tidak ditemukan</p>
                        )}
                    </div>
                </div>
            </OverlayPanel>
        </div>
    );
};

export default IconPicker;
