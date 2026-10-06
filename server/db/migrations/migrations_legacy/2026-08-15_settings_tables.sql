-- ============================================================
-- โมดูลตั้งค่าระบบ: ตารางปีการศึกษา + ระดับคะแนน + ข้อมูลโรงเรียนเพิ่มเติม
-- ============================================================

-- 1) ปีการศึกษา
CREATE TABLE IF NOT EXISTS academic_years (
    id          SERIAL PRIMARY KEY,
    year        INTEGER NOT NULL UNIQUE,
    is_current  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Seed: ปีที่มีข้อมูลอยู่แล้วในระบบ + ปีล่าสุดเป็นปีปัจจุบัน
INSERT INTO academic_years (year, is_current)
SELECT 2569, TRUE
WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE year = 2569);

INSERT INTO academic_years (year, is_current)
SELECT 2568, FALSE
WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE year = 2568);

-- 2) ระดับคะแนน (สเกล 5-1) — ใช้ในหน้าตั้งค่าคะแนน และให้หน้าประเมินอ่านจากตาราง
CREATE TABLE IF NOT EXISTS score_levels (
    id          SERIAL PRIMARY KEY,
    score       INTEGER NOT NULL UNIQUE,
    label       TEXT NOT NULL,
    color       VARCHAR(20) NOT NULL,
    text_color  VARCHAR(20) NOT NULL DEFAULT '#ffffff',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITHOUT TIME zone DEFAULT NOW(),
    updated_at  TIMESTAMP WITHOUT TIME zone DEFAULT NOW()
);

-- Seed: ระดับเริ่มต้นตรงกับค่าคงที่เดิมใน Scorescale.ts
INSERT INTO score_levels (score, label, color, text_color, sort_order)
SELECT s.score, s.label, s.color, s.text_color, s.sort_order
FROM (VALUES
    (5, 'มีคุณภาพ มีความชัดเจน มีความเหมาะสม มากที่สุด', '#2fae60', '#ffffff', 1),
    (4, 'มีคุณภาพ มีความชัดเจน มีความเหมาะสม มาก', '#7cb342', '#ffffff', 2),
    (3, 'มีคุณภาพ มีความชัดเจน มีความเหมาะสม ปานกลาง', '#f59e0b', '#422006', 3),
    (2, 'มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อย', '#e07a3f', '#ffffff', 4),
    (1, 'มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อยที่สุด', '#d64545', '#ffffff', 5)
) AS s(score, label, color, text_color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM score_levels);

-- 3) ข้อมูลโรงเรียนเพิ่มเติม (ที่อยู่ เบอร์ อีเมล ชื่อผู้อำนวยการ)
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS director_name VARCHAR(255);
