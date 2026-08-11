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
		_ = tx.Rollback(ctx)
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

	if status != "draft" {
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
	// 3. ตรวจ evaluator
	// -----------------------------------------

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
			status = 'open',
			updated_at = NOW()
		WHERE id = $1
		  AND created_by = $2
		  AND status = 'draft'
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