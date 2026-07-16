// internal/repository/evaluation_instance_repo.go
package evaluationRepositories

import (
	"context"
	"encoding/json"
	"fmt"

	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (r *EvaluationRepository) CountByTemplateAndYear(
	templateID int64, academicYear int,
) (int, error) {
	query := `SELECT COUNT(*) FROM evaluation_instances WHERE template_id = $1 AND academic_year = $2 AND deleted_at IS NULL`
	var count int
	err := db.DB.QueryRow(context.Background(), query, templateID, academicYear).Scan(&count)
	return count, err
}

func (r *EvaluationRepository) GetInstanceList() ([]evaluationModels.InstanceListResponce, error) {

	instanceQuery := `
	SELECT
		ei.id,
		ei.template_name,
		ei.template_id,
		ei.status,
		ei.start_date,
		ei.end_date,
		ei.created_by,
		ei.updated_at,
		ei.academic_year,
		ei.round,

		COALESCE(
			(
				SELECT json_agg(
					json_build_object(
						'user_id', eie.user_id,
						'name_snapshort', eie.name_snapshot,
						'position_snapshort', eie.position_snapshot
					)
					ORDER BY eie.id
				)
				FROM evaluation_instance_evaluators eie
				WHERE eie.instance_id = ei.id
			),
			'[]'::json
		) AS evaluators

	FROM evaluation_instances ei
	ORDER BY ei.id DESC;
	`

	rows, err := db.DB.Query(context.Background(), instanceQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var instanceList []evaluationModels.InstanceListResponce

	for rows.Next() {

		var instance evaluationModels.InstanceListResponce
		var evaluatorJSON []byte

		err = rows.Scan(
			&instance.ID,
			&instance.TemplateName,
			&instance.TemplateId,
			&instance.Status,
			&instance.StartDate,
			&instance.EndDate,
			&instance.CreatedBy,
			&instance.UpdatedAt,
			&instance.AcademicYear,
			&instance.Round,
			&evaluatorJSON,
		)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(evaluatorJSON, &instance.Evaluators); err != nil {
			return nil, err
		}

		instanceList = append(instanceList, instance)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return instanceList, nil
}
func (r *EvaluationRepository) CreateInstance(
	ctx context.Context,
	payload evaluationModels.CreateEvaluationInstancePayload,
) (err error) {

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		}
	}()

	// =====================================
	// 1. Get Template Snapshot
	// =====================================

	var templateName string

	templateQuery := `
		SELECT template_name
		FROM evaluation_templates
		WHERE id = $1
		AND deleted_at IS NULL
	`

	err = tx.QueryRow(
		ctx,
		templateQuery,
		payload.TemplateID,
	).Scan(&templateName)

	if err != nil {
		return err
	}

	// =====================================
	// 2. Create Evaluation Instance
	// =====================================

	var instanceID int64

	instanceQuery := `
		INSERT INTO evaluation_instances
		(
			template_id,
			template_name,
			academic_year,
			round,
			show_score_to_visibility,
			created_by
		)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id
	`

	err = tx.QueryRow(
		ctx,
		instanceQuery,
		payload.TemplateID,
		templateName,
		payload.AcademicYear,
		payload.Round,
		payload.ShowScoreToVisibility,
		payload.CreateBy,
	).Scan(&instanceID)

	if err != nil {
		return err
	}

	// =====================================
	// 3. Copy Questions Snapshot (+ choices)
	// =====================================

	questionRows, err := tx.Query(ctx, `
		SELECT q.id, q.question, q.question_type, q.sort_order
		FROM evaluation_questions q
		JOIN evaluation_sections s ON s.id = q.section_id
		WHERE s.template_id = $1
		AND q.deleted_at IS NULL
		ORDER BY q.sort_order
	`, payload.TemplateID)

	if err != nil {
		return err
	}

	type questionSnapshot struct {
		oldID        int64
		questionText string
		questionType string
		sortOrder    int
	}

	var questions []questionSnapshot

	for questionRows.Next() {
		var q questionSnapshot
		if err = questionRows.Scan(&q.oldID, &q.questionText, &q.questionType, &q.sortOrder); err != nil {
			questionRows.Close()
			return err
		}
		questions = append(questions, q)
	}
	if err = questionRows.Err(); err != nil {
		questionRows.Close()
		return err
	}
	questionRows.Close()

	maxScoreQuery := `
		SELECT COALESCE(MAX(score), 0)
		FROM evaluation_question_choices
		WHERE question_id = $1
		AND deleted_at IS NULL
	`

	insertQuestionQuery := `
		INSERT INTO evaluation_instance_questions
		(
			evaluation_instance_id,
			question_text,
			question_type,
			max_score,
			sort_order
		)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id
	`

	copyChoicesQuery := `
		INSERT INTO evaluation_instance_question_choices
		(
			evaluation_instance_question_id,
			label,
			score,
			sort_order
		)
		SELECT $1, label, score, sort_order
		FROM evaluation_question_choices
		WHERE question_id = $2
		AND deleted_at IS NULL
	`

	for _, q := range questions {

		var maxScore float64
		err = tx.QueryRow(ctx, maxScoreQuery, q.oldID).Scan(&maxScore)
		if err != nil {
			return err
		}

		var newQuestionID int64

		err = tx.QueryRow(
			ctx,
			insertQuestionQuery,
			instanceID,
			q.questionText,
			q.questionType,
			maxScore,
			q.sortOrder,
		).Scan(&newQuestionID)

		if err != nil {
			return err
		}

		_, err = tx.Exec(
			ctx,
			copyChoicesQuery,
			newQuestionID,
			q.oldID,
		)

		if err != nil {
			return err
		}
	}

	// =====================================
	// 4. Insert Target Members
	// =====================================


	targetQuery := `
		INSERT INTO evaluation_targets
		(
			instance_id,
			user_id
		)
		VALUES ($1,$2)
		RETURNING id
	`

	targetIDMap := make(map[string]int64) // user_id (string) -> evaluation_targets.id

	for _, memberID := range payload.TargetMemberIDs {

		var targetRowID int64

		err = tx.QueryRow(
			ctx,
			targetQuery,
			instanceID,
			memberID,
		).Scan(&targetRowID)

		if err != nil {
			return err
		}

		targetIDMap[memberID] = targetRowID
	}

	// =====================================
	// 5. Insert Evaluators
	// =====================================
	// join users + positions เพื่อ snapshot ชื่อ-ตำแหน่งจริง ณ ตอนสร้าง instance
	// ใช้ COALESCE กันกรณี position_id เป็น NULL หรือหา position ไม่เจอ

	evaluatorQuery := `
		INSERT INTO evaluation_instance_evaluators
		(
			instance_id,
			user_id,
			name_snapshot,
			position_snapshot
		)
		SELECT
			$1,
			u.id,
			CONCAT(u.first_name, ' ', u.last_name),
			COALESCE(p.name_th, '-')
		FROM users u
		LEFT JOIN positions p ON p.id = u.position_id
		WHERE u.id = $2
	`

        for _, evaluatorID := range payload.EvaluatorMemberIDs {

		tag, err := tx.Exec(
			ctx,
			evaluatorQuery,
			instanceID,
			evaluatorID,
		)

		if err != nil {
			return err
		}

		if tag.RowsAffected() == 0 {
			err = fmt.Errorf("evaluator user_id %d not found", evaluatorID)
			return err
		}
	}
	

	// =====================================
	// 6. Create Assignment
	// ใครประเมินใคร
	// =====================================

	assignmentQuery := `
		INSERT INTO evaluation_assignments
		(
			instance_id,
			evaluator_id,
			target_id,
			status
		)
		VALUES ($1,$2,$3,'pending')
	`

	for _, evaluatorID := range payload.EvaluatorMemberIDs {

		for _, targetUserID := range payload.TargetMemberIDs {

			targetRowID, ok := targetIDMap[targetUserID]
			if !ok {
				return fmt.Errorf("target row id not found for user_id %s", targetUserID)
			}

			_, err = tx.Exec(
				ctx,
				assignmentQuery,
				instanceID,
				evaluatorID,
				targetRowID,
			)

			if err != nil {
				return err
			}
		}
	}

	// =====================================
	// Commit
	// =====================================

	err = tx.Commit(ctx)

	return err
}