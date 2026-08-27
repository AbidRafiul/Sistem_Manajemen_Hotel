-- ============================================================
-- Update mst_navigation: Tambah menu "Master Navigasi Sidebar"
-- ke dalam grup "MASTER & SETUP CABANG" untuk semua role
-- Jalankan script ini di MySQL database
-- ============================================================

-- Superadmin
UPDATE `mst_navigation`
SET `menu` = JSON_ARRAY_APPEND(
    `menu`,
    '$[1].items',
    JSON_OBJECT(
        'label', 'Master Navigasi',
        'icon', 'pi pi-fw pi-sitemap',
        'to', '/setup/navigation'
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
        'label', 'Master Navigasi',
        'icon', 'pi pi-fw pi-sitemap',
        'to', '/setup/navigation'
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
        'label', 'Master Navigasi',
        'icon', 'pi pi-fw pi-sitemap',
        'to', '/setup/navigation'
    )
),
`updated_at` = NOW()
WHERE `role` = 'master';

-- Verifikasi
SELECT id, role, JSON_EXTRACT(menu, '$[1].items[last].label') as last_item FROM mst_navigation;
