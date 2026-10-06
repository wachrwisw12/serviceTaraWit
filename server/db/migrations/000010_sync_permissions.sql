-- ============================================================
-- 000010_sync_permissions.sql
-- Sync permission codes ระหว่าง Frontend, Backend, และ Database
-- ============================================================

-- ── 1. เพิ่ม permissions ที่ frontend ใช้แต่ DB ไม่มี ──────
INSERT INTO permissions (code, name, module, is_active) VALUES
  -- Dashboard
  ('dashboard.view',   'ดูแดชบอร์ด',           'DASHBOARD', true),
  ('dashboard.export', 'ส่งออกแดชบอร์ด',       'DASHBOARD', true),
  -- Evaluation (frontend codes ที่ต่างจาก backend)
  ('evaluation.view',   'ดูการประเมิน',        'EVALUATION', true),
  ('evaluation.create', 'สร้างการประเมิน',     'EVALUATION', true),
  ('evaluation.edit',   'แก้ไขการประเมิน',     'EVALUATION', true),
  -- Report
  ('report.create', 'สร้างรายงาน',   'REPORT', true),
  ('report.edit',   'แก้ไขรายงาน',   'REPORT', true),
  ('report.delete', 'ลบรายงาน',       'REPORT', true),
  -- Template
  ('template.edit', 'แก้ไขแบบประเมิน', 'TEMPLATE', true),
  -- User
  ('user.edit', 'แก้ไขผู้ใช้ (frontend)', 'USER', true)
ON CONFLICT (code) DO NOTHING;

-- ── 2. ลบ permissions ที่ไม่ได้ใช้ทั้ง frontend และ backend ──
--    (ไม่ได้ assign ให้ role ใด + ไม่ได้ใช้ใน routes)
DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions WHERE code IN (
    'report.export',     -- frontend ใช้ 'report.view'/'report.create'/'report.edit'/'report.delete'
    'result.view',       -- frontend ไม่มี code นี้
    'template.delete',   -- frontend ไม่มี code นี้ (ใช้ 'template.create')
    'template.update'    -- frontend ไม่มี code นี้ (ใช้ 'template.edit')
  )
);

DELETE FROM permissions WHERE code IN (
  'report.export',
  'result.view',
  'template.delete',
  'template.update'
);

-- ── 3. เพิ่ม permissions ที่ backend ใช้แต่ frontend ยังไม่มี ──
--    (เก็บไว้ก่อน ยังไม่ลบ เพราะอาจใช้ในอนาคต)
--    evaluation.approve, evaluation.round.view, evaluation.submit
--    result.history.view, result.person.view, result.summary.view
--    user.create, user.delete
--    → ปล่อยไว้ ไม่ลบ เพราะเป็น permissions ที่มีประโยชน์ในอนาคต
