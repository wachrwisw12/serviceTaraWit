package iqamodels

import "time"

// ─── Standard ───
type Standard struct {
	ID          int64  `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	SortOrder   int    `json:"sort_order"`
	IsActive    bool   `json:"is_active"`
}

// ─── Criterion ───
type Criterion struct {
	ID          int64  `json:"id"`
	StandardID  int64  `json:"standard_id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	SortOrder   int    `json:"sort_order"`
	IsActive    bool   `json:"is_active"`
}

// ─── Indicator ───
type Indicator struct {
	ID          int64  `json:"id"`
	CriterionID int64  `json:"criterion_id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	SortOrder   int    `json:"sort_order"`
	IsActive    bool   `json:"is_active"`
}

// ─── QualityLevel ───
type QualityLevel struct {
	ID          int64  `json:"id"`
	Score       int    `json:"score"`
	Label       string `json:"label"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color"`
	SortOrder   int    `json:"sort_order"`
}

// ─── Assessment Cycle ───
type AssessmentCycle struct {
	ID           int64      `json:"id"`
	AcademicYear int        `json:"academic_year"`
	Name         string     `json:"name"`
	Status       string     `json:"status"` // DRAFT|IN_PROGRESS|COMPLETED
	StartDate    *string    `json:"start_date"`
	EndDate      *string    `json:"end_date"`
	CreatedBy    *int64     `json:"created_by"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// ─── Assessment ───
type Assessment struct {
	ID           int64      `json:"id"`
	CycleID      int64      `json:"cycle_id"`
	AssessorID   int64      `json:"assessor_id"`
	Status       string     `json:"status"` // DRAFT|IN_PROGRESS|SUBMITTED
	TotalScore   *float64   `json:"total_score"`
	AvgScore     *float64   `json:"avg_score"`
	QualityLevel *string    `json:"quality_level"`
	Comment      *string    `json:"comment"`
	SubmittedAt  *time.Time `json:"submitted_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	// populated on read
	AssessorName *string `json:"assessor_name,omitempty"`
}

// ─── Assessment Score (per indicator) ───
type AssessmentScore struct {
	ID           int64  `json:"id"`
	AssessmentID int64  `json:"assessment_id"`
	IndicatorID  int64  `json:"indicator_id"`
	Score        int    `json:"score"`
	Comment      string `json:"comment,omitempty"`
}

// ─── Evidence ───
type Evidence struct {
	ID           int64  `json:"id"`
	AssessmentID int64  `json:"assessment_id"`
	IndicatorID  *int64 `json:"indicator_id"`
	FileName     string `json:"file_name"`
	StoredName   string `json:"stored_name"`
	FilePath     string `json:"file_path"`
	FileSize     int64  `json:"file_size"`
	MimeType     string `json:"mime_type"`
	Description  string `json:"description,omitempty"`
	UploadedBy   *int64 `json:"uploaded_by"`
	CreatedAt    time.Time `json:"created_at"`
}

// ─── School Summary (per indicator, aggregated) ───
type SchoolSummary struct {
	ID           int64   `json:"id"`
	CycleID      int64   `json:"cycle_id"`
	IndicatorID  int64   `json:"indicator_id"`
	AvgScore     float64 `json:"avg_score"`
	MinScore     int     `json:"min_score"`
	MaxScore     int     `json:"max_score"`
	AssessorCount int   `json:"assessor_count"`
	QualityLevel string  `json:"quality_level"`
}

// ─── Full tree: Standard → Criteria → Indicators ───
type StandardTree struct {
	Standard
	Criteria []CriterionTree `json:"criteria"`
}

type CriterionTree struct {
	Criterion
	Indicators []Indicator `json:"indicators"`
}

// ─── Dashboard Summary ───
type IQADashboard struct {
	TotalAssessments    int              `json:"total_assessments"`
	SubmittedCount      int              `json:"submitted_count"`
	DraftCount          int              `json:"draft_count"`
	AvgSchoolScore      *float64         `json:"avg_school_score"`
	QualityLevel        *string          `json:"quality_level"`
	Standards           []StandardSummary `json:"standards"`
}

type StandardSummary struct {
	Standard
	AvgScore  *float64 `json:"avg_score"`
	IndicatorCount int  `json:"indicator_count"`
}

// ─── Request types ───
type CreateCycleRequest struct {
	AcademicYear int    `json:"academic_year"`
	Name         string `json:"name"`
	StartDate    *string `json:"start_date"`
	EndDate      *string `json:"end_date"`
}

type SubmitScoresRequest struct {
	Scores []ScoreItem `json:"scores"`
}

type ScoreItem struct {
	IndicatorID int64  `json:"indicator_id"`
	Score       int    `json:"score"`
	Comment     string `json:"comment,omitempty"`
}
