-- เพิ่มคอลัมน์ template_type ('EVALUATION' | 'SURVEY') ให้ evaluation_instances
-- เพื่อให้รู้ว่า instance นี้เป็นแบบประเมินหรือแบบสอบถาม (snapshot จากแม่แบบตอนสร้าง)
ALTER TABLE evaluation_instances
    ADD COLUMN IF NOT EXISTS template_type character varying(20)
    NOT NULL DEFAULT 'EVALUATION';

-- Backfill: ข้อมูลเดิมให้ยึดตามประเภทของแม่แบบต้นทาง
UPDATE evaluation_instances ei
SET template_type = t.template_type
FROM evaluation_templates t
WHERE t.id = ei.template_id
  AND t.template_type IS NOT NULL
  AND ei.template_type = 'EVALUATION';
