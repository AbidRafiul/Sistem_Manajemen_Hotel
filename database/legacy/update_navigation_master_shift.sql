-- ==============================================================================
-- SQL UPDATE SCRIPT: Navigation Master Shift Kasir (mst_navigation)
-- Menambahkan menu "Master Shift Kasir" (/master_shift) ke navigasi sidebar
-- PT Marstech Global - Sistem Manajemen Hotel (PMS)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Update menu superadmin, admin, master, employee, staff
UPDATE `mst_navigation` 
SET `menu` = REPLACE(`menu`, 
  '{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}', 
  '{"label":"Master Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"},{"label":"Master Shift Kasir","icon":"pi pi-fw pi-clock","to":"/master_shift"}'
),
`updated_at` = NOW()
WHERE `menu` LIKE '%/master_cashier_counter%' 
  AND `menu` NOT LIKE '%/master_shift%';

-- 2. Update menu branch_manager (di mana labelnya "Cashier Counter")
UPDATE `mst_navigation` 
SET `menu` = REPLACE(`menu`, 
  '{"label":"Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"}', 
  '{"label":"Cashier Counter","icon":"pi pi-fw pi-desktop","to":"/master_cashier_counter"},{"label":"Master Shift Kasir","icon":"pi pi-fw pi-clock","to":"/master_shift"}'
),
`updated_at` = NOW()
WHERE `menu` LIKE '%/master_cashier_counter%' 
  AND `menu` NOT LIKE '%/master_shift%';

-- 3. Update juga user_navigation jika terdapat override kustom user
UPDATE `user_navigation` 
SET `menu` = REPLACE(`menu`, 
  '"to":"/master_cashier_counter"}', 
  '"to":"/master_cashier_counter"},{"label":"Master Shift Kasir","icon":"pi pi-fw pi-clock","to":"/master_shift"}'
),
`updated_at` = NOW()
WHERE `menu` LIKE '%/master_cashier_counter%' 
  AND `menu` NOT LIKE '%/master_shift%';

SET FOREIGN_KEY_CHECKS = 1;
