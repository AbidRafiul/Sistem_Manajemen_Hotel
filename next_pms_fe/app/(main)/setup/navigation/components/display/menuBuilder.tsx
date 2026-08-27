'use client';

/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file menuBuilder.tsx
 * @description Komponen visual tree menu builder dengan drag-and-drop reorder (2 level)
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

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuBuilderProps, NavMenuItem } from '../interfaces';
import IconPicker from './iconPicker';

/* ─────────────── Dialog tambah / edit item ─────────────── */

interface ItemDialogProps {
    visible: boolean;
    title: string;
    initialData?: { label: string; icon: string; to: string };
    onHide: () => void;
    onSave: (data: { label: string; icon: string; to: string }) => void;
}

const ItemDialog = ({ visible, title, initialData, onHide, onSave }: ItemDialogProps) => {
    const [form, setForm] = useState({ label: '', icon: '', to: '', ...initialData });

    // Sync bila initialData berubah (edit)
    const handleOpen = () => setForm({ label: '', icon: '', to: '', ...initialData });

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" severity="secondary" outlined onClick={onHide} />
            <Button
                label="Simpan"
                icon="pi pi-check"
                severity="success"
                onClick={() => {
                    if (!form.label.trim()) return;
                    onSave(form);
                    onHide();
                }}
                disabled={!form.label.trim()}
            />
        </div>
    );

    return (
        <Dialog
            header={title}
            visible={visible}
            onShow={handleOpen}
            onHide={onHide}
            modal
            style={{ width: '100%', maxWidth: '460px' }}
            breakpoints={{ '641px': '90vw' }}
            footer={footer}
        >
            <div className="flex flex-column gap-3 pt-2">
                {/* Label */}
                <div className="flex flex-column gap-1">
                    <label className="font-semibold text-sm">
                        Label <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        value={form.label}
                        placeholder="Contoh: Master Kamar"
                        onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                        className="w-full"
                        autoFocus
                    />
                    {!form.label.trim() && (
                        <small className="p-error">Label wajib diisi</small>
                    )}
                </div>

                {/* Icon Picker */}
                <IconPicker
                    value={form.icon}
                    onChange={(ic) => setForm((p) => ({ ...p, icon: ic }))}
                />

                {/* Route URL */}
                <div className="flex flex-column gap-1">
                    <label className="font-semibold text-sm">
                        Route URL <span className="text-color-secondary text-xs font-normal">(opsional, kosongkan untuk grup)</span>
                    </label>
                    <InputText
                        value={form.to}
                        placeholder="Contoh: /master_kamar"
                        onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
                        className="w-full"
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                </div>
            </div>
        </Dialog>
    );
};

/* ─────────────── Sortable item (level 2 / leaf) ─────────────── */

interface SortableLeafProps {
    item: NavMenuItem;
    id: string;
    groupIdx: number;
    leafIdx: number;
    onEdit: (groupIdx: number, leafIdx: number) => void;
    onDelete: (groupIdx: number, leafIdx: number) => void;
}

const SortableLeaf = ({ item, id, groupIdx, leafIdx, onEdit, onDelete }: SortableLeafProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.4 : 1,
                background: 'var(--surface-50)',
                marginLeft: '1.5rem',
            }}
            className="flex align-items-center gap-2 border-1 border-200 border-round p-2 mb-1"
        >
            {/* Drag handle */}
            <span
                {...attributes}
                {...listeners}
                className="cursor-grab text-color-secondary"
                style={{ touchAction: 'none' }}
            >
                <i className="pi pi-bars" style={{ fontSize: '0.85rem' }} />
            </span>

            {item.icon && <i className={item.icon} style={{ fontSize: '0.85rem', minWidth: '1rem' }} />}
            <span className="flex-1 text-sm" style={{ wordBreak: 'break-word' }}>{item.label}</span>
            {item.to && (
                <code className="text-xs text-color-secondary" style={{ fontFamily: 'monospace' }}>
                    {item.to}
                </code>
            )}

            <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="info"
                onClick={() => onEdit(groupIdx, leafIdx)}
                className="p-0"
                style={{ width: '1.8rem', height: '1.8rem' }}
                type="button"
            />
            <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                onClick={() => onDelete(groupIdx, leafIdx)}
                className="p-0"
                style={{ width: '1.8rem', height: '1.8rem' }}
                type="button"
            />
        </div>
    );
};

