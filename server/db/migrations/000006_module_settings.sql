CREATE TABLE IF NOT EXISTS system_modules (
    module_key VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    show_on_web BOOLEAN NOT NULL DEFAULT TRUE,
    show_on_mobile BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    maintenance_message TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS system_module_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    module_key VARCHAR(64) NOT NULL,
    before_value JSONB NOT NULL,
    after_value JSONB NOT NULL,
    changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_modules (module_key, name, description, sort_order, show_on_mobile) VALUES
    ('attendance', 'การลงเวลา', 'ลงเวลาเข้า–ออกและดูประวัติการปฏิบัติงาน', 10, TRUE),
    ('evaluation', 'การประเมิน', 'งานประเมิน แม่แบบ รอบ และผลการประเมิน', 20, TRUE),
    ('personnel', 'บุคลากร', 'ข้อมูลบุคลากรและตำแหน่ง', 30, FALSE),
    ('users', 'ผู้ใช้และสิทธิ์', 'บัญชีผู้ใช้ บทบาท และสิทธิ์', 40, FALSE),
    ('reports', 'รายงาน', 'รายงานและภาพรวมสำหรับผู้บริหาร', 50, FALSE),
    ('settings', 'ตั้งค่าระบบ', 'การตั้งค่าระบบทั้งหมด', 60, FALSE)
ON CONFLICT (module_key) DO NOTHING;
