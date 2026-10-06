CREATE TABLE IF NOT EXISTS attendance_record_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    attendance_record_id BIGINT NOT NULL REFERENCES attendance_records(id) ON DELETE RESTRICT,
    edited_by BIGINT NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL CHECK (length(trim(reason)) >= 3),
    old_data JSONB NOT NULL,
    new_data JSONB NOT NULL,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_record
    ON attendance_record_audit_logs(attendance_record_id, edited_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_audit_editor
    ON attendance_record_audit_logs(edited_by, edited_at DESC);
