-- Refresh token สำหรับ session ระยะยาว (รองรับ mobile app)
-- เก็บเฉพาะ SHA-256 hash ไม่เก็บ raw token; รองรับ rotation (แทนที่กันเป็นลูกโซ่) + revoke
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash     TEXT NOT NULL UNIQUE,
    expires_at     TIMESTAMP NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at     TIMESTAMP,
    replaced_by_id BIGINT REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    user_agent     TEXT
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
