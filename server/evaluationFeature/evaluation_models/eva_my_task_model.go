package evaluationModels

type MyEvaluationTaskResponse struct {
	BatchID         string `json:"batch_id"`
	Title           string `json:"title"`
	AcademicYear    int    `json:"academic_year"`
	Round           string `json:"round"`
	TotalTarget     int    `json:"total_target"`
	CompletedTarget int    `json:"completed_target"`
	Status          string `json:"status"`
	EvaluatorID     string `json:"evaluator_id"`
}


type BatchTargetResponse struct {
	UserID         int64                  `json:"user_id"`
	Name           string                 `json:"name"`
	Position       *string                 `json:"position"`
	TotalInstances int                    `json:"total_instances"`
	CompletedCount int                    `json:"completed_count"` // นับเฉพาะของผู้ประเมินคนปัจจุบัน
	Instances      []TargetInstanceStatus `json:"instances"`
}

type TargetInstanceStatus struct {
	InstanceID    int64             `json:"instance_id"`
	TemplateName  string            `json:"template_name"`
	AttachmentIDs []int64           `json:"attachment_ids"`

	// nil = ผู้เรียก API ไม่ได้เป็นผู้ประเมินของ instance+target นี้ -> ห้ามให้คะแนน
	MyAssignmentID *int64  `json:"my_assignment_id"`
	MyStatus       *string `json:"my_status"`

	Evaluators []EvaluatorStatus `json:"evaluators"` // ทุกคนที่ประเมินคนนี้ใน instance นี้ รวมตัวเอง
}

type EvaluatorStatus struct {
	EvaluatorID int64  `json:"evaluator_id"`
	Name        string `json:"name"`     // จาก evaluation_instance_evaluators.name_snapshot (ไม่ join users)
	Position    *string `json:"position"` // จาก evaluation_instance_evaluators.position_snapshot
	Status      string `json:"status"`
	IsMe        bool   `json:"is_me"`
}