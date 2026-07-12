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