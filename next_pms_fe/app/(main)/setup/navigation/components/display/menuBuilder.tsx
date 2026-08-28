'use client';

/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file menuBuilder.tsx
 * @description Komponen visual tree menu builder dengan drag-and-drop N-level (PrimeReact Tree)
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-28
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-28)
 * @version 2.0.0
 */

import { useState, useMemo } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Tree, TreeDragDropEvent } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
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

    const handleOpen = () => setForm({ label: '', icon: '', to: '', ...initialData });

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" severity="secondary" outlined onClick={onHide} type="button" />
            <Button
                label="Simpan"
                icon="pi pi-check"
                severity="success"
                type="button"
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

                <IconPicker
                    value={form.icon}
                    onChange={(ic) => setForm((p) => ({ ...p, icon: ic }))}
                />

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

/* ─────────────── Helper Functions ─────────────── */

const convertToTreeNodes = (items: NavMenuItem[], parentKey: string = ''): TreeNode[] => {
    return items.map((item, index) => {
        const key = parentKey ? `${parentKey}-${index}` : `${index}`;
        return {
            key,
            label: item.label,
            icon: item.icon,
            data: item.to,
            children: item.items ? convertToTreeNodes(item.items, key) : [],
            expanded: true // Expand all by default in builder
        };
    });
};

const convertToNavMenuItems = (nodes: TreeNode[]): NavMenuItem[] => {
    return nodes.map((node) => {
        const item: NavMenuItem = {
            label: node.label as string,
            icon: (node.icon as string) || undefined,
        };
        if (node.data) {
            item.to = node.data;
        }
        if (node.children && node.children.length > 0) {
            item.items = convertToNavMenuItems(node.children);
        }
        return item;
    });
};

const findNodeByKey = (nodes: TreeNode[], key: string): TreeNode | null => {
    for (const node of nodes) {
        if (node.key === key) return node;
        if (node.children) {
            const found = findNodeByKey(node.children, key);
            if (found) return found;
        }
    }
    return null;
};

/* ─────────────── MenuBuilder utama ─────────────── */

