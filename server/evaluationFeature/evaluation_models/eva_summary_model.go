package evaluationModels

// EvaluationSummary คือ response สำหรับหน้าสรุปการประเมิน (Dashboard)
type EvaluationSummary struct {
	// สถิติรอบประเมิน
	InstanceStats InstanceStatsSummary `json:"instance_stats"`

	// อัตราการส่งแบบประเมิน
	AssignmentStats AssignmentStatsSummary `json:"assignment_stats"`

	// คะแนนเฉลี่ยรวม
	AverageScore *float64 `json:"average_score"`
	ScoreChange  *float64 `json:"score_change"` // เปลี่ยนแปลงจากปีก่อน

	// ผู้เข้าร่วม
	ParticipantStats ParticipantStatsSummary `json:"participant_stats"`

	// คะแนนเฉลี่ยตามแม่แบบ
	ScoreByTemplate []TemplateScoreSummary `json:"score_by_template"`

	// รอบประเมินล่าสุด
	RecentInstances []RecentInstanceSummary `json:"recent_instances"`

	// สรุปตามบทบาทของ user ปัจจุบัน
	MyRoleSummary *MyRoleSummaryData `json:"my_role_summary"`
}

type InstanceStatsSummary struct {
	Total  int `json:"total"`
	Open   int `json:"open"`
	Draft  int `json:"draft"`
	Closed int `json:"closed"`
}

type AssignmentStatsSummary struct {
	Total             int      `json:"total"`
	Submitted         int      `json:"submitted"`
	Pending           int      `json:"pending"`
	CompletionPercent *float64 `json:"completion_percent"`
}

type ParticipantStatsSummary struct {
	Total         int `json:"total"`
	MaxPossible   int `json:"max_possible"`
	EvaluatorCount int `json:"evaluator_count"`
	TargetCount    int `json:"target_count"`
}

type TemplateScoreSummary struct {
	TemplateName   string   `json:"template_name"`
	AssignmentCount int     `json:"assignment_count"`
	SubmittedCount  int     `json:"submitted_count"`
	AverageScore    *float64 `json:"average_score"`
}

type RecentInstanceSummary struct {
	ID              int64   `json:"id"`
	TemplateName    string  `json:"template_name"`
	TemplateType    string  `json:"template_type"`
	AcademicYear    int     `json:"academic_year"`
	Round           string  `json:"round"`
	Status          string  `json:"status"`
	TotalTargets    int     `json:"total_targets"`
	SubmittedCount  int     `json:"submitted_count"`
	BatchID         string  `json:"batch_id"`
}

// MyRoleSummaryData สรุปตามบทบาทของ user ปัจจุบัน
type MyRoleSummaryData struct {
	// ฝั่งผู้ประเมิน (evaluator)
	AsEvaluator *MyEvaluatorSummary `json:"as_evaluator,omitempty"`
	// ฝั่งผู้ถูกประเมิน (target)
	AsTarget *MyTargetSummary `json:"as_target,omitempty"`
}

type MyEvaluatorSummary struct {
	InstanceCount  int `json:"instance_count"`
	TotalAssigned  int `json:"total_assigned"`
	TotalSubmitted int `json:"total_submitted"`
	TotalPending   int `json:"total_pending"`
}

type MyTargetSummary struct {
	InstanceCount int  `json:"instance_count"`
	AverageScore  *float64 `json:"average_score"`
}
