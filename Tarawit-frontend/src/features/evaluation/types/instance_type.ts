// export type CreateEvaluationInstancePayload = {
//   template_id: number;
//   academic_year: string;
//   round: string;
//   target_member_ids: string[];
//   evaluator_member_ids: string[];
//   show_score_to_visibility: boolean;
//   create_by: string;
// };

// ⚠️ สมมติ shape ของแต่ละแถวใน list — ต้องเช็คกับ backend จริงตอนต่อ endpoint
export type EvaluationInstanceListItem = {
  id: number;
  template_id: number;
  template_name: string;
  academic_year: number;
  round: string;
  status: "draft" | "open" | "closed";
  created_at: string;
  closed_at: string | null;
  target_count: number;
  evaluator_count: number;
  assignment_count: number;
};

export type RoundCountArgs = {
  templateId: string;
  academicYear: number;
};

export type EvaluationInstanceState = {
  roundCount: number | null;
  roundCountLoading: boolean;
  roundCountError: string | null;
  loading: boolean;
  error: string;
  creating: boolean;
  createError: string | null;

  instances: EvaluationInstanceListItem[];
  listLoading: boolean;
  listError: string | null;

  closingId: number | null;
  closeError: string | null;
};