const MenuBuilder = ({ menu, onChange }: MenuBuilderProps) => {
    const nodes = useMemo(() => convertToTreeNodes(menu), [menu]);

    const [dialog, setDialog] = useState<{
        visible: boolean;
        type: 'addRoot' | 'addChild' | 'edit';
        targetKey: string | null;
        initial: { label: string; icon: string; to: string };
    }>({
        visible: false,
        type: 'addRoot',
        targetKey: null,
        initial: { label: '', icon: '', to: '' },
    });

    const openDialog = (
        type: typeof dialog.type,
        targetKey: string | null,
        initial?: { label: string; icon: string; to: string }
    ) => {
        setDialog({ visible: true, type, targetKey, initial: initial || { label: '', icon: '', to: '' } });
    };

    const handleSave = (data: { label: string; icon: string; to: string }) => {
        const updatedNodes = structuredClone(nodes);

        if (dialog.type === 'addRoot') {
            updatedNodes.push({
                key: `new-${Date.now()}`,
                label: data.label,
                icon: data.icon,
                data: data.to,
                children: []
            });
        } else if (dialog.type === 'addChild' && dialog.targetKey) {
            const targetNode = findNodeByKey(updatedNodes, dialog.targetKey);
            if (targetNode) {
                if (!targetNode.children) targetNode.children = [];
                targetNode.children.push({
                    key: `new-${Date.now()}`,
                    label: data.label,
                    icon: data.icon,
                    data: data.to,
                    children: []
                });
            }
        } else if (dialog.type === 'edit' && dialog.targetKey) {
            const targetNode = findNodeByKey(updatedNodes, dialog.targetKey);
            if (targetNode) {
                targetNode.label = data.label;
                targetNode.icon = data.icon;
                targetNode.data = data.to;
            }
        }

        onChange(convertToNavMenuItems(updatedNodes));
    };

    const handleDelete = (key: string) => {
        const updatedNodes = structuredClone(nodes);

        const deleteNode = (nodeList: TreeNode[]) => {
            const index = nodeList.findIndex(n => n.key === key);
            if (index !== -1) {
                nodeList.splice(index, 1);
                return true;
            }
            for (const node of nodeList) {
                if (node.children && deleteNode(node.children)) {
                    return true;
                }
            }
            return false;
        };

        deleteNode(updatedNodes);
        onChange(convertToNavMenuItems(updatedNodes));
    };

    const onDragDrop = (e: TreeDragDropEvent) => {
        // e.value contains the new array of TreeNodes after drop
        onChange(convertToNavMenuItems(e.value as TreeNode[]));
    };

    const nodeTemplate = (node: TreeNode, options: any) => {
        return (
            <div className="flex align-items-center justify-content-between w-full" style={{ minWidth: '100%' }}>
                <div className="flex align-items-center gap-2">
                    <span className="font-medium text-sm">{node.label}</span>
                    {node.data && (
                        <code className="text-xs text-color-secondary ml-2 border-1 border-300 p-1 border-round surface-100" style={{ fontFamily: 'monospace' }}>
                            {node.data}
                        </code>
                    )}
                </div>
                <div className="flex align-items-center ml-4 gap-1">
                    <Button
                        icon="pi pi-plus"
                        text
                        rounded
                        size="small"
                        severity="success"
                        tooltip="Tambah Submenu"
                        tooltipOptions={{ position: 'top' }}
                        className="p-0 h-2rem w-2rem"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDialog('addChild', node.key as string);
                        }}
                    />
                    <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        size="small"
                        severity="info"
                        tooltip="Edit"
                        tooltipOptions={{ position: 'top' }}
                        className="p-0 h-2rem w-2rem"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDialog('edit', node.key as string, {
                                label: node.label as string,
                                icon: (node.icon as string) || '',
                                to: (node.data as string) || ''
                            });
                        }}
                    />
                    <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        size="small"
                        severity="danger"
                        tooltip="Hapus"
                        tooltipOptions={{ position: 'top' }}
                        className="p-0 h-2rem w-2rem"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(node.key as string);
                        }}
                    />
                </div>
            </div>
        );
    };

    const dialogTitle =
        dialog.type === 'addRoot' ? 'Tambah Menu Utama'
            : dialog.type === 'addChild' ? 'Tambah Submenu'
                : 'Edit Menu';

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Tambahan CSS untuk membuat garis panduan / Tree Lines */
                .custom-menu-tree .p-treenode-children {
                    border-left: 1px dashed var(--surface-400);
                    margin-left: 1.15rem;
                    padding-left: 0.85rem;
                }
                .custom-menu-tree .p-treenode-content {
                    padding-top: 0.5rem;
                    padding-bottom: 0.5rem;
                    border-radius: 6px;
                }
                .custom-menu-tree .p-treenode-content:hover {
                    background: var(--surface-100);
                }
                `
            }} />

            <div className="flex flex-column gap-2">
                {nodes.length === 0 && (
                    <div className="text-center text-color-secondary py-3 border-1 border-dashed border-300 border-round mb-2">
                        <i className="pi pi-sitemap text-3xl mb-2 block text-300" />
                        <p className="m-0 text-sm">Belum ada menu. Mulai dengan menambah menu utama.</p>
                    </div>
                )}

                {nodes.length > 0 && (
                    <div className="border-1 border-300 border-round p-2 surface-card mb-2" style={{ minHeight: '200px' }}>
                        <Tree 
                            value={nodes} 
                            dragdropScope="menu-builder" 
                            onDragDrop={onDragDrop} 
                            nodeTemplate={nodeTemplate} 
                            className="w-full border-none p-0 bg-transparent custom-menu-tree"
                            style={{ overflow: 'hidden' }}
                        />
                    </div>
                )}

                <Button
                    label="Tambah Menu Utama"
                    icon="pi pi-plus"
                    severity="secondary"
                    outlined
                    size="small"
                    onClick={() => openDialog('addRoot', null)}
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
