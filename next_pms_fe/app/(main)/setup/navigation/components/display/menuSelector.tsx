'use client';

/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file menuSelector.tsx
 * @description Komponen checkbox tree untuk N-Level navigasi (PrimeReact Tree)
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

import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { NavMenuItem } from '../interfaces';
import { useMemo, useState, useEffect } from 'react';

interface MenuSelectorProps {
    masterMenu: NavMenuItem[];
    menu: NavMenuItem[];
    onChange: (menu: NavMenuItem[]) => void;
}

/* ─────────────── Helper Functions ─────────────── */

const convertToTreeNodes = (items: NavMenuItem[], parentKey: string = ''): TreeNode[] => {
    return items.map((item, index) => {
        const key = parentKey ? `${parentKey}-${index}` : `${index}`;
        return {
            key,
            label: item.label,
            icon: item.icon,
            data: item, // Simpan referensi asli item untuk akses properti 'to'
            children: item.items ? convertToTreeNodes(item.items, key) : [],
            expanded: true // Selalu expand agar mudah dilihat
        };
    });
};

const calculateSelectionKeys = (masterNodes: TreeNode[], currentMenu: NavMenuItem[]): TreeCheckboxSelectionKeys => {
    const keys: TreeCheckboxSelectionKeys = {};
    
    const processNode = (node: TreeNode, currentItems: NavMenuItem[]) => {
        const matchingItem = currentItems.find(i => i.label === node.label);
        
        if (!matchingItem) {
            return { checked: false, partialChecked: false };
        }
        
        if (!node.children || node.children.length === 0) {
            keys[node.key as string] = { checked: true, partialChecked: false };
            return { checked: true, partialChecked: false };
        }
        
        let allChecked = true;
        let someChecked = false;
        
        for (const child of node.children) {
            const childStatus = processNode(child, matchingItem.items || []);
            if (childStatus.checked) {
                someChecked = true;
            } else if (childStatus.partialChecked) {
                someChecked = true;
                allChecked = false;
            } else {
                allChecked = false;
            }
        }
        
        if (allChecked && node.children.length > 0) {
            keys[node.key as string] = { checked: true, partialChecked: false };
            return { checked: true, partialChecked: false };
        } else if (someChecked) {
            keys[node.key as string] = { checked: false, partialChecked: true };
            return { checked: false, partialChecked: true };
        } else {
            // Kasus dimana grup dipilih, tapi seluruh childnya diuncheck 
            // (kita asumsikan tetap di-check secara parsial atau penuh tergantung implementasi)
            if ((matchingItem.items || []).length === 0) {
               keys[node.key as string] = { checked: true, partialChecked: false };
               return { checked: true, partialChecked: false };
            }
            return { checked: false, partialChecked: false };
        }
    };
    
    for (const node of masterNodes) {
        processNode(node, currentMenu);
    }
    
    return keys;
};

const buildMenuFromKeys = (masterNodes: TreeNode[], keys: TreeCheckboxSelectionKeys): NavMenuItem[] => {
    const result: NavMenuItem[] = [];
    
    for (const node of masterNodes) {
        const status = keys[node.key as string];
        if (status && (status.checked || status.partialChecked)) {
            const originalItem = node.data as NavMenuItem;
            const item: NavMenuItem = {
                label: node.label as string,
                icon: (node.icon as string) || undefined,
                to: originalItem.to,
            };
            
            if (node.children && node.children.length > 0) {
                item.items = buildMenuFromKeys(node.children, keys);
            } else if (originalItem.items && originalItem.items.length === 0) {
                item.items = []; // Preserve empty array if it was originally an empty group
            }
            
            result.push(item);
        }
    }
    
    return result;
};

/* ─────────────── Component ─────────────── */

const MenuSelector = ({ masterMenu, menu, onChange }: MenuSelectorProps) => {
    const masterNodes = useMemo(() => convertToTreeNodes(masterMenu), [masterMenu]);
    
    // Inisialisasi state keys dari props
    const [selectionKeys, setSelectionKeys] = useState<TreeCheckboxSelectionKeys>({});

    // Sync ketika 'menu' atau 'masterMenu' berubah (misal pas data load pertama kali)
    useEffect(() => {
        const keys = calculateSelectionKeys(masterNodes, menu);
        setSelectionKeys(keys);
    }, [masterNodes, menu]);

    const handleSelectionChange = (e: any) => {
        const newKeys = e.value as TreeCheckboxSelectionKeys;
        setSelectionKeys(newKeys);
        
        // Rebuild JSON based on selected keys and master nodes
        const updatedMenu = buildMenuFromKeys(masterNodes, newKeys);
        onChange(updatedMenu);
    };

    return (
        <div className="flex flex-column gap-2">
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-menu-tree .p-treenode-children {
                    border-left: 1px dashed var(--surface-400);
                    margin-left: 1.15rem;
                    padding-left: 0.85rem;
                }
                .custom-menu-tree .p-treenode-content {
                    padding-top: 0.4rem;
                    padding-bottom: 0.4rem;
                    border-radius: 6px;
                }
                .custom-menu-tree .p-treenode-content:hover {
                    background: var(--surface-100);
                }
                `
            }} />

            {masterNodes.length === 0 && (
                <div className="text-center text-color-secondary py-3 border-1 border-dashed border-300 border-round">
                    <i className="pi pi-ban text-3xl mb-2 block text-300" />
                    <p className="m-0 text-sm">Master Menu belum di-set. Harap konfigurasi Role Superadmin terlebih dahulu.</p>
                </div>
            )}

            {masterNodes.length > 0 && (
                <div className="border-1 border-300 border-round p-2 surface-card">
                    <Tree 
                        value={masterNodes} 
                        selectionMode="checkbox" 
                        selectionKeys={selectionKeys} 
                        onSelectionChange={handleSelectionChange} 
                        className="w-full border-none p-0 bg-transparent custom-menu-tree"
                    />
                </div>
            )}
        </div>
    );
};

export default MenuSelector;
