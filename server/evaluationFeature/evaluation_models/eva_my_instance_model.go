package evaluationModels

import "time"

// --- List response (GET /evaluation/instances/get-my-instance) ---
// Unchanged from your original — matches evaluation_instance_evaluators exactly
// (id, instance_id, user_id, name_snapshot, position_snapshot, created_at).

type EvaluatorInfo struct {
	UserId            int64   `json:"user_id"`
	NameSnapshort     string  `json:"name_snapshort"`
	PositionSnapshort *string `json:"position_snapshort"`
}

// type InstanceListResponce struct {
// 	ID           int64           `json:"id"`
// 	TemplateId   int64           `json:"template_id"`
// 	TemplateName string          `json:"template_name"`
// 	Status       string          `json:"status"`
// 	StartDate    *time.Time      `json:"start_date"`
// 	EndDate      *time.Time      `json:"end_date"`
// 	CreatedBy    int64           `json:"created_by"`
// 	UpdatedAt    time.Time       `json:"updated_at"`
// 	AcademicYear int             `json:"academic_year"`
// 	Round        string          `json:"round"`
// 	TargetUserId *int64          `json:"target_user_id"`
// 	Evaluators   []EvaluatorInfo `json:"evaluators"`
// }

// --- Detail response (GET /evaluation/instances/get-my-instance/:id) ---
// Only reference data: instance info, target info (with real name/position),
// evaluator list, and the instance's questions/choices as reference —
// there is no answers table yet, so no submitted scores are included.

// QuestionChoice is one selectable option for a question
// (evaluation_instance_question_choices: id, label, score, sort_order).
type QuestionChoice struct {
	ID        int64   `json:"id"`
	Label     string  `json:"label"`
	Score     float64 `json:"score"`
	SortOrder int     `json:"sort_order"`
}

// InstanceQuestion is one question on this instance's form
// (evaluation_instance_questions), with its selectable choices nested.
//
// SectionId/Category/CategorySortOrder come from a LEFT JOIN to
// evaluation_sections via evaluation_instance_questions.section_id — all
// three are nil/null for forms that don't group questions into sections
// (e.g. "แบบนิเทศสื่อการสอน"), so they must stay pointers.
type InstanceQuestion struct {
	ID                 int64            `json:"id"`
	SectionId          *int64           `json:"section_id"`
	Category           *string          `json:"category"`
	CategorySortOrder  *int             `json:"category_sort_order"`
	QuestionText       string           `json:"question_text"`
	QuestionType       string           `json:"question_type"`
	MaxScore           *int             `json:"max_score"`
	SortOrder          int              `json:"sort_order"`
	Choices            []QuestionChoice `json:"choices"`
}

// TargetInfo is the person being evaluated in this instance
// (evaluation_targets joined to users -> positions/prefixes).
type TargetInfo struct {
	ID       int64   `json:"id"`
	UserId   int64   `json:"user_id"`
	Status   *string `json:"status"`
	Name     string  `json:"name"`
	Position *string `json:"position"`
}

type InstanceDetailResponce struct {
	ID                    int64              `json:"id"`
	TemplateId            int64              `json:"template_id"`
	TemplateName          string             `json:"template_name"`
	InstanceName          *string            `json:"instance_name"`
	Status                string             `json:"status"`
	StartDate             *time.Time         `json:"start_date"`
	EndDate               *time.Time         `json:"end_date"`
	CreatedBy             int64              `json:"created_by"`
	UpdatedAt             *time.Time         `json:"updated_at"`
	AcademicYear          int                `json:"academic_year"`
	Round                 string             `json:"round"`
	ShowScoreToVisibility *bool              `json:"show_score_to_visibility"`
	Target                TargetInfo         `json:"target"`

	Evaluators            []EvaluatorInfo    `json:"evaluators"`

	Fields []InstanceField `json:"fields"`

	Questions             []InstanceQuestion `json:"questions"`
}
type InstanceField struct {
	ID              int64   `json:"id"`
	InstanceID      int64   `json:"instance_id"`
	TargetID        int64   `json:"target_id"`
	TargetUserID    int64   `json:"target_user_id"`

	TemplateFieldID int64   `json:"template_field_id"`
	FieldKey        string  `json:"field_key"`
	Label           string  `json:"label"`
	FieldType       string  `json:"field_type"`

	Placeholder     *string `json:"placeholder"`
	Value           *string `json:"value"`

	Required        bool    `json:"required"`
	SortOrder       int     `json:"sort_order"`
}

type UpdateInstanceFieldsRequest struct {
	Fields map[int64]string `json:"fields"`
}

