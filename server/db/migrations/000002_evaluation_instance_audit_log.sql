-- บันทึกประวัติการเพิ่มและลบผู้เกี่ยวข้องในรอบการประเมิน
CREATE TABLE IF NOT EXISTS evaluation_instance_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    instance_id     BIGINT NOT NULL REFERENCES evaluation_instances(id) ON DELETE CASCADE,
    actor_user_id   BIGINT NOT NULL,
    action          VARCHAR(20) NOT NULL,
    target_user_id  BIGINT NOT NULL,
    detail          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_audit_instance_id
    ON evaluation_instance_audit_log (instance_id, created_at DESC);
