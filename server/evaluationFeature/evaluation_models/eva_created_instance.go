package evaluationModels

type MyCreatedEvaluation struct {
	ID            int64  `json:"id"`
	BatchID       *string `json:"batch_id"`
	TemplateID    int64  `json:"template_id"`
	TemplateName  string `json:"template_name"`
	InstanceName  string `json:"instance_name"`
	AcademicYear  int    `json:"academic_year"`
	Round         string `json:"round"`
	Status        string `json:"status"`

	TargetCount     int `json:"target_count"`
	EvaluatorCount  int `json:"evaluator_count"`
	AssignmentCount int `json:"assignment_count"`

	CompletedCount int `json:"completed_count"`
}