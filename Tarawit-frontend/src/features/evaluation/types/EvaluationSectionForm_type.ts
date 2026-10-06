import type { TemplateType } from "./template_type";

export interface EvaluationSectionForm {
  template_type: TemplateType;
  attachments: unknown;
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
  accessible_targets: EvaluationTargetDetail[];
  evaluators: EvaluationEvaluator[];
  fields: InstanceField[];
  questions: InstanceQuestion[];
  sections: InstanceSection[];
  comment: string | null;
  total_score: number | null;
  average_score: number | null;

  /** id ของไฟล์แนบของ instance+target นี้ (ฝั่งผู้ประเมิน) */
  attachment_ids?: number[];

  /** assignment_id ของ user ปัจจุบันใน instance นี้ (ใช้สำหรับ SURVEY submit) */
  assignment_id?: number | null;

  /** สถานะของ assignment นี้เอง (pending / submitted) */
  assignment_status?: string;

  /** รายชื่อผู้ถูกประเมินทั้งหมดของผู้ประเมินคนนี้ใน instance เดียวกัน (ก่อนหน้า/ถัดไป) */
  siblings?: AssignmentSibling[];
}

export interface AssignmentSibling {
  assignment_id: number;
  target_name: string;
  target_position?: string | null;
  /** สถานะการให้คะแนน: "pending" | "submitted" */
  status: string;
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
  submitted?: boolean;
  can_score: boolean;
  requires_signature: boolean;
  signature_order: number;
  signature_role: string;
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

  /** คะแนนที่บันทึกไว้แล้ว (จาก API ของผู้ประเมิน) */
  selected_score?: number | null;
  selected_choice_id?: number | null;

  /** คะแนนของแต่ละผู้ประเมินที่ส่งแล้ว (โหมดดูผล/ผู้ถูกประเมิน) */
  evaluator_scores?: EvaluatorScore[];
}

export interface EvaluatorScore {
  evaluator_id: number;
  evaluator_name: string;
  score: number;
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

  /** บทบาทของผู้ใช้ล็อกอินในรายการนี้: "target" | "evaluator" | "both" */
  role: string;
  my_can_score: boolean;
  my_requires_signature: boolean;

  /** batch_id ของรายการฝั่งผู้ประเมิน ใช้ลิงก์ไปหน้าให้คะแนน */
  batch_id?: string | null;

  /** จำนวนผู้ถูกประเมินที่ผู้ใช้ต้องให้คะแนนในรายการนี้ */
  my_assignment_count?: number;

  /** จำนวนผู้ถูกประเมินที่ให้คะแนนไปแล้ว */
  my_submitted_count?: number;

  /** จำนวนผู้ประเมินทั้งหมดที่ได้รับมอบหมายให้ประเมินผู้ใช้ปัจจุบัน */
  target_evaluator_count?: number;

  /** จำนวนผู้ประเมินที่ส่งคะแนนให้ผู้ใช้ปัจจุบันแล้ว */
  target_submitted_count?: number;

  /** assignment_id แรกที่ยังไม่ได้ให้คะแนน (nil = ให้ครบแล้ว) */
  my_pending_assignment_id?: number | null;

  /** รายชื่อผู้ถูกประเมินทั้งหมดของรายการนี้ พร้อมสถานะการให้คะแนน */
  my_assignments?: MyAssignmentInfo[];
}

export interface MyAssignmentInfo {
  assignment_id: number;
  target_user_id: number;
  target_name: string;
  target_position?: string | null;
  /** สถานะการให้คะแนน: "pending" | "submitted" */
  status: string;
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
