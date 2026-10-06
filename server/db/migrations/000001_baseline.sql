--
-- PostgreSQL database dump
--


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


