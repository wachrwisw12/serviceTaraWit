--
-- PostgreSQL database dump
--

\restrict EBGiYP65co6bqJ0eBuzjPyuKFzA2p9otwQgbIe2eMd8raru9fcnKSaPDRIIt1e4

-- Dumped from database version 15.18 (Debian 15.18-1.pgdg13+1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_years (
    id integer NOT NULL,
    year integer NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now()
);


--
-- Name: academic_years_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.academic_years_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: academic_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.academic_years_id_seq OWNED BY public.academic_years.id;


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id integer NOT NULL,
    user_id integer NOT NULL,
    record_date date NOT NULL,
    check_in_at timestamp(6) without time zone,
    check_out_at timestamp(6) without time zone,
    status character varying(20) DEFAULT 'working'::character varying NOT NULL,
    work_minutes integer,
    note text,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now()
);


--
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- Name: attendance_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_settings (
    id integer NOT NULL,
    work_start time(6) without time zone DEFAULT '08:00:00'::time without time zone NOT NULL,
    late_threshold time(6) without time zone DEFAULT '08:15:00'::time without time zone NOT NULL,
    work_end time(6) without time zone DEFAULT '16:30:00'::time without time zone NOT NULL,
    grace_end time(6) without time zone DEFAULT '17:00:00'::time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    timezone_offset_minutes integer DEFAULT 420 NOT NULL
);


--
-- Name: attendance_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: attendance_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_settings_id_seq OWNED BY public.attendance_settings.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    code character varying(30),
    name_th character varying(150) NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: departments_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: departments_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq1 OWNED BY public.departments.id;


