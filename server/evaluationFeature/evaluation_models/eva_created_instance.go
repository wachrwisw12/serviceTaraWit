package evaluationModels

type MyCreatedEvaluation struct {
	ID            int64  `json:"id"`
	BatchID       *string `json:"batch_id"`
	TemplateID    int64  `json:"template_id"`
	TemplateName  string `json:"template_name"`
	TemplateType  string `json:"template_type"`
	InstanceName  string `json:"instance_name"`
	AcademicYear  int    `json:"academic_year"`
	Round         string `json:"round"`
	Status        string `json:"status"`

	TargetCount     int `json:"target_count"`
	EvaluatorCount  int `json:"evaluator_count"`
	AssignmentCount int `json:"assignment_count"`

	CompletedCount int `json:"completed_count"`
}

// MyCreatedEvaluationSummary สรุปการประเมินสำหรับผู้สร้าง
// จำนวนผู้ถูกประเมิน/ผู้ประเมิน, คะแนนเฉลี่ย, ความครบถ้วน
// ของแต่ละผู้ประเมินและผู้ถูกประเมิน
type MyCreatedEvaluationSummary struct {
	ID            int64   `json:"id"`
	BatchID       *string `json:"batch_id"`
	TemplateID    int64   `json:"template_id"`
	TemplateName  string  `json:"template_name"`
	TemplateType  string  `json:"template_type"`
	InstanceName  string  `json:"instance_name"`
	AcademicYear  int     `json:"academic_year"`
	Round         string  `json:"round"`
	Status        string  `json:"status"`

	TargetCount     int `json:"target_count"`
	EvaluatorCount  int `json:"evaluator_count"`
	AssignmentCount int `json:"assignment_count"`
	CompletedCount  int `json:"completed_count"`

	// คะแนนเฉลี่ยต่อรอบการประเมิน (เฉพาะที่ส่งแล้ว)
	AverageScore *float64 `json:"average_score"`
	// คะแนนเต็มสูงสุดต่อรอบ (ผลรวม max_score ของคำถาม SCALE)
	MaxPossibleScore *float64 `json:"max_possible_score"`

	Evaluators []EvaluatorProgress `json:"evaluators"`
	Targets    []TargetProgress    `json:"targets"`

	// คะแนนเฉลี่ยแยกรายหมวด/ส่วน (เฉพาะรอบที่ส่งแล้ว)
	Sections []SectionScoreSummary `json:"sections"`
}

type SectionScoreSummary struct {
	SectionID        int64    `json:"section_id"`
	Name             string   `json:"name"`
	SortOrder        int      `json:"sort_order"`
	AverageScore     *float64 `json:"average_score"`
	MaxPossibleScore *float64 `json:"max_possible_score"`
}

type EvaluatorProgress struct {
	UserID           int64  `json:"user_id"`
	NameSnapshot     string `json:"name_snapshot"`
	PositionSnapshot string `json:"position_snapshot"`

	AssignmentCount int  `json:"assignment_count"`
	CompletedCount  int  `json:"completed_count"`
	Complete        bool `json:"complete"`
}

type TargetProgress struct {
	TargetID       int64    `json:"target_id"`
	UserID         int64    `json:"user_id"`
	Name           string   `json:"name"`
	Position       *string  `json:"position"`
	AssignmentCount int     `json:"assignment_count"`
	CompletedCount  int     `json:"completed_count"`
	AverageScore    *float64 `json:"average_score"`
}