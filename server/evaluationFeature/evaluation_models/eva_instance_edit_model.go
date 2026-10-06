package evaluationModels

// InstanceEditDetail — ข้อมูล instance สำหรับหน้าแก้ไขผู้เกี่ยวข้อง
type InstanceEditDetail struct {
	ID           int64  `json:"id"`
	TemplateName string `json:"template_name"`
	TemplateType string `json:"template_type"`
	InstanceName string `json:"instance_name"`
	AcademicYear int    `json:"academic_year"`
	Round        string `json:"round"`
	Status       string `json:"status"`

	Targets    []InstanceEditMember `json:"targets"`
	Evaluators []InstanceEditMember `json:"evaluators"`
}

// InstanceEditMember — ข้อมูลสมาชิก (target หรือ evaluator) สำหรับหน้าแก้ไข
type InstanceEditMember struct {
	UserID            int64   `json:"user_id"`
	Name              string  `json:"name"`
	Position          *string `json:"position"`
	HasSubmitted      bool    `json:"has_submitted"` // true = มี assignment ที่ส่งแล้ว → ลบไม่ได้
	AssignmentCount   int     `json:"assignment_count"`
	CompletedCount    int     `json:"completed_count"`
	CanScore          bool    `json:"can_score"`
	RequiresSignature bool    `json:"requires_signature"`
	SignatureOrder    int     `json:"signature_order"`
	SignatureRole     string  `json:"signature_role"`
}

// UpdateInstanceMembersPayload — payload สำหรับเพิ่ม/ลบ targets หรือ evaluators
type UpdateInstanceMembersPayload struct {
	AddUserIDs        []string                `json:"add_user_ids"`    // user_id ที่ต้องการเพิ่ม
	RemoveUserIDs     []string                `json:"remove_user_ids"` // user_id ที่ต้องการลบ
	EvaluatorSettings []EvaluatorSettingInput `json:"evaluator_settings"`
}

// UpdateInstanceMembersResponse — response หลังอัปเดต
type UpdateInstanceMembersResponse struct {
	Success        bool   `json:"success"`
	Message        string `json:"message"`
	TargetCount    int    `json:"target_count"`
	EvaluatorCount int    `json:"evaluator_count"`
}
