-- ล็อกบัญชีชั่วคราวเมื่อกรอกรหัสผิดซ้ำ — นับครั้งต่อบัญชี (นอกเหนือจาก IP limiter เดิม)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until   TIMESTAMP;
