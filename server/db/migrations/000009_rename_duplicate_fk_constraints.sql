-- ============================================================
-- 000009_rename_duplicate_fk_constraints.sql
-- ตั้งชื่อ FK constraints ให้สื่อความหมาย
-- ปัญหา: role_permissions และ user_roles มี FK ชื่อ "fk_role" ซ้ำกัน
-- ============================================================

-- role_permissions: fk_role → fk_role_permissions_role
ALTER TABLE ONLY public.role_permissions
    DROP CONSTRAINT IF EXISTS fk_role;

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

-- role_permissions: fk_permission → fk_role_permissions_permission
ALTER TABLE ONLY public.role_permissions
    DROP CONSTRAINT IF EXISTS fk_permission;

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;

-- user_roles: fk_role → fk_user_roles_role
ALTER TABLE ONLY public.user_roles
    DROP CONSTRAINT IF EXISTS fk_role;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

-- user_roles: fk_user → fk_user_roles_user
ALTER TABLE ONLY public.user_roles
    DROP CONSTRAINT IF EXISTS fk_user;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
