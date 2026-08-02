package evaluationModels

import "time"

type EvaluatorAssignmentDetail struct {
	ID             int                     `json:"id"`
	TemplateID     int                     `json:"template_id"`
	TemplateName   string                  `json:"template_name"`
	InstanceName   *string                 `json:"instance_name"`
	Status         string                  `json:"status"`
	AcademicYear   int                     `json:"academic_year"`
	Round          string                  `json:"round"`
    StartDate             *time.Time         `json:"start_date"`
	EndDate               *time.Time         `json:"end_date"`
    CreatedBy int64 `json:"created_by"`

	UpdatedAt *time.Time `json:"updated_at"`
	Target         EvaluationTarget        `json:"target"`
	Evaluators     []EvaluationEvaluator   `json:"evaluators"`

	Fields         []InstanceField         `json:"fields"`
	Questions      []EvaluatorQuestion      `json:"questions"`
	ShowScoreToVisibility bool `json:"show_score_to_visibility"`

	Comment        *string                 `json:"comment"`
	TotalScore     *float64                `json:"total_score"`
	AverageScore   *float64                `json:"average_score"`
}


type EvaluationTarget struct {
	ID       int     `json:"id"`
	UserID   int     `json:"user_id"`
	Status   *string `json:"status"` // ต้องมี
	Name     string  `json:"name"`
	Position *string `json:"position"`
}


type EvaluationEvaluator struct {
	UserID            int    `json:"user_id"`
	NameSnapshot      string `json:"name_snapshot"`
	PositionSnapshot  string `json:"position_snapshot"`
}


// type InstanceField struct {
// 	ID          int     `json:"id"`
// 	FieldKey    string  `json:"field_key"`
// 	Label       string  `json:"label"`
// 	FieldType   string  `json:"field_type"`
// 	Value       *string `json:"value"`
// }

type EvaluatorQuestion struct {
	ID                int     `json:"id"`
	SectionID         *int    `json:"section_id"`
	Category          *string `json:"category"`
	CategorySortOrder *int    `json:"category_sort_order"`
	QuestionText      string  `json:"question_text"`
	QuestionType      string  `json:"question_type"`
	MaxScore          *int    `json:"max_score"`
	SortOrder         int     `json:"sort_order"`

	Choices []QuestionChoice `json:"choices"`

	SelectedChoiceID *int     `json:"selected_choice_id"`
	SelectedScore    *float64 `json:"selected_score"`
}


// type QuestionChoice struct {
// 	ID     int    `json:"id"`
// 	Label  string `json:"label"`
// 	Score  int    `json:"score"`
// }