--
-- Name: departments_id_seq2; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.departments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.departments_id_seq2
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: evaluation_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_answers (
    id bigint NOT NULL,
    assignment_id bigint NOT NULL,
    question_id bigint NOT NULL,
    score numeric(10,2),
    answer_text text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: evaluation_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_answers_id_seq OWNED BY public.evaluation_answers.id;


--
-- Name: evaluation_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_assignments (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    evaluator_id bigint NOT NULL,
    target_id bigint NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    assigned_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    submitted_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: evaluation_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_assignments_id_seq OWNED BY public.evaluation_assignments.id;


--
-- Name: evaluation_instance_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_instance_attachments (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    target_id bigint NOT NULL,
    uploaded_by bigint NOT NULL,
    file_name character varying(255) NOT NULL,
    stored_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


--
-- Name: evaluation_instance_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_instance_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_instance_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_instance_attachments_id_seq OWNED BY public.evaluation_instance_attachments.id;


--
-- Name: evaluation_instance_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_instance_audit_log (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    actor_user_id bigint NOT NULL,
    action character varying(20) NOT NULL,
    target_user_id bigint NOT NULL,
    detail jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: evaluation_instance_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_instance_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_instance_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_instance_audit_log_id_seq OWNED BY public.evaluation_instance_audit_log.id;


--
-- Name: evaluation_instance_evaluators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_instance_evaluators (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    user_id bigint NOT NULL,
    name_snapshot character varying(255) NOT NULL,
    position_snapshot character varying(100),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: evaluation_instance_evaluators_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_instance_evaluators_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_instance_evaluators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_instance_evaluators_id_seq OWNED BY public.evaluation_instance_evaluators.id;


--
-- Name: evaluation_instance_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_instance_fields (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    template_field_id bigint NOT NULL,
    field_key character varying(100) NOT NULL,
    label character varying(255) NOT NULL,
    field_type character varying(30) NOT NULL,
    value text,
    required boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    placeholder text,
    target_id bigint
);


--
-- Name: evaluation_instance_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_instance_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_instance_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_instance_fields_id_seq OWNED BY public.evaluation_instance_fields.id;


--
-- Name: evaluation_instance_question_choices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_instance_question_choices (
    id bigint NOT NULL,
    evaluation_instance_question_id bigint NOT NULL,
    label character varying(255) NOT NULL,
    score numeric(10,2) NOT NULL,
    sort_order integer NOT NULL
);


--
-- Name: evaluation_instance_question_choices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_instance_question_choices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_instance_question_choices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_instance_question_choices_id_seq OWNED BY public.evaluation_instance_question_choices.id;


--
-- Name: evaluation_instance_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_instance_questions (
    id bigint NOT NULL,
    question_text text,
    question_type character varying(50),
    max_score integer DEFAULT 5,
    sort_order integer,
    created_at timestamp(6) without time zone DEFAULT now(),
    evaluation_instance_id bigint NOT NULL,
    section_id bigint,
    source_question_id bigint,
    CONSTRAINT evaluation_instance_questions_question_type_no_whitespace CHECK (((question_type)::text = TRIM(BOTH FROM question_type)))
);


--
-- Name: evaluation_instance_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_instance_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_instance_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_instance_questions_id_seq OWNED BY public.evaluation_instance_questions.id;


--
-- Name: evaluation_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_instances (
    id bigint NOT NULL,
    template_id bigint NOT NULL,
    target_type character varying(20),
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    start_date date,
    end_date date,
    created_by bigint NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) without time zone,
    academic_year integer NOT NULL,
    round character varying(50),
    show_score_to_visibility boolean DEFAULT false,
    template_name character varying(255),
    instance_name character varying(255),
    batch_id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_type character varying(20) DEFAULT 'EVALUATION'::character varying NOT NULL
);


--
-- Name: evaluation_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_instances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_instances_id_seq OWNED BY public.evaluation_instances.id;


--
-- Name: evaluation_question_choices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_question_choices (
    id bigint NOT NULL,
    question_id bigint NOT NULL,
    label character varying(255) NOT NULL,
    score numeric(10,2) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) without time zone
);


--
-- Name: evaluation_question_choices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_question_choices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_question_choices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_question_choices_id_seq OWNED BY public.evaluation_question_choices.id;


--
-- Name: evaluation_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_questions (
    id bigint NOT NULL,
    section_id bigint NOT NULL,
    question text NOT NULL,
    question_type character varying(50) DEFAULT 'SCALE'::character varying NOT NULL,
    required boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) without time zone,
    CONSTRAINT evaluation_questions_question_type_no_whitespace CHECK (((question_type)::text = TRIM(BOTH FROM question_type)))
);


--
-- Name: evaluation_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_questions_id_seq OWNED BY public.evaluation_questions.id;


--
-- Name: evaluation_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_sections (
    id bigint NOT NULL,
    template_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) without time zone
);


--
-- Name: evaluation_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_sections_id_seq OWNED BY public.evaluation_sections.id;


--
-- Name: evaluation_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_targets (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    user_id bigint NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: evaluation_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_targets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_targets_id_seq OWNED BY public.evaluation_targets.id;


--
-- Name: evaluation_template_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_template_fields (
    id bigint NOT NULL,
    template_id bigint NOT NULL,
    field_key character varying(100) NOT NULL,
    label character varying(255) NOT NULL,
    field_type character varying(30) DEFAULT 'TEXT'::character varying NOT NULL,
    placeholder character varying(255),
    required boolean DEFAULT false NOT NULL,
    default_value text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_by bigint,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp(6) without time zone
);


--
-- Name: evaluation_template_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_template_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_template_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_template_fields_id_seq OWNED BY public.evaluation_template_fields.id;


--
-- Name: evaluation_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluation_templates (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    template_name character varying(255) NOT NULL,
    description text,
    evaluation_target_id character varying(50) NOT NULL,
    versions integer DEFAULT 1 NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_by bigint NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) without time zone,
    organization_id bigint,
    owner_id bigint,
    visibility character varying(20) DEFAULT 'ORGANIZATION'::character varying NOT NULL,
    source_template_id bigint,
    template_type character varying(20) DEFAULT 'EVALUATION'::character varying NOT NULL
);


--
-- Name: evaluation_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluation_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluation_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluation_templates_id_seq OWNED BY public.evaluation_templates.id;


--
-- Name: iqa_assessment_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_assessment_cycles (
    id integer NOT NULL,
    academic_year integer NOT NULL,
    name character varying(200),
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    start_date date,
    end_date date,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_assessment_cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_assessment_cycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_assessment_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_assessment_cycles_id_seq OWNED BY public.iqa_assessment_cycles.id;


--
-- Name: iqa_assessment_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_assessment_scores (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    indicator_id integer NOT NULL,
    score integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT iqa_assessment_scores_score_check CHECK (((score >= 0) AND (score <= 4)))
);


--
-- Name: iqa_assessment_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_assessment_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_assessment_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_assessment_scores_id_seq OWNED BY public.iqa_assessment_scores.id;


--
-- Name: iqa_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_assessments (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    assessor_id integer NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    total_score numeric(10,2),
    avg_score numeric(5,2),
    quality_level character varying(50),
    comment text,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_assessments_id_seq OWNED BY public.iqa_assessments.id;


--
-- Name: iqa_criteria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_criteria (
    id integer NOT NULL,
    standard_id integer NOT NULL,
    code character varying(10) NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_criteria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_criteria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_criteria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_criteria_id_seq OWNED BY public.iqa_criteria.id;


--
-- Name: iqa_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_evidence (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    indicator_id integer,
    file_name character varying(500) NOT NULL,
    stored_name character varying(500) NOT NULL,
    file_path character varying(1000) NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    mime_type character varying(100),
    description text,
    uploaded_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_evidence_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_evidence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_evidence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_evidence_id_seq OWNED BY public.iqa_evidence.id;


--
-- Name: iqa_indicators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_indicators (
    id integer NOT NULL,
    criterion_id integer NOT NULL,
    code character varying(20) NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_indicators_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_indicators_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_indicators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_indicators_id_seq OWNED BY public.iqa_indicators.id;


--
-- Name: iqa_quality_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_quality_levels (
    id integer NOT NULL,
    score integer NOT NULL,
    label character varying(100) NOT NULL,
    description text,
    color character varying(20) DEFAULT '#3B82F6'::character varying,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_quality_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_quality_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_quality_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_quality_levels_id_seq OWNED BY public.iqa_quality_levels.id;


--
-- Name: iqa_school_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_school_summary (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    indicator_id integer NOT NULL,
    avg_score numeric(5,2),
    min_score integer,
    max_score integer,
    assessor_count integer DEFAULT 0 NOT NULL,
    quality_level character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_school_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_school_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_school_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_school_summary_id_seq OWNED BY public.iqa_school_summary.id;


--
-- Name: iqa_standards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iqa_standards (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iqa_standards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.iqa_standards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: iqa_standards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.iqa_standards_id_seq OWNED BY public.iqa_standards.id;


--
-- Name: line_login_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.line_login_states (
    id bigint NOT NULL,
    state text NOT NULL,
    nonce text NOT NULL,
    mode text DEFAULT 'login'::text NOT NULL,
    user_id bigint,
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    used_at timestamp(6) with time zone
);


--
-- Name: line_login_states_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.line_login_states_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: line_login_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.line_login_states_id_seq OWNED BY public.line_login_states.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id bigint NOT NULL,
    code character varying(50),
    name character varying(255) NOT NULL,
    type character varying(50),
    province character varying(100),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    address text,
    phone character varying(20),
    email character varying(255),
    director_name character varying(255),
    system_name character varying(255) DEFAULT 'ระบบบริหารจัดการโรงเรียน'::character varying,
    system_short_name character varying(100) DEFAULT 'TARAWIT'::character varying
);


--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organizations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now()
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: person_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_types (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name_th character varying(100) NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: person_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.person_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: person_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.person_types_id_seq OWNED BY public.person_types.id;


--
-- Name: person_types_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.person_types ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.person_types_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.positions (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name_th character varying(150) NOT NULL,
    level integer DEFAULT 0,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: positions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.positions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;


--
-- Name: positions_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.positions_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: positions_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.positions_id_seq1 OWNED BY public.positions.id;


--
-- Name: positions_id_seq2; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.positions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.positions_id_seq2
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: prefixes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prefixes (
    id bigint NOT NULL,
    code character varying(20),
    name_th character varying(50) NOT NULL
);


--
-- Name: prefixes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prefixes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prefixes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prefixes_id_seq OWNED BY public.prefixes.id;


--
-- Name: prefixes_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prefixes_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prefixes_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prefixes_id_seq1 OWNED BY public.prefixes.id;


--
-- Name: prefixes_id_seq2; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.prefixes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prefixes_id_seq2
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now() NOT NULL,
    revoked_at timestamp(6) without time zone,
    replaced_by_id bigint,
    user_agent text
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now()
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    icon character varying(255),
    color character varying(255)
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: score_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.score_levels (
    id integer NOT NULL,
    score integer NOT NULL,
    label text NOT NULL,
    color character varying(20) NOT NULL,
    text_color character varying(20) DEFAULT '#ffffff'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now()
);


--
-- Name: score_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.score_levels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: score_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.score_levels_id_seq OWNED BY public.score_levels.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now()
);


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    password_hash text NOT NULL,
    organization_id bigint,
    status smallint DEFAULT 1,
    last_login timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    person_type_id integer,
    position_id integer,
    cid character varying(13),
    prefix_id bigint,
    first_name character varying(255),
    last_name character varying(255),
    phone character varying(20),
    is_active boolean DEFAULT true,
    email character varying(255),
    person_level integer,
    avatar_url text,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp(6) without time zone,
    line_user_id text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: academic_years id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years ALTER COLUMN id SET DEFAULT nextval('public.academic_years_id_seq'::regclass);


--
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- Name: attendance_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_settings ALTER COLUMN id SET DEFAULT nextval('public.attendance_settings_id_seq'::regclass);


--
-- Name: evaluation_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_answers ALTER COLUMN id SET DEFAULT nextval('public.evaluation_answers_id_seq'::regclass);


--
-- Name: evaluation_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_assignments ALTER COLUMN id SET DEFAULT nextval('public.evaluation_assignments_id_seq'::regclass);


--
-- Name: evaluation_instance_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_attachments ALTER COLUMN id SET DEFAULT nextval('public.evaluation_instance_attachments_id_seq'::regclass);


--
-- Name: evaluation_instance_audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_audit_log ALTER COLUMN id SET DEFAULT nextval('public.evaluation_instance_audit_log_id_seq'::regclass);


--
-- Name: evaluation_instance_evaluators id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_evaluators ALTER COLUMN id SET DEFAULT nextval('public.evaluation_instance_evaluators_id_seq'::regclass);


--
-- Name: evaluation_instance_fields id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_fields ALTER COLUMN id SET DEFAULT nextval('public.evaluation_instance_fields_id_seq'::regclass);


--
-- Name: evaluation_instance_question_choices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_question_choices ALTER COLUMN id SET DEFAULT nextval('public.evaluation_instance_question_choices_id_seq'::regclass);


--
-- Name: evaluation_instance_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_questions ALTER COLUMN id SET DEFAULT nextval('public.evaluation_instance_questions_id_seq'::regclass);


--
-- Name: evaluation_instances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instances ALTER COLUMN id SET DEFAULT nextval('public.evaluation_instances_id_seq'::regclass);


--
-- Name: evaluation_question_choices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_question_choices ALTER COLUMN id SET DEFAULT nextval('public.evaluation_question_choices_id_seq'::regclass);


--
-- Name: evaluation_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_questions ALTER COLUMN id SET DEFAULT nextval('public.evaluation_questions_id_seq'::regclass);


--
-- Name: evaluation_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_sections ALTER COLUMN id SET DEFAULT nextval('public.evaluation_sections_id_seq'::regclass);


--
-- Name: evaluation_targets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_targets ALTER COLUMN id SET DEFAULT nextval('public.evaluation_targets_id_seq'::regclass);


--
-- Name: evaluation_template_fields id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_template_fields ALTER COLUMN id SET DEFAULT nextval('public.evaluation_template_fields_id_seq'::regclass);


--
-- Name: evaluation_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_templates ALTER COLUMN id SET DEFAULT nextval('public.evaluation_templates_id_seq'::regclass);


--
-- Name: iqa_assessment_cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_cycles ALTER COLUMN id SET DEFAULT nextval('public.iqa_assessment_cycles_id_seq'::regclass);


--
-- Name: iqa_assessment_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_scores ALTER COLUMN id SET DEFAULT nextval('public.iqa_assessment_scores_id_seq'::regclass);


--
-- Name: iqa_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessments ALTER COLUMN id SET DEFAULT nextval('public.iqa_assessments_id_seq'::regclass);


--
-- Name: iqa_criteria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_criteria ALTER COLUMN id SET DEFAULT nextval('public.iqa_criteria_id_seq'::regclass);


--
-- Name: iqa_evidence id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_evidence ALTER COLUMN id SET DEFAULT nextval('public.iqa_evidence_id_seq'::regclass);


--
-- Name: iqa_indicators id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_indicators ALTER COLUMN id SET DEFAULT nextval('public.iqa_indicators_id_seq'::regclass);


--
-- Name: iqa_quality_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_quality_levels ALTER COLUMN id SET DEFAULT nextval('public.iqa_quality_levels_id_seq'::regclass);


--
-- Name: iqa_school_summary id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_school_summary ALTER COLUMN id SET DEFAULT nextval('public.iqa_school_summary_id_seq'::regclass);


--
-- Name: iqa_standards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_standards ALTER COLUMN id SET DEFAULT nextval('public.iqa_standards_id_seq'::regclass);


--
-- Name: line_login_states id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_login_states ALTER COLUMN id SET DEFAULT nextval('public.line_login_states_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: score_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.score_levels ALTER COLUMN id SET DEFAULT nextval('public.score_levels_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.academic_years (id, year, is_current, created_at) FROM stdin;
2	2568	f	2026-08-15 09:56:19.760833
1	2569	t	2026-08-15 09:56:19.757641
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_records (id, user_id, record_date, check_in_at, check_out_at, status, work_minutes, note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_settings (id, work_start, late_threshold, work_end, grace_end, is_active, created_at, updated_at, timezone_offset_minutes) FROM stdin;
1	08:00:00	08:15:00	16:30:00	17:00:00	t	2026-08-15 01:47:22.175397	2026-08-15 01:47:22.175397	420
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, code, name_th, created_at) FROM stdin;
1	ADMIN	ฝ่ายบริหาร	2026-07-12 00:38:26.492239
2	THAI	กลุ่มสาระภาษาไทย	2026-07-12 00:38:26.492239
3	MATH	กลุ่มสาระคณิตศาสตร์	2026-07-12 00:38:26.492239
4	SCIENCE	กลุ่มสาระวิทยาศาสตร์	2026-07-12 00:38:26.492239
5	SOCIAL	กลุ่มสาระสังคมศึกษา	2026-07-12 00:38:26.492239
6	ENGLISH	กลุ่มสาระภาษาต่างประเทศ	2026-07-12 00:38:26.492239
7	HEALTH	กลุ่มสาระสุขศึกษาและพลศึกษา	2026-07-12 00:38:26.492239
8	ART	กลุ่มสาระศิลปะ	2026-07-12 00:38:26.492239
9	CAREER	กลุ่มสาระการงานอาชีพ	2026-07-12 00:38:26.492239
10	GENERAL	งานทั่วไป	2026-07-12 00:38:26.492239
\.


--
-- Data for Name: evaluation_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_answers (id, assignment_id, question_id, score, answer_text, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: evaluation_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_assignments (id, instance_id, evaluator_id, target_id, status, assigned_at, submitted_at, created_at) FROM stdin;
1	1	5	1	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
2	1	5	2	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
3	1	5	3	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
4	1	5	4	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
5	1	5	5	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
6	1	5	6	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
7	1	5	7	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
8	1	5	8	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
9	1	5	9	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
10	1	5	10	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
11	1	5	11	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
12	1	5	12	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
13	1	5	13	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
14	1	5	14	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
15	1	5	15	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
16	1	5	16	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
17	1	5	17	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
18	1	5	18	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
19	1	5	19	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
20	1	5	20	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
21	1	5	21	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
22	1	5	22	pending	2026-08-21 15:06:41.902916	\N	2026-08-21 15:06:41.902916
23	2	4	23	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
24	2	4	24	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
25	2	4	25	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
26	2	4	26	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
27	2	4	27	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
28	2	4	28	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
29	2	4	29	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
30	2	4	30	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
31	2	4	31	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
32	2	4	32	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
33	2	4	33	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
34	2	4	34	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
35	2	4	35	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
36	2	4	36	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
37	2	4	37	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
38	2	4	38	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
39	2	4	39	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
40	2	4	40	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
41	2	4	41	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
42	2	4	42	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
43	2	4	43	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
44	2	4	44	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
45	2	5	23	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
46	2	5	24	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
47	2	5	25	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
48	2	5	26	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
49	2	5	27	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
50	2	5	28	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
51	2	5	29	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
52	2	5	30	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
53	2	5	31	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
54	2	5	32	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
55	2	5	33	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
56	2	5	34	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
57	2	5	35	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
58	2	5	36	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
59	2	5	37	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
60	2	5	38	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
61	2	5	39	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
62	2	5	40	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
63	2	5	41	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
64	2	5	42	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
65	2	5	43	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
66	2	5	44	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
67	2	13	23	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
68	2	13	24	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
69	2	13	25	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
70	2	13	26	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
71	2	13	27	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
72	2	13	28	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
73	2	13	29	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
74	2	13	30	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
75	2	13	31	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
76	2	13	32	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
77	2	13	33	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
78	2	13	34	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
79	2	13	35	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
80	2	13	36	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
81	2	13	37	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
82	2	13	38	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
83	2	13	39	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
84	2	13	40	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
85	2	13	41	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
86	2	13	42	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
87	2	13	43	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
88	2	13	44	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
89	2	16	23	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
90	2	16	24	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
91	2	16	25	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
92	2	16	26	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
93	2	16	27	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
94	2	16	28	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
95	2	16	29	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
96	2	16	30	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
97	2	16	31	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
98	2	16	32	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
99	2	16	33	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
100	2	16	34	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
101	2	16	35	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
102	2	16	36	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
103	2	16	37	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
104	2	16	38	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
105	2	16	39	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
106	2	16	40	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
107	2	16	41	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
108	2	16	42	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
109	2	16	43	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
110	2	16	44	pending	2026-08-21 15:14:00.541088	\N	2026-08-21 15:14:00.541088
\.


--
-- Data for Name: evaluation_instance_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_instance_attachments (id, instance_id, target_id, uploaded_by, file_name, stored_name, file_path, file_size, mime_type, created_at) FROM stdin;
1	2	43	28	535037503_1204471011721123_6968445306383966295_n.jpg	69a18ba8-59b5-454f-a1ab-7e8290a63fe9.jpg	storage/attachments/instances/2/targets/43/69a18ba8-59b5-454f-a1ab-7e8290a63fe9.jpg	1120441	image/jpeg	2026-08-23 09:27:15.432129+00
2	2	43	28	S__3571723.jpg	0990c913-23bf-4ae1-83d0-42adcdd69a1c.jpg	storage/attachments/instances/2/targets/43/0990c913-23bf-4ae1-83d0-42adcdd69a1c.jpg	254838	image/jpeg	2026-08-23 09:27:43.715008+00
3	2	43	28	643846897_122276527004194969_3871688932359920338_n.jpg	9d27ba17-6dc5-47c5-af70-fa7182241076.jpg	storage/attachments/instances/2/targets/43/9d27ba17-6dc5-47c5-af70-fa7182241076.jpg	37001	image/jpeg	2026-08-23 09:38:10.969012+00
4	2	43	28	hueman.png	aef31d02-b7de-4430-9c4b-e4ce8420b3ed.png	storage/attachments/instances/2/targets/43/aef31d02-b7de-4430-9c4b-e4ce8420b3ed.png	1482821	image/png	2026-08-23 09:38:18.81781+00
5	2	43	28	logoquickview.png	7cdb8c44-b282-4de6-acbf-e1cb7a159005.png	storage/attachments/instances/2/targets/43/7cdb8c44-b282-4de6-acbf-e1cb7a159005.png	41025	image/png	2026-08-23 09:39:05.919685+00
6	2	43	5	camera_20260823_185942.jpg	9941e402-bb0b-43e1-af08-76ab0c2831fe.jpg	storage/attachments/instances/2/targets/43/9941e402-bb0b-43e1-af08-76ab0c2831fe.jpg	209181	image/jpeg	2026-08-23 11:59:43.599077+00
7	2	43	5	camera_20260823_190012.jpg	3986a858-c42d-4987-9cb4-48ef96c5a846.jpg	storage/attachments/instances/2/targets/43/3986a858-c42d-4987-9cb4-48ef96c5a846.jpg	211758	image/jpeg	2026-08-23 12:00:14.704005+00
8	2	28	12	535037503_1204471011721123_6968445306383966295_n.jpg	4068a478-4000-46ec-b3a6-bb8e8362802e.jpg	storage/attachments/instances/2/targets/28/4068a478-4000-46ec-b3a6-bb8e8362802e.jpg	1120441	image/jpeg	2026-08-23 13:59:18.766278+00
\.


--
-- Data for Name: evaluation_instance_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_instance_audit_log (id, instance_id, actor_user_id, action, target_user_id, detail, created_at) FROM stdin;
\.


--
-- Data for Name: evaluation_instance_evaluators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_instance_evaluators (id, instance_id, user_id, name_snapshot, position_snapshot, created_at) FROM stdin;
1	1	5	นางสาวกัลย์ธิดา อนุสนธิ์	รองผู้อำนวยการโรงเรียนท่าแร่วิทยา	2026-08-21 15:06:41.902916
2	2	4	นางพรรมาหา เพชรพรรณ	ผู้อำนวยการโรงเรียนท่าแร่วิทยา	2026-08-21 15:14:00.541088
3	2	5	นางสาวกัลย์ธิดา อนุสนธิ์	รองผู้อำนวยการโรงเรียนท่าแร่วิทยา	2026-08-21 15:14:00.541088
4	2	13	นางมยุรี สำเภา	ครู วิทยฐานะ ครูชำนาญการพิเศษ	2026-08-21 15:14:00.541088
5	2	16	นางขวัญจิรา เนตรมุงคุณ	ครู วิทยฐานะ ครูชำนาญการพิเศษ	2026-08-21 15:14:00.541088
\.


--
-- Data for Name: evaluation_instance_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_instance_fields (id, instance_id, template_field_id, field_key, label, field_type, value, required, sort_order, created_at, updated_at, placeholder, target_id) FROM stdin;
1	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
2	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
3	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
4	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
5	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
6	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
7	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
8	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	7
9	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
10	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
11	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
12	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
13	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
14	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
15	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
16	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	9
17	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
18	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
19	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
20	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
21	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
22	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
23	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
24	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	13
25	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
26	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
27	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
28	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
29	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
30	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
31	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
32	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	15
33	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
34	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
35	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
36	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
37	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
38	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
39	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
40	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	18
41	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
42	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
43	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
44	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
45	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
46	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
47	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
48	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	21
49	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
50	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
51	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
52	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
53	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
54	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
55	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
56	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	1
57	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
58	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
59	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
60	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
61	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
62	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
63	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
64	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	10
65	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
66	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
67	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
68	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
69	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
70	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
71	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
72	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	12
73	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
74	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
75	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
76	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
77	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
78	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
79	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
80	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	14
81	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
82	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
83	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
84	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
85	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
86	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
87	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
88	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	20
89	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
90	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
91	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
92	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
93	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
94	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
95	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
96	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2
97	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
98	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
99	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
100	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
101	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
102	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
103	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
104	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	3
105	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
106	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
107	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
108	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
109	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
110	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
111	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
112	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	5
113	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
114	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
115	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
116	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
117	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
118	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
119	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
120	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	11
121	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
122	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
123	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
124	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
125	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
126	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
127	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
128	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	17
129	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
130	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
131	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
132	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
133	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
134	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
135	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
136	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	4
137	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
138	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
139	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
140	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
141	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
142	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
143	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
144	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	8
145	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
146	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
147	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
148	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
149	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
150	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
151	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
152	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	16
153	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
154	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
155	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
156	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
157	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
158	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
159	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
160	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	19
161	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
162	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
163	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
164	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
165	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
166	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
167	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
168	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	22
169	1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	1	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
170	1	2	subject	วิชา	TEXT	\N	t	2	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
171	1	3	subject_code	รหัสวิชา	TEXT	\N	f	3	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
172	1	4	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	4	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
173	1	5	topic	เรื่อง	TEXT	\N	t	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
174	1	6	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	6	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
175	1	7	grade_level	ระดับชั้น	TEXT	\N	f	7	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
176	1	8	period	คาบที่	NUMBER	\N	f	8	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	6
177	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		39
178	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		39
179	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		41
180	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		41
181	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		26
182	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		26
183	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		28
184	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		28
185	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		42
186	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		42
187	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		43
188	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		43
189	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		33
190	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		33
191	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		34
192	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		34
193	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		35
194	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		35
195	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		44
196	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		44
197	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		27
198	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		27
199	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		29
200	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		29
201	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		30
202	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		30
203	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		31
204	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		31
205	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		38
206	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		38
207	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		40
208	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		40
209	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		23
210	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		23
211	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		24
212	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		24
213	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		25
214	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		25
215	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		32
216	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		32
217	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		36
218	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		36
219	2	24	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	t	1	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		37
220	2	25	grade_level	ชั้น	TEXT	\N	t	2	2026-08-21 15:14:00.541088	2026-08-21 15:14:00.541088		37
\.


--
-- Data for Name: evaluation_instance_question_choices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_instance_question_choices (id, evaluation_instance_question_id, label, score, sort_order) FROM stdin;
1	1	3	3.00	3
2	1	4	4.00	2
3	1	5	5.00	1
4	1	1	1.00	5
5	1	2	2.00	4
6	2	1	1.00	5
7	2	2	2.00	4
8	2	3	3.00	3
9	2	4	4.00	2
10	2	5	5.00	1
11	3	1	1.00	5
12	3	2	2.00	4
13	3	3	3.00	3
14	3	4	4.00	2
15	3	5	5.00	1
16	4	1	1.00	5
17	4	2	2.00	4
18	4	3	3.00	3
19	4	4	4.00	2
20	4	5	5.00	1
21	5	1	1.00	5
22	5	2	2.00	4
23	5	3	3.00	3
24	5	4	4.00	2
25	5	5	5.00	1
26	6	1	1.00	5
27	6	2	2.00	4
28	6	3	3.00	3
29	6	4	4.00	2
30	6	5	5.00	1
31	7	4	4.00	2
32	7	1	1.00	5
33	7	2	2.00	4
34	7	3	3.00	3
35	7	5	5.00	1
36	8	1	1.00	5
37	8	2	2.00	4
38	8	3	3.00	3
39	8	4	4.00	2
40	8	5	5.00	1
41	9	1	1.00	5
42	9	2	2.00	4
43	9	3	3.00	3
44	9	4	4.00	2
45	9	5	5.00	1
46	10	1	1.00	5
47	10	2	2.00	4
48	10	3	3.00	3
49	10	4	4.00	2
50	10	5	5.00	1
51	11	1	1.00	5
52	11	2	2.00	4
53	11	3	3.00	3
54	11	4	4.00	2
55	11	5	5.00	1
56	12	1	1.00	5
57	12	2	2.00	4
58	12	3	3.00	3
59	12	4	4.00	2
60	12	5	5.00	1
61	13	1	1.00	5
62	13	2	2.00	4
63	13	3	3.00	3
64	13	4	4.00	2
65	13	5	5.00	1
66	14	1	1.00	5
67	14	2	2.00	4
68	14	3	3.00	3
69	14	4	4.00	2
70	14	5	5.00	1
71	15	1	1.00	5
72	15	2	2.00	4
73	15	3	3.00	3
74	15	4	4.00	2
75	15	5	5.00	1
76	16	2	2.00	4
77	16	3	3.00	3
78	16	4	4.00	2
79	16	5	5.00	1
80	16	1	1.00	5
81	17	1	1.00	5
82	17	2	2.00	4
83	17	3	3.00	3
84	17	4	4.00	2
85	17	5	5.00	1
86	18	1	1.00	5
87	18	2	2.00	4
88	18	3	3.00	3
89	18	4	4.00	2
90	18	5	5.00	1
91	19	1	1.00	5
92	19	2	2.00	4
93	19	3	3.00	3
94	19	4	4.00	2
95	19	5	5.00	1
96	20	1	1.00	5
97	20	2	2.00	4
98	20	3	3.00	3
99	20	4	4.00	2
100	20	5	5.00	1
101	21	1	1.00	5
102	21	2	2.00	4
103	21	3	3.00	3
104	21	4	4.00	2
105	21	5	5.00	1
106	22	1	1.00	5
107	22	2	2.00	4
108	22	3	3.00	3
109	22	4	4.00	2
110	22	5	5.00	1
111	23	1	1.00	5
112	23	2	2.00	4
113	23	3	3.00	3
114	23	4	4.00	2
115	23	5	5.00	1
\.


--
-- Data for Name: evaluation_instance_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_instance_questions (id, question_text, question_type, max_score, sort_order, created_at, evaluation_instance_id, section_id, source_question_id) FROM stdin;
1	สื่อการสอนที่สร้างขึ้นเหมาะสมและสอดคล้องกับเนื้อหาวิชา	SCALE	5	1	2026-08-21 15:06:41.902916	1	1	\N
2	สื่อการสอนที่สร้างขึ้นเหมาะสมกับวิธีการสอน	SCALE	5	2	2026-08-21 15:06:41.902916	1	1	\N
3	สื่อการสอนที่สร้างขึ้นมีความถูกต้อง ชัดเจน	SCALE	5	3	2026-08-21 15:06:41.902916	1	1	\N
4	สื่อการสอนที่สร้างขึ้นมีความทันสมัย เหมาะสมกับวัยของผู้เรียน	SCALE	5	4	2026-08-21 15:06:41.902916	1	1	\N
5	สื่อการสอนที่สร้างขึ้นมีหลากหลายให้นักเรียนเลือกใช้ตามความต้องการ	SCALE	5	5	2026-08-21 15:06:41.902916	1	1	\N
6	สื่อการสอนที่สร้างขึ้นมีความน่าสนใจ กระตุ้นให้อยากเรียนรู้	SCALE	5	6	2026-08-21 15:06:41.902916	1	1	\N
7	สื่อการสอนที่สร้างขึ้นมีเครื่องมือวัด ประเมินผลและรายงานผลการเรียนรู้ได้	SCALE	5	7	2026-08-21 15:06:41.902916	1	1	\N
8	สื่อการสอนที่สร้างขึ้นมีประสิทธิภาพในภาพรวม	SCALE	5	8	2026-08-21 15:06:41.902916	1	1	\N
9	มีองค์ประกอบของแผนการจัดการเรียนรู้ครบถ้วน	SCALE	5	1	2026-08-21 15:14:00.541088	2	4	\N
10	เนื้อหาสอดคล้องกับผลการเรียนรู้ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2568 สำหรับเด็กอายุ 3-6 ปี หลักสูตรการศึกษาประถมศึกษาตอนต้น (ป.1-3) พุทธศักราช 2568 /ประถมศึกษาตอนปลาย (ป.4-6) พุทธศักราช 2569 / มาตรฐานการเรียนรู้ตัวชี้วัดตามหลักสูตรแกนกลางการศึกษาขึ้นพื้นฐาน พ.ศ. 2551	SCALE	5	2	2026-08-21 15:14:00.541088	2	5	\N
11	เนื้อหาถูกต้องตามหลักวิชาการและมีความทันสมัย	SCALE	5	3	2026-08-21 15:14:00.541088	2	5	\N
12	เนื้อหามีการเรียงลำดับจากง่ายไปยาก	SCALE	5	4	2026-08-21 15:14:00.541088	2	5	\N
13	สอดคล้องกับผลการเรียนรู้ หรือ มาตรฐานการเรียนรู้และตัวชี้วัด	SCALE	5	5	2026-08-21 15:14:00.541088	2	6	\N
14	มีความเหมาะสมกับเนื้อหาและวัยของผู้เรียน	SCALE	5	6	2026-08-21 15:14:00.541088	2	6	\N
15	เป็นกิจกรรมที่เน้นผู้เรียนเป็นสำคัญ	SCALE	5	7	2026-08-21 15:14:00.541088	2	6	\N
16	เป็นกิจกรรมที่ส่งเสริมผู้เรียนตามความถนัดและความแตกต่าง	SCALE	5	8	2026-08-21 15:14:00.541088	2	6	\N
17	เป็นกิจกรรมที่ช่วยเหลือนักเรียนที่เรียนช้าและส่งเสริมนักเรียนที่เรียนดี 	SCALE	5	9	2026-08-21 15:14:00.541088	2	6	\N
18	ความทันสมัย น่าสนใจ	SCALE	5	10	2026-08-21 15:14:00.541088	2	7	\N
19	สอดคล้องกับเนื้อหาและวัยของผู้เรียน	SCALE	5	11	2026-08-21 15:14:00.541088	2	7	\N
20	เป็นสื่อที่ผู้เรียนมีส่วนร่วมในการใช้	SCALE	5	12	2026-08-21 15:14:00.541088	2	7	\N
21	เครื่องมือวัดประเมินผลสอดคล้องกับมาตรฐานการเรียนรู้ ตัวชี้วัด เนื้อหา และกิจกรรมการเรียนการสอน	SCALE	5	13	2026-08-21 15:14:00.541088	2	8	\N
22	มีเครื่องมือและวิธีการวัดผลที่หลากหลาย	SCALE	5	14	2026-08-21 15:14:00.541088	2	8	\N
23	มีเกณฑ์การประเมิณผลสอดคล้องกับเครื่องมือและวิธีการวัดผลฯ	SCALE	5	15	2026-08-21 15:14:00.541088	2	8	\N
\.


--
-- Data for Name: evaluation_instances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_instances (id, template_id, target_type, status, start_date, end_date, created_by, created_at, updated_at, deleted_at, academic_year, round, show_score_to_visibility, template_name, instance_name, batch_id, template_type) FROM stdin;
1	1	\N	DRAFT	\N	\N	5	2026-08-21 15:06:41.902916	2026-08-21 15:06:41.902916	\N	2569	1	f	แบบนิเทศสื่อการสอน	แบบนิเทศสื่อการสอน ครั้งที่ 1/2569	98953469-f348-49bb-b980-291fef23b3df	EVALUATION
2	4	\N	OPEN	\N	\N	5	2026-08-21 15:14:00.541088	2026-08-23 11:45:20.813764	\N	2569	1	f	แบบนิเทศแผนการจัดการเรียนรู้	แบบนิเทศแผนการจัดการเรียนรู้ ครั้งที่ 1 ปี 2569	671e12ae-23c2-4035-a1dc-dd2c08c29930	EVALUATION
\.


--
-- Data for Name: evaluation_question_choices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_question_choices (id, question_id, label, score, sort_order, created_at, updated_at, deleted_at) FROM stdin;
42	1	3	3.00	3	2026-07-19 01:13:28.909083	2026-07-19 01:13:28.909083	\N
43	1	4	4.00	2	2026-07-19 01:13:45.13556	2026-07-19 01:13:45.13556	\N
44	1	5	5.00	1	2026-07-19 01:13:54.878838	2026-07-19 01:13:54.878838	\N
45	2	1	1.00	5	2026-07-19 01:15:25.528867	2026-07-19 01:15:25.528867	\N
46	2	2	2.00	4	2026-07-19 01:15:36.998597	2026-07-19 01:15:36.998597	\N
47	2	3	3.00	3	2026-07-19 01:15:45.287186	2026-07-19 01:15:45.287186	\N
48	2	4	4.00	2	2026-07-19 01:15:55.306619	2026-07-19 01:15:55.306619	\N
49	2	5	5.00	1	2026-07-19 01:16:03.7066	2026-07-19 01:16:03.7066	\N
50	3	1	1.00	5	2026-07-19 01:16:49.79069	2026-07-19 01:16:49.79069	\N
51	3	2	2.00	4	2026-07-19 01:17:03.707196	2026-07-19 01:17:03.707196	\N
52	3	3	3.00	3	2026-07-19 01:17:34.616886	2026-07-19 01:17:34.616886	\N
53	3	4	4.00	2	2026-07-19 01:17:53.689719	2026-07-19 01:17:53.689719	\N
54	3	5	5.00	1	2026-07-19 01:18:09.875529	2026-07-19 01:18:09.875529	\N
55	4	1	1.00	5	2026-07-19 01:18:23.211954	2026-07-19 01:18:23.211954	\N
56	4	2	2.00	4	2026-07-19 01:18:50.243907	2026-07-19 01:18:50.243907	\N
57	4	3	3.00	3	2026-07-19 01:18:58.327654	2026-07-19 01:18:58.327654	\N
58	4	4	4.00	2	2026-07-19 01:19:10.828257	2026-07-19 01:19:10.828257	\N
59	4	5	5.00	1	2026-07-19 01:19:17.531487	2026-07-19 01:19:17.531487	\N
60	5	1	1.00	5	2026-07-19 01:19:32.59871	2026-07-19 01:19:32.59871	\N
61	5	2	2.00	4	2026-07-19 01:19:40.423762	2026-07-19 01:19:40.423762	\N
62	5	3	3.00	3	2026-07-19 01:19:47.579591	2026-07-19 01:19:47.579591	\N
63	5	4	4.00	2	2026-07-19 01:19:56.297115	2026-07-19 01:19:56.297115	\N
64	5	5	5.00	1	2026-07-19 01:20:05.729656	2026-07-19 01:20:05.729656	\N
65	6	1	1.00	5	2026-07-19 01:20:15.491839	2026-07-19 01:20:15.491839	\N
66	6	2	2.00	4	2026-07-19 01:20:23.550534	2026-07-19 01:20:23.550534	\N
67	6	3	3.00	3	2026-07-19 01:20:42.152019	2026-07-19 01:20:42.152019	\N
68	6	4	4.00	2	2026-07-19 01:20:55.634083	2026-07-19 01:20:55.634083	\N
69	6	5	5.00	1	2026-07-19 01:21:04.128368	2026-07-19 01:21:04.128368	\N
73	7	4	4.00	2	2026-07-19 01:22:21.694138	2026-07-19 01:22:21.694138	\N
70	7	1	1.00	5	2026-07-19 01:21:28.480912	2026-07-19 01:21:28.480912	\N
71	7	2	2.00	4	2026-07-19 01:21:39.315137	2026-07-19 01:21:39.315137	\N
72	7	3	3.00	3	2026-07-19 01:21:54.715821	2026-07-19 01:21:54.715821	\N
74	7	5	5.00	1	2026-07-19 01:22:29.99457	2026-07-19 01:22:29.99457	\N
75	8	1	1.00	5	2026-07-19 01:22:41.667119	2026-07-19 01:22:41.667119	\N
76	8	2	2.00	4	2026-07-19 01:22:48.384349	2026-07-19 01:22:48.384349	\N
77	8	3	3.00	3	2026-07-19 01:22:54.610148	2026-07-19 01:22:54.610148	\N
78	8	4	4.00	2	2026-07-19 01:23:03.050306	2026-07-19 01:23:03.050306	\N
79	8	5	5.00	1	2026-07-19 01:23:12.999763	2026-07-19 01:23:12.999763	\N
80	9	1	1.00	5	2026-07-19 01:23:45.591588	2026-07-19 01:23:45.591588	\N
81	9	2	2.00	4	2026-07-19 01:23:55.170608	2026-07-19 01:23:55.170608	\N
82	9	3	3.00	3	2026-07-19 01:24:03.752354	2026-07-19 01:24:03.752354	\N
83	9	4	4.00	2	2026-07-19 01:24:21.764396	2026-07-19 01:24:21.764396	\N
84	9	5	5.00	1	2026-07-19 01:24:31.229348	2026-07-19 01:24:31.229348	\N
85	10	1	1.00	5	2026-07-19 01:24:39.871147	2026-07-19 01:24:39.871147	\N
86	10	2	2.00	4	2026-07-19 01:24:48.44302	2026-07-19 01:24:48.44302	\N
87	10	3	3.00	3	2026-07-19 01:25:01.47485	2026-07-19 01:25:01.47485	\N
88	10	4	4.00	2	2026-07-19 01:25:16.191985	2026-07-19 01:25:16.191985	\N
89	10	5	5.00	1	2026-07-19 01:25:26.351535	2026-07-19 01:25:26.351535	\N
91	13	1	1.00	5	2026-07-19 01:26:37.448782	2026-07-19 01:26:37.448782	\N
92	13	2	2.00	4	2026-07-19 01:26:43.247099	2026-07-19 01:26:43.247099	\N
93	13	3	3.00	3	2026-07-19 01:26:50.493515	2026-07-19 01:26:50.493515	\N
94	13	4	4.00	2	2026-07-19 01:26:57.363239	2026-07-19 01:26:57.363239	\N
95	13	5	5.00	1	2026-07-19 01:27:09.035321	2026-07-19 01:27:09.035321	\N
96	14	1	1.00	5	2026-07-19 01:27:22.190436	2026-07-19 01:27:22.190436	\N
97	14	2	2.00	4	2026-07-19 01:27:29.494535	2026-07-19 01:27:29.494535	\N
98	14	3	3.00	3	2026-07-19 01:27:36.132084	2026-07-19 01:27:36.132084	\N
99	14	4	4.00	2	2026-07-19 01:27:42.633193	2026-07-19 01:27:42.633193	\N
100	14	5	5.00	1	2026-07-19 01:27:49.371558	2026-07-19 01:27:49.371558	\N
101	15	1	1.00	5	2026-07-19 01:28:11.719363	2026-07-19 01:28:11.719363	\N
102	15	2	2.00	4	2026-07-19 01:28:17.382457	2026-07-19 01:28:17.382457	\N
103	15	3	3.00	3	2026-07-19 01:28:41.416726	2026-07-19 01:28:41.416726	\N
104	15	4	4.00	2	2026-07-19 01:28:53.518868	2026-07-19 01:28:53.518868	\N
105	15	5	5.00	1	2026-07-19 01:29:07.050262	2026-07-19 01:29:07.050262	\N
106	16	1	1.00	5	2026-07-19 01:29:16.797311	2026-07-19 01:29:16.797311	\N
107	16	2	2.00	4	2026-07-19 01:29:24.152353	2026-07-19 01:29:24.152353	\N
108	16	3	3.00	3	2026-07-19 01:29:29.604878	2026-07-19 01:29:29.604878	\N
109	16	4	4.00	2	2026-07-19 01:29:35.879032	2026-07-19 01:29:35.879032	\N
110	16	5	5.00	1	2026-07-19 01:29:45.774696	2026-07-19 01:29:45.774696	\N
111	17	1	1.00	5	2026-07-19 01:29:54.039185	2026-07-19 01:29:54.039185	\N
112	18	2	2.00	4	2026-07-19 01:30:01.792529	2026-07-19 01:30:01.792529	\N
113	18	3	3.00	3	2026-07-19 01:30:08.829526	2026-07-19 01:30:08.829526	\N
114	18	4	4.00	2	2026-07-19 01:30:15.584439	2026-07-19 01:30:15.584439	\N
115	18	5	5.00	1	2026-07-19 01:30:27.895565	2026-07-19 01:30:27.895565	\N
116	19	1	1.00	5	2026-07-19 01:30:34.338285	2026-07-19 01:30:34.338285	\N
117	19	2	2.00	4	2026-07-19 01:30:43.809807	2026-07-19 01:30:43.809807	\N
118	19	3	3.00	3	2026-07-19 01:30:50.022465	2026-07-19 01:30:50.022465	\N
119	19	4	4.00	2	2026-07-19 01:30:55.985594	2026-07-19 01:30:55.985594	\N
120	19	5	5.00	1	2026-07-19 01:31:01.034213	2026-07-19 01:31:01.034213	\N
121	20	1	1.00	5	2026-07-19 01:31:10.043443	2026-07-19 01:31:10.043443	\N
122	20	2	2.00	4	2026-07-19 01:31:18.067212	2026-07-19 01:31:18.067212	\N
123	20	3	3.00	3	2026-07-19 01:31:23.618356	2026-07-19 01:31:23.618356	\N
124	20	4	4.00	2	2026-07-19 01:31:30.315149	2026-07-19 01:31:30.315149	\N
125	20	5	5.00	1	2026-07-19 01:31:38.098964	2026-07-19 01:31:38.098964	\N
126	21	1	1.00	5	2026-07-19 01:31:49.297543	2026-07-19 01:31:49.297543	\N
127	21	2	2.00	4	2026-07-19 01:31:55.56038	2026-07-19 01:31:55.56038	\N
128	21	3	3.00	3	2026-07-19 01:32:01.491533	2026-07-19 01:32:01.491533	\N
129	21	4	4.00	2	2026-07-19 01:32:11.404619	2026-07-19 01:32:11.404619	\N
130	21	5	5.00	1	2026-07-19 01:32:25.123559	2026-07-19 01:32:25.123559	\N
131	22	1	1.00	5	2026-07-19 01:32:37.263217	2026-07-19 01:32:37.263217	\N
132	22	2	2.00	4	2026-07-19 01:32:42.314642	2026-07-19 01:32:42.314642	\N
133	22	3	3.00	3	2026-07-19 01:32:46.681029	2026-07-19 01:32:46.681029	\N
134	22	4	4.00	2	2026-07-19 01:32:52.098156	2026-07-19 01:32:52.098156	\N
135	22	5	5.00	1	2026-07-19 01:32:58.015073	2026-07-19 01:32:58.015073	\N
136	23	1	1.00	5	2026-07-19 01:33:04.697709	2026-07-19 01:33:04.697709	\N
137	23	2	2.00	4	2026-07-19 01:33:11.849835	2026-07-19 01:33:11.849835	\N
138	23	3	3.00	3	2026-07-19 01:33:17.904762	2026-07-19 01:33:17.904762	\N
139	23	4	4.00	2	2026-07-19 01:33:22.065123	2026-07-19 01:33:22.065123	\N
140	23	5	5.00	1	2026-07-19 01:33:28.083584	2026-07-19 01:33:28.083584	\N
141	24	1	1.00	5	2026-07-19 01:33:35.381271	2026-07-19 01:33:35.381271	\N
142	24	2	2.00	4	2026-07-19 01:33:45.613397	2026-07-19 01:33:45.613397	\N
143	24	3	3.00	3	2026-07-19 01:33:50.696211	2026-07-19 01:33:50.696211	\N
144	24	4	4.00	2	2026-07-19 01:33:57.327616	2026-07-19 01:33:57.327616	\N
145	24	5	5.00	1	2026-07-19 01:34:03.695004	2026-07-19 01:34:03.695004	\N
146	25	1	1.00	5	2026-07-19 01:34:12.826353	2026-07-19 01:34:12.826353	\N
40	1	1	1.00	5	2569-07-19 08:10:34	2569-07-19 08:10:37	\N
147	25	2	2.00	4	2026-07-19 01:34:18.232619	2026-07-19 01:34:18.232619	\N
148	25	3	3.00	3	2026-07-19 01:34:23.992304	2026-07-19 01:34:23.992304	\N
149	25	4	4.00	2	2026-07-19 01:34:29.723838	2026-07-19 01:34:29.723838	\N
150	25	5	5.00	1	2026-07-19 01:34:35.892629	2026-07-19 01:34:35.892629	\N
151	17	2	2.00	4	2026-07-19 01:35:57.21366	2026-07-19 01:35:57.21366	\N
152	17	3	3.00	3	2026-07-19 01:36:09.088082	2026-07-19 01:36:09.088082	\N
153	17	4	4.00	2	2026-07-19 01:36:17.217947	2026-07-19 01:36:17.217947	\N
154	17	5	5.00	1	2026-07-19 01:36:24.40927	2026-07-19 01:36:24.40927	\N
155	18	1	1.00	5	2026-07-19 01:37:11.192147	2026-07-19 01:37:11.192147	\N
156	26	1	1.00	5	2026-07-19 01:55:51.866351	2026-07-19 01:55:51.866351	\N
157	26	2	2.00	4	2026-07-19 01:56:01.152178	2026-07-19 01:56:01.152178	\N
158	26	3	3.00	3	2026-07-19 01:56:09.414654	2026-07-19 01:56:09.414654	\N
159	26	4	4.00	2	2026-07-19 01:56:20.260014	2026-07-19 01:56:20.260014	\N
160	26	5	5.00	1	2026-07-19 01:56:27.697738	2026-07-19 01:56:27.697738	\N
161	27	1	1.00	5	2026-07-19 01:57:00.696088	2026-07-19 01:57:00.696088	\N
162	27	2	2.00	4	2026-07-19 01:57:07.547617	2026-07-19 01:57:07.547617	\N
163	27	3	3.00	3	2026-07-19 01:57:13.791733	2026-07-19 01:57:13.791733	\N
164	27	4	4.00	2	2026-07-19 01:57:19.308639	2026-07-19 01:57:19.308639	\N
165	27	5	5.00	1	2026-07-19 01:57:26.604034	2026-07-19 01:57:26.604034	\N
166	28	1	1.00	5	2026-07-19 01:57:35.685471	2026-07-19 01:57:35.685471	\N
167	28	2	2.00	4	2026-07-19 01:57:45.528884	2026-07-19 01:57:45.528884	\N
168	28	3	3.00	3	2026-07-19 01:57:56.676702	2026-07-19 01:57:56.676702	\N
169	28	4	4.00	2	2026-07-19 01:58:06.145768	2026-07-19 01:58:06.145768	\N
170	28	5	5.00	1	2026-07-19 01:58:14.376082	2026-07-19 01:58:14.376082	\N
171	29	1	1.00	5	2026-07-19 01:58:22.267976	2026-07-19 01:58:22.267976	\N
172	29	2	2.00	4	2026-07-19 01:58:34.670022	2026-07-19 01:58:34.670022	\N
173	29	3	3.00	3	2026-07-19 01:58:42.773911	2026-07-19 01:58:42.773911	\N
174	29	4	4.00	2	2026-07-19 01:58:49.97974	2026-07-19 01:58:49.97974	\N
175	29	5	5.00	1	2026-07-19 01:58:57.794139	2026-07-19 01:58:57.794139	\N
176	30	1	1.00	5	2026-07-19 01:59:04.826859	2026-07-19 01:59:04.826859	\N
177	30	2	2.00	4	2026-07-19 01:59:13.469543	2026-07-19 01:59:13.469543	\N
178	30	3	3.00	3	2026-07-19 01:59:21.684326	2026-07-19 01:59:21.684326	\N
179	30	4	4.00	2	2026-07-19 01:59:32.705828	2026-07-19 01:59:32.705828	\N
180	30	5	5.00	1	2026-07-19 01:59:38.851007	2026-07-19 01:59:38.851007	\N
181	31	1	1.00	5	2026-07-19 01:59:47.716359	2026-07-19 01:59:47.716359	\N
182	31	2	2.00	4	2026-07-19 01:59:54.834595	2026-07-19 01:59:54.834595	\N
183	31	3	3.00	3	2026-07-19 01:59:59.634599	2026-07-19 01:59:59.634599	\N
184	31	4	4.00	2	2026-07-19 02:00:05.583318	2026-07-19 02:00:05.583318	\N
185	31	5	5.00	1	2026-07-19 02:00:11.71871	2026-07-19 02:00:11.71871	\N
186	32	1	1.00	5	2026-07-19 11:45:28.416445	2026-07-19 11:45:28.416445	\N
187	32	2	2.00	4	2026-07-19 11:45:41.629537	2026-07-19 11:45:41.629537	\N
188	32	3	3.00	3	2026-07-19 11:45:48.569835	2026-07-19 11:45:48.569835	\N
189	32	4	4.00	2	2026-07-19 11:45:54.676275	2026-07-19 11:45:54.676275	\N
190	32	5	5.00	1	2026-07-19 11:46:01.463941	2026-07-19 11:46:01.463941	\N
191	33	1	1.00	5	2026-07-19 11:46:08.405012	2026-07-19 11:46:08.405012	\N
192	33	2	2.00	4	2026-07-19 11:46:19.348831	2026-07-19 11:46:19.348831	\N
193	33	3	3.00	3	2026-07-19 11:46:25.205141	2026-07-19 11:46:25.205141	\N
194	33	4	4.00	2	2026-07-19 11:46:31.709049	2026-07-19 11:46:31.709049	\N
195	33	5	5.00	1	2026-07-19 11:46:38.456769	2026-07-19 11:46:38.456769	\N
196	34	1	1.00	5	2026-07-19 11:46:45.674771	2026-07-19 11:46:45.674771	\N
197	34	2	2.00	4	2026-07-19 11:46:51.473141	2026-07-19 11:46:51.473141	\N
198	34	3	3.00	3	2026-07-19 11:46:58.413536	2026-07-19 11:46:58.413536	\N
199	34	4	4.00	2	2026-07-19 11:47:04.705698	2026-07-19 11:47:04.705698	\N
200	34	5	5.00	1	2026-07-19 11:47:11.869997	2026-07-19 11:47:11.869997	\N
201	35	1	1.00	5	2026-07-19 11:49:23.7881	2026-07-19 11:49:23.7881	\N
202	35	2	2.00	4	2026-07-19 11:49:31.557956	2026-07-19 11:49:31.557956	\N
203	35	3	3.00	3	2026-07-19 11:49:39.636461	2026-07-19 11:49:39.636461	\N
204	35	4	4.00	2	2026-07-19 11:49:45.496054	2026-07-19 11:49:45.496054	\N
205	35	5	5.00	1	2026-07-19 11:49:51.537687	2026-07-19 11:49:51.537687	\N
206	36	1	1.00	5	2026-07-19 11:50:15.70984	2026-07-19 11:50:15.70984	\N
207	36	2	2.00	4	2026-07-19 11:50:21.996549	2026-07-19 11:50:21.996549	\N
209	36	4	4.00	2	2026-07-19 11:50:55.190894	2026-07-19 11:50:55.190894	\N
208	36	3	3.00	3	2026-07-19 11:50:28.51321	2026-07-19 11:50:28.51321	\N
210	36	5	5.00	1	2026-07-19 11:51:02.226054	2026-07-19 11:51:02.226054	\N
211	37	1	1.00	5	2026-07-19 11:51:12.339823	2026-07-19 11:51:12.339823	\N
212	37	2	2.00	4	2026-07-19 11:51:25.956992	2026-07-19 11:51:25.956992	\N
213	37	3	3.00	3	2026-07-19 11:51:35.797238	2026-07-19 11:51:35.797238	\N
214	37	4	4.00	2	2026-07-19 11:51:42.242706	2026-07-19 11:51:42.242706	\N
215	37	5	5.00	1	2026-07-19 11:52:10.751897	2026-07-19 11:52:10.751897	\N
216	38	1	1.00	5	2026-07-19 11:52:47.097278	2026-07-19 11:52:47.097278	\N
217	38	2	2.00	4	2026-07-19 11:52:54.539182	2026-07-19 11:52:54.539182	\N
218	38	3	3.00	3	2026-07-19 11:53:04.086378	2026-07-19 11:53:04.086378	\N
219	38	4	4.00	2	2026-07-19 11:53:30.276225	2026-07-19 11:53:30.276225	\N
220	38	5	5.00	1	2026-07-19 11:53:37.12555	2026-07-19 11:53:37.12555	\N
221	39	1	1.00	5	2026-07-19 11:53:44.327563	2026-07-19 11:53:44.327563	\N
222	39	2	2.00	4	2026-07-19 11:53:51.108503	2026-07-19 11:53:51.108503	\N
223	39	3	3.00	3	2026-07-19 11:53:57.66142	2026-07-19 11:53:57.66142	\N
224	39	4	4.00	2	2026-07-19 11:54:03.256015	2026-07-19 11:54:03.256015	\N
225	39	5	5.00	1	2026-07-19 11:54:10.032863	2026-07-19 11:54:10.032863	\N
226	40	1	1.00	5	2026-07-19 11:54:17.523816	2026-07-19 11:54:17.523816	\N
227	40	2	2.00	4	2026-07-19 11:54:25.744497	2026-07-19 11:54:25.744497	\N
228	40	3	3.00	3	2026-07-19 11:54:31.673136	2026-07-19 11:54:31.673136	\N
229	40	4	4.00	2	2026-07-19 11:54:40.457904	2026-07-19 11:54:40.457904	\N
230	40	5	5.00	1	2569-07-19 18:54:58	2026-07-19 11:55:01.100512	\N
231	41	1	1.00	5	2026-07-19 11:55:10.697274	2026-07-19 11:55:10.697274	\N
232	41	2	2.00	4	2026-07-19 11:55:25.385979	2026-07-19 11:55:25.385979	\N
233	41	3	3.00	3	2026-07-19 11:55:33.640906	2026-07-19 11:55:33.640906	\N
234	41	4	4.00	2	2026-07-19 11:55:41.802221	2026-07-19 11:55:41.802221	\N
235	41	5	5.00	1	2026-07-19 11:55:52.205442	2026-07-19 11:55:52.205442	\N
244	42	2	2.00	4	2026-07-19 12:02:14.781009	2026-07-19 12:02:14.781009	\N
245	42	3	3.00	3	2026-07-19 12:02:22.424285	2026-07-19 12:02:22.424285	\N
246	42	4	4.00	2	2026-07-19 12:02:30.199537	2026-07-19 12:02:30.199537	\N
247	42	5	5.00	1	2026-07-19 12:02:40.002299	2026-07-19 12:02:40.002299	\N
248	43	1	1.00	5	2026-07-19 12:02:48.330414	2026-07-19 12:02:48.330414	\N
249	43	2	2.00	4	2026-07-19 12:02:55.127556	2026-07-19 12:02:55.127556	\N
250	43	3	3.00	3	2026-07-19 12:03:01.316991	2026-07-19 12:03:01.316991	\N
251	43	4	4.00	2	2569-07-19 19:03:22	2569-07-19 19:03:24	\N
252	43	5	5.00	1	2026-07-19 12:04:07.045728	2026-07-19 12:04:07.045728	\N
253	44	1	1.00	5	2026-07-19 12:04:22.877957	2026-07-19 12:04:22.877957	\N
254	44	2	2.00	4	2026-07-19 12:04:29.624761	2026-07-19 12:04:29.624761	\N
255	44	3	3.00	3	2026-07-19 12:04:35.468369	2026-07-19 12:04:35.468369	\N
256	44	4	4.00	2	2026-07-19 12:04:42.056042	2026-07-19 12:04:42.056042	\N
257	44	5	5.00	1	2026-07-19 12:04:47.907147	2026-07-19 12:04:47.907147	\N
258	45	1	1.00	5	2026-07-19 12:04:57.23519	2026-07-19 12:04:57.23519	\N
259	45	2	2.00	4	2026-07-19 12:05:03.712123	2026-07-19 12:05:03.712123	\N
260	45	3	3.00	3	2026-07-19 12:05:12.476384	2026-07-19 12:05:12.476384	\N
261	45	4	4.00	2	2026-07-19 12:05:18.33861	2026-07-19 12:05:18.33861	\N
262	45	5	5.00	1	2026-07-19 12:05:25.879926	2026-07-19 12:05:25.879926	\N
263	46	1	1.00	5	2026-07-19 12:05:44.825807	2026-07-19 12:05:44.825807	\N
264	46	2	2.00	4	2569-07-19 19:05:54	2026-07-19 12:05:57.326971	\N
265	46	3	3.00	3	2026-07-19 12:06:03.565595	2026-07-19 12:06:03.565595	\N
266	46	4	4.00	2	2026-07-19 12:06:09.836232	2026-07-19 12:06:09.836232	\N
267	46	5	5.00	1	2026-07-19 12:06:16.240672	2026-07-19 12:06:16.240672	\N
268	47	1	1.00	5	2026-07-19 12:08:01.658253	2026-07-19 12:08:01.658253	\N
269	47	2	2.00	4	2026-07-19 12:08:15.751762	2026-07-19 12:08:15.751762	\N
270	47	3	3.00	3	2026-07-19 12:08:21.494103	2026-07-19 12:08:21.494103	\N
271	47	4	4.00	2	2026-07-19 12:08:28.836257	2026-07-19 12:08:28.836257	\N
272	47	5	5.00	1	2026-07-19 12:08:35.653146	2026-07-19 12:08:35.653146	\N
273	48	1	1.00	5	2026-07-19 12:09:27.246495	2026-07-19 12:09:27.246495	\N
274	48	2	2.00	4	2026-07-19 12:09:36.342478	2026-07-19 12:09:36.342478	\N
275	48	3	3.00	3	2026-07-19 12:09:42.925249	2026-07-19 12:09:42.925249	\N
276	48	4	4.00	2	2026-07-19 12:09:51.263582	2026-07-19 12:09:51.263582	\N
277	48	5	5.00	1	2026-07-19 12:10:00.211018	2026-07-19 12:10:00.211018	\N
278	49	1	1.00	5	2026-07-19 12:10:38.075645	2026-07-19 12:10:38.075645	\N
279	49	2	2.00	4	2026-07-19 12:10:44.782211	2026-07-19 12:10:44.782211	\N
280	49	3	3.00	3	2026-07-19 12:10:50.099012	2026-07-19 12:10:50.099012	\N
281	49	4	4.00	2	2026-07-19 12:10:56.606991	2026-07-19 12:10:56.606991	\N
282	49	5	5.00	1	2026-07-19 12:11:04.780951	2026-07-19 12:11:04.780951	\N
283	52	1	1.00	5	2026-07-19 12:13:09.832643	2026-07-19 12:13:09.832643	\N
284	52	2	2.00	4	2026-07-19 12:13:20.896559	2026-07-19 12:13:20.896559	\N
285	52	3	3.00	3	2026-07-19 12:13:27.731688	2026-07-19 12:13:27.731688	\N
286	52	4	4.00	2	2026-07-19 12:13:34.324968	2026-07-19 12:13:34.324968	\N
287	52	5	5.00	1	2026-07-19 12:13:42.204408	2026-07-19 12:13:42.204408	\N
288	53	1	1.00	5	2026-07-19 12:13:50.430046	2026-07-19 12:13:50.430046	\N
289	53	2	2.00	4	2026-07-19 12:13:58.065886	2026-07-19 12:13:58.065886	\N
290	53	3	3.00	3	2026-07-19 12:14:03.891448	2026-07-19 12:14:03.891448	\N
291	53	4	4.00	2	2026-07-19 12:14:12.878435	2026-07-19 12:14:12.878435	\N
292	53	5	5.00	1	2026-07-19 12:14:20.550879	2026-07-19 12:14:20.550879	\N
293	54	1	1.00	5	2026-07-19 12:15:32.860724	2026-07-19 12:15:32.860724	\N
294	54	2	2.00	4	2026-07-19 12:15:40.725449	2026-07-19 12:15:40.725449	\N
295	54	3	3.00	3	2026-07-19 12:15:50.8675	2026-07-19 12:15:50.8675	\N
296	54	4	4.00	2	2026-07-19 12:15:57.58152	2026-07-19 12:15:57.58152	\N
297	54	5	5.00	1	2026-07-19 12:16:05.420053	2026-07-19 12:16:05.420053	\N
298	55	1	1.00	5	2026-07-19 12:16:14.683116	2026-07-19 12:16:14.683116	\N
299	55	2	2.00	4	2026-07-19 12:16:24.784162	2026-07-19 12:16:24.784162	\N
300	55	3	3.00	3	2026-07-19 12:16:30.646548	2026-07-19 12:16:30.646548	\N
301	55	4	4.00	2	2026-07-19 12:16:36.870196	2026-07-19 12:16:36.870196	\N
302	55	5	5.00	1	2026-07-19 12:16:44.096053	2026-07-19 12:16:44.096053	\N
303	56	1	1.00	5	2026-07-19 12:19:27.686968	2026-07-19 12:19:27.686968	\N
304	56	2	2.00	4	2026-07-19 12:19:36.09577	2026-07-19 12:19:36.09577	\N
305	56	3	3.00	3	2026-07-19 12:19:42.444599	2026-07-19 12:19:42.444599	\N
306	56	4	4.00	2	2026-07-19 12:19:49.274979	2026-07-19 12:19:49.274979	\N
307	56	5	5.00	1	2026-07-19 12:19:55.70153	2026-07-19 12:19:55.70153	\N
308	57	1	1.00	5	2026-07-19 12:20:07.85994	2026-07-19 12:20:07.85994	\N
309	57	2	2.00	4	2026-07-19 12:20:14.687682	2026-07-19 12:20:14.687682	\N
310	57	3	3.00	3	2026-07-19 12:20:22.485066	2026-07-19 12:20:22.485066	\N
311	57	4	4.00	2	2026-07-19 12:20:29.510511	2026-07-19 12:20:29.510511	\N
312	57	5	5.00	1	2026-07-19 12:20:36.826043	2026-07-19 12:20:36.826043	\N
41	1	2	2.00	4	2569-07-19 08:11:41	2569-07-19 08:11:44	\N
243	42	1	1.00	5	2026-07-19 12:02:07.064451	2026-07-19 12:02:07.064451	\N
313	58	1	1.00	5	2026-08-02 07:26:35.897358	2026-08-02 07:26:35.897358	\N
314	58	2	2.00	4	2026-08-02 07:26:46.763327	2026-08-02 07:26:46.763327	\N
315	58	3	3.00	3	2026-08-02 07:26:54.203936	2026-08-02 07:26:54.203936	\N
316	58	4	4.00	2	2026-08-02 07:27:02.074562	2026-08-02 07:27:02.074562	\N
317	58	5	5.00	1	2026-08-02 07:27:18.03316	2026-08-02 07:27:18.03316	\N
318	59	1	1.00	5	2026-08-02 07:27:27.11018	2026-08-02 07:27:27.11018	\N
319	59	2	2.00	4	2026-08-02 07:27:34.397253	2026-08-02 07:27:34.397253	\N
320	59	3	3.00	3	2026-08-02 07:27:47.001306	2026-08-02 07:27:47.001306	\N
321	59	4	4.00	2	2026-08-02 07:27:58.879155	2026-08-02 07:27:58.879155	\N
322	59	5	5.00	1	2026-08-02 07:28:06.475436	2026-08-02 07:28:06.475436	\N
323	60	1	1.00	5	2026-08-02 07:28:18.073738	2026-08-02 07:28:18.073738	\N
324	60	2	2.00	4	2026-08-02 07:28:26.131223	2026-08-02 07:28:26.131223	\N
325	60	3	3.00	3	2026-08-02 07:28:33.202883	2026-08-02 07:28:33.202883	\N
326	60	4	4.00	2	2026-08-02 07:28:43.516927	2026-08-02 07:28:43.516927	\N
327	60	5	5.00	1	2026-08-02 07:28:51.704275	2026-08-02 07:28:51.704275	\N
328	61	1	1.00	5	2026-08-02 07:29:02.536414	2026-08-02 07:29:02.536414	\N
329	61	2	2.00	4	2026-08-02 07:29:10.633414	2026-08-02 07:29:10.633414	\N
330	61	3	3.00	3	2026-08-02 07:29:16.783332	2026-08-02 07:29:16.783332	\N
331	61	4	4.00	2	2026-08-02 07:29:29.288267	2026-08-02 07:29:29.288267	\N
332	61	5	5.00	1	2026-08-02 07:29:37.284289	2026-08-02 07:29:37.284289	\N
333	62	1	1.00	5	2026-08-02 07:29:49.287515	2026-08-02 07:29:49.287515	\N
334	62	2	2.00	4	2026-08-02 07:29:56.948401	2026-08-02 07:29:56.948401	\N
335	62	3	3.00	3	2026-08-02 07:30:03.932117	2026-08-02 07:30:03.932117	\N
336	62	4	4.00	2	2026-08-02 07:30:10.721162	2026-08-02 07:30:10.721162	\N
337	62	5	5.00	1	2026-08-02 07:30:18.144007	2026-08-02 07:30:18.144007	\N
338	63	1	1.00	5	2026-08-02 07:30:40.046652	2026-08-02 07:30:40.046652	\N
339	63	2	2.00	4	2026-08-02 07:30:49.345277	2026-08-02 07:30:49.345277	\N
340	63	3	3.00	3	2026-08-02 07:30:58.121705	2026-08-02 07:30:58.121705	\N
341	63	4	4.00	2	2026-08-02 07:31:04.889269	2026-08-02 07:31:04.889269	\N
342	63	5	5.00	1	2026-08-02 07:31:11.904195	2026-08-02 07:31:11.904195	\N
343	64	1	1.00	5	2026-08-02 07:31:21.316123	2026-08-02 07:31:21.316123	\N
344	64	2	2.00	4	2026-08-02 07:31:29.524606	2026-08-02 07:31:29.524606	\N
345	64	3	3.00	3	2026-08-02 07:31:40.070312	2026-08-02 07:31:40.070312	\N
346	64	4	4.00	2	2026-08-02 07:31:47.429009	2026-08-02 07:31:47.429009	\N
350	65	1	1.00	5	2026-08-02 07:32:20.60649	2026-08-02 07:32:20.60649	\N
347	64	5	5.00	1	2026-08-02 07:31:54.422821	2026-08-02 07:31:54.422821	\N
351	65	2	2.00	4	2026-08-02 07:32:28.793825	2026-08-02 07:32:28.793825	\N
352	65	3	3.00	3	2026-08-02 07:32:34.386544	2026-08-02 07:32:34.386544	\N
353	65	4	4.00	2	2026-08-02 07:32:39.560762	2026-08-02 07:32:39.560762	\N
354	65	5	5.00	1	2026-08-02 07:32:44.683033	2026-08-02 07:32:44.683033	\N
355	66	1	1.00	5	2026-08-02 07:32:50.544104	2026-08-02 07:32:50.544104	\N
356	66	2	2.00	4	2026-08-02 07:32:57.592623	2026-08-02 07:32:57.592623	\N
357	66	3	3.00	3	2026-08-02 07:33:03.329785	2026-08-02 07:33:03.329785	\N
358	66	4	4.00	2	2026-08-02 07:33:10.543935	2026-08-02 07:33:10.543935	\N
359	66	5	5.00	1	2026-08-02 07:33:16.279437	2026-08-02 07:33:16.279437	\N
360	67	1	1.00	5	2026-08-02 07:33:22.027545	2026-08-02 07:33:22.027545	\N
361	67	2	2.00	4	2026-08-02 07:33:27.075085	2026-08-02 07:33:27.075085	\N
362	67	3	3.00	3	2026-08-02 07:33:57.154053	2026-08-02 07:33:57.154053	\N
363	67	4	4.00	2	2026-08-02 07:34:07.106885	2026-08-02 07:34:07.106885	\N
364	67	5	5.00	1	2026-08-02 07:34:18.401551	2026-08-02 07:34:18.401551	\N
\.


--
-- Data for Name: evaluation_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_questions (id, section_id, question, question_type, required, sort_order, created_at, updated_at, deleted_at) FROM stdin;
1	1	สื่อการสอนที่สร้างขึ้นเหมาะสมและสอดคล้องกับเนื้อหาวิชา	SCALE	t	1	2026-07-10 15:21:27.224442	2026-07-10 15:21:27.224442	\N
2	1	สื่อการสอนที่สร้างขึ้นเหมาะสมกับวิธีการสอน	SCALE	t	2	2026-07-10 15:21:27.224442	2026-07-10 15:21:27.224442	\N
3	1	สื่อการสอนที่สร้างขึ้นมีความถูกต้อง ชัดเจน	SCALE	t	3	2026-07-10 15:21:27.224442	2026-07-10 15:21:27.224442	\N
4	1	สื่อการสอนที่สร้างขึ้นมีความทันสมัย เหมาะสมกับวัยของผู้เรียน	SCALE	t	4	2569-07-11 20:42:36	2026-07-11 13:42:42.485969	\N
5	1	สื่อการสอนที่สร้างขึ้นมีหลากหลายให้นักเรียนเลือกใช้ตามความต้องการ	SCALE	t	5	2026-07-11 13:43:03.316139	2026-07-11 13:43:03.316139	\N
7	1	สื่อการสอนที่สร้างขึ้นมีเครื่องมือวัด ประเมินผลและรายงานผลการเรียนรู้ได้	SCALE	t	7	2026-07-11 13:44:09.211363	2026-07-11 13:44:09.211363	\N
8	1	สื่อการสอนที่สร้างขึ้นมีประสิทธิภาพในภาพรวม	SCALE	t	8	2026-07-11 13:44:31.024126	2026-07-11 13:44:31.024126	\N
6	1	สื่อการสอนที่สร้างขึ้นมีความน่าสนใจ กระตุ้นให้อยากเรียนรู้	SCALE	t	6	2026-07-11 13:43:43.180467	2026-07-11 13:43:43.180467	\N
10	5	เนื้อหาสอดคล้องกับผลการเรียนรู้ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2568 สำหรับเด็กอายุ 3-6 ปี หลักสูตรการศึกษาประถมศึกษาตอนต้น (ป.1-3) พุทธศักราช 2568 /ประถมศึกษาตอนปลาย (ป.4-6) พุทธศักราช 2569 / มาตรฐานการเรียนรู้ตัวชี้วัดตามหลักสูตรแกนกลางการศึกษาขึ้นพื้นฐาน พ.ศ. 2551	SCALE	t	2	2026-07-19 01:02:14.64491	2026-07-19 01:02:14.64491	\N
9	4	มีองค์ประกอบของแผนการจัดการเรียนรู้ครบถ้วน	SCALE	t	1	2026-07-19 01:01:25.192589	2026-07-19 01:01:25.192589	\N
13	5	เนื้อหาถูกต้องตามหลักวิชาการและมีความทันสมัย	SCALE	t	3	2026-07-19 01:02:34.945249	2026-07-19 01:02:34.945249	\N
14	5	เนื้อหามีการเรียงลำดับจากง่ายไปยาก	SCALE	t	4	2026-07-19 01:02:56.70947	2026-07-19 01:02:56.70947	\N
18	6	เป็นกิจกรรมที่ส่งเสริมผู้เรียนตามความถนัดและความแตกต่าง	SCALE	t	8	2026-07-19 01:04:47.009361	2026-07-19 01:04:47.009361	\N
15	6	สอดคล้องกับผลการเรียนรู้ หรือ มาตรฐานการเรียนรู้และตัวชี้วัด	SCALE	t	5	2026-07-19 01:04:01.09626	2026-07-19 01:04:01.09626	\N
16	6	มีความเหมาะสมกับเนื้อหาและวัยของผู้เรียน	SCALE	t	6	2026-07-19 01:04:16.745564	2026-07-19 01:04:16.745564	\N
17	6	เป็นกิจกรรมที่เน้นผู้เรียนเป็นสำคัญ	SCALE	t	7	2026-07-19 01:04:32.299007	2026-07-19 01:04:32.299007	\N
19	6	เป็นกิจกรรมที่ช่วยเหลือนักเรียนที่เรียนช้าและส่งเสริมนักเรียนที่เรียนดี 	SCALE	t	9	2026-07-19 01:05:05.688803	2026-07-19 01:05:05.688803	\N
20	7	ความทันสมัย น่าสนใจ	SCALE	t	10	2026-07-19 01:05:23.035186	2026-07-19 01:05:23.035186	\N
21	7	สอดคล้องกับเนื้อหาและวัยของผู้เรียน	SCALE	t	11	2026-07-19 01:05:34.118617	2026-07-19 01:05:34.118617	\N
22	7	เป็นสื่อที่ผู้เรียนมีส่วนร่วมในการใช้	SCALE	t	12	2026-07-19 01:05:44.578805	2026-07-19 01:05:44.578805	\N
23	8	เครื่องมือวัดประเมินผลสอดคล้องกับมาตรฐานการเรียนรู้ ตัวชี้วัด เนื้อหา และกิจกรรมการเรียนการสอน	SCALE	t	13	2026-07-19 01:06:05.955193	2026-07-19 01:06:05.955193	\N
24	8	มีเครื่องมือและวิธีการวัดผลที่หลากหลาย	SCALE	t	14	2026-07-19 01:06:16.335953	2026-07-19 01:06:16.335953	\N
25	8	มีเกณฑ์การประเมิณผลสอดคล้องกับเครื่องมือและวิธีการวัดผลฯ	SCALE	t	15	2026-07-19 01:06:28.005137	2026-07-19 01:06:28.005137	\N
26	9	เชื่อมั่นในตนเอง	SCALE	t	1	2026-07-19 01:47:24.297644	2026-07-19 01:47:24.297644	\N
27	9	แต่งกายสุภาพ เรียบร้อย และเหมาะสมกับอาชีพครู	SCALE	t	2	2026-07-19 01:47:48.134369	2026-07-19 01:47:48.134369	\N
28	9	ใช้ภาษาถูกต้องชัดเจน	SCALE	t	3	2026-07-19 01:48:11.771859	2026-07-19 01:48:11.771859	\N
29	10	จัดเตรียมสื่อการสอนและเนื้อหาสาระเหมาะสมกับกิจกรรม	SCALE	t	1	2026-07-19 01:48:42.525379	2026-07-19 01:48:42.525379	\N
31	11	นำเข้าสู่บทเรียนที่น่าสนใจ	SCALE	t	1	2026-07-19 01:49:43.934345	2026-07-19 01:49:43.934345	\N
30	10	เตรียมเครื่องมือและวิธีการวัดและประเมินผล เหมาะสมกับกิจกรรม	SCALE	t	2	2026-07-19 01:49:13.001531	2026-07-19 01:49:13.001531	\N
32	11	จัดกิจกรรมการสอนตรงกับแผนการจัดการเรียนรู้	SCALE	t	2	2026-07-19 01:49:59.888797	2026-07-19 01:49:59.888797	\N
33	11	เปิดโอกาสให้นักเรียนมีส่วนร่วมในกิจกรรมการเรียนการสอน	SCALE	t	3	2026-07-19 01:50:15.170884	2026-07-19 01:50:15.170884	\N
34	11	ใช้วิธีการสอนตรงกับออกแบบและหรือใช้นวัตกรรมที่ออกแบบในการแก้ปัญหาการเรียนการสอน	SCALE	t	4	2026-07-19 01:50:39.326822	2026-07-19 01:50:39.326822	\N
35	12	มีความคล่องตัวในการใช้สื่อการสอน	SCALE	t	1	2026-07-19 01:50:56.801361	2026-07-19 01:50:56.801361	\N
36	12	เลือกใช้สื่อได้เหมาะสมกับเนื้อหาและกิจกรรม ส่งเสริมให้นักเรียนเข้าใจบทเรียนง่ายขึ้น	SCALE	t	2	2026-07-19 01:51:15.633931	2026-07-19 01:51:15.633931	\N
37	13	จัดการความรู้ก่อนเรียน ทดสอบก่อนเรียน	SCALE	t	1	2026-07-19 01:51:35.815895	2026-07-19 01:51:35.815895	\N
38	13	ตรวจสอบความเข้าใจระหว่างเรียน	SCALE	t	2	2026-07-19 01:51:53.982788	2026-07-19 01:51:53.982788	\N
39	13	ประเมินผลความรู้หลังเรียน ตามตัวชี้วัด	SCALE	t	3	2026-07-19 01:52:10.879225	2026-07-19 01:52:10.879225	\N
40	14	สามารถควบคุมชั้นเรียนได้ ให้ความสนใจนักเรียนทุกคน	SCALE	t	1	2026-07-19 01:52:30.088882	2026-07-19 01:52:30.088882	\N
42	15	แผนการจัดการเรียนรู้มีการกำหนดเป้าหมายคุณภาพผู้เรียนทั้งด้านความรู้และทักษะกระบวนการ	SCALE	t	1	2026-07-19 12:00:12.430001	2026-07-19 12:00:12.430001	\N
43	15	จัดทำแผนการจัดการเรียนรู้ที่สอดคล้องกับผลการเรียนรู้ตามหลักสูตรการศึกษาปฐมวัย พุทธศักราช 2568 สำหรับเด็กอายุ 3-6 ปี หลักสูตรการศึกษาประถมศึกษาตอนต้น (ป.1-3) พุทธศักราช 2568 /ประถมศึกษาตอนปลาย (ป.4-6) พุทธศักราช 2569 / มาตรฐานการเรียนรู้ตัวชี้วัดตามหลักสูตรแกนกลางการศึกษาขึ้นพื้นฐาน พ.ศ. 2551  สมรรถนะสำคัญและคุณลักษณะอันพึงประสงค์	SCALE	t	2	2026-07-19 12:00:37.817268	2026-07-19 12:00:37.817268	\N
44	15	เลือกใช้วิธีสอน เทคนิคการสอนที่หลากหลายสอดคล้องกับความแตกต่างระหว่างบุคคล	SCALE	t	3	2026-07-19 12:01:01.595227	2026-07-19 12:01:01.595227	\N
45	15	เลือกใช้สื่อ แหล่งการเรียนรู้ และเทคโนโลยีที่หลากหลาย  เหมาะสมผนวกกับการนำบริบทและภูมิปัญญาท้องถิ่นมาบูรณาการ	SCALE	t	4	2026-07-19 12:01:22.131306	2026-07-19 12:01:22.131306	\N
46	15	เลือกใช้วิธีวัดผล และเครื่องมือประเมินผลที่หลากหลายสอดคล้องกับมารตฐานตัวชี้วัด  สมรรถนะสำคัญ และลักษณะ  ที่พึงประสงค์	SCALE	t	5	2026-07-19 12:01:41.863467	2026-07-19 12:01:41.863467	\N
47	16	จัดกิจกรรมการเรียนรู้อย่างเป็นขั้นตอนตามแผนการจัดการเรียนรู้ที่กำหนดไว้	SCALE	t	1	2026-07-19 12:07:47.822511	2026-07-19 12:07:47.822511	\N
48	16	ใช้วิธีสอนหรือเทคนิคการสอนส่งเสริมพัฒนาการของผู้เรียนตามความสามารถได้อย่างหลากหลายและมีประสิทธิภาพ	SCALE	t	2	2026-07-19 12:09:09.78082	2026-07-19 12:09:09.78082	\N
49	16	ใช้สื่อ แหล่งเรียนรู้และเทคโนโลยีที่เหมาะสม ผนวกกับการนำบริบทและภูมิปัญญาของท้องถิ่นมาบูรณาการในการจัดการเรียนรู้ได้อย่างมีประสิทธิภาพ	SCALE	t	3	2026-07-19 12:10:26.400389	2026-07-19 12:10:26.400389	\N
53	16	ครูให้คำแนะนำคำปรึกษาและแก้ไขปัญหาให้แก่ผู้เรียนทั้งด้านการเรียน	SCALE	t	5	2026-07-19 12:12:54.491492	2026-07-19 12:12:54.491492	\N
52	16	มีการวัดและประเมินผลที่มุ่งเน้นการพัฒนาการเรียนรู้ด้วยวิธีการและเครื่องมือที่หลากหลาย	SCALE	t	4	2026-07-19 12:11:55.640569	2026-07-19 12:11:55.640569	\N
54	17	ผู้เรียนมีความรู้ทักษะกระบวนการที่สอดคล้องกับมาตรฐานการเรียนรู้ตัวชี้วัดสมรรถนะที่สำคัญและคุณลักษณะที่พึงประสงค์ตามที่กำหนดในแผนการจัดการเรียนรู้	SCALE	t	1	2026-07-19 12:14:56.074406	2026-07-19 12:14:56.074406	\N
55	17	ชิ้นงานและหรือผลงานของผู้เรียนสอดคล้องกับมาตรฐานการเรียนรู้ตัวชี้วัดสมรรถนะสำคัญและคุณลักษณะที่พึงประสงค์ตามที่กำหนดในแผนการจัดการเรียนรู้	SCALE	t	2	2026-07-19 12:15:16.265006	2026-07-19 12:15:16.265006	\N
56	17	ผู้เรียนระดับการศึกษาขั้นพื้นฐานอ่านออกเขียนได้คิดได้เป็นเหมาะสมตามระดับชั้นในระดับดีขึ้นไปผู้เรียนระดับการศึกษาปฐมวัยมีความพร้อมในระดับดีขึ้นไป	SCALE	t	3	2026-07-19 12:18:33.873846	2026-07-19 12:18:33.873846	\N
57	17	ผู้เรียนมีคุณลักษณะที่พึงประสงค์คุณธรรมพื้นฐานและความกตัญญูระดับดีขึ้นไป	SCALE	t	4	2026-07-19 12:18:52.144528	2026-07-19 12:18:52.144528	\N
58	18	การเตรียมการวางแผนดำเนินงาน	SCALE	t	1	2026-08-02 07:07:54.334055	2026-08-02 07:07:54.334055	\N
59	18	การประชาสัมพันธ์โครงการให้คณะครู นักเรียนและชุมชนทราบ	SCALE	t	2	2026-08-02 07:08:19.686772	2026-08-02 07:08:19.686772	\N
60	18	การดำเนินงานปฏิบัติตามขั้นตอนที่วางไว้	SCALE	t	3	2026-08-02 07:08:41.293437	2026-08-02 07:08:41.293437	\N
61	18	คณะครู นักเรียนและชุมชนมีส่วนร่วมในการดำเนินงาน	SCALE	t	4	2026-08-02 07:09:03.668891	2026-08-02 07:09:03.668891	\N
62	18	ลักษณะโครงการ/กิจกรรมเอื้อต่อการเรียน  การสอน	SCALE	t	5	2026-08-02 07:09:27.634927	2026-08-02 07:09:27.634927	\N
63	18	กิจกรรมเหมาะสมและสอดคล้องกับการต้องการของหลักสูตร โรงเรียน นักเรียนและชุมชน	SCALE	t	6	2026-08-02 07:09:48.335345	2026-08-02 07:09:48.335345	\N
64	18	ความเหมาะสมในสถานที่ที่จัดกิจกรรม	SCALE	t	7	2026-08-02 07:10:07.121224	2026-08-02 07:10:07.121224	\N
65	18	ช่วงเวลาในการจัดกิจกรรม	SCALE	t	8	2026-08-02 07:10:26.212353	2026-08-02 07:10:26.212353	\N
66	18	ประโยชน์ที่คาดว่าจะได้รับจากกิจกรรมในครั้งนี้	SCALE	t	9	2026-08-02 07:10:44.893061	2026-08-02 07:10:44.893061	\N
67	18	ท่านมีความพึงพอใจในการจัดกิจกรรมครั้งนี้ระดับใด	SCALE	t	10	2026-08-02 07:11:05.617878	2026-08-02 07:11:05.617878	\N
41	14	บรรยากาศการเรียนเหมาะสมและสอดคล้องกับกิจกรรม	SCALE	t	2	2026-07-19 01:54:09.101102	2026-07-19 01:54:09.101102	\N
\.


--
-- Data for Name: evaluation_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_sections (id, template_id, name, description, sort_order, created_at, updated_at, deleted_at) FROM stdin;
1	1	ด้านการจัดการเรียนรู้	ประเมินความสามารถในการจัดการเรียนการสอน	1	2026-07-10 15:20:44.237151	2026-07-10 15:20:44.237151	\N
4	4	องค์ประกอบ	\N	1	2026-07-19 00:57:27.913445	2026-07-19 00:57:27.913445	\N
5	4	เนื้อหา	\N	2	2026-07-19 00:57:42.246249	2026-07-19 00:57:42.246249	\N
6	4	กิจกรรมการเรียนการสอน	\N	3	2026-07-19 00:58:23.595492	2026-07-19 00:58:23.595492	\N
7	4	สื่อการสอน	\N	4	2026-07-19 00:58:40.493722	2026-07-19 00:58:40.493722	\N
8	4	การวัดและประเมินผล	\N	5	2026-07-19 00:59:24.733787	2026-07-19 00:59:24.733787	\N
9	2	บุคลิกภาพ	\N	1	2026-07-19 01:45:03.323254	2026-07-19 01:45:03.323254	\N
10	2	การเตรียมการสอน	\N	2	2026-07-19 01:45:22.060346	2026-07-19 01:45:22.060346	\N
11	2	การจัดกิจกรรมการสอน	\N	3	2026-07-19 01:45:35.537433	2026-07-19 01:45:35.537433	\N
12	2	การใช้สื่อการสอน	\N	4	2026-07-19 01:45:50.183394	2026-07-19 01:45:50.183394	\N
13	2	การประเมินผล	\N	5	2026-07-19 01:46:05.264627	2026-07-19 01:46:05.264627	\N
14	2	การควบคุมชั้นเรียน	\N	6	2026-07-19 01:46:22.252146	2026-07-19 01:46:22.252146	\N
15	3	1	\N	1	2026-07-19 11:58:58.556429	2026-07-19 11:58:58.556429	\N
16	3	2	\N	2	2026-07-19 11:59:08.870286	2026-07-19 11:59:08.870286	\N
17	3	3	\N	3	2026-07-19 11:59:20.277143	2026-07-19 11:59:20.277143	\N
18	5	1	แบบสอบถามความพึงพอใจ	1	2026-08-02 07:06:33.991677	2026-08-02 07:06:33.991677	\N
\.


--
-- Data for Name: evaluation_targets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_targets (id, instance_id, user_id, status, created_at) FROM stdin;
1	1	6	PENDING	2026-08-21 15:06:41.902916
2	1	8	PENDING	2026-08-21 15:06:41.902916
3	1	9	PENDING	2026-08-21 15:06:41.902916
4	1	10	PENDING	2026-08-21 15:06:41.902916
5	1	11	PENDING	2026-08-21 15:06:41.902916
6	1	12	PENDING	2026-08-21 15:06:41.902916
7	1	13	PENDING	2026-08-21 15:06:41.902916
8	1	14	PENDING	2026-08-21 15:06:41.902916
9	1	15	PENDING	2026-08-21 15:06:41.902916
10	1	16	PENDING	2026-08-21 15:06:41.902916
11	1	17	PENDING	2026-08-21 15:06:41.902916
12	1	18	PENDING	2026-08-21 15:06:41.902916
13	1	19	PENDING	2026-08-21 15:06:41.902916
14	1	20	PENDING	2026-08-21 15:06:41.902916
15	1	21	PENDING	2026-08-21 15:06:41.902916
16	1	23	PENDING	2026-08-21 15:06:41.902916
17	1	24	PENDING	2026-08-21 15:06:41.902916
18	1	25	PENDING	2026-08-21 15:06:41.902916
19	1	26	PENDING	2026-08-21 15:06:41.902916
20	1	27	PENDING	2026-08-21 15:06:41.902916
21	1	28	PENDING	2026-08-21 15:06:41.902916
22	1	29	PENDING	2026-08-21 15:06:41.902916
23	2	6	PENDING	2026-08-21 15:14:00.541088
24	2	8	PENDING	2026-08-21 15:14:00.541088
25	2	9	PENDING	2026-08-21 15:14:00.541088
26	2	10	PENDING	2026-08-21 15:14:00.541088
27	2	11	PENDING	2026-08-21 15:14:00.541088
28	2	12	PENDING	2026-08-21 15:14:00.541088
29	2	13	PENDING	2026-08-21 15:14:00.541088
30	2	14	PENDING	2026-08-21 15:14:00.541088
31	2	15	PENDING	2026-08-21 15:14:00.541088
32	2	16	PENDING	2026-08-21 15:14:00.541088
33	2	17	PENDING	2026-08-21 15:14:00.541088
34	2	18	PENDING	2026-08-21 15:14:00.541088
35	2	19	PENDING	2026-08-21 15:14:00.541088
36	2	20	PENDING	2026-08-21 15:14:00.541088
37	2	21	PENDING	2026-08-21 15:14:00.541088
38	2	23	PENDING	2026-08-21 15:14:00.541088
39	2	24	PENDING	2026-08-21 15:14:00.541088
40	2	25	PENDING	2026-08-21 15:14:00.541088
41	2	26	PENDING	2026-08-21 15:14:00.541088
42	2	27	PENDING	2026-08-21 15:14:00.541088
43	2	28	PENDING	2026-08-21 15:14:00.541088
44	2	29	PENDING	2026-08-21 15:14:00.541088
\.


--
-- Data for Name: evaluation_template_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_template_fields (id, template_id, field_key, label, field_type, placeholder, required, default_value, sort_order, created_by, created_at, updated_at, deleted_at) FROM stdin;
1	1	media_name	ชื่อสื่อการสอน	TEXT	\N	t	\N	1	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
2	1	subject	วิชา	TEXT	\N	t	\N	2	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
3	1	subject_code	รหัสวิชา	TEXT	\N	f	\N	3	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
4	1	unit	หน่วยการเรียนรู้ที่	TEXT	\N	f	\N	4	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
5	1	topic	เรื่อง	TEXT	\N	t	\N	5	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
6	1	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	\N	6	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
7	1	grade_level	ระดับชั้น	TEXT	\N	f	\N	7	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
8	1	period	คาบที่	NUMBER	\N	f	\N	8	\N	2026-07-21 14:25:09.170171	2026-07-21 14:25:09.170171	\N
11	2	learning_group	กลุ่มสาระการเรียนรู้	TEXT	\N	f	\N	1	\N	2026-07-21 15:03:50.379105	2026-07-21 15:03:50.379105	\N
12	2	topic	แผนการจัดการเรียนรู้เรื่อง	TEXT	\N	f	\N	2	\N	2026-07-21 15:04:32.070368	2026-07-21 15:04:32.070368	\N
13	2	uit	หน่วยการเรียนรู้ที่	TEXT	\N	f	\N	3	\N	2026-07-21 15:05:03.730053	2026-07-21 15:05:03.730053	\N
14	2	subject	วิชา	TEXT	\N	f	\N	4	\N	2026-07-21 15:05:27.172505	2026-07-21 15:05:27.172505	\N
15	2	subject_code	รหัสวิชา	TEXT	\N	f	\N	5	\N	2026-07-21 15:05:59.228391	2026-07-21 15:05:59.228391	\N
16	2	grade_level	ระดับชั้น	TEXT	\N	f	\N	6	\N	2026-07-21 15:06:32.298574	2026-07-21 15:06:32.298574	\N
17	2	total_hour	จำนวนชั่วโมง	TEXT	\N	f	\N	7	\N	2026-07-21 15:07:56.410351	2026-07-21 15:07:56.410351	\N
18	3	learning_group	กลุ่มสาระการเรียนรู้	TEXT		t		1	\N	2026-07-21 15:09:01.572138	2026-07-21 15:09:01.572138	\N
19	3	teaching_model	ชื่อรูปแบบการสอน	TEXT		t		2	\N	2026-07-21 15:09:01.572138	2026-07-21 15:09:01.572138	\N
20	3	subject	สำหรับวิชา	TEXT		t		3	\N	2026-07-21 15:09:01.572138	2026-07-21 15:09:01.572138	\N
21	3	topic	เรื่อง	TEXT		t		4	\N	2026-07-21 15:09:01.572138	2026-07-21 15:09:01.572138	\N
22	3	grade_level	ชั้น	TEXT		t		5	\N	2026-07-21 15:09:01.572138	2026-07-21 15:09:01.572138	\N
23	3	hours	จำนวนชั่วโมง	NUMBER		t		6	\N	2026-07-21 15:09:01.572138	2026-07-21 15:09:01.572138	\N
24	4	learning_group	กลุ่มสาระการเรียนรู้	TEXT		t		1	\N	2026-07-21 15:09:33.977797	2026-07-21 15:09:33.977797	\N
25	4	grade_level	ชั้น	TEXT		t		2	\N	2026-07-21 15:09:33.977797	2026-07-21 15:09:33.977797	\N
\.


--
-- Data for Name: evaluation_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluation_templates (id, code, template_name, description, evaluation_target_id, versions, status, created_by, created_at, updated_at, deleted_at, organization_id, owner_id, visibility, source_template_id, template_type) FROM stdin;
1	TEACHER_2569	แบบนิเทศสื่อการสอน	แบบประเมินผลการปฏิบัติงานครู	TEACHER	1	ACTIVE	1	2026-07-10 15:19:19.280546	2026-07-10 15:19:19.280546	\N	\N	\N	ORGANIZATION	\N	EVALUATION
4	TEACH	แบบนิเทศแผนการจัดการเรียนรู้	แบบประเมินผลการสอน	TEACHER	1	ACTIVE	1	2026-07-19 00:56:08.926264	2026-07-19 00:56:08.926264	\N	\N	\N	ORGANIZATION	\N	EVALUATION
2	TEACH2	แบบนิเทศการจัดการเรียนการสอน	แบบนิเทศการจัดการเรียนการสอน	TEACHER	1	ACTIVE	1	2026-07-19 01:41:37.503727	2026-07-19 01:41:37.503727	\N	\N	\N	ORGANIZATION	\N	EVALUATION
5	TEACH4	แบบประเมินความพึงพอใจ 	แบบประเมินความพึงพอใจ ประเมินโดยครูผุ้สอน	TEACHER	1	ACTIVE	1	2026-08-02 07:03:32.769765	2026-08-02 07:03:32.769765	\N	\N	\N	ORGANIZATION	\N	SURVEY
3	TEACH3	แบบประเมินประสิทธิภาพการจัดการเรียนการสอนของครู	แบบประเมินประสิทธิภาพการจัดการเรียนการสอนของครู	TEACHER	1	ACTIVE	1	2026-07-19 01:42:40.708055	2026-07-19 01:42:40.708055	\N	\N	\N	ORGANIZATION	\N	EVALUATION
\.


--
-- Data for Name: iqa_assessment_cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_assessment_cycles (id, academic_year, name, status, start_date, end_date, created_by, created_at, updated_at) FROM stdin;
1	2569	รอบการนิเทศ ป.ม. 2569	COMPLETED	\N	\N	5	2026-08-23 12:45:18.420441+00	2026-08-23 12:45:52.919972+00
\.


--
-- Data for Name: iqa_assessment_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_assessment_scores (id, assessment_id, indicator_id, score, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iqa_assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_assessments (id, cycle_id, assessor_id, status, total_score, avg_score, quality_level, comment, submitted_at, created_at, updated_at) FROM stdin;
1	1	5	DRAFT	\N	\N	\N	\N	\N	2026-08-23 12:45:27.221586+00	2026-08-23 12:45:55.320817+00
\.


--
-- Data for Name: iqa_criteria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_criteria (id, standard_id, code, name, description, sort_order, is_active, created_at, updated_at) FROM stdin;
1	1	1.1	ผลสัมฤทธิ์ทางวิชาการของผู้เรียน	\N	1	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
2	1	1.2	คุณลักษณะอันพึงประสงค์ของผู้เรียน	\N	2	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
3	2	2.1	เป้าหมาย วิสัยทัศน์ และพันธกิจ	\N	1	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
4	2	2.2	ระบบบริหารจัดการคุณภาพ	\N	2	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
5	2	2.3	พัฒนาวิชาการเน้นคุณภาพผู้เรียน	\N	3	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
6	2	2.4	พัฒนาครู บุคลากร และ PLC	\N	4	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
7	2	2.5	สภาพแวดล้อมทางกายภาพและสังคม	\N	5	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
8	2	2.6	เทคโนโลยีสารสนเทศ	\N	6	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
9	3	3.1	แผนการจัดการเรียนรู้	\N	1	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
10	3	3.2	สื่อ เทคโนโลยี และแหล่งเรียนรู้	\N	2	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
11	3	3.3	บริหารจัดการชั้นเรียน	\N	3	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
12	3	3.4	ตรวจสอบและประเมินคุณภาพ	\N	4	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
13	3	3.5	ชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)	\N	5	t	2026-08-23 12:43:05.278455+00	2026-08-23 12:43:05.278455+00
\.


--
-- Data for Name: iqa_evidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_evidence (id, assessment_id, indicator_id, file_name, stored_name, file_path, file_size, mime_type, description, uploaded_by, created_at) FROM stdin;
1	1	\N	ใบประกาศอบรม_ชื่อสมมติ_5คน.pdf	./storage/iqa/assessments/1/ใบประกาศอบรม_ชื่อสมมติ_5คน.pdf	./storage/iqa/assessments/1/ใบประกาศอบรม_ชื่อสมมติ_5คน.pdf	868493	application/pdf		5	2026-08-23 12:45:39.492687+00
\.


--
-- Data for Name: iqa_indicators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_indicators (id, criterion_id, code, name, description, sort_order, is_active, created_at, updated_at) FROM stdin;
1	1	1.1.1	ผู้เรียนมีความสามารถในการอ่าน การเขียน การสื่อสาร และการคิดคำนวณ	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
2	1	1.1.2	ผู้เรียนมีความสามารถในการคิดวิเคราะห์ คิดวิจารณญาณ อภิปราย แลกเปลี่ยนความคิดเห็นโดยใช้เหตุผลประกอบการตัดสินใจ และแก้ปัญหา	\N	2	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
3	1	1.1.3	ผู้เรียนมีความสามารถในการสร้างนวัตกรรม	\N	3	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
4	1	1.1.4	ผู้เรียนมีความสามารถในการใช้เทคโนโลยีสารสนเทศและการสื่อสารเพื่อการพัฒนาตนเองและสังคม	\N	4	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
5	1	1.1.5	ผู้เรียนมีผลสัมฤทธิ์ทางการเรียนตามหลักสูตรสถานศึกษา	\N	5	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
6	1	1.1.6	ผู้เรียนมีความรู้ ทักษะ และเจตคติที่ดี พร้อมที่จะศึกษาต่อในระดับชั้นที่สูงขึ้น	\N	6	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
7	2	1.2.1	ผู้เรียนมีคุณลักษณะตามที่สถานศึกษากำหนด และมีค่านิยมที่ดี	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
8	2	1.2.2	ผู้เรียนมีความภูมิใจในท้องถิ่น เห็นคุณค่าของความเป็นไทย	\N	2	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
9	2	1.2.3	ผู้เรียนมีการยอมรับที่จะอยู่ร่วมกันบนความแตกต่างและหลากหลาย	\N	3	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
10	2	1.2.4	ผู้เรียนมีสุขภาวะทางร่างกาย และลักษณะจิตสังคมแบ่งเป็นระดับคุณภาพตามเกณฑ์	\N	4	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
11	3	2.1	สถานศึกษามีเป้าหมาย วิสัยทัศน์ และพันธกิจที่ชัดเจน	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
12	4	2.2	สถานศึกษามีระบบบริหารจัดการคุณภาพ	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
13	5	2.3	สถานศึกษาดำเนินงานพัฒนาวิชาการเน้นคุณภาพผู้เรียนรอบด้าน	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
14	6	2.4	สถานศึกษาส่งเสริม พัฒนาครู บุคลากร และจัด PLC	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
15	7	2.5	สถานศึกษาจัดสภาพแวดล้อมทางกายภาพและสังคม	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
16	8	2.6	สถานศึกษาจัดระบบเทคโนโลยีสารสนเทศ	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
17	9	3.1	ครูมีแผนการจัดการเรียนรู้ผ่านกระบวนการคิดและปฏิบัติจริง	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
18	10	3.2	ครูใช้สื่อ เทคโนโลยี และแหล่งเรียนรู้รวมถึงภูมิปัญญาท้องถิ่น	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
19	11	3.3	ครูบริหารจัดการชั้นเรียน เน้นปฏิสัมพันธ์เชิงบวก	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
20	12	3.4	ครูตรวจสอบและประเมินคุณภาพการจัดการเรียนรู้อย่างเป็นระบบ	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
21	13	3.5	มีชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)	\N	1	t	2026-08-23 12:43:05.334439+00	2026-08-23 12:43:05.334439+00
\.


--
-- Data for Name: iqa_quality_levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_quality_levels (id, score, label, description, color, sort_order, created_at) FROM stdin;
1	4	ดีเลิศ	เป็นไปตามเกณฑ์ทุกข้อ มีหลักฐานยืนยันชัดเจน เป็นต้นแบบได้	#16A34A	1	2026-08-23 12:43:05.210566+00
2	3	ดี	เป็นไปตามเกณฑ์ส่วนใหญ่ มีหลักฐานยืนยันเพียงพอ	#3B82F6	2	2026-08-23 12:43:05.210566+00
3	2	พอใช้	เป็นไปตามเกณฑ์บางส่วน ยังต้องพัฒนาเพิ่มเติม	#F59E0B	3	2026-08-23 12:43:05.210566+00
4	1	ปรับปรุง	ยังไม่เป็นไปตามเกณฑ์ ต้องแก้ไขและพัฒนาอย่างเร่งด่วน	#EF4444	4	2026-08-23 12:43:05.210566+00
5	0	ไม่ผ่านเกณฑ์	ไม่มีหลักฐานหรือไม่ได้ดำเนินการเลย	#6B7280	5	2026-08-23 12:43:05.210566+00
\.


--
-- Data for Name: iqa_school_summary; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_school_summary (id, cycle_id, indicator_id, avg_score, min_score, max_score, assessor_count, quality_level, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iqa_standards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iqa_standards (id, code, name, description, sort_order, is_active, created_at, updated_at) FROM stdin;
1	1	คุณภาพของผู้เรียน	\N	1	t	2026-08-23 12:43:05.227138+00	2026-08-23 12:43:05.227138+00
2	2	กระบวนการบริหารและการจัดการสถานศึกษา	\N	2	t	2026-08-23 12:43:05.227138+00	2026-08-23 12:43:05.227138+00
3	3	กระบวนการจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ	\N	3	t	2026-08-23 12:43:05.227138+00	2026-08-23 12:43:05.227138+00
\.


--
-- Data for Name: line_login_states; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.line_login_states (id, state, nonce, mode, user_id, created_at, used_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, code, name, type, province, created_at, address, phone, email, director_name, system_name, system_short_name) FROM stdin;
1	1047540038	โรงเรียนท่าแร่วิทยา	1	สกลนคร	2026-07-09 12:56:44.947462	\N	\N	\N	\N	ระบบบริหารจัดการโรงเรียนท่าแร่วิทยา	IQAT SYSTEM
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, code, module, description, is_active, created_at) FROM stdin;
1	ดูผู้ใช้	user.view	USER	ดูข้อมูลผู้ใช้	t	2026-07-12 02:07:52.305891
2	เพิ่มผู้ใช้	user.create	USER	สร้างผู้ใช้	t	2026-07-12 02:07:52.305891
3	แก้ไขผู้ใช้	user.update	USER	แก้ไขผู้ใช้	t	2026-07-12 02:07:52.305891
4	ลบผู้ใช้	user.delete	USER	ลบผู้ใช้	t	2026-07-12 02:07:52.305891
5	จัดการ Role	role.manage	ROLE	จัดการบทบาท	t	2026-07-12 02:07:52.305891
6	ดูแบบประเมิน	template.view	TEMPLATE	ดูแบบประเมิน	t	2026-07-12 02:07:52.305891
7	สร้างแบบประเมิน	template.create	TEMPLATE	สร้างแบบประเมิน	t	2026-07-12 02:07:52.305891
8	แก้ไขแบบประเมิน	template.update	TEMPLATE	แก้ไขแบบประเมิน	t	2026-07-12 02:07:52.305891
9	ลบแบบประเมิน	template.delete	TEMPLATE	ลบแบบประเมิน	t	2026-07-12 02:07:52.305891
12	ประเมินครู	evaluation.evaluate	EVALUATION	ทำแบบประเมิน	t	2026-07-12 02:07:52.305891
13	อนุมัติผลประเมิน	evaluation.approve	EVALUATION	อนุมัติผล	t	2026-07-12 02:07:52.305891
14	ดูรายงาน	report.view	REPORT	ดูรายงาน	t	2026-07-12 02:07:52.305891
15	ส่งออกรายงาน	report.export	REPORT	Export รายงาน	t	2026-07-12 02:07:52.305891
16	จัดการระบบ	setting.manage	SETTING	ตั้งค่าระบบ	t	2026-07-12 02:07:52.305891
17	รายการรับประเมินของฉัน	instance.view	INSTANCE	เข้าใช้ระบบประเมิน	t	2026-07-13 04:04:24.348477
10	สร้างการประเมิน	instance.create	EVALUATION	สร้างรอบประเมิน	t	2026-07-12 02:07:52.305891
19	รอบการประเมิน	evaluation.round.view	EVALUATION	\N	t	2026-08-15 01:36:07.740833
20	ส่งแบบประเมิน	evaluation.submit	EVALUATION	\N	t	2026-08-15 01:36:07.740833
21	ดูผลการประเมิน	result.view	RESULT	\N	t	2026-08-15 01:36:07.740833
22	คะแนนรายบุคคล	result.person.view	RESULT	\N	t	2026-08-15 01:36:07.740833
23	สรุปผลการประเมิน	result.summary.view	RESULT	\N	t	2026-08-15 01:36:07.740833
24	ประวัติการประเมิน	result.history.view	RESULT	\N	t	2026-08-15 01:36:07.740833
25	ดู Role	role.view	ROLE	\N	t	2026-08-15 01:36:07.740833
26	ดู Permission	permission.view	PERMISSION	\N	t	2026-08-15 01:36:07.740833
27	ดูบุคลากร	personnel.view	PERSONNEL	\N	t	2026-08-15 01:36:07.740833
28	เพิ่มบุคลากร	personnel.create	PERSONNEL	\N	t	2026-08-15 01:36:07.740833
29	ดูตำแหน่ง/วิทยฐานะ	position.view	PERSONNEL	\N	t	2026-08-15 01:36:07.740833
30	ตั้งค่าข้อมูลโรงเรียน	setting.school	SETTING	\N	t	2026-08-15 01:36:07.740833
31	ตั้งค่าปีการศึกษา	setting.academic	SETTING	\N	t	2026-08-15 01:36:07.740833
32	ตั้งค่าคะแนน	setting.scoring	SETTING	\N	t	2026-08-15 01:36:07.740833
33	ลงเวลาปฏิบัติงาน	attendance.view	ATTENDANCE	\N	t	2026-08-15 01:47:22.177433
34	จัดการข้อมูลลงเวลา	attendance.manage	ATTENDANCE	\N	t	2026-08-15 02:03:00.117688
\.


--
-- Data for Name: person_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.person_types (id, code, name_th, created_at) FROM stdin;
1	STAFF	บุคลากร	2026-07-12 00:37:26.239129
2	STUDENT	นักเรียน	2026-07-12 00:37:26.239129
3	TEACHER	ครู	2026-07-12 07:38:00.140739
4	DIRECTOR	ผู้บริหาร	2026-07-12 07:38:55.19004
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.positions (id, code, name_th, level, created_at) FROM stdin;
1	DIRECTOR	ผู้อำนวยการโรงเรียนท่าแร่วิทยา	1	2026-07-12 00:37:35.048602
2	DEPUTY_DIRECTOR	รองผู้อำนวยการโรงเรียนท่าแร่วิทยา	2	2026-07-12 00:37:35.048602
8	TEACEEE	พี่เลี้ยงเด็กพิการ	8	2026-07-21 12:39:12.741394
6	ACADEMIC_STAFF	ครู วิทยฐานะ ครูชำนาญการพิเศษ	6	2026-07-12 00:37:35.048602
3	HEAD_DEPARTMENT	ครู วิทยฐานะ ครูผู้ช่วย	3	2026-07-12 00:37:35.048602
4	TEACHER	ครู วิทยฐานะ ครู คศ.1	4	2026-07-12 00:37:35.048602
7	ATC	ครู วิทยฐานะ ครูชำนาญการ	7	2026-07-21 12:35:21.501892
5	CONTRACT_TEACHER	ครูอัตราจ้าง	5	2026-07-12 00:37:35.048602
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prefixes (id, code, name_th) FROM stdin;
1	MR	นาย
2	MRS	นาง
3	MISS	นางสาว
4	MASTER	เด็กชาย
5	MISS_CHILD	เด็กหญิง
6	DR	ดร.
7	ASST_PROF	ผศ.
8	ASSOC_PROF	รศ.
9	PROF	ศ.
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at, replaced_by_id, user_agent) FROM stdin;
1	23	31626ce480f19723ea3293d94049b81e5f79d4c2e70d2e9ee63db57f7acb0240	2026-09-20 15:09:32.018283	2026-08-21 15:09:32.018534	\N	\N	
2	5	2f2893f9b97ae134ea9ec44c29d61322a0373d757c058ff1ffeccd447aa34805	2026-09-22 01:29:52.311224	2026-08-23 01:29:52.311421	\N	\N	
3	5	b7d852d5d9b930d0687ef4bfffb09040049ca45c5e8b7e22f62383e3446db2ec	2026-09-22 06:40:30.194244	2026-08-23 06:40:30.19441	2026-08-23 07:43:57.412511	4	
4	5	56061246f70f594a93ca8d455ffa5ed2735e9a0d61ee690b5d7828d8c527551f	2026-09-22 07:43:57.41256	2026-08-23 07:43:57.412511	2026-08-23 08:59:57.538325	5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
5	5	201479a504fc3b9f291014e8ba24ee47d294ae3cb77616152913717e48abb06b	2026-09-22 08:59:57.538394	2026-08-23 08:59:57.538325	2026-08-23 11:32:33.886903	7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
6	28	14b9bc543d58c1c73d045183cdbc26bc6a1e0bf6a69c7ad409ba21033308967a	2026-09-22 09:27:02.035412	2026-08-23 09:27:02.035609	2026-08-23 11:32:38.35581	8	
9	5	4a63d9e007128521424e7c98f646bc5d6bea6223176fb367bbbfc957b3890480	2026-09-22 12:38:05.367444	2026-08-23 12:38:05.367377	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
10	28	4cc682bcbca1fa09a06000d683562ef70d5058997dba290dfbcb449fe2890ada	2026-09-22 12:38:05.367444	2026-08-23 12:38:05.367387	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
8	28	0757cdb9e6a57e81ca6b13bcd2483085c670a1cf3a5a4d19f3c1a0dc2d8f1cef	2026-09-22 11:32:38.355867	2026-08-23 11:32:38.35581	2026-08-23 12:38:05.367387	10	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
7	5	be3738067b182c6ba14565ff4e5c2397f53568b8aaa195d586fa0125dffe34ca	2026-09-22 11:32:33.886993	2026-08-23 11:32:33.886903	2026-08-23 12:38:05.367377	9	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36
11	5	987a55aa88bbca83172a07e9e1145e5d5d715c16c074df7bd7a6b883c2cb1e2f	2026-09-22 13:54:17.332241	2026-08-23 13:54:17.33244	\N	\N	
12	12	ac71182ce6c2e22387580b77acabdf16567070f06420d6f8f958d8587e482144	2026-09-22 13:58:55.708114	2026-08-23 13:58:55.708485	\N	\N	
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
1	2	1	2026-07-12 02:08:39.082321
2	2	2	2026-07-12 02:08:39.082321
3	2	3	2026-07-12 02:08:39.082321
4	2	6	2026-07-12 02:08:39.082321
5	2	7	2026-07-12 02:08:39.082321
6	2	8	2026-07-12 02:08:39.082321
7	2	9	2026-07-12 02:08:39.082321
8	2	14	2026-07-12 02:08:39.082321
9	2	15	2026-07-12 02:08:39.082321
15	4	12	2026-07-12 02:08:56.416891
17	1	17	2026-07-13 04:06:58.105665
18	2	17	2026-07-13 04:07:07.484323
20	4	17	2026-07-20 03:25:18.614247
10	5	10	2026-07-12 02:08:49.353393
25	2	4	2026-08-15 01:36:07.768268
26	2	5	2026-08-15 01:36:07.768268
31	2	12	2026-08-15 01:36:07.768268
32	2	13	2026-08-15 01:36:07.768268
35	2	16	2026-08-15 01:36:07.768268
37	2	10	2026-08-15 01:36:07.768268
38	2	19	2026-08-15 01:36:07.768268
39	2	20	2026-08-15 01:36:07.768268
40	2	21	2026-08-15 01:36:07.768268
41	2	22	2026-08-15 01:36:07.768268
42	2	23	2026-08-15 01:36:07.768268
43	2	24	2026-08-15 01:36:07.768268
44	2	25	2026-08-15 01:36:07.768268
45	2	26	2026-08-15 01:36:07.768268
46	2	27	2026-08-15 01:36:07.768268
47	2	28	2026-08-15 01:36:07.768268
48	2	29	2026-08-15 01:36:07.768268
49	2	30	2026-08-15 01:36:07.768268
50	2	31	2026-08-15 01:36:07.768268
51	2	32	2026-08-15 01:36:07.768268
52	1	33	2026-08-15 01:47:22.179042
53	2	33	2026-08-15 01:47:22.179042
55	4	33	2026-08-15 01:47:22.179042
56	5	33	2026-08-15 01:47:22.179042
57	1	34	2026-08-15 02:03:00.127891
58	2	34	2026-08-15 02:03:00.127891
73	3	5	2026-08-15 09:20:40.290605
74	3	13	2026-08-15 09:20:40.290605
75	3	14	2026-08-15 09:20:40.290605
76	3	17	2026-08-15 09:20:40.290605
77	3	33	2026-08-15 09:20:40.290605
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, code, description, is_active, created_at, updated_at, icon, color) FROM stdin;
1	Super Admin	SUPER_ADMIN	ผู้ดูแลระบบสูงสุด	t	2026-07-12 02:07:18.05101	2026-07-12 02:07:18.05101	Users	blue
2	Admin	ADMIN	ผู้ดูแลระบบ	t	2026-07-12 02:07:18.05101	2026-07-12 02:07:18.05101	ClipboardList	green
3	ผู้บริหาร	DIRECTOR	ผู้ประเมินและดูรายงาน	t	2026-07-12 02:07:18.05101	2026-07-12 02:07:18.05101	FileText	purple
4	ครู	TECHER	ผู้ใช้งานประเภทครู	t	2026-07-12 02:07:18.05101	2026-07-12 02:07:18.05101	BarChart3	amber
5	Admin ระบบประเมิน	ADMIN_INSTANCE	จัดการการประเมิน	t	2569-08-01 19:58:48	2569-08-01 19:58:51	Users	green
\.


--
-- Data for Name: score_levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.score_levels (id, score, label, color, text_color, is_active, sort_order, created_at, updated_at) FROM stdin;
1	5	มีคุณภาพ มีความชัดเจน มีความเหมาะสม มากที่สุด	#2fae60	#ffffff	t	1	2026-08-15 09:56:19.780134	2026-08-15 09:56:19.780134
2	4	มีคุณภาพ มีความชัดเจน มีความเหมาะสม มาก	#7cb342	#ffffff	t	2	2026-08-15 09:56:19.780134	2026-08-15 09:56:19.780134
3	3	มีคุณภาพ มีความชัดเจน มีความเหมาะสม ปานกลาง	#f59e0b	#422006	t	3	2026-08-15 09:56:19.780134	2026-08-15 09:56:19.780134
4	2	มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อย	#e07a3f	#ffffff	t	4	2026-08-15 09:56:19.780134	2026-08-15 09:56:19.780134
5	1	มีคุณภาพ มีความชัดเจน มีความเหมาะสม น้อยที่สุด	#d64545	#ffffff	t	5	2026-08-15 09:56:19.780134	2026-08-15 10:03:50.555482
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role_id, created_at) FROM stdin;
2	5	3	2026-07-12 02:10:41.935646
3	5	4	2026-07-12 02:10:41.935646
4	5	2	2026-07-12 07:00:35.832075
5	11	4	2026-07-20 03:20:44.696208
6	13	4	2026-07-21 13:38:44.685352
8	19	4	2026-08-01 05:30:41.396244
9	21	4	2026-08-01 05:30:48.862314
11	14	4	2026-08-01 05:31:19.249265
12	16	4	2026-08-01 05:31:25.399885
13	20	4	2026-08-01 05:31:34.515723
14	9	4	2026-08-01 05:31:47.050214
15	10	4	2026-08-01 05:31:55.629927
16	23	4	2026-08-01 05:33:31.705767
17	24	4	2026-08-01 05:33:37.597618
18	25	4	2026-08-01 05:33:43.538346
19	26	4	2026-08-01 05:33:48.917974
20	4	3	2026-08-01 05:34:03.222972
21	28	4	2026-08-01 05:34:10.35405
22	29	4	2026-08-01 05:34:23.675007
23	6	4	2026-08-01 05:54:56.208056
24	8	4	2026-08-01 05:55:02.934016
25	12	4	2026-08-01 05:55:13.020228
26	15	4	2026-08-01 05:55:20.38647
27	17	4	2026-08-01 05:55:25.504157
28	18	4	2026-08-01 05:55:31.684845
29	27	4	2026-08-01 05:55:54.678488
30	5	5	2026-08-01 13:01:06.450062
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password_hash, organization_id, status, last_login, created_at, updated_at, person_type_id, position_id, cid, prefix_id, first_name, last_name, phone, is_active, email, person_level, avatar_url, failed_attempts, locked_until, line_user_id) FROM stdin;
25	1471000136820	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	4	1471000136820	3	สุภาพร	โสดาลี	0864583201	t	\N	\N	\N	0	\N	\N
11	3470101476273	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	3470101476273	2	อาลักคณา	มะละกา	0819649658	t	\N	\N	\N	0	\N	\N
22	3470100111565	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	1	4	3470100111565	1	นนท์	สมใจเพ็ง	0895779822	t	\N	\N	\N	0	\N	\N
17	1470100043121	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	2026-08-19 11:51:05.496364	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	1470100043121	3	จิตติมา	ก้อนแพง	0910568050	t	\N	\N	\N	0	\N	\N
15	1470100018259	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	1470100018259	2	ปิยาภรณ์	เจือจันทึก	0885601929	t	\N	\N	\N	0	\N	\N
18	1470900045561	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	1470900045561	3	ภัทรภร	ผลจันทร์	0846995950	t	\N	\N	\N	0	\N	\N
26	1470300105210	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	4	1470300105210	1	ศราวุฒิ	คำศัยอินทร์	0821204552	t	\N	\N	\N	0	\N	\N
13	3480200023617	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	3480200023617	2	มยุรี	สำเภา	0934173388	t	\N	\N	\N	0	\N	\N
10	3470100395521	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	3470100395521	2	ดอกจันทร์	เหล่าเจริญ	0878677787	t	\N	\N	\N	0	\N	\N
27	1479900401748	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	3	1479900401748	1	กิตติพงษ์	พานจำลอง	0895286140	t	\N	\N	\N	0	\N	\N
24	1479900363544	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	4	1479900363544	3	สุชัญญา	สุวพงษ์	0621454490	t	\N	\N	\N	0	\N	\N
16	3470100917136	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	3470100917136	2	ขวัญจิรา	เนตรมุงคุณ	0848878414	t	\N	\N	\N	0	\N	\N
20	1419900278962	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	7	1419900278962	1	วรากร	นาคคง	0807456584	t	\N	\N	\N	0	\N	\N
21	1411300195783	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	7	1411300195783	1	อานนท์	แสนภูวา	0901045601	t	\N	\N	\N	0	\N	\N
9	5400199004096	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	5400199004096	2	ละเอียด	ศรีวรกุล	0863230942	t	\N	\N	\N	0	\N	\N
14	3470100090754	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	3470100090754	2	วิระพร	พิทักษ์ชัยโสภณ	0968321551	t	\N	\N	\N	0	\N	\N
19	1449900095094	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	7	1449900095094	1	อติชาต	เหนือกลาง	0650598945	t	\N	\N	\N	0	\N	\N
4	3470400451850	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 00:55:03.667405	2026-07-12 00:55:03.667405	4	1	3470400451850	2	พรรมาหา	เพชรพรรณ	0812665890	t	\N	\N	\N	0	\N	\N
29	1470100161507	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	8	1470100161507	3	วิลัย	อินแตน	0854619702	t	\N	\N	\N	0	\N	\N
6	3470400111170	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 00:55:03.667405	2026-07-12 00:55:03.667405	3	6	3470400111170	2	สุภา	ศรีวรกุล	0818733887	t	\N	\N	\N	0	\N	\N
8	3470100136061	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	\N	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	3470100136061	2	วาลิกา	เจริญพงศ์	0818720776	t	\N	\N	\N	0	\N	\N
23	1479900357510	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	2026-08-21 15:09:32.010135	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	4	1479900357510	1	รชานนท์	เจริญอินทร์	0834624746	t	\N	\N	\N	0	\N	\N
12	3470100074619	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	2026-08-23 13:58:55.687572	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	6	3470100074619	3	ศิรินทิพย์	คำพุทธ	0935655966	t	\N	\N	\N	0	\N	\N
28	470101376236	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	2026-08-23 09:27:02.008256	2026-07-12 01:04:02.381278	2026-07-12 01:04:02.381278	3	5	1470101376236	3	อรพิลา	มูลประสาร	0986850104	t	\N	\N	\N	0	\N	\N
5	1250200077551	$2a$10$Tx5wgshSJeNLAqv7ybnRWe9/lsrZiPY2370KI5UZte9rImTgeUqO6	1	1	2026-08-23 13:54:17.308789	2026-07-12 00:55:03.667405	2026-08-23 12:50:07.108583	4	2	1250200077551	3	กัลย์ธิดา	อนุสนธิ์	0922419894	t	\N	\N	/api/uploads/avatars/5_1787489407098.jpg	0	\N	\N
\.


--
-- Name: academic_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.academic_years_id_seq', 4, true);


--
-- Name: attendance_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_records_id_seq', 1, false);


--
-- Name: attendance_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_settings_id_seq', 1, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 10, true);


--
-- Name: departments_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq1', 1, false);


--
-- Name: departments_id_seq2; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq2', 1, false);


--
-- Name: evaluation_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_answers_id_seq', 1, false);


--
-- Name: evaluation_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_assignments_id_seq', 110, true);


--
-- Name: evaluation_instance_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_instance_attachments_id_seq', 8, true);


--
-- Name: evaluation_instance_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_instance_audit_log_id_seq', 1, false);


--
-- Name: evaluation_instance_evaluators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_instance_evaluators_id_seq', 5, true);


--
-- Name: evaluation_instance_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_instance_fields_id_seq', 220, true);


--
-- Name: evaluation_instance_question_choices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_instance_question_choices_id_seq', 115, true);


--
-- Name: evaluation_instance_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_instance_questions_id_seq', 23, true);


--
-- Name: evaluation_instances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_instances_id_seq', 2, true);


--
-- Name: evaluation_question_choices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_question_choices_id_seq', 364, true);


--
-- Name: evaluation_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_questions_id_seq', 68, true);


--
-- Name: evaluation_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_sections_id_seq', 18, true);


--
-- Name: evaluation_targets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_targets_id_seq', 44, true);


--
-- Name: evaluation_template_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_template_fields_id_seq', 25, true);


--
-- Name: evaluation_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluation_templates_id_seq', 14, true);


--
-- Name: iqa_assessment_cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_assessment_cycles_id_seq', 1, true);


--
-- Name: iqa_assessment_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_assessment_scores_id_seq', 1, false);


--
-- Name: iqa_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_assessments_id_seq', 2, true);


--
-- Name: iqa_criteria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_criteria_id_seq', 13, true);


--
-- Name: iqa_evidence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_evidence_id_seq', 1, true);


--
-- Name: iqa_indicators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_indicators_id_seq', 21, true);


--
-- Name: iqa_quality_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_quality_levels_id_seq', 5, true);


--
-- Name: iqa_school_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_school_summary_id_seq', 1, false);


--
-- Name: iqa_standards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.iqa_standards_id_seq', 3, true);


--
-- Name: line_login_states_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.line_login_states_id_seq', 6, true);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 34, true);


--
-- Name: person_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.person_types_id_seq', 1, false);


--
-- Name: person_types_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.person_types_id_seq1', 1, false);


--
-- Name: positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.positions_id_seq', 8, true);


--
-- Name: positions_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.positions_id_seq1', 10, true);


--
-- Name: positions_id_seq2; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.positions_id_seq2', 1, false);


--
-- Name: prefixes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prefixes_id_seq', 9, true);


--
-- Name: prefixes_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prefixes_id_seq1', 1, false);


--
-- Name: prefixes_id_seq2; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prefixes_id_seq2', 1, false);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 12, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 77, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: score_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.score_levels_id_seq', 5, true);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 43, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 46, true);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: academic_years academic_years_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_year_key UNIQUE (year);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: attendance_settings attendance_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_settings
    ADD CONSTRAINT attendance_settings_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: evaluation_answers evaluation_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_answers
    ADD CONSTRAINT evaluation_answers_pkey PRIMARY KEY (id);


--
-- Name: evaluation_assignments evaluation_assignments_instance_id_evaluator_id_target_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_assignments
    ADD CONSTRAINT evaluation_assignments_instance_id_evaluator_id_target_id_key UNIQUE (instance_id, evaluator_id, target_id);


--
-- Name: evaluation_assignments evaluation_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_assignments
    ADD CONSTRAINT evaluation_assignments_pkey PRIMARY KEY (id);


--
-- Name: evaluation_instance_attachments evaluation_instance_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_attachments
    ADD CONSTRAINT evaluation_instance_attachments_pkey PRIMARY KEY (id);


--
-- Name: evaluation_instance_audit_log evaluation_instance_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_audit_log
    ADD CONSTRAINT evaluation_instance_audit_log_pkey PRIMARY KEY (id);


--
-- Name: evaluation_instance_evaluators evaluation_instance_evaluators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_evaluators
    ADD CONSTRAINT evaluation_instance_evaluators_pkey PRIMARY KEY (id);


--
-- Name: evaluation_instance_fields evaluation_instance_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_fields
    ADD CONSTRAINT evaluation_instance_fields_pkey PRIMARY KEY (id);


--
-- Name: evaluation_instance_question_choices evaluation_instance_question_choices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_question_choices
    ADD CONSTRAINT evaluation_instance_question_choices_pkey PRIMARY KEY (id);


--
-- Name: evaluation_instance_questions evaluation_instance_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_questions
    ADD CONSTRAINT evaluation_instance_questions_pkey PRIMARY KEY (id);


--
-- Name: evaluation_instances evaluation_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instances
    ADD CONSTRAINT evaluation_instances_pkey PRIMARY KEY (id);


--
-- Name: evaluation_question_choices evaluation_question_choices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_question_choices
    ADD CONSTRAINT evaluation_question_choices_pkey PRIMARY KEY (id);


--
-- Name: evaluation_questions evaluation_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_questions
    ADD CONSTRAINT evaluation_questions_pkey PRIMARY KEY (id);


--
-- Name: evaluation_sections evaluation_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_sections
    ADD CONSTRAINT evaluation_sections_pkey PRIMARY KEY (id);


--
-- Name: evaluation_targets evaluation_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_targets
    ADD CONSTRAINT evaluation_targets_pkey PRIMARY KEY (id);


--
-- Name: evaluation_template_fields evaluation_template_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_template_fields
    ADD CONSTRAINT evaluation_template_fields_pkey PRIMARY KEY (id);


--
-- Name: evaluation_template_fields evaluation_template_fields_template_id_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_template_fields
    ADD CONSTRAINT evaluation_template_fields_template_id_field_key_key UNIQUE (template_id, field_key);


--
-- Name: evaluation_templates evaluation_templates_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_templates
    ADD CONSTRAINT evaluation_templates_code_key UNIQUE (code);


--
-- Name: evaluation_templates evaluation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_templates
    ADD CONSTRAINT evaluation_templates_pkey PRIMARY KEY (id);


--
-- Name: iqa_assessment_cycles iqa_assessment_cycles_academic_year_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_cycles
    ADD CONSTRAINT iqa_assessment_cycles_academic_year_name_key UNIQUE (academic_year, name);


--
-- Name: iqa_assessment_cycles iqa_assessment_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_cycles
    ADD CONSTRAINT iqa_assessment_cycles_pkey PRIMARY KEY (id);


--
-- Name: iqa_assessment_scores iqa_assessment_scores_assessment_id_indicator_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_scores
    ADD CONSTRAINT iqa_assessment_scores_assessment_id_indicator_id_key UNIQUE (assessment_id, indicator_id);


--
-- Name: iqa_assessment_scores iqa_assessment_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_scores
    ADD CONSTRAINT iqa_assessment_scores_pkey PRIMARY KEY (id);


--
-- Name: iqa_assessments iqa_assessments_cycle_id_assessor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessments
    ADD CONSTRAINT iqa_assessments_cycle_id_assessor_id_key UNIQUE (cycle_id, assessor_id);


--
-- Name: iqa_assessments iqa_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessments
    ADD CONSTRAINT iqa_assessments_pkey PRIMARY KEY (id);


--
-- Name: iqa_criteria iqa_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_criteria
    ADD CONSTRAINT iqa_criteria_pkey PRIMARY KEY (id);


--
-- Name: iqa_criteria iqa_criteria_standard_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_criteria
    ADD CONSTRAINT iqa_criteria_standard_id_code_key UNIQUE (standard_id, code);


--
-- Name: iqa_evidence iqa_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_evidence
    ADD CONSTRAINT iqa_evidence_pkey PRIMARY KEY (id);


--
-- Name: iqa_indicators iqa_indicators_criterion_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_indicators
    ADD CONSTRAINT iqa_indicators_criterion_id_code_key UNIQUE (criterion_id, code);


--
-- Name: iqa_indicators iqa_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_indicators
    ADD CONSTRAINT iqa_indicators_pkey PRIMARY KEY (id);


--
-- Name: iqa_quality_levels iqa_quality_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_quality_levels
    ADD CONSTRAINT iqa_quality_levels_pkey PRIMARY KEY (id);


--
-- Name: iqa_school_summary iqa_school_summary_cycle_id_indicator_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_school_summary
    ADD CONSTRAINT iqa_school_summary_cycle_id_indicator_id_key UNIQUE (cycle_id, indicator_id);


--
-- Name: iqa_school_summary iqa_school_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_school_summary
    ADD CONSTRAINT iqa_school_summary_pkey PRIMARY KEY (id);


--
-- Name: iqa_standards iqa_standards_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_standards
    ADD CONSTRAINT iqa_standards_code_key UNIQUE (code);


--
-- Name: iqa_standards iqa_standards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_standards
    ADD CONSTRAINT iqa_standards_pkey PRIMARY KEY (id);


--
-- Name: line_login_states line_login_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_login_states
    ADD CONSTRAINT line_login_states_pkey PRIMARY KEY (id);


--
-- Name: line_login_states line_login_states_state_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.line_login_states
    ADD CONSTRAINT line_login_states_state_key UNIQUE (state);


--
-- Name: organizations organizations_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_code_key UNIQUE (code);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: person_types person_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_types
    ADD CONSTRAINT person_types_code_key UNIQUE (code);


--
-- Name: person_types person_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_types
    ADD CONSTRAINT person_types_pkey PRIMARY KEY (id);


--
-- Name: positions positions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_code_key UNIQUE (code);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prefixes
    ADD CONSTRAINT prefixes_code_key UNIQUE (code);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: score_levels score_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.score_levels
    ADD CONSTRAINT score_levels_pkey PRIMARY KEY (id);


--
-- Name: score_levels score_levels_score_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.score_levels
    ADD CONSTRAINT score_levels_score_key UNIQUE (score);


--
-- Name: attendance_records uq_attendance_user_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT uq_attendance_user_date UNIQUE (user_id, record_date);


--
-- Name: evaluation_answers uq_evaluation_answer; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_answers
    ADD CONSTRAINT uq_evaluation_answer UNIQUE (assignment_id, question_id);


--
-- Name: users uq_users_cid; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_cid UNIQUE (cid);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_attachment_instance_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attachment_instance_id ON public.evaluation_instance_attachments USING btree (instance_id);


--
-- Name: idx_attachment_target_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attachment_target_id ON public.evaluation_instance_attachments USING btree (target_id);


--
-- Name: idx_eval_audit_instance_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eval_audit_instance_id ON public.evaluation_instance_audit_log USING btree (instance_id, created_at DESC);


--
-- Name: idx_evaluation_answers_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluation_answers_assignment ON public.evaluation_answers USING btree (assignment_id);


--
-- Name: idx_evaluation_answers_question; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluation_answers_question ON public.evaluation_answers USING btree (question_id);


--
-- Name: idx_evaluation_instances_template_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluation_instances_template_year ON public.evaluation_instances USING btree (template_id, academic_year);


--
-- Name: idx_instance_fields_instance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instance_fields_instance ON public.evaluation_instance_fields USING btree (instance_id);


--
-- Name: idx_line_login_states_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_line_login_states_created ON public.line_login_states USING btree (created_at);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_template_fields_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_template_fields_template ON public.evaluation_template_fields USING btree (template_id);


--
-- Name: uq_users_line_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_users_line_user_id ON public.users USING btree (line_user_id) WHERE (line_user_id IS NOT NULL);


--
-- Name: attendance_records attendance_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: evaluation_answers evaluation_answers_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_answers
    ADD CONSTRAINT evaluation_answers_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.evaluation_assignments(id) ON DELETE CASCADE;


--
-- Name: evaluation_answers evaluation_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_answers
    ADD CONSTRAINT evaluation_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.evaluation_instance_questions(id) ON DELETE CASCADE;


--
-- Name: evaluation_assignments evaluation_assignments_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_assignments
    ADD CONSTRAINT evaluation_assignments_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES public.users(id);


--
-- Name: evaluation_assignments evaluation_assignments_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_assignments
    ADD CONSTRAINT evaluation_assignments_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.evaluation_instances(id) ON DELETE CASCADE;


--
-- Name: evaluation_assignments evaluation_assignments_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_assignments
    ADD CONSTRAINT evaluation_assignments_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.evaluation_targets(id) ON DELETE CASCADE;


--
-- Name: evaluation_instance_attachments evaluation_instance_attachments_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_attachments
    ADD CONSTRAINT evaluation_instance_attachments_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.evaluation_instances(id) ON DELETE CASCADE;


--
-- Name: evaluation_instance_attachments evaluation_instance_attachments_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_attachments
    ADD CONSTRAINT evaluation_instance_attachments_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.evaluation_targets(id) ON DELETE CASCADE;


--
-- Name: evaluation_instance_attachments evaluation_instance_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_attachments
    ADD CONSTRAINT evaluation_instance_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: evaluation_instance_audit_log evaluation_instance_audit_log_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_audit_log
    ADD CONSTRAINT evaluation_instance_audit_log_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.evaluation_instances(id) ON DELETE CASCADE;


--
-- Name: evaluation_instance_evaluators evaluation_instance_evaluators_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_evaluators
    ADD CONSTRAINT evaluation_instance_evaluators_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.evaluation_instances(id);


--
-- Name: evaluation_instance_fields evaluation_instance_fields_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_fields
    ADD CONSTRAINT evaluation_instance_fields_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.evaluation_instances(id) ON DELETE CASCADE;


--
-- Name: evaluation_instance_fields evaluation_instance_fields_template_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_fields
    ADD CONSTRAINT evaluation_instance_fields_template_field_id_fkey FOREIGN KEY (template_field_id) REFERENCES public.evaluation_template_fields(id);


--
-- Name: evaluation_instance_question_choices evaluation_instance_question__evaluation_instance_question_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_question_choices
    ADD CONSTRAINT evaluation_instance_question__evaluation_instance_question_fkey FOREIGN KEY (evaluation_instance_question_id) REFERENCES public.evaluation_instance_questions(id);


--
-- Name: evaluation_instance_questions evaluation_instance_questions_evaluation_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_questions
    ADD CONSTRAINT evaluation_instance_questions_evaluation_instance_id_fkey FOREIGN KEY (evaluation_instance_id) REFERENCES public.evaluation_instances(id);


--
-- Name: evaluation_instance_questions evaluation_instance_questions_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_questions
    ADD CONSTRAINT evaluation_instance_questions_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.evaluation_sections(id);


--
-- Name: evaluation_instance_questions evaluation_instance_questions_source_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_questions
    ADD CONSTRAINT evaluation_instance_questions_source_question_id_fkey FOREIGN KEY (source_question_id) REFERENCES public.evaluation_questions(id) ON DELETE SET NULL;


--
-- Name: evaluation_instances evaluation_instances_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instances
    ADD CONSTRAINT evaluation_instances_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.evaluation_templates(id);


--
-- Name: evaluation_question_choices evaluation_question_choices_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_question_choices
    ADD CONSTRAINT evaluation_question_choices_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.evaluation_questions(id) ON DELETE CASCADE;


--
-- Name: evaluation_questions evaluation_questions_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_questions
    ADD CONSTRAINT evaluation_questions_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.evaluation_sections(id) ON DELETE CASCADE;


--
-- Name: evaluation_sections evaluation_sections_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_sections
    ADD CONSTRAINT evaluation_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.evaluation_templates(id) ON DELETE CASCADE;


--
-- Name: evaluation_targets evaluation_targets_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_targets
    ADD CONSTRAINT evaluation_targets_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.evaluation_instances(id) ON DELETE CASCADE;


--
-- Name: evaluation_template_fields evaluation_template_fields_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_template_fields
    ADD CONSTRAINT evaluation_template_fields_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.evaluation_templates(id) ON DELETE CASCADE;


--
-- Name: evaluation_instance_fields fk_instance_fields_target; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_instance_fields
    ADD CONSTRAINT fk_instance_fields_target FOREIGN KEY (target_id) REFERENCES public.evaluation_targets(id);


--
-- Name: role_permissions fk_permission; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: evaluation_templates fk_template_organization; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_templates
    ADD CONSTRAINT fk_template_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: evaluation_templates fk_template_owner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_templates
    ADD CONSTRAINT fk_template_owner FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: evaluation_templates fk_template_source; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluation_templates
    ADD CONSTRAINT fk_template_source FOREIGN KEY (source_template_id) REFERENCES public.evaluation_templates(id);


--
-- Name: user_roles fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users fk_user_org; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: iqa_assessment_cycles iqa_assessment_cycles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_cycles
    ADD CONSTRAINT iqa_assessment_cycles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: iqa_assessment_scores iqa_assessment_scores_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_scores
    ADD CONSTRAINT iqa_assessment_scores_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.iqa_assessments(id) ON DELETE CASCADE;


--
-- Name: iqa_assessment_scores iqa_assessment_scores_indicator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessment_scores
    ADD CONSTRAINT iqa_assessment_scores_indicator_id_fkey FOREIGN KEY (indicator_id) REFERENCES public.iqa_indicators(id) ON DELETE CASCADE;


--
-- Name: iqa_assessments iqa_assessments_assessor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessments
    ADD CONSTRAINT iqa_assessments_assessor_id_fkey FOREIGN KEY (assessor_id) REFERENCES public.users(id);


--
-- Name: iqa_assessments iqa_assessments_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_assessments
    ADD CONSTRAINT iqa_assessments_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.iqa_assessment_cycles(id) ON DELETE CASCADE;


--
-- Name: iqa_criteria iqa_criteria_standard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_criteria
    ADD CONSTRAINT iqa_criteria_standard_id_fkey FOREIGN KEY (standard_id) REFERENCES public.iqa_standards(id) ON DELETE CASCADE;


--
-- Name: iqa_evidence iqa_evidence_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_evidence
    ADD CONSTRAINT iqa_evidence_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.iqa_assessments(id) ON DELETE CASCADE;


--
-- Name: iqa_evidence iqa_evidence_indicator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_evidence
    ADD CONSTRAINT iqa_evidence_indicator_id_fkey FOREIGN KEY (indicator_id) REFERENCES public.iqa_indicators(id);


--
-- Name: iqa_evidence iqa_evidence_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_evidence
    ADD CONSTRAINT iqa_evidence_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: iqa_indicators iqa_indicators_criterion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_indicators
    ADD CONSTRAINT iqa_indicators_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES public.iqa_criteria(id) ON DELETE CASCADE;


--
-- Name: iqa_school_summary iqa_school_summary_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_school_summary
    ADD CONSTRAINT iqa_school_summary_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.iqa_assessment_cycles(id) ON DELETE CASCADE;


--
-- Name: iqa_school_summary iqa_school_summary_indicator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iqa_school_summary
    ADD CONSTRAINT iqa_school_summary_indicator_id_fkey FOREIGN KEY (indicator_id) REFERENCES public.iqa_indicators(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_replaced_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_replaced_by_id_fkey FOREIGN KEY (replaced_by_id) REFERENCES public.refresh_tokens(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict EBGiYP65co6bqJ0eBuzjPyuKFzA2p9otwQgbIe2eMd8raru9fcnKSaPDRIIt1e4

