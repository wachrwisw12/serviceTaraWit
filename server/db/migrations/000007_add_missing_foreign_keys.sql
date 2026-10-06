-- ============================================================
-- 000007_add_missing_foreign_keys.sql
-- เพิ่ม Foreign Key constraints ที่หายไป
-- ============================================================

-- 1. users.position_id → positions.id
ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_position
    FOREIGN KEY (position_id) REFERENCES public.positions(id)
    ON DELETE SET NULL;

-- 2. users.prefix_id → prefixes.id
ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_prefix
    FOREIGN KEY (prefix_id) REFERENCES public.prefixes(id)
    ON DELETE SET NULL;

-- 3. users.person_type_id → person_types.id
ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_person_type
    FOREIGN KEY (person_type_id) REFERENCES public.person_types(id)
    ON DELETE SET NULL;

-- 4. evaluation_instance_evaluators.user_id → users.id
ALTER TABLE ONLY public.evaluation_instance_evaluators
    ADD CONSTRAINT fk_evaluator_user
    FOREIGN KEY (user_id) REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 5. evaluation_targets.user_id → users.id
ALTER TABLE ONLY public.evaluation_targets
    ADD CONSTRAINT fk_eval_target_user
    FOREIGN KEY (user_id) REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 6. evaluation_instance_audit_log.actor_user_id → users.id
ALTER TABLE ONLY public.evaluation_instance_audit_log
    ADD CONSTRAINT fk_audit_log_actor
    FOREIGN KEY (actor_user_id) REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 7. evaluation_instance_audit_log.target_user_id → users.id
ALTER TABLE ONLY public.evaluation_instance_audit_log
    ADD CONSTRAINT fk_audit_log_target
    FOREIGN KEY (target_user_id) REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 8. line_login_states.user_id → users.id
ALTER TABLE ONLY public.line_login_states
    ADD CONSTRAINT fk_line_login_user
    FOREIGN KEY (user_id) REFERENCES public.users(id)
    ON DELETE CASCADE;
