package evaluationModels

import "time"

type CreateEvaluationInstancePayload struct {
	BatchID               string                  `json:"batch_id" validate:"required"` // ⬅️ เพิ่ม
	TemplateID            int64                   `json:"template_id" validate:"required"`
	InstanceName          string                  `json:"instance_name"`
	AcademicYear          int64                   `json:"academic_year" validate:"required"`
	Round                 string                  `json:"round" validate:"required"`
	TemplateType          string                  `json:"template_type"` // "EVALUATION" | "SURVEY" — ถ้าไม่ส่ง จะดึงจากแม่แบบ
	TargetMemberIDs       []string                `json:"target_member_ids" validate:"required"`
	EvaluatorMemberIDs    []string                `json:"evaluator_member_ids" validate:"required"`
	EvaluatorSettings     []EvaluatorSettingInput `json:"evaluator_settings"`
	ShowScoreToVisibility bool                    `json:"show_score_to_visibility"`
	CreateBy              int64                   `json:"-"`
}

type EvaluatorSettingInput struct {
	UserID            string `json:"user_id"`
	CanScore          bool   `json:"can_score"`
	RequiresSignature bool   `json:"requires_signature"`
	SignatureOrder    int    `json:"signature_order"`
	SignatureRole     string `json:"signature_role"`
}

type CreateEvaluationInstanceResponse struct {
	Success        bool   `json:"success"`
	Message        string `json:"message"`
	TargetCount    int    `json:"target_count"`    // ผู้ถูกประเมิน
	EvaluatorCount int    `json:"evaluator_count"` // ผู้ประเมิน
}

type QuestionDTO struct {
	ID       uint       `json:"id"`
	Order    int        `json:"order"`
	Category string     `json:"category,omitempty"`
	Text     string     `json:"text"`
	Type     string     `json:"type"` // "score" | "text" | "choice"
	MaxScore *int       `json:"max_score,omitempty"`
	Weight   *float64   `json:"weight,omitempty"`
	Options  []string   `json:"options,omitempty"`
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
	TemplateType string       `json:"template_type"`
	StartDate    *time.Time   `json:"start_date"`
	EndDate      *time.Time   `json:"end_date"`
	CreatedBy    uint         `json:"created_by"` // แก้ "
	UpdatedAt    time.Time    `json:"updated_at"` // แก้ "
	AcademicYear int          `json:"academic_year"`
	Round        string       `json:"round"`
	Target       TargetDTO    `json:"target"`
	Status       string       `json:"status"`
	TargetUserId int64        `json:"target_user_id"`
	Evaluators   []Evaluators `json:"evaluators"`

	// บทบาทของผู้ใช้ล็อกอินในรายการนี้: "target" | "evaluator" | "both"
	Role                string `json:"role"`
	MyCanScore          bool   `json:"my_can_score"`
	MyRequiresSignature bool   `json:"my_requires_signature"`

	// ฝั่งผู้ประเมิน (เป็นผู้นิเทศ)
	BatchID           string `json:"batch_id"`
	MyAssignmentCount int    `json:"my_assignment_count"`
	MySubmittedCount  int    `json:"my_submitted_count"`

	// ฝั่งผู้ถูกประเมิน: จำนวนผู้ประเมินทั้งหมดและจำนวนที่ส่งคะแนนแล้ว
	TargetEvaluatorCount int `json:"target_evaluator_count"`
	TargetSubmittedCount int `json:"target_submitted_count"`

	// assignment_id แรกที่ยังไม่ได้ให้คะแนนของรายการนี้ (nil = ให้ครบแล้ว)
	MyPendingAssignmentID *int64 `json:"my_pending_assignment_id"`

	// รายชื่อผู้ถูกประเมินทั้งหมดของผู้ใช้ในรายการนี้ พร้อมสถานะการให้คะแนน
	MyAssignments []MyAssignmentInfo `json:"my_assignments"`
}

// MyAssignmentInfo คือ 1 assignment ของผู้ใช้ (เป็นผู้นิเทศ) ต่อ 1 ผู้ถูกประเมิน
type MyAssignmentInfo struct {
	AssignmentID   int64   `json:"assignment_id"`
	TargetUserID   int64   `json:"target_user_id"`
	TargetName     string  `json:"target_name"`
	TargetPosition *string `json:"target_position"`
	// สถานะการให้คะแนน: "pending" | "submitted"
	Status string `json:"status"`
}

type Evaluators struct {
	UserId            int64  `json:"user_id"`
	NameSnapshort     string `json:"name_snapshort"`
	PositionSnapshort string `json:"position_snapshort"` // แก้ tag
	Submitted         bool   `json:"submitted"`
	CanScore          bool   `json:"can_score"`
	RequiresSignature bool   `json:"requires_signature"`
	SignatureOrder    int    `json:"signature_order"`
	SignatureRole     string `json:"signature_role"`
}
