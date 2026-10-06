export interface InstanceStatsSummary {
  total: number;
  open: number;
  draft: number;
  closed: number;
}

export interface AssignmentStatsSummary {
  total: number;
  submitted: number;
  pending: number;
  completion_percent: number | null;
}

export interface ParticipantStatsSummary {
  total: number;
  max_possible: number;
  evaluator_count: number;
  target_count: number;
}

export interface TemplateScoreSummary {
  template_name: string;
  assignment_count: number;
  submitted_count: number;
  average_score: number | null;
}

export interface RecentInstanceSummary {
  id: number;
  template_name: string;
  template_type: string;
  academic_year: number;
  round: string;
  status: string;
  total_targets: number;
  submitted_count: number;
  batch_id: string;
}

export interface MyEvaluatorSummary {
  instance_count: number;
  total_assigned: number;
  total_submitted: number;
  total_pending: number;
}

export interface MyTargetSummary {
  instance_count: number;
  average_score: number | null;
}

export interface MyRoleSummary {
  as_evaluator: MyEvaluatorSummary | null;
  as_target: MyTargetSummary | null;
}

export interface EvaluationSummary {
  instance_stats: InstanceStatsSummary;
  assignment_stats: AssignmentStatsSummary;
  average_score: number | null;
  score_change: number | null;
  participant_stats: ParticipantStatsSummary;
  score_by_template: TemplateScoreSummary[];
  recent_instances: RecentInstanceSummary[];
  my_role_summary: MyRoleSummary | null;
}
