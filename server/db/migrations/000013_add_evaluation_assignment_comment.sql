ALTER TABLE evaluation_assignments
    ADD COLUMN IF NOT EXISTS comment TEXT;

COMMENT ON COLUMN evaluation_assignments.comment IS
    'ข้อเสนอแนะภาพรวมจากผู้ประเมินสำหรับผู้รับการประเมินใน assignment นี้';
