package evaluationModels

import "time"

// AuditLogEntry — 1 รายการ audit log
type AuditLogEntry struct {
	ID           int64     `json:"id"`
	InstanceID   int64     `json:"instance_id"`
	ActorUserID  int64     `json:"actor_user_id"`
	ActorName    string    `json:"actor_name"`
	Action       string    `json:"action"`        // "add_target" | "remove_target" | "add_evaluator" | "remove_evaluator"
	TargetUserID int64     `json:"target_user_id"`
	TargetName   string    `json:"target_name"`
	Detail       string    `json:"detail"`        // JSON string เช่น {"position": "..."}
	CreatedAt    time.Time `json:"created_at"`
}

// AuditLogAction constants
const (
	AuditActionAddTarget       = "add_target"
	AuditActionRemoveTarget    = "remove_target"
	AuditActionAddEvaluator    = "add_evaluator"
	AuditActionRemoveEvaluator = "remove_evaluator"
)
