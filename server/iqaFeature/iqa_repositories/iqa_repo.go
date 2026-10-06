package iqarepos

import (
	"context"

	"tarawitApi/db"
	iqamodels "tarawitApi/iqaFeature/iqa_models"
)

type IQARepository struct{}

func NewIQARepository() *IQARepository { return &IQARepository{} }

// ═══════════════ Read-only: Standards tree ═══════════════

func (r *IQARepository) ListStandards(ctx context.Context) ([]iqamodels.Standard, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, code, name, COALESCE(description,''), sort_order, is_active
		 FROM iqa_standards WHERE is_active = TRUE ORDER BY sort_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.Standard
	for rows.Next() {
		var s iqamodels.Standard
		if err := rows.Scan(&s.ID, &s.Code, &s.Name, &s.Description, &s.SortOrder, &s.IsActive); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func (r *IQARepository) ListCriteria(ctx context.Context, standardID int64) ([]iqamodels.Criterion, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, standard_id, code, name, COALESCE(description,''), sort_order, is_active
		 FROM iqa_criteria WHERE standard_id = $1 AND is_active = TRUE ORDER BY sort_order`, standardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.Criterion
	for rows.Next() {
		var c iqamodels.Criterion
		if err := rows.Scan(&c.ID, &c.StandardID, &c.Code, &c.Name, &c.Description, &c.SortOrder, &c.IsActive); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (r *IQARepository) ListIndicators(ctx context.Context, criterionID int64) ([]iqamodels.Indicator, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, criterion_id, code, name, COALESCE(description,''), sort_order, is_active
		 FROM iqa_indicators WHERE criterion_id = $1 AND is_active = TRUE ORDER BY sort_order`, criterionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.Indicator
	for rows.Next() {
		var ind iqamodels.Indicator
		if err := rows.Scan(&ind.ID, &ind.CriterionID, &ind.Code, &ind.Name, &ind.Description, &ind.SortOrder, &ind.IsActive); err != nil {
			return nil, err
		}
		list = append(list, ind)
	}
	return list, rows.Err()
}

func (r *IQARepository) GetFullTree(ctx context.Context) ([]iqamodels.StandardTree, error) {
	standards, err := r.ListStandards(ctx)
	if err != nil {
		return nil, err
	}

	var tree []iqamodels.StandardTree
	for _, s := range standards {
		criteria, err := r.ListCriteria(ctx, s.ID)
		if err != nil {
			return nil, err
		}
		ct := make([]iqamodels.CriterionTree, 0, len(criteria))
		for _, c := range criteria {
			indicators, err := r.ListIndicators(ctx, c.ID)
			if err != nil {
				return nil, err
			}
			ct = append(ct, iqamodels.CriterionTree{Criterion: c, Indicators: indicators})
		}
		tree = append(tree, iqamodels.StandardTree{Standard: s, Criteria: ct})
	}
	return tree, nil
}

func (r *IQARepository) ListQualityLevels(ctx context.Context) ([]iqamodels.QualityLevel, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, score, label, COALESCE(description,''), color, sort_order
		 FROM iqa_quality_levels ORDER BY sort_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.QualityLevel
	for rows.Next() {
		var l iqamodels.QualityLevel
		if err := rows.Scan(&l.ID, &l.Score, &l.Label, &l.Description, &l.Color, &l.SortOrder); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, rows.Err()
}

// ═══════════════ Cycles ═══════════════

func (r *IQARepository) ListCycles(ctx context.Context) ([]iqamodels.AssessmentCycle, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, academic_year, name, status, start_date::text, end_date::text, created_by, created_at, updated_at
		 FROM iqa_assessment_cycles ORDER BY academic_year DESC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.AssessmentCycle
	for rows.Next() {
		var c iqamodels.AssessmentCycle
		if err := rows.Scan(&c.ID, &c.AcademicYear, &c.Name, &c.Status, &c.StartDate, &c.EndDate, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (r *IQARepository) CreateCycle(ctx context.Context, req iqamodels.CreateCycleRequest, userID int64) (int64, error) {
	var id int64
	err := db.DB.QueryRow(ctx,
		`INSERT INTO iqa_assessment_cycles (academic_year, name, start_date, end_date, created_by)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		req.AcademicYear, req.Name, req.StartDate, req.EndDate, userID,
	).Scan(&id)
	return id, err
}

func (r *IQARepository) UpdateCycleStatus(ctx context.Context, cycleID int64, status string) error {
	_, err := db.DB.Exec(ctx,
		`UPDATE iqa_assessment_cycles SET status = $2, updated_at = NOW() WHERE id = $1`, cycleID, status)
	return err
}

// ═══════════════ Assessments ═══════════════

func (r *IQARepository) GetOrCreateAssessment(ctx context.Context, cycleID, assessorID int64) (*iqamodels.Assessment, error) {
	var a iqamodels.Assessment
	err := db.DB.QueryRow(ctx,
		`INSERT INTO iqa_assessments (cycle_id, assessor_id)
		 VALUES ($1, $2)
		 ON CONFLICT (cycle_id, assessor_id) DO UPDATE SET updated_at = NOW()
		 RETURNING id, cycle_id, assessor_id, status, total_score, avg_score, quality_level, comment, submitted_at, created_at, updated_at`,
		cycleID, assessorID,
	).Scan(&a.ID, &a.CycleID, &a.AssessorID, &a.Status, &a.TotalScore, &a.AvgScore, &a.QualityLevel, &a.Comment, &a.SubmittedAt, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *IQARepository) ListAssessmentsByCycle(ctx context.Context, cycleID int64) ([]iqamodels.Assessment, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT a.id, a.cycle_id, a.assessor_id, a.status, a.total_score, a.avg_score, a.quality_level, a.comment, a.submitted_at, a.created_at, a.updated_at,
		        TRIM(COALESCE(pf.name_th,'') || ' ' || u.first_name || ' ' || u.last_name)
		 FROM iqa_assessments a
		 JOIN users u ON u.id = a.assessor_id
		 LEFT JOIN prefixes pf ON pf.id = u.prefix_id
		 WHERE a.cycle_id = $1 ORDER BY a.created_at`, cycleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.Assessment
	for rows.Next() {
		var a iqamodels.Assessment
		if err := rows.Scan(&a.ID, &a.CycleID, &a.AssessorID, &a.Status, &a.TotalScore, &a.AvgScore, &a.QualityLevel, &a.Comment, &a.SubmittedAt, &a.CreatedAt, &a.UpdatedAt, &a.AssessorName); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func (r *IQARepository) GetAssessment(ctx context.Context, id int64) (*iqamodels.Assessment, error) {
	var a iqamodels.Assessment
	err := db.DB.QueryRow(ctx,
		`SELECT id, cycle_id, assessor_id, status, total_score, avg_score, quality_level, comment, submitted_at, created_at, updated_at
		 FROM iqa_assessments WHERE id = $1`, id,
	).Scan(&a.ID, &a.CycleID, &a.AssessorID, &a.Status, &a.TotalScore, &a.AvgScore, &a.QualityLevel, &a.Comment, &a.SubmittedAt, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// ═══════════════ Scores ═══════════════

func (r *IQARepository) UpsertScores(ctx context.Context, assessmentID int64, scores []iqamodels.ScoreItem) error {
	for _, s := range scores {
		_, err := db.DB.Exec(ctx,
			`INSERT INTO iqa_assessment_scores (assessment_id, indicator_id, score, comment)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (assessment_id, indicator_id)
			 DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment, updated_at = NOW()`,
			assessmentID, s.IndicatorID, s.Score, s.Comment)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *IQARepository) GetScores(ctx context.Context, assessmentID int64) ([]iqamodels.AssessmentScore, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, assessment_id, indicator_id, score, COALESCE(comment,'')
		 FROM iqa_assessment_scores WHERE assessment_id = $1 ORDER BY indicator_id`, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.AssessmentScore
	for rows.Next() {
		var s iqamodels.AssessmentScore
		if err := rows.Scan(&s.ID, &s.AssessmentID, &s.IndicatorID, &s.Score, &s.Comment); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func (r *IQARepository) CalculateAssessmentTotals(ctx context.Context, assessmentID int64) error {
	_, err := db.DB.Exec(ctx,
		`UPDATE iqa_assessments SET
			total_score = (SELECT COALESCE(SUM(score),0) FROM iqa_assessment_scores WHERE assessment_id = $1),
			avg_score   = (SELECT CASE WHEN COUNT(*)>0 THEN ROUND(AVG(score)::numeric,2) ELSE NULL END FROM iqa_assessment_scores WHERE assessment_id = $1),
			updated_at  = NOW()
		 WHERE id = $1`, assessmentID)
	return err
}

func (r *IQARepository) SubmitAssessment(ctx context.Context, assessmentID int64) error {
	_, err := db.DB.Exec(ctx,
		`UPDATE iqa_assessments SET status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW() WHERE id = $1`, assessmentID)
	return err
}

// ═══════════════ Evidence ═══════════════

func (r *IQARepository) CreateEvidence(ctx context.Context, e *iqamodels.Evidence) error {
	return db.DB.QueryRow(ctx,
		`INSERT INTO iqa_evidence (assessment_id, indicator_id, file_name, stored_name, file_path, file_size, mime_type, description, uploaded_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at`,
		e.AssessmentID, e.IndicatorID, e.FileName, e.StoredName, e.FilePath, e.FileSize, e.MimeType, e.Description, e.UploadedBy,
	).Scan(&e.ID, &e.CreatedAt)
}

func (r *IQARepository) ListEvidence(ctx context.Context, assessmentID int64) ([]iqamodels.Evidence, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, assessment_id, indicator_id, file_name, stored_name, file_path, file_size, mime_type, COALESCE(description,''), uploaded_by, created_at
		 FROM iqa_evidence WHERE assessment_id = $1 ORDER BY created_at DESC`, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.Evidence
	for rows.Next() {
		var e iqamodels.Evidence
		if err := rows.Scan(&e.ID, &e.AssessmentID, &e.IndicatorID, &e.FileName, &e.StoredName, &e.FilePath, &e.FileSize, &e.MimeType, &e.Description, &e.UploadedBy, &e.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, rows.Err()
}

func (r *IQARepository) DeleteEvidence(ctx context.Context, id int64) (string, error) {
	var filePath string
	err := db.DB.QueryRow(ctx,
		`DELETE FROM iqa_evidence WHERE id = $1 RETURNING file_path`, id).Scan(&filePath)
	return filePath, err
}

// ═══════════════ School Summary ═══════════════

func (r *IQARepository) RecalculateSchoolSummary(ctx context.Context, cycleID int64) error {
	_, err := db.DB.Exec(ctx,
		`DELETE FROM iqa_school_summary WHERE cycle_id = $1`, cycleID)
	if err != nil {
		return err
	}

	_, err = db.DB.Exec(ctx,
		`INSERT INTO iqa_school_summary (cycle_id, indicator_id, avg_score, min_score, max_score, assessor_count, quality_level)
		 SELECT
			scores.cycle_id,
			scores.indicator_id,
			ROUND(AVG(scores.score)::numeric, 2),
			MIN(scores.score),
			MAX(scores.score),
			COUNT(DISTINCT a.assessor_id),
			CASE
				WHEN AVG(scores.score) >= 3.5 THEN 'ดีเลิศ'
				WHEN AVG(scores.score) >= 2.5 THEN 'ดี'
				WHEN AVG(scores.score) >= 1.5 THEN 'พอใช้'
				ELSE 'ปรับปรุง'
			END
		 FROM iqa_assessment_scores scores
		 JOIN iqa_assessments a ON a.id = scores.assessment_id
		 WHERE a.cycle_id = $1 AND a.status = 'SUBMITTED'
		 GROUP BY scores.cycle_id, scores.indicator_id`, cycleID)
	return err
}

func (r *IQARepository) GetSchoolSummary(ctx context.Context, cycleID int64) ([]iqamodels.SchoolSummary, error) {
	rows, err := db.DB.Query(ctx,
		`SELECT id, cycle_id, indicator_id, avg_score, min_score, max_score, assessor_count, quality_level
		 FROM iqa_school_summary WHERE cycle_id = $1 ORDER BY indicator_id`, cycleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []iqamodels.SchoolSummary
	for rows.Next() {
		var s iqamodels.SchoolSummary
		if err := rows.Scan(&s.ID, &s.CycleID, &s.IndicatorID, &s.AvgScore, &s.MinScore, &s.MaxScore, &s.AssessorCount, &s.QualityLevel); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}
