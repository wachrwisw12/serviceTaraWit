package evaluationModels

import "time"

type EvaTemplateResponse struct {
	ID                 int       `json:"id"`
	Code               string    `json:"code"`
	TemplateName       string    `json:"template_name"`
	Description        string    `json:"description"`
	EvaluationTargetID string       `json:"evaluation_target_id"`
	Versions            int       `json:"Versions"`
	Status             string    `json:"status"`
	CreatedBy          int       `json:"created_by"`
	CreatedAt          time.Time `json:"created_at"`
}

type EvalTemplateFullByIDResponse  struct {
	ID  int `json:"id"`
	Code string `json:"code"`
	TemplateName       string    `json:"template_name"`
    EvaluationTargetID string       `json:"evaluation_target_id"`
	Versions            int       `json:"versions"`
	Status             string    `json:"status"`
	Sections []SectionResponses `json:"sections"`
    
	
}
type SectionResponses struct {
  SectionID int `json:"section_id"`
  Name string `json:"name"`
  Questions []QuestionResponses `json:"questions"`
}

type QuestionResponses struct {
	ID int `json:"id"`
	Question string `json:"question"`
	QuestionType string `json:"quesion_type"`
	SortOrder int `json:"sort_order"`
	QuestionScore []QuestionScoreResponses `json:"question_score"` 

}

type QuestionScoreResponses struct {
	ID int `json:"score_id"`
	Label string `json:"label"`
	SortOrder int `json:"sort_order"`
}

// internal/model/evaluation_instance.go


type EvaluationInstance struct {
    ID           int64      `db:"id" json:"id"`
    TemplateID   int64      `db:"template_id" json:"template_id"`
    Name         string     `db:"name" json:"name"`
    TargetType   string     `db:"target_type" json:"target_type"`
    AcademicYear int        `db:"academic_year" json:"academic_year"`
    Status       string     `db:"status" json:"status"`
    StartDate    time.Time  `db:"start_date" json:"start_date"`
    EndDate      time.Time  `db:"end_date" json:"end_date"`
    CreatedBy    int64      `db:"created_by" json:"created_by"`
    CreatedAt    time.Time  `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time  `db:"updated_at" json:"updated_at"`
    DeletedAt    *time.Time `db:"deleted_at" json:"deleted_at,omitempty"`
}