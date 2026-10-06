package evaluationRepositories

import (
	"context"
	"fmt"
	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

	"github.com/jackc/pgx/v5"
)
func (r *EvaluationRepository) GetMyCreatedEvaluations(
	ctx context.Context,
	userID int64,
) ([]evaluationModels.MyCreatedEvaluation, error) {

	query := `
		SELECT
			ei.id,
			COALESCE(ei.batch_id::text, ''),
			ei.template_id,
			ei.template_name,
			COALESCE(ei.template_type, 'EVALUATION') AS template_type,
			COALESCE(ei.instance_name, ''),
			ei.academic_year,
			ei.round,
			ei.status,

			(
				SELECT COUNT(*)
				FROM evaluation_targets et
				WHERE et.instance_id = ei.id
			) AS target_count,

			(
				SELECT COUNT(DISTINCT eie.user_id)
				FROM evaluation_instance_evaluators eie
				WHERE eie.instance_id = ei.id
			) AS evaluator_count,

			(
				SELECT COUNT(*)
				FROM evaluation_assignments ea
				WHERE ea.instance_id = ei.id
			) AS assignment_count,

			(
				SELECT COUNT(*)
				FROM evaluation_assignments ea
				WHERE ea.instance_id = ei.id
				  AND ea.status = 'submitted'
			) AS completed_count

		FROM evaluation_instances ei

		WHERE ei.created_by = $1

		ORDER BY ei.id DESC
	`

	rows, err := db.DB.Query(
		ctx,
		query,
		userID,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"โหลดรายการประเมินที่สร้างไม่สำเร็จ: %w",
			err,
		)
	}

	defer rows.Close()

	result := make(
		[]evaluationModels.MyCreatedEvaluation,
		0,
	)

	for rows.Next() {
		var item evaluationModels.MyCreatedEvaluation

		err := rows.Scan(
			&item.ID,
			&item.BatchID,
			&item.TemplateID,
			&item.TemplateName,
			&item.TemplateType,
			&item.InstanceName,
			&item.AcademicYear,
			&item.Round,
			&item.Status,
			&item.TargetCount,
			&item.EvaluatorCount,
			&item.AssignmentCount,
			&item.CompletedCount,
		)

		if err != nil {
			return nil, fmt.Errorf(
				"อ่านข้อมูลการประเมินไม่สำเร็จ: %w",
				err,
			)
		}

		result = append(result, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

func (r *EvaluationRepository) GetMyCreatedEvaluationSummary(
	ctx context.Context,
	instanceID int64,
	userID int64,
) (*evaluationModels.MyCreatedEvaluationSummary, error) {

	// -----------------------------------------
	// 1. ข้อมูล instance + จำนวน + คะแนนเฉลี่ย
	// -----------------------------------------

	query := `
		SELECT
			ei.id,
			COALESCE(ei.batch_id::text, ''),
			ei.template_id,
			ei.template_name,
			COALESCE(ei.template_type, 'EVALUATION') AS template_type,
			COALESCE(ei.instance_name, ''),
			ei.academic_year,
			ei.round,
			ei.status,

			(
				SELECT COUNT(*)
				FROM evaluation_targets et
				WHERE et.instance_id = ei.id
			) AS target_count,

			(
				SELECT COUNT(DISTINCT eie.user_id)
				FROM evaluation_instance_evaluators eie
				WHERE eie.instance_id = ei.id
			) AS evaluator_count,

			(
				SELECT COUNT(*)
				FROM evaluation_assignments ea
				WHERE ea.instance_id = ei.id
			) AS assignment_count,

			(
				SELECT COUNT(*)
				FROM evaluation_assignments ea
				WHERE ea.instance_id = ei.id
				  AND ea.status = 'submitted'
			) AS completed_count,

			(
				SELECT AVG(sub.total)
				FROM (
					SELECT SUM(es.score) AS total
					FROM evaluation_assignments ea
					JOIN evaluation_answers es
						ON es.assignment_id = ea.id
					WHERE ea.instance_id = ei.id
					  AND ea.status = 'submitted'
					GROUP BY ea.id
				) sub
			) AS average_score,

			(
				SELECT SUM(COALESCE(eiq.max_score, 0))
				FROM evaluation_instance_questions eiq
				WHERE eiq.evaluation_instance_id = ei.id
				  AND eiq.question_type = 'SCALE'
			) AS max_possible_score

		FROM evaluation_instances ei
		WHERE ei.id = $1
		  AND ei.created_by = $2
	`

	var summary evaluationModels.MyCreatedEvaluationSummary

	err := db.DB.QueryRow(
		ctx,
		query,
		instanceID,
		userID,
	).Scan(
		&summary.ID,
		&summary.BatchID,
		&summary.TemplateID,
		&summary.TemplateName,
		&summary.TemplateType,
		&summary.InstanceName,
		&summary.AcademicYear,
		&summary.Round,
		&summary.Status,
		&summary.TargetCount,
		&summary.EvaluatorCount,
		&summary.AssignmentCount,
		&summary.CompletedCount,
		&summary.AverageScore,
		&summary.MaxPossibleScore,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf(
				"ไม่พบการประเมิน หรือคุณไม่มีสิทธิ์ดูรายการนี้",
			)
		}

		return nil, fmt.Errorf(
			"โหลดสรุปการประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	// -----------------------------------------
	// 2. ความคืบหน้าของผู้ประเมินแต่ละคน
	// -----------------------------------------

	evaluatorRows, err := db.DB.Query(
		ctx,
		`
		SELECT
			eie.user_id,
			eie.name_snapshot,
			eie.position_snapshot,
			COUNT(ea.id) AS assignment_count,
			COUNT(*) FILTER (WHERE ea.status = 'submitted') AS completed_count
		FROM evaluation_instance_evaluators eie
		LEFT JOIN evaluation_assignments ea
			ON ea.instance_id = eie.instance_id
		   AND ea.evaluator_id = eie.user_id
		WHERE eie.instance_id = $1
		GROUP BY
			eie.user_id,
			eie.name_snapshot,
			eie.position_snapshot
		ORDER BY MIN(eie.id)
		`,
		instanceID,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"โหลดความคืบหน้าผู้ประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	defer evaluatorRows.Close()

	summary.Evaluators = make(
		[]evaluationModels.EvaluatorProgress,
		0,
	)

	for evaluatorRows.Next() {
		var item evaluationModels.EvaluatorProgress

		err := evaluatorRows.Scan(
			&item.UserID,
			&item.NameSnapshot,
			&item.PositionSnapshot,
			&item.AssignmentCount,
			&item.CompletedCount,
		)

		if err != nil {
			return nil, fmt.Errorf(
				"อ่านข้อมูลผู้ประเมินไม่สำเร็จ: %w",
				err,
			)
		}

		item.Complete = item.AssignmentCount > 0 &&
			item.CompletedCount == item.AssignmentCount

		summary.Evaluators = append(summary.Evaluators, item)
	}

	if err := evaluatorRows.Err(); err != nil {
		return nil, err
	}

	// -----------------------------------------
	// 3. ความคืบหน้าของผู้ถูกประเมินแต่ละคน
	// -----------------------------------------

	targetRows, err := db.DB.Query(
		ctx,
		`
		SELECT
			et.id,
			et.user_id,
			TRIM(
				COALESCE(pf.name_th, '') || ' ' ||
				u.first_name || ' ' ||
				u.last_name
			) AS target_name,
			pos.name_th,
			COUNT(ea.id) AS assignment_count,
			COUNT(*) FILTER (WHERE ea.status = 'submitted') AS completed_count,
			AVG(
				CASE
					WHEN ea.status = 'submitted' THEN
						(
							SELECT SUM(es.score)
							FROM evaluation_answers es
							WHERE es.assignment_id = ea.id
						)
				END
			) AS average_score
		FROM evaluation_targets et
		LEFT JOIN users u
			ON u.id = et.user_id
		LEFT JOIN prefixes pf
			ON pf.id = u.prefix_id
		LEFT JOIN positions pos
			ON pos.id = u.position_id
		LEFT JOIN evaluation_assignments ea
			ON ea.instance_id = et.instance_id
		   AND ea.target_id = et.id
		WHERE et.instance_id = $1
		GROUP BY
			et.id,
			u.first_name,
			u.last_name,
			pf.name_th,
			pos.name_th
		ORDER BY et.id
		`,
		instanceID,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"โหลดความคืบหน้าผู้ถูกประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	defer targetRows.Close()

	summary.Targets = make(
		[]evaluationModels.TargetProgress,
		0,
	)

	for targetRows.Next() {
		var item evaluationModels.TargetProgress

		err := targetRows.Scan(
			&item.TargetID,
			&item.UserID,
			&item.Name,
			&item.Position,
			&item.AssignmentCount,
			&item.CompletedCount,
			&item.AverageScore,
		)

		if err != nil {
			return nil, fmt.Errorf(
				"อ่านข้อมูลผู้ถูกประเมินไม่สำเร็จ: %w",
				err,
			)
		}

		summary.Targets = append(summary.Targets, item)
	}

	if err := targetRows.Err(); err != nil {
		return nil, err
	}

	// -----------------------------------------
	// 4. คะแนนเฉลี่ยแยกรายหมวด/ส่วน
	// -----------------------------------------

	sectionRows, err := db.DB.Query(
		ctx,
		`
		SELECT
			sec.id,
			sec.name,
			sec.sort_order,
			AVG(section_totals.total) AS average_score,
			MAX(section_totals.max_possible) AS max_possible_score
		FROM (
			SELECT
				ea.id AS assignment_id,
				eiq.section_id,
				SUM(es.score) AS total,
				SUM(COALESCE(eiq.max_score, 0)) AS max_possible
			FROM evaluation_assignments ea
			JOIN evaluation_answers es
				ON es.assignment_id = ea.id
			JOIN evaluation_instance_questions eiq
				ON eiq.id = es.question_id
			WHERE ea.instance_id = $1
			  AND ea.status = 'submitted'
			  AND eiq.section_id IS NOT NULL
			GROUP BY
				ea.id,
				eiq.section_id
		) section_totals
		JOIN evaluation_sections sec
			ON sec.id = section_totals.section_id
		GROUP BY
			sec.id,
			sec.name,
			sec.sort_order
		ORDER BY sec.sort_order
		`,
		instanceID,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"โหลดคะแนนเฉลี่ยรายหมวดไม่สำเร็จ: %w",
			err,
		)
	}

	defer sectionRows.Close()

	summary.Sections = make(
		[]evaluationModels.SectionScoreSummary,
		0,
	)

	for sectionRows.Next() {
		var item evaluationModels.SectionScoreSummary

		err := sectionRows.Scan(
			&item.SectionID,
			&item.Name,
			&item.SortOrder,
			&item.AverageScore,
			&item.MaxPossibleScore,
		)

		if err != nil {
			return nil, fmt.Errorf(
				"อ่านข้อมูลคะแนนรายหมวดไม่สำเร็จ: %w",
				err,
			)
		}

		summary.Sections = append(summary.Sections, item)
	}

	if err := sectionRows.Err(); err != nil {
		return nil, err
	}

	return &summary, nil
}

func (r *EvaluationRepository) CloseEvaluationInstance(
	ctx context.Context,
	instanceID int64,
	userID int64,
) error {

	tx, err := db.DB.Begin(ctx)

	if err != nil {
		return fmt.Errorf(
			"เริ่ม transaction ไม่สำเร็จ: %w",
			err,
		)
	}

	defer func() {
		_ = tx.Rollback(context.Background())
	}()

	// -----------------------------------------
	// 1. ตรวจ instance + เจ้าของ + status
	// -----------------------------------------

	var status string

	err = tx.QueryRow(
		ctx,
		`
		SELECT status
		FROM evaluation_instances
		WHERE id = $1
		  AND created_by = $2
		FOR UPDATE
		`,
		instanceID,
		userID,
	).Scan(&status)

	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf(
				"ไม่พบการประเมิน หรือคุณไม่มีสิทธิ์จัดการรายการนี้",
			)
		}

		return fmt.Errorf(
			"ตรวจสอบการประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	// สถานะในฐานข้อมูลเก็บเป็นตัวพิมพ์ใหญ่ (DRAFT/OPEN/CLOSED)
	if status != "OPEN" {
		return fmt.Errorf(
			"สามารถปิดได้เฉพาะการประเมินที่อยู่ในสถานะกำลังประเมิน",
		)
	}

	// -----------------------------------------
	// 2. ปิดการประเมิน
	// -----------------------------------------

	_, err = tx.Exec(
		ctx,
		`
		UPDATE evaluation_instances
		SET
			status = 'CLOSED',
			updated_at = NOW()
		WHERE id = $1
		  AND created_by = $2
		  AND status = 'OPEN'
		`,
		instanceID,
		userID,
	)

	if err != nil {
		return fmt.Errorf(
			"ปิดการประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf(
			"commit ไม่สำเร็จ: %w",
			err,
		)
	}

	return nil
}

func (r *EvaluationRepository) StartEvaluationInstance(
	ctx context.Context,
	instanceID int64,
	userID int64,
) error {

	tx, err := db.DB.Begin(ctx)

	if err != nil {
		return fmt.Errorf(
			"เริ่ม transaction ไม่สำเร็จ: %w",
			err,
		)
	}

	defer func() {
		_ = tx.Rollback(context.Background())
	}()

	// -----------------------------------------
	// 1. ตรวจ instance + เจ้าของ + status
	// -----------------------------------------

	var (
		status       string
		templateType string
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT status, COALESCE(template_type, 'EVALUATION')
		FROM evaluation_instances
		WHERE id = $1
		  AND created_by = $2
		FOR UPDATE
		`,
		instanceID,
		userID,
	).Scan(&status, &templateType)

	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf(
				"ไม่พบการประเมิน หรือคุณไม่มีสิทธิ์จัดการรายการนี้",
			)
		}

		return fmt.Errorf(
			"ตรวจสอบการประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	// สถานะในฐานข้อมูลเก็บเป็นตัวพิมพ์ใหญ่ (DRAFT/OPEN/CLOSED)
	if status != "DRAFT" {
		return fmt.Errorf(
			"สามารถเริ่มได้เฉพาะการประเมินที่เป็นฉบับร่าง",
		)
	}

	// -----------------------------------------
	// 2. ตรวจ target
	// -----------------------------------------

	var targetCount int

	err = tx.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM evaluation_targets
		WHERE instance_id = $1
		`,
		instanceID,
	).Scan(&targetCount)

	if err != nil {
		return fmt.Errorf(
			"ตรวจสอบกลุ่มเป้าหมายไม่สำเร็จ: %w",
			err,
		)
	}

	if targetCount == 0 {
		return fmt.Errorf(
			"ยังไม่มีกลุ่มเป้าหมายในการประเมิน",
		)
	}

	// -----------------------------------------
	// 3. ตรวจ evaluator (ข้ามสำหรับแบบสอบถาม — ผู้ตอบตอบเอง ไม่มีผู้ประเมินแยก)
	// -----------------------------------------

	if templateType != "SURVEY" {

		var evaluatorCount int

		err = tx.QueryRow(
			ctx,
			`
			SELECT COUNT(*)
			FROM evaluation_instance_evaluators
			WHERE instance_id = $1
			`,
			instanceID,
		).Scan(&evaluatorCount)

		if err != nil {
			return fmt.Errorf(
				"ตรวจสอบผู้ประเมินไม่สำเร็จ: %w",
				err,
			)
		}

		if evaluatorCount == 0 {
			return fmt.Errorf(
				"ยังไม่มีผู้ประเมิน",
			)
		}
	}

	// -----------------------------------------
	// 4. ตรวจ assignment
	// -----------------------------------------

	var assignmentCount int

	err = tx.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM evaluation_assignments
		WHERE instance_id = $1
		`,
		instanceID,
	).Scan(&assignmentCount)

	if err != nil {
		return fmt.Errorf(
			"ตรวจสอบ assignment ไม่สำเร็จ: %w",
			err,
		)
	}

	if assignmentCount == 0 {
		return fmt.Errorf(
			"ยังไม่มีรายการมอบหมายการประเมิน",
		)
	}

	// -----------------------------------------
	// 5. เปิดการประเมิน
	// -----------------------------------------

	_, err = tx.Exec(
		ctx,
		`
		UPDATE evaluation_instances
		SET
			status = 'OPEN',
			updated_at = NOW()
		WHERE id = $1
		  AND created_by = $2
		  AND status = 'DRAFT'
		`,
		instanceID,
		userID,
	)

	if err != nil {
		return fmt.Errorf(
			"เริ่มการประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf(
			"commit ไม่สำเร็จ: %w",
			err,
		)
	}

	return nil
}