-- ============================================================
-- มาตรฐานการประกันคุณภาพภายในสถานศึกษา
-- Module: iqa (Internal Quality Assurance)
-- ============================================================

-- มาตรฐาน (Standards)
CREATE TABLE IF NOT EXISTS iqa_standards (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(10) NOT NULL UNIQUE,  -- '1','2','3'
    name            TEXT NOT NULL,                 -- ชื่อมาตรฐาน
    description     TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ประเด็น/เกณฑ์ (Criteria) — อยู่ภายใต้มาตรฐาน
CREATE TABLE IF NOT EXISTS iqa_criteria (
    id              SERIAL PRIMARY KEY,
    standard_id     INT NOT NULL REFERENCES iqa_standards(id) ON DELETE CASCADE,
    code            VARCHAR(10) NOT NULL,          -- '1.1','1.2','2.1', ...
    name            TEXT NOT NULL,
    description     TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(standard_id, code)
);

-- ตัวชี้วัด (Indicators) — อยู่ภายใต้เกณฑ์
CREATE TABLE IF NOT EXISTS iqa_indicators (
    id              SERIAL PRIMARY KEY,
    criterion_id    INT NOT NULL REFERENCES iqa_criteria(id) ON DELETE CASCADE,
    code            VARCHAR(20) NOT NULL,          -- '1.1.1','1.1.2', ...
    name            TEXT NOT NULL,                 -- คำอธิบายตัวชี้วัด
    description     TEXT,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(criterion_id, code)
);

-- ระดับคุณภาพ (Quality Levels) — เกณฑ์การให้คะแนน
CREATE TABLE IF NOT EXISTS iqa_quality_levels (
    id              SERIAL PRIMARY KEY,
    score           INT NOT NULL,                  -- 4,3,2,1
    label           VARCHAR(100) NOT NULL,         -- 'ดีเลิศ','ดี','พอใช้','ปรับปรุง'
    description     TEXT,                          -- คำอธิบายเกณฑ์
    color           VARCHAR(20) DEFAULT '#3B82F6',
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ปีการประเมิน (Assessment Cycles) — เช่น ปีการศึกษา 2568
CREATE TABLE IF NOT EXISTS iqa_assessment_cycles (
    id              SERIAL PRIMARY KEY,
    academic_year   INT NOT NULL,                  -- 2568
    name            VARCHAR(200),                  -- 'รอบการประเมิน ป.ม. 2568'
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT|IN_PROGRESS|COMPLETED
    start_date      DATE,
    end_date        DATE,
    created_by      INT REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(academic_year, name)
);

-- การประเมิน (Assessments) — ผู้ประเมิน 1 คน ต่อ 1 cycle
CREATE TABLE IF NOT EXISTS iqa_assessments (
    id              SERIAL PRIMARY KEY,
    cycle_id        INT NOT NULL REFERENCES iqa_assessment_cycles(id) ON DELETE CASCADE,
    assessor_id     INT NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT|IN_PROGRESS|SUBMITTED
    total_score     DECIMAL(10,2),
    avg_score       DECIMAL(5,2),
    quality_level   VARCHAR(50),                   -- 'ดีเลิศ','ดี','พอใช้','ปรับปรุง'
    comment         TEXT,
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cycle_id, assessor_id)
);

-- ผลการประเมินรายตัวชี้วัด (Assessment Scores)
CREATE TABLE IF NOT EXISTS iqa_assessment_scores (
    id              SERIAL PRIMARY KEY,
    assessment_id   INT NOT NULL REFERENCES iqa_assessments(id) ON DELETE CASCADE,
    indicator_id    INT NOT NULL REFERENCES iqa_indicators(id) ON DELETE CASCADE,
    score           INT NOT NULL CHECK (score >= 0 AND score <= 4),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(assessment_id, indicator_id)
);

-- หลักฐาน/เอกสารประกอบ (Evidence)
CREATE TABLE IF NOT EXISTS iqa_evidence (
    id              SERIAL PRIMARY KEY,
    assessment_id   INT NOT NULL REFERENCES iqa_assessments(id) ON DELETE CASCADE,
    indicator_id    INT REFERENCES iqa_indicators(id),
    file_name       VARCHAR(500) NOT NULL,
    stored_name     VARCHAR(500) NOT NULL,
    file_path       VARCHAR(1000) NOT NULL,
    file_size       BIGINT NOT NULL DEFAULT 0,
    mime_type       VARCHAR(100),
    description     TEXT,
    uploaded_by     INT REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- สรุปผลระดับสถานศึกษา (School-level Summary) — สรุปจากทุก assessor
CREATE TABLE IF NOT EXISTS iqa_school_summary (
    id              SERIAL PRIMARY KEY,
    cycle_id        INT NOT NULL REFERENCES iqa_assessment_cycles(id) ON DELETE CASCADE,
    indicator_id    INT NOT NULL REFERENCES iqa_indicators(id) ON DELETE CASCADE,
    avg_score       DECIMAL(5,2),
    min_score       INT,
    max_score       INT,
    assessor_count  INT NOT NULL DEFAULT 0,
    quality_level   VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cycle_id, indicator_id)
);

-- Seed: ระดับคุณภาพ
INSERT INTO iqa_quality_levels (score, label, description, color, sort_order) VALUES
(4, 'ดีเลิศ',    'เป็นไปตามเกณฑ์ทุกข้อ มีหลักฐานยืนยันชัดเจน เป็นต้นแบบได้', '#16A34A', 1),
(3, 'ดี',        'เป็นไปตามเกณฑ์ส่วนใหญ่ มีหลักฐานยืนยันเพียงพอ',           '#3B82F6', 2),
(2, 'พอใช้',     'เป็นไปตามเกณฑ์บางส่วน ยังต้องพัฒนาเพิ่มเติม',             '#F59E0B', 3),
(1, 'ปรับปรุง',  'ยังไม่เป็นไปตามเกณฑ์ ต้องแก้ไขและพัฒนาอย่างเร่งด่วน',     '#EF4444', 4),
(0, 'ไม่ผ่านเกณฑ์', 'ไม่มีหลักฐานหรือไม่ได้ดำเนินการเลย',                    '#6B7280', 5)
ON CONFLICT DO NOTHING;

-- Seed: มาตรฐานที่ 1-3
INSERT INTO iqa_standards (code, name, sort_order) VALUES
('1', 'คุณภาพของผู้เรียน', 1),
('2', 'กระบวนการบริหารและการจัดการสถานศึกษา', 2),
('3', 'กระบวนการจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ', 3)
ON CONFLICT (code) DO NOTHING;

-- Seed: เกณฑ์
INSERT INTO iqa_criteria (standard_id, code, name, sort_order) VALUES
-- มาตรฐาน 1
((SELECT id FROM iqa_standards WHERE code='1'), '1.1', 'ผลสัมฤทธิ์ทางวิชาการของผู้เรียน', 1),
((SELECT id FROM iqa_standards WHERE code='1'), '1.2', 'คุณลักษณะอันพึงประสงค์ของผู้เรียน', 2),
-- มาตรฐาน 2
((SELECT id FROM iqa_standards WHERE code='2'), '2.1', 'เป้าหมาย วิสัยทัศน์ และพันธกิจ', 1),
((SELECT id FROM iqa_standards WHERE code='2'), '2.2', 'ระบบบริหารจัดการคุณภาพ', 2),
((SELECT id FROM iqa_standards WHERE code='2'), '2.3', 'พัฒนาวิชาการเน้นคุณภาพผู้เรียน', 3),
((SELECT id FROM iqa_standards WHERE code='2'), '2.4', 'พัฒนาครู บุคลากร และ PLC', 4),
((SELECT id FROM iqa_standards WHERE code='2'), '2.5', 'สภาพแวดล้อมทางกายภาพและสังคม', 5),
((SELECT id FROM iqa_standards WHERE code='2'), '2.6', 'เทคโนโลยีสารสนเทศ', 6),
-- มาตรฐาน 3
((SELECT id FROM iqa_standards WHERE code='3'), '3.1', 'แผนการจัดการเรียนรู้', 1),
((SELECT id FROM iqa_standards WHERE code='3'), '3.2', 'สื่อ เทคโนโลยี และแหล่งเรียนรู้', 2),
((SELECT id FROM iqa_standards WHERE code='3'), '3.3', 'บริหารจัดการชั้นเรียน', 3),
((SELECT id FROM iqa_standards WHERE code='3'), '3.4', 'ตรวจสอบและประเมินคุณภาพ', 4),
((SELECT id FROM iqa_standards WHERE code='3'), '3.5', 'ชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)', 5)
ON CONFLICT (standard_id, code) DO NOTHING;

-- Seed: ตัวชี้วัด
-- ประเด็น 1.1
INSERT INTO iqa_indicators (criterion_id, code, name, sort_order) VALUES
((SELECT id FROM iqa_criteria WHERE code='1.1'), '1.1.1', 'ผู้เรียนมีความสามารถในการอ่าน การเขียน การสื่อสาร และการคิดคำนวณ', 1),
((SELECT id FROM iqa_criteria WHERE code='1.1'), '1.1.2', 'ผู้เรียนมีความสามารถในการคิดวิเคราะห์ คิดวิจารณญาณ อภิปราย แลกเปลี่ยนความคิดเห็นโดยใช้เหตุผลประกอบการตัดสินใจ และแก้ปัญหา', 2),
((SELECT id FROM iqa_criteria WHERE code='1.1'), '1.1.3', 'ผู้เรียนมีความสามารถในการสร้างนวัตกรรม', 3),
((SELECT id FROM iqa_criteria WHERE code='1.1'), '1.1.4', 'ผู้เรียนมีความสามารถในการใช้เทคโนโลยีสารสนเทศและการสื่อสารเพื่อการพัฒนาตนเองและสังคม', 4),
((SELECT id FROM iqa_criteria WHERE code='1.1'), '1.1.5', 'ผู้เรียนมีผลสัมฤทธิ์ทางการเรียนตามหลักสูตรสถานศึกษา', 5),
((SELECT id FROM iqa_criteria WHERE code='1.1'), '1.1.6', 'ผู้เรียนมีความรู้ ทักษะ และเจตคติที่ดี พร้อมที่จะศึกษาต่อในระดับชั้นที่สูงขึ้น', 6),
-- ประเด็น 1.2
((SELECT id FROM iqa_criteria WHERE code='1.2'), '1.2.1', 'ผู้เรียนมีคุณลักษณะตามที่สถานศึกษากำหนด และมีค่านิยมที่ดี', 1),
((SELECT id FROM iqa_criteria WHERE code='1.2'), '1.2.2', 'ผู้เรียนมีความภูมิใจในท้องถิ่น เห็นคุณค่าของความเป็นไทย', 2),
((SELECT id FROM iqa_criteria WHERE code='1.2'), '1.2.3', 'ผู้เรียนมีการยอมรับที่จะอยู่ร่วมกันบนความแตกต่างและหลากหลาย', 3),
((SELECT id FROM iqa_criteria WHERE code='1.2'), '1.2.4', 'ผู้เรียนมีสุขภาวะทางร่างกาย และลักษณะจิตสังคมแบ่งเป็นระดับคุณภาพตามเกณฑ์', 4),
-- ประเด็น 2.1 - 2.6
((SELECT id FROM iqa_criteria WHERE code='2.1'), '2.1', 'สถานศึกษามีเป้าหมาย วิสัยทัศน์ และพันธกิจที่ชัดเจน', 1),
((SELECT id FROM iqa_criteria WHERE code='2.2'), '2.2', 'สถานศึกษามีระบบบริหารจัดการคุณภาพ', 1),
((SELECT id FROM iqa_criteria WHERE code='2.3'), '2.3', 'สถานศึกษาดำเนินงานพัฒนาวิชาการเน้นคุณภาพผู้เรียนรอบด้าน', 1),
((SELECT id FROM iqa_criteria WHERE code='2.4'), '2.4', 'สถานศึกษาส่งเสริม พัฒนาครู บุคลากร และจัด PLC', 1),
((SELECT id FROM iqa_criteria WHERE code='2.5'), '2.5', 'สถานศึกษาจัดสภาพแวดล้อมทางกายภาพและสังคม', 1),
((SELECT id FROM iqa_criteria WHERE code='2.6'), '2.6', 'สถานศึกษาจัดระบบเทคโนโลยีสารสนเทศ', 1),
-- ประเด็น 3.1 - 3.5
((SELECT id FROM iqa_criteria WHERE code='3.1'), '3.1', 'ครูมีแผนการจัดการเรียนรู้ผ่านกระบวนการคิดและปฏิบัติจริง', 1),
((SELECT id FROM iqa_criteria WHERE code='3.2'), '3.2', 'ครูใช้สื่อ เทคโนโลยี และแหล่งเรียนรู้รวมถึงภูมิปัญญาท้องถิ่น', 1),
((SELECT id FROM iqa_criteria WHERE code='3.3'), '3.3', 'ครูบริหารจัดการชั้นเรียน เน้นปฏิสัมพันธ์เชิงบวก', 1),
((SELECT id FROM iqa_criteria WHERE code='3.4'), '3.4', 'ครูตรวจสอบและประเมินคุณภาพการจัดการเรียนรู้อย่างเป็นระบบ', 1),
((SELECT id FROM iqa_criteria WHERE code='3.5'), '3.5', 'มีชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)', 1)
ON CONFLICT (criterion_id, code) DO NOTHING;