/* ─────────────── Sortable group (level 1) ─────────────── */

interface SortableGroupProps {
    group: NavMenuItem;
    id: string;
    groupIdx: number;
    onEditGroup: (groupIdx: number) => void;
    onDeleteGroup: (groupIdx: number) => void;
    onAddLeaf: (groupIdx: number) => void;
    onEditLeaf: (groupIdx: number, leafIdx: number) => void;
    onDeleteLeaf: (groupIdx: number, leafIdx: number) => void;
    onLeafDragEnd: (groupIdx: number, event: DragEndEvent) => void;
}

const SortableGroup = ({
    group,
    id,
    groupIdx,
    onEditGroup,
    onDeleteGroup,
    onAddLeaf,
    onEditLeaf,
    onDeleteLeaf,
    onLeafDragEnd,
}: SortableGroupProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const leafIds = (group.items || []).map((_, i) => `leaf-${groupIdx}-${i}`);

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.4 : 1,
                background: 'var(--surface-card)',
            }}
            className="border-1 border-300 border-round mb-2"
        >
            {/* Group header */}
            <div className="flex align-items-center gap-2 p-2 border-bottom-1 border-200">
                <span
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-color-secondary"
                    style={{ touchAction: 'none' }}
                >
                    <i className="pi pi-bars" />
                </span>
                {group.icon && <i className={group.icon} />}
                <span className="font-semibold flex-1">{group.label}</span>

                <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    severity="info"
                    onClick={() => onEditGroup(groupIdx)}
                    style={{ width: '1.8rem', height: '1.8rem' }}
                    type="button"
                />
                <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    onClick={() => onDeleteGroup(groupIdx)}
                    style={{ width: '1.8rem', height: '1.8rem' }}
                    type="button"
                />
            </div>

            {/* Leaf items */}
            <div className="p-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => onLeafDragEnd(groupIdx, e)}
                >
                    <SortableContext items={leafIds} strategy={verticalListSortingStrategy}>
                        {(group.items || []).map((leaf, leafIdx) => (
                            <SortableLeaf
                                key={`leaf-${groupIdx}-${leafIdx}`}
                                id={`leaf-${groupIdx}-${leafIdx}`}
                                item={leaf}
                                groupIdx={groupIdx}
                                leafIdx={leafIdx}
                                onEdit={onEditLeaf}
                                onDelete={onDeleteLeaf}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {(group.items || []).length === 0 && (
                    <p className="text-color-secondary text-sm text-center py-2 m-0">
                        Belum ada item menu
                    </p>
                )}

                <Button
                    label="Tambah Item"
                    icon="pi pi-plus"
                    size="small"
                    text
                    severity="success"
                    onClick={() => onAddLeaf(groupIdx)}
                    className="mt-1 w-full"
                    type="button"
                />
            </div>
        </div>
    );
};

/* ─────────────── MenuBuilder utama ─────────────── */

const MenuBuilder = ({ menu, onChange }: MenuBuilderProps) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // Dialog state
    const [dialog, setDialog] = useState<{
        visible: boolean;
        type: 'addGroup' | 'editGroup' | 'addLeaf' | 'editLeaf';
        groupIdx: number;
        leafIdx: number;
        initial: { label: string; icon: string; to: string };
    }>({
        visible: false,
        type: 'addGroup',
        groupIdx: -1,
        leafIdx: -1,
        initial: { label: '', icon: '', to: '' },
    });

    const openDialog = (
        type: typeof dialog.type,
        groupIdx: number,
        leafIdx: number,
        initial?: { label: string; icon: string; to: string }
    ) => {
        setDialog({ visible: true, type, groupIdx, leafIdx, initial: initial || { label: '', icon: '', to: '' } });
    };

    const handleSave = (data: { label: string; icon: string; to: string }) => {
        const updated = structuredClone(menu);

        if (dialog.type === 'addGroup') {
            updated.push({ label: data.label, icon: data.icon, items: [] });
        } else if (dialog.type === 'editGroup') {
            updated[dialog.groupIdx] = {
                ...updated[dialog.groupIdx],
                label: data.label,
                icon: data.icon,
            };
        } else if (dialog.type === 'addLeaf') {
            const group = updated[dialog.groupIdx];
            if (!group.items) group.items = [];
            group.items.push({ label: data.label, icon: data.icon, to: data.to || undefined });
        } else if (dialog.type === 'editLeaf') {
            const leaf = updated[dialog.groupIdx].items![dialog.leafIdx];
            leaf.label = data.label;
            leaf.icon = data.icon;
            leaf.to = data.to || undefined;
        }

        onChange(updated);
    };

    const handleDeleteGroup = (groupIdx: number) => {
        const updated = structuredClone(menu);
        updated.splice(groupIdx, 1);
        onChange(updated);
    };

    const handleDeleteLeaf = (groupIdx: number, leafIdx: number) => {
        const updated = structuredClone(menu);
        updated[groupIdx].items!.splice(leafIdx, 1);
        onChange(updated);
    };

    const handleGroupDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIdx = Number(String(active.id).replace('group-', ''));
        const newIdx = Number(String(over.id).replace('group-', ''));
        onChange(arrayMove(menu, oldIdx, newIdx));
    };

    const handleLeafDragEnd = (groupIdx: number, event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIdx = Number(String(active.id).split('-')[2]);
        const newIdx = Number(String(over.id).split('-')[2]);

        const updated = structuredClone(menu);
        updated[groupIdx].items = arrayMove(updated[groupIdx].items || [], oldIdx, newIdx);
        onChange(updated);
    };

    const groupIds = menu.map((_, i) => `group-${i}`);

    const dialogTitle =
        dialog.type === 'addGroup' ? 'Tambah Grup Menu'
            : dialog.type === 'editGroup' ? 'Edit Grup Menu'
                : dialog.type === 'addLeaf' ? 'Tambah Item Menu'
                    : 'Edit Item Menu';

    return (
        <>
            <div className="flex flex-column gap-2">
                {menu.length === 0 && (
                    <div className="text-center text-color-secondary py-3 border-1 border-dashed border-300 border-round">
                        <i className="pi pi-sitemap text-3xl mb-2 block text-300" />
                        <p className="m-0 text-sm">Belum ada menu. Mulai dengan menambah grup.</p>
                    </div>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleGroupDragEnd}
                >
                    <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                        {menu.map((group, groupIdx) => (
                            <SortableGroup
                                key={`group-${groupIdx}`}
                                id={`group-${groupIdx}`}
                                group={group}
                                groupIdx={groupIdx}
                                onEditGroup={(gi) =>
                                    openDialog('editGroup', gi, -1, {
                                        label: group.label,
                                        icon: group.icon || '',
                                        to: '',
                                    })
                                }
                                onDeleteGroup={handleDeleteGroup}
                                onAddLeaf={(gi) => openDialog('addLeaf', gi, -1)}
                                onEditLeaf={(gi, li) =>
                                    openDialog('editLeaf', gi, li, {
                                        label: group.items![li].label,
                                        icon: group.items![li].icon || '',
                                        to: group.items![li].to || '',
                                    })
                                }
                                onDeleteLeaf={handleDeleteLeaf}
                                onLeafDragEnd={handleLeafDragEnd}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <Button
                    label="Tambah Grup Menu"
                    icon="pi pi-plus"
                    severity="secondary"
                    outlined
                    size="small"
                    onClick={() => openDialog('addGroup', -1, -1)}
                    className="w-full"
                    type="button"
                />
            </div>

            <ItemDialog
                visible={dialog.visible}
                title={dialogTitle}
                initialData={dialog.initial}
                onHide={() => setDialog((p) => ({ ...p, visible: false }))}
                onSave={handleSave}
            />
        </>
    );
};

export default MenuBuilder;
