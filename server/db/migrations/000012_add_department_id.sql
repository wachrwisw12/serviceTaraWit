-- Forward-only migration. Rollbacks must be a separately reviewed operation.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_users_department'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_department
      FOREIGN KEY (department_id) REFERENCES public.departments(id)
      ON DELETE SET NULL;
  END IF;
END
$$;
