-- LINE Login: ผูกบัญชี LINE กับ user ในระบบ (login ผ่าน LINE ได้)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- LINE userId ไม่ซ้ำกัน (ผูกกับบัญชีเดียวเท่านั้น)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_line_user_id
    ON users (line_user_id)
    WHERE line_user_id IS NOT NULL;

-- เก็บ state + nonce ของ LINE OAuth (กัน CSRF / replay attack)
-- mode: 'login' = login ผ่าน LINE, 'link' = เชื่อม LINE กับบัญชีที่ login อยู่แล้ว
CREATE TABLE IF NOT EXISTS line_login_states (
    id         BIGSERIAL PRIMARY KEY,
    state      TEXT NOT NULL UNIQUE,
    nonce      TEXT NOT NULL,
    mode       TEXT NOT NULL DEFAULT 'login',
    user_id    BIGINT,                       -- ระบุเฉพาะตอน mode = 'link'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at    TIMESTAMPTZ
);

-- state หมดอายุเร็ว (10 นาที)
CREATE INDEX IF NOT EXISTS idx_line_login_states_created
    ON line_login_states (created_at);
