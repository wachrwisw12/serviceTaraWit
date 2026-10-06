-- ============================================================
-- 000008_drop_orphaned_sequences.sql
-- ลบ sequences ที่ไม่ได้ใช้งานแล้ว (ค้างจาก migration เก่า)
--
-- สถานะจริงของแต่ละตาราง:
--   departments  → _id_seq (nextval default, dead code)
--                 → _id_seq1 (orphaned, ลบได้)
--                 → _id_seq2 (identity sequence, ใช้งานอยู่)
--   person_types → _id_seq (nextval default, dead code)
--                 → _id_seq1 (identity sequence, ใช้งานอยู่)
--   positions    → _id_seq (nextval default, dead code)
--                 → _id_seq1 (orphaned, ลบได้)
--                 → _id_seq2 (identity sequence, ใช้งานอยู่)
--   prefixes     → _id_seq (nextval default, dead code)
--                 → _id_seq1 (orphaned, ลบได้)
--                 → _id_seq2 (identity sequence, ใช้งานอยู่)
-- ============================================================

-- ลบ sequences ที่ orphaned (ไม่ได้ผูกกับ identity column)
DROP SEQUENCE IF EXISTS public.departments_id_seq1;
DROP SEQUENCE IF EXISTS public.positions_id_seq1;
DROP SEQUENCE IF EXISTS public.prefixes_id_seq1;

-- หมายเหตุ: departments_id_seq2, person_types_id_seq1,
-- positions_id_seq2, prefixes_id_seq2 เป็น identity sequences
-- ไม่สามารถ DROP ได้ — ปล่อยไว้
