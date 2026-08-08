export interface TemplateApiResponse {
  id: number;
  code: string;
  template_name: string;
  description: string;
  evaluation_target_id: EvaluationTarget;
  versions: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  created_by: number;
  created_at: string;
  template_type: TemplateType; // <-- เพิ่ม
  sectionCount?: number;
  questionCount?: number;
}
export type TemplateType = "EVALUATION" | "SURVEY";

export interface QuestionScoreResponse {
  score_id: number;
  label: string;
  sort_order: number;
}
export type EvaluationTarget =
  | "TEACHER"
  | "DIRECTOR"
  | "STAFF"
  | "STUDENT"
  | "PARENT"
  | "ALL";
export interface QuestionResponse {
  id: number;
  question: string;
  quesion_type: string;
  sort_order: number;
  question_score: QuestionScoreResponse[];
}

export interface SectionResponse {
  section_id: number;
  name: string;
  questions: QuestionResponse[];
}

export interface TemplateDetailResponse {
  id: number;
  code: string;
  template_name: string;
  evaluation_target_id: EvaluationTarget;
  versions: number;
  status: string;
  template_type: TemplateType;
  sections: SectionResponse[];
}

export interface Member {
  id: string;
  name: string;
  personTypeCode?: string;
  personTypeName?: string;
}

export interface MemberGroup {
  id: string;
  label: string;
  members: Member[];
}
