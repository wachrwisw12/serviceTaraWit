-- This project uses the custom migration runner in db/migrations/migrate.go.
-- Keep only forward migrations in this file; goose Down sections would also
-- be executed by the custom runner.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nickname character varying(100);
