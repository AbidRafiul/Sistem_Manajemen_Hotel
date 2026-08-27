-- ============================================================
-- Update mst_navigation: Tambah menu "Master Harga Kamar"
-- ke dalam grup "MASTER & SETUP CABANG" untuk semua role
-- ============================================================

-- Superadmin
UPDATE `mst_navigation`
SET `menu` = JSON_ARRAY_APPEND(
    `menu`,
    '$[1].items',
    JSON_OBJECT(
        'label', 'Master Harga Kamar',
        'icon', 'pi pi-fw pi-money-bill',
        'to', '/master_rate_plan_price'
    )
),
`updated_at` = NOW()
WHERE `role` = 'superadmin';

-- Admin
UPDATE `mst_navigation`
SET `menu` = JSON_ARRAY_APPEND(
    `menu`,
    '$[1].items',
    JSON_OBJECT(
        'label', 'Master Harga Kamar',
        'icon', 'pi pi-fw pi-money-bill',
        'to', '/master_rate_plan_price'
    )
),
`updated_at` = NOW()
WHERE `role` = 'admin';

-- Master
UPDATE `mst_navigation`
SET `menu` = JSON_ARRAY_APPEND(
    `menu`,
    '$[1].items',
    JSON_OBJECT(
        'label', 'Master Harga Kamar',
        'icon', 'pi pi-fw pi-money-bill',
        'to', '/master_rate_plan_price'
    )
),
`updated_at` = NOW()
WHERE `role` = 'master';

-- Verifikasi
SELECT id, role, JSON_EXTRACT(menu, '$[1].items[last].label') as last_item FROM mst_navigation;
