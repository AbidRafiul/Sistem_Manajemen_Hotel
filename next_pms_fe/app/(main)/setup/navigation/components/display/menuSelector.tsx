'use client';

import { InputSwitch } from 'primereact/inputswitch';
import { NavMenuItem } from '../interfaces';

interface MenuSelectorProps {
    masterMenu: NavMenuItem[];
    menu: NavMenuItem[];
    onChange: (menu: NavMenuItem[]) => void;
}

const MenuSelector = ({ masterMenu, menu, onChange }: MenuSelectorProps) => {

    const isGroupChecked = (groupLabel: string) => {
        return menu.some(g => g.label === groupLabel);
    };

    const isLeafChecked = (groupLabel: string, leafLabel: string) => {
        const group = menu.find(g => g.label === groupLabel);
        if (!group || !group.items) return false;
        return group.items.some(l => l.label === leafLabel);
    };

    const handleGroupToggle = (group: NavMenuItem, checked: boolean) => {
        let updated = structuredClone(menu);
        if (checked) {
            // Add entire group from master
            updated.push(structuredClone(group));
        } else {
            // Remove group
            updated = updated.filter(g => g.label !== group.label);
        }
        
        // Ensure order matches master Menu
        const finalSorted = masterMenu
            .filter(mg => updated.some(g => g.label === mg.label))
            .map(mg => {
                const existingGroup = updated.find(g => g.label === mg.label)!;
                const sortedItems = (mg.items || []).filter(ml => 
                    (existingGroup.items || []).some(el => el.label === ml.label)
                );
                return { ...existingGroup, items: sortedItems };
            });

        onChange(finalSorted);
    };

    const handleLeafToggle = (groupLabel: string, leaf: NavMenuItem, checked: boolean) => {
        let updated = structuredClone(menu);
        let group = updated.find(g => g.label === groupLabel);
        
        if (checked) {
            // Ensure group exists
            if (!group) {
                const masterG = masterMenu.find(g => g.label === groupLabel);
                group = { label: masterG!.label, icon: masterG!.icon, items: [] };
                updated.push(group);
            }
            if (!group.items) group.items = [];
            group.items.push(structuredClone(leaf));
        } else {
            if (group && group.items) {
                group.items = group.items.filter(l => l.label !== leaf.label);
            }
        }

        // Sort and preserve master order
        const finalSorted = masterMenu
            .filter(mg => updated.some(g => g.label === mg.label))
            .map(mg => {
                const existingGroup = updated.find(g => g.label === mg.label)!;
                const sortedItems = (mg.items || []).filter(ml => 
                    (existingGroup.items || []).some(el => el.label === ml.label)
                );
                return { ...existingGroup, items: sortedItems };
            });

        onChange(finalSorted);
    };

    return (
        <div className="flex flex-column gap-3">
            {masterMenu.map((group, gIdx) => {
                const groupChecked = isGroupChecked(group.label);

                return (
                    <div key={gIdx} className="border-1 border-300 border-round p-3 surface-card">
                        <div className="flex align-items-center justify-content-between mb-3 border-bottom-1 border-200 pb-2">
                            <div className="flex align-items-center gap-3">
                                <i className={group.icon || "pi pi-folder"} style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }} />
                                <span className="font-bold text-lg">{group.label}</span>
                            </div>
                            <InputSwitch 
                                checked={groupChecked} 
                                onChange={(e) => handleGroupToggle(group, e.value as boolean)} 
                            />
                        </div>

                        {groupChecked && (group.items || []).length > 0 && (
                            <div className="flex flex-column gap-2 ml-4">
                                {group.items?.map((leaf, lIdx) => {
                                    const leafChecked = isLeafChecked(group.label, leaf.label);

                                    return (
                                        <div key={lIdx} className="flex align-items-center justify-content-between surface-100 p-2 border-round hover:surface-200 transition-colors transition-duration-150">
                                            <div className="flex align-items-center gap-2">
                                                <i className={leaf.icon || "pi pi-file"} style={{ color: 'var(--text-color-secondary)' }} />
                                                <span className="font-medium text-sm">{leaf.label}</span>
                                            </div>
                                            <InputSwitch 
                                                checked={leafChecked} 
                                                onChange={(e) => handleLeafToggle(group.label, leaf, e.value as boolean)} 
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        
                        {groupChecked && (group.items || []).length === 0 && (
                             <p className="text-sm text-color-secondary ml-4 m-0 font-italic">Tidak ada submenu</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MenuSelector;
