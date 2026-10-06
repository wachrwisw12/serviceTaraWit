package evaluationRepositories

import (
	"context"
	"fmt"
	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

// GetEvaluationSummary ดึงข้อมูลสรุปการประเมินเฉพาะของ user ปัจจุบันสำหรับ Dashboard
func (r *EvaluationRepository) GetEvaluationSummary(
	ctx context.Context,
	userID int64,
	academicYear *int,
) (*evaluationModels.EvaluationSummary, error) {

	result := &evaluationModels.EvaluationSummary{}

	// 1. Instance Stats (เฉพาะรอบที่ user เกี่ยวข้อง)
	instanceStats, err := getInstanceStats(ctx, userID, academicYear)
	if err != nil {
		return nil, fmt.Errorf("โหลดสถิติรอบประเมินไม่สำเร็จ: %w", err)
	}
	result.InstanceStats = *instanceStats

	// 2. Assignment Stats (เฉพาะ assignment ของ user)
	assignmentStats, err := getAssignmentStats(ctx, userID, academicYear)
	if err != nil {
		return nil, fmt.Errorf("โหลดสถิติการส่งไม่สำเร็จ: %w", err)
	}
	result.AssignmentStats = *assignmentStats

	// 3. Average Score (เฉพาะคะแนนของ user)
	avgScore, err := getAverageScore(ctx, userID, academicYear)
	if err != nil {
		return nil, fmt.Errorf("โหลดคะแนนเฉลี่ยไม่สำเร็จ: %w", err)
	}
	result.AverageScore = avgScore

	// 4. Participant Stats (เฉพาะรอบที่ user เกี่ยวข้อง)
	participantStats, err := getParticipantStats(ctx, userID, academicYear)
	if err != nil {
		return nil, fmt.Errorf("โหลดสถิติผู้เข้าร่วมไม่สำเร็จ: %w", err)
	}
	result.ParticipantStats = *participantStats

	// 5. Score by Template (เฉพาะรอบที่ user เกี่ยวข้อง)
	scoreByTemplate, err := getScoreByTemplate(ctx, userID, academicYear)
	if err != nil {
		return nil, fmt.Errorf("โหลดคะแนนตามแม่แบบไม่สำเร็จ: %w", err)
	}
	result.ScoreByTemplate = scoreByTemplate

	// 6. Recent Instances (เฉพาะรอบที่ user เกี่ยวข้อง)
	recentInstances, err := getRecentInstances(ctx, userID, academicYear, 5)
	if err != nil {
		return nil, fmt.Errorf("โหลดรอบประเมินล่าสุดไม่สำเร็จ: %w", err)
	}
	result.RecentInstances = recentInstances

	// 7. My Role Summary
	myRoleSummary, err := getMyRoleSummary(ctx, userID, academicYear)
	if err != nil {
		return nil, fmt.Errorf("โหลดสรุปบทบาทไม่สำเร็จ: %w", err)
	}
	result.MyRoleSummary = myRoleSummary

	return result, nil
}

// userInstanceWhere สร้าง WHERE clause สำหรับกรอง instance ที่ user เกี่ยวข้อง
// คืน (whereClause, args) — ต้อง append userID เข้า args ด้วย
func userInstanceWhere(userID int64, academicYear *int) (string, []interface{}) {
	args := []interface{}{userID}
	idx := 1 // $1 = userID

	yearClause := ""
	if academicYear != nil {
		idx++
		yearClause = fmt.Sprintf(" AND ei.academic_year = $%d", idx)
		args = append(args, *academicYear)
	}

	where := fmt.Sprintf(`
		AND (
			ei.id IN (SELECT et.instance_id FROM evaluation_targets et WHERE et.user_id = $1)
			OR ei.id IN (SELECT eie.instance_id FROM evaluation_instance_evaluators eie WHERE eie.user_id = $1)
		)
		%s
	`, yearClause)

	return where, args
}

func getInstanceStats(ctx context.Context, userID int64, academicYear *int) (*evaluationModels.InstanceStatsSummary, error) {
	where, args := userInstanceWhere(userID, academicYear)
	query := fmt.Sprintf(`
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE ei.status = 'OPEN') AS open,
			COUNT(*) FILTER (WHERE ei.status = 'DRAFT') AS draft,
			COUNT(*) FILTER (WHERE ei.status = 'CLOSED') AS closed
		FROM evaluation_instances ei
		WHERE ei.deleted_at IS NULL %s
	`, where)

	var stats evaluationModels.InstanceStatsSummary
	err := db.DB.QueryRow(ctx, query, args...).Scan(
		&stats.Total, &stats.Open, &stats.Draft, &stats.Closed,
	)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func getAssignmentStats(ctx context.Context, userID int64, academicYear *int) (*evaluationModels.AssignmentStatsSummary, error) {
	where, args := userInstanceWhere(userID, academicYear)
	query := fmt.Sprintf(`
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE ea.status = 'submitted') AS submitted,
			COUNT(*) FILTER (WHERE ea.status != 'submitted') AS pending
		FROM evaluation_assignments ea
		JOIN evaluation_instances ei ON ei.id = ea.instance_id
		WHERE ei.deleted_at IS NULL %s
	`, where)

	var stats evaluationModels.AssignmentStatsSummary
	err := db.DB.QueryRow(ctx, query, args...).Scan(
		&stats.Total, &stats.Submitted, &stats.Pending,
	)
	if err != nil {
		return nil, err
	}

	if stats.Total > 0 {
		pct := float64(stats.Submitted) / float64(stats.Total) * 100
		stats.CompletionPercent = &pct
	}

	return &stats, nil
}

func getAverageScore(ctx context.Context, userID int64, academicYear *int) (*float64, error) {
	where, args := userInstanceWhere(userID, academicYear)
	query := fmt.Sprintf(`
		SELECT AVG(sub.total_score)
		FROM (
			SELECT
				ea.id AS assignment_id,
				SUM(eans.score) AS total_score
			FROM evaluation_assignments ea
			JOIN evaluation_instances ei ON ei.id = ea.instance_id
			JOIN evaluation_answers eans ON eans.assignment_id = ea.id
			WHERE ea.status = 'submitted'
			  AND ei.deleted_at IS NULL %s
			GROUP BY ea.id
		) sub
	`, where)

	var avgScore *float64
	err := db.DB.QueryRow(ctx, query, args...).Scan(&avgScore)
	if err != nil {
		return nil, err
	}
	return avgScore, nil
}

func getParticipantStats(ctx context.Context, userID int64, academicYear *int) (*evaluationModels.ParticipantStatsSummary, error) {
	where, args := userInstanceWhere(userID, academicYear)

	// จำนวน evaluator (distinct) ในรอบที่ user เกี่ยวข้อง
	queryEvaluator := fmt.Sprintf(`
		SELECT COUNT(DISTINCT eie.user_id)
		FROM evaluation_instance_evaluators eie
		JOIN evaluation_instances ei ON ei.id = eie.instance_id
		WHERE ei.deleted_at IS NULL %s
	`, where)
	var evaluatorCount int
	if err := db.DB.QueryRow(ctx, queryEvaluator, args...).Scan(&evaluatorCount); err != nil {
		return nil, err
	}

	// จำนวน target (distinct) ในรอบที่ user เกี่ยวข้อง
	queryTarget := fmt.Sprintf(`
		SELECT COUNT(DISTINCT et.user_id)
		FROM evaluation_targets et
		JOIN evaluation_instances ei ON ei.id = et.instance_id
		WHERE ei.deleted_at IS NULL %s
	`, where)
	var targetCount int
	if err := db.DB.QueryRow(ctx, queryTarget, args...).Scan(&targetCount); err != nil {
		return nil, err
	}

	total := evaluatorCount + targetCount

	return &evaluationModels.ParticipantStatsSummary{
		Total:          total,
		MaxPossible:    total,
		EvaluatorCount: evaluatorCount,
		TargetCount:    targetCount,
	}, nil
}

func getScoreByTemplate(ctx context.Context, userID int64, academicYear *int) ([]evaluationModels.TemplateScoreSummary, error) {
	where, args := userInstanceWhere(userID, academicYear)
	query := fmt.Sprintf(`
		SELECT
			ei.template_name,
			COUNT(DISTINCT ea.id) AS assignment_count,
			COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'submitted') AS submitted_count,
			(
				SELECT AVG(ans.total_score)
				FROM (
					SELECT a_inner.id, SUM(a_ans.score) AS total_score
					FROM evaluation_assignments a_inner
					JOIN evaluation_answers a_ans ON a_ans.assignment_id = a_inner.id
					WHERE a_inner.instance_id = ei.id AND a_inner.status = 'submitted'
					GROUP BY a_inner.id
				) ans
			) AS avg_score
		FROM evaluation_instances ei
		LEFT JOIN evaluation_assignments ea ON ea.instance_id = ei.id
		WHERE ei.deleted_at IS NULL %s
		GROUP BY ei.id, ei.template_name
		ORDER BY submitted_count DESC
	`, where)

	rows, err := db.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []evaluationModels.TemplateScoreSummary
	for rows.Next() {
		var item evaluationModels.TemplateScoreSummary
		if err := rows.Scan(
			&item.TemplateName,
			&item.AssignmentCount,
			&item.SubmittedCount,
			&item.AverageScore,
		); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func getRecentInstances(ctx context.Context, userID int64, academicYear *int, limit int) ([]evaluationModels.RecentInstanceSummary, error) {
	where, args := userInstanceWhere(userID, academicYear)
	query := fmt.Sprintf(`
		SELECT
			ei.id,
			COALESCE(ei.template_name, ''),
			COALESCE(ei.template_type, 'EVALUATION'),
			ei.academic_year,
			COALESCE(ei.round, ''),
			ei.status,
			COALESCE(ei.batch_id::text, ''),
			(SELECT COUNT(*) FROM evaluation_targets et WHERE et.instance_id = ei.id) AS total_targets,
			(SELECT COUNT(*) FROM evaluation_assignments ea WHERE ea.instance_id = ei.id AND ea.status = 'submitted') AS submitted_count
		FROM evaluation_instances ei
	WHERE ei.deleted_at IS NULL %s
	ORDER BY ei.id DESC
		LIMIT %d
	`, where, limit)

	rows, err := db.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []evaluationModels.RecentInstanceSummary
	for rows.Next() {
		var item evaluationModels.RecentInstanceSummary
		if err := rows.Scan(
			&item.ID,
			&item.TemplateName,
			&item.TemplateType,
			&item.AcademicYear,
			&item.Round,
			&item.Status,
			&item.BatchID,
			&item.TotalTargets,
			&item.SubmittedCount,
		); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func getMyRoleSummary(ctx context.Context, userID int64, academicYear *int) (*evaluationModels.MyRoleSummaryData, error) {
	result := &evaluationModels.MyRoleSummaryData{}

	// As Evaluator
	where, _ := userInstanceWhere(userID, academicYear)
	args := []interface{}{userID}
	argIdx := 2

	yearClause := ""
	if academicYear != nil {
		yearClause = fmt.Sprintf(" AND ei.academic_year = $%d", argIdx)
		args = append(args, *academicYear)
		argIdx++
	}

	queryEvaluator := fmt.Sprintf(`
		SELECT
			COUNT(DISTINCT ea.instance_id) AS instance_count,
			COUNT(ea.id) AS total_assigned,
			COUNT(ea.id) FILTER (WHERE ea.status = 'submitted') AS total_submitted,
			COUNT(ea.id) FILTER (WHERE ea.status != 'submitted') AS total_pending
		FROM evaluation_assignments ea
		JOIN evaluation_instances ei ON ei.id = ea.instance_id
		WHERE ea.evaluator_id = $1		AND ei.deleted_at IS NULL %s
	`, yearClause)
	_ = where // unused for this query

	var evalSummary evaluationModels.MyEvaluatorSummary
	if err := db.DB.QueryRow(ctx, queryEvaluator, args...).Scan(
		&evalSummary.InstanceCount,
		&evalSummary.TotalAssigned,
		&evalSummary.TotalSubmitted,
		&evalSummary.TotalPending,
	); err != nil {
		return nil, err
	}
	if evalSummary.TotalAssigned > 0 {
		result.AsEvaluator = &evalSummary
	}

	// As Target
	argsTarget := []interface{}{userID}
	yearClauseTarget := ""
	if academicYear != nil {
		yearClauseTarget = fmt.Sprintf(" AND ei.academic_year = $2")
		argsTarget = append(argsTarget, *academicYear)
	}

	queryTarget := fmt.Sprintf(`
		SELECT
			COUNT(DISTINCT et.instance_id) AS instance_count
		FROM evaluation_targets et
		JOIN evaluation_instances ei ON ei.id = et.instance_id
		WHERE et.user_id = $1		AND ei.deleted_at IS NULL %s
	`, yearClauseTarget)

	var targetSummary evaluationModels.MyTargetSummary
	if err := db.DB.QueryRow(ctx, queryTarget, argsTarget...).Scan(
		&targetSummary.InstanceCount,
	); err != nil {
		return nil, err
	}
	if targetSummary.InstanceCount > 0 {
		result.AsTarget = &targetSummary
	}

	return result, nil
}
