package evaluationModels

import "time"

type InstanceAttachment struct {
	ID int64 `json:"id"`

	InstanceID int64 `json:"instance_id"`
	TargetID   int64 `json:"target_id"`

	UploadedBy int64 `json:"uploaded_by"`

	FileName   string `json:"file_name"`
	StoredName string `json:"stored_name"`
	FilePath   string `json:"file_path"`

	FileSize int64  `json:"file_size"`
	MimeType string `json:"mime_type"`

	CreatedAt time.Time `json:"created_at"`
}

type EvaluationTargetInfo struct {
	ID         int64 `json:"id"`
	InstanceID int64 `json:"instance_id"`
	UserID     int64 `json:"user_id"`
}