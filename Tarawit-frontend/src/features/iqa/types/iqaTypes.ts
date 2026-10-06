// ═══════════ IQA Module Types ═══════════

export interface IQAStandard {
  id: number;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface IQACriterion {
  id: number;
  standard_id: number;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface IQAIndicator {
  id: number;
  criterion_id: number;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface IQAQualityLevel {
  id: number;
  score: number;
  label: string;
  description?: string;
  color: string;
  sort_order: number;
}

// Tree types
export interface IQACriterionTree extends IQACriterion {
  indicators: IQAIndicator[];
}

export interface IQAStandardTree extends IQAStandard {
  criteria: IQACriterionTree[];
}

// Cycle
export interface IQACycle {
  id: number;
  academic_year: number;
  name: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
  start_date?: string;
  end_date?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

// Assessment
export interface IQAAssessment {
  id: number;
  cycle_id: number;
  assessor_id: number;
  status: "DRAFT" | "IN_PROGRESS" | "SUBMITTED";
  total_score?: number;
  avg_score?: number;
  quality_level?: string;
  comment?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  assessor_name?: string;
}

export interface IQAAssessmentScore {
  id: number;
  assessment_id: number;
  indicator_id: number;
  score: number;
  comment?: string;
}

export interface IQAEvidence {
  id: number;
  assessment_id: number;
  indicator_id?: number;
  file_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  uploaded_by?: number;
  created_at: string;
}

// School summary
export interface IQASchoolSummary {
  id: number;
  cycle_id: number;
  indicator_id: number;
  avg_score: number;
  min_score: number;
  max_score: number;
  assessor_count: number;
  quality_level: string;
}

// Full assessment detail
export interface IQAAssessmentDetail {
  assessment: IQAAssessment;
  scores: IQAAssessmentScore[];
  evidence: IQAEvidence[];
}

// Request types
export interface CreateCyclePayload {
  academic_year: number;
  name: string;
  start_date?: string;
  end_date?: string;
}

export interface ScoreItem {
  indicator_id: number;
  score: number;
  comment?: string;
}
