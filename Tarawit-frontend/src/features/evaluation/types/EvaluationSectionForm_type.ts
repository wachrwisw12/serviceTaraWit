import type { TemplateType } from "./template_type";

export interface EvaluationSectionForm {
  template_type: TemplateType;
  attachments: any;
  id: number;
  template_id: number;
  template_name: string;
  instance_name: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  updated_at: string | null;
  academic_year: number;
  round: string;
  show_score_to_visibility: boolean | null;
  target: EvaluationTargetDetail;
  evaluators: EvaluationEvaluator[];
  fields: InstanceField[];
  questions: InstanceQuestion[];
  sections: InstanceSection[];
  comment: string | null;
  total_score: number | null;
  average_score: number | null;
}
export interface EvaluationTargetDetail {
  id: number;
  user_id: number;
  status: string | null;
  name: string;
  position: string | null;
}

export interface EvaluationEvaluator {
  user_id: number;
  name_snapshort: string;
  position_snapshort: string;
}
export interface InstanceField {
  id: number;
  template_field_id: number;

  field_key: string;
  label: string;
  field_type: string;

  placeholder: string | null;

  required: boolean;

  value: string | null;

  sort_order: number;
}
export interface InstanceQuestion {
  id: number;

  section_id: number | null;
  category: string | null;
  category_sort_order: number | null;

  question_text: string;
  question_type: string;
  max_score: number | null;
  sort_order: number;

  choices: QuestionChoice[];
}
export interface QuestionChoice {
  id: number;
  label: string;
  score: number;
  sort_order: number;
}

export interface InstanceSection {
  id: number;
  name: string;
  sort_order: number;

  questions: InstanceQuestion[];
}
export interface MyEvaluationAssignment {
  id: number;
  template_id: number;
  template_name: string;
  template_type: TemplateType;
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  updated_at: string;
  academic_year: number;
  round: string;
  target: EvaluationTarget;
  status: string;
  evaluators: EvaluationEvaluator[];
}
export interface EvaluationTarget {
  id: number;
  name: string;
  position: string;
}

export interface InstanceAttachment {
  id: number;
  instance_id: number;
  target_id: number;
  uploaded_by: number;

  file_name: string;
  stored_name: string;
  file_path: string;

  file_size: number;
  mime_type: string;

  created_at: string;
}
