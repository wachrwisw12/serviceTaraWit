package evaluationModels

import "time"

type CreateEvaluationInstancePayload struct {
	TemplateID            int64    `json:"template_id" validate:"required"`
	InstanceName          string    `json:"instance_name"`
	AcademicYear          int64      `json:"academic_year" validate:"required"`
	Round                 string   `json:"round" validate:"required"`
	TargetMemberIDs    []string `json:"target_member_ids" validate:"required"`
    EvaluatorMemberIDs []string `json:"evaluator_member_ids" validate:"required"`
	ShowScoreToVisibility bool     `json:"show_score_to_visibility"`
	CreateBy              int64    `json:"-"`
}


type CreateEvaluationInstanceResponse struct {
	Success          bool `json:"success"`
	Message          string `json:"message"`
	TargetCount      int  `json:"target_count"`      // ผู้ถูกประเมิน
	EvaluatorCount   int  `json:"evaluator_count"`   // ผู้ประเมิน
}


type QuestionDTO struct {
	ID       uint     `json:"id"`
	Order    int      `json:"order"`
	Category string   `json:"category,omitempty"`
	Text     string   `json:"text"`
	Type     string   `json:"type"` // "score" | "text" | "choice"
	MaxScore *int     `json:"max_score,omitempty"`
	Weight   *float64 `json:"weight,omitempty"`
	Options  []string `json:"options,omitempty"`
	Answer   *AnswerDTO `json:"answer,omitempty"`
}
type AnswerDTO struct {
	Score  *float64 `json:"score,omitempty"`
	Text   *string  `json:"text,omitempty"`
	Choice *string  `json:"choice,omitempty"`
}
type TargetDTO struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Position string `json:"position"`
}
type AssignmentDetailDTO struct {
	ID           uint          `json:"id"`
	TemplateName string        `json:"template_name"`
	AcademicYear int           `json:"academic_year"`
	Round        string        `json:"round"`
	Target       TargetDTO     `json:"target"`
	Status       string        `json:"status"`
	Questions    []QuestionDTO `json:"questions"`
}

type SubmitAnswerInput struct {
	QuestionID uint     `json:"question_id" binding:"required"`
	Score      *float64 `json:"score"`
	Text       *string  `json:"text"`
	Choice     *string  `json:"choice"`
}
type SubmitAssignmentRequest struct {
	Answers []SubmitAnswerInput `json:"answers" binding:"required,min=1"`
	Comment *string             `json:"comment"`
	IsDraft bool                `json:"is_draft"`
}


type InstanceListResponce struct {
	ID           uint         `json:"id"`
	TemplateId   uint         `json:"template_id"`
	TemplateName string       `json:"template_name"`
	StartDate    *time.Time   `json:"start_date"`
	EndDate      *time.Time   `json:"end_date"`
	CreatedBy    uint         `json:"created_by"`   // แก้ "
	UpdatedAt    time.Time    `json:"updated_at"`   // แก้ "
	AcademicYear int          `json:"academic_year"`
	Round        string       `json:"round"`
	Target       TargetDTO    `json:"target"`
	Status       string       `json:"status"`
	Evaluators   []Evaluators `json:"evaluators"`
}

type Evaluators struct {
	UserId            uint   `json:"user_id"`
	NameSnapshort     string `json:"name_snapshort"`
	PositionSnapshort string `json:"position_snapshort"` // แก้ tag
}