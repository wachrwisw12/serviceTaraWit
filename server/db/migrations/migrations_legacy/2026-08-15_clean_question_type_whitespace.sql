-- ============================================================================
-- 2026-08-15_clean_question_type_whitespace.sql
--
-- ล้าง whitespace (ช่องว่าง / แท็บ / ขึ้นบรรทัดใหม่) ที่ติดอยู่ข้างหน้า/ท้าย
-- ของคอลัมน์ question_type ในสองตาราง:
--   - evaluation_questions            (ต้นฉบับของ template)
--   - evaluation_instance_questions   (snapshot ที่คัดลอกไปตอนสร้าง instance)
--
-- ทำไมต้องล้าง:
--   ค่าเช่น 'SCALE ' (มีเว้นวรรคท้าย) ทำให้การส่งคะแนนล้มเหลวด้วย error
--   "คำถาม id N ไม่ใช่คำถามแบบให้คะแนน" เพราะโค้ดเทียบกับ 'SCALE' ตรงๆ
--   (โค้ดฝั่ง Go ได้ใช้ TRIM() ป้องกันไว้แล้วที่
--   server/evaluationFeature/evauation_ropositories/eva_evaluator_assingnment_repo.go
--   — script นี้เป็นการล้างข้อมูลเดิมค้างในฐานข้อมูลให้สะอาด)
--
-- วิธีรัน (production):
--   ผ่าน docker:
--     docker exec -i <postgres-container> psql -U <user> -d <db> \
--       -v ON_ERROR_STOP=1 \
--       -f /path/to/2026-08-15_clean_question_type_whitespace.sql
--   หรือ psql โดยตรง:
--     psql "postgres://<user>:<pass>@<host>/<db>" \
--       -v ON_ERROR_STOP=1 \
--       -f server/db/migrations/2026-08-15_clean_question_type_whitespace.sql
--
-- ปลอดภัย:
--   - Idempotent — รันซ้ำได้ ไม่เปลี่ยนข้อมูลเพิ่ม (UPDATE เจอแถวสะอาด = 0 แถว)
--   - ขอบเขตจำกัดเฉพาะคอลัมน์ question_type ของสองตารางนี้
--   - ใช้ transaction เพื่อให้ถูกรันทั้งหมดหรือไม่รันเลย
--   - ส่วนท้าย (CHECK constraint) ป้องกันการเกิดซ้ำ — ถ้าไม่อยากได้
--     constraint ให้คอมเมนต์ส่วนที่ 3 ทิ้งได้
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) รายงานก่อนล้าง — แสดงจำนวนแถวที่มี whitespace (สำหรับตรวจผล)
-- ----------------------------------------------------------------------------
SELECT 'evaluation_questions' AS table_name,
       COUNT(*) AS dirty_rows
FROM evaluation_questions
WHERE question_type IS DISTINCT FROM TRIM(question_type)

UNION ALL

SELECT 'evaluation_instance_questions' AS table_name,
       COUNT(*) AS dirty_rows
FROM evaluation_instance_questions
WHERE question_type IS DISTINCT FROM TRIM(question_type);

-- ----------------------------------------------------------------------------
-- 1) ล้างข้อมูล — ตัด whitespace หน้า/ท้าย (รวมแท็บ, ขึ้นบรรทัดใหม่)
-- ----------------------------------------------------------------------------
UPDATE evaluation_questions
SET question_type = TRIM(question_type)
WHERE question_type IS DISTINCT FROM TRIM(question_type);

UPDATE evaluation_instance_questions
SET question_type = TRIM(question_type)
WHERE question_type IS DISTINCT FROM TRIM(question_type);

-- ----------------------------------------------------------------------------
-- 2) รายงานหลังล้าง — ควรได้ 0 ทั้งสองตาราง
-- ----------------------------------------------------------------------------
SELECT 'evaluation_questions' AS table_name,
       COUNT(*) AS dirty_rows
FROM evaluation_questions
WHERE question_type IS DISTINCT FROM TRIM(question_type)

UNION ALL

SELECT 'evaluation_instance_questions' AS table_name,
       COUNT(*) AS dirty_rows
FROM evaluation_instance_questions
WHERE question_type IS DISTINCT FROM TRIM(question_type);

-- ----------------------------------------------------------------------------
-- 3) [แนะนำ] ป้องกันการเกิดซ้ำ — ห้ามเก็บ question_type ที่มี whitespace หน้า/ท้าย
--
-- หมายเหตุ: ต้นทางของคำถาม (template) ถูกเติมจากภายนอกระบบ server
-- (server ไม่มี INSERT เข้า evaluation_questions โดยตรง) ถ้าต้นทางยังส่งค่า
-- ไม่สะอาด constraint นี้จะทำให้ insert/update นั้น error ขึ้นมาทันที
-- เพื่อให้เห็นจุดบกพร่องเร็ว — แก้ที่ต้นทางก่อน แล้วค่อยเปิด constraint นี้
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'evaluation_questions_question_type_no_whitespace'
    ) THEN
        ALTER TABLE evaluation_questions
        ADD CONSTRAINT evaluation_questions_question_type_no_whitespace
        CHECK (question_type = TRIM(question_type));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'evaluation_instance_questions_question_type_no_whitespace'
    ) THEN
        ALTER TABLE evaluation_instance_questions
        ADD CONSTRAINT evaluation_instance_questions_question_type_no_whitespace
        CHECK (question_type = TRIM(question_type));
    END IF;
END $$;

-- ============================================================================
-- ตรวจสอบภายหลัง (รันแยกได้ ถ้าอยากยืนยัน):
--
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conname IN (
--       'evaluation_questions_question_type_no_whitespace',
--       'evaluation_instance_questions_question_type_no_whitespace'
--   );
--
-- ตัวอย่างทดสอบว่า constraint กันค่าไม่สะอาดจริง:
--   INSERT INTO evaluation_questions (section_id, question, question_type, sort_order)
--   VALUES (1, 'test', 'SCALE ', 999);  -- ควร error
-- ============================================================================
