ALTER TABLE evaluation_instance_evaluators
    ADD COLUMN IF NOT EXISTS can_score boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS requires_signature boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS signature_order integer,
    ADD COLUMN IF NOT EXISTS signature_role varchar(100) NOT NULL DEFAULT 'ผู้ประเมิน';

UPDATE evaluation_instance_evaluators
SET signature_order = id
WHERE signature_order IS NULL;

COMMENT ON COLUMN evaluation_instance_evaluators.can_score IS
    'Whether this committee member receives scoring assignments.';
COMMENT ON COLUMN evaluation_instance_evaluators.requires_signature IS
    'Whether this committee member appears in the printable signature section.';
