import type { QuestionChoice } from "./EvaluationSectionForm_type";

export interface EvaluatorQuestion {
  id: number;
  section_id: number | null;
  category: string | null;
  category_sort_order: number | null;
  question_text: string;
  question_type: string;
  max_score: number | null;
  sort_order: number;
  choices: QuestionChoice[];

  selected_choice_id: number | null;
  selected_score: number | null;
}

export interface EvaluationTarget {
  id: number;
  user_id: number;
  status: string | null;
  name: string;
  position: string | null;
}

export interface EvaluationEvaluator {
  user_id: number;
  name_snapshot: string;
  position_snapshot: string;
}
