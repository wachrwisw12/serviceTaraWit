-- ตาราง audit log สำหรับบันทึกการเปลี่ยนแปลง members (targets/evaluators)
-- ในการประเมินแต่ละรอบ — เพื่อ trace ว่าใครแก้ไขอะไรเมื่อไหร่

CREATE TABLE IF NOT EXISTS evaluation_instance_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    instance_id     BIGINT NOT NULL REFERENCES evaluation_instances(id) ON DELETE CASCADE,
    actor_user_id   BIGINT NOT NULL,
    action          VARCHAR(20) NOT NULL,          -- 'add_target' | 'remove_target' | 'add_evaluator' | 'remove_evaluator'
    target_user_id  BIGINT NOT NULL,               -- user_id ที่ถูกเพิ่ม/ลบ
    detail          JSONB DEFAULT '{}'::jsonb,     -- เช่น {"name": "...", "position": "..."}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- index สำหรับ query ตาม instance_id (บ่อยสุด)
CREATE INDEX IF NOT EXISTS idx_eval_audit_instance_id
    ON evaluation_instance_audit_log (instance_id, created_at DESC);
