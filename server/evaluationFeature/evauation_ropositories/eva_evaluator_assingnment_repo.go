package evaluationRepositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)


func (r *EvaluationRepository) GetEvaluatorAssignmentDetail(
	userId int64,
	assignmentId int64,
) (*evaluationModels.EvaluatorAssignmentDetail, error) {
 

	query := `
SELECT

    ei.id,
    ei.template_id,
    ei.template_name,
    tt.template_type,
    ei.instance_name,
    ei.status,
    ei.start_date,
    ei.end_date,
    ei.created_by,
    ei.updated_at,
    ei.academic_year,
    ei.round,
    ei.show_score_to_visibility,

    -- target
    et.id,
    et.user_id,
    et.status,

    TRIM(
        COALESCE(pf.name_th,'') || ' ' ||
        u.first_name || ' ' ||
        u.last_name
    ) AS target_name,

    pos.name_th,
    -- evaluators
COALESCE(
(
    SELECT json_agg(
        json_build_object(
            'user_id', eie.user_id,
            'name_snapshot', eie.name_snapshot,
            'position_snapshot', eie.position_snapshot
        )
        ORDER BY eie.id
    )
    FROM evaluation_instance_evaluators eie
    WHERE eie.instance_id = ei.id
),
'[]'::json
) AS evaluators,
    COALESCE(
(
    SELECT json_agg(
        json_build_object(
            'id', eif.id,
            'instance_id', eif.instance_id,
            'target_id', eif.target_id,
            'target_user_id', et.user_id,
            'template_field_id', eif.template_field_id,
            'field_key', eif.field_key,
            'label', eif.label,
            'field_type', eif.field_type,
            'placeholder', eif.placeholder,
            'value', eif.value,
            'required', eif.required,
            'sort_order', eif.sort_order
        )
        ORDER BY eif.sort_order
    )
    FROM evaluation_instance_fields eif
    WHERE eif.instance_id = ei.id
      AND eif.target_id = et.id
),
'[]'::json
) AS fields,
   -- questions
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(

                    'id', eiq.id,
                    'section_id', eiq.section_id,
                    'category', sec.name,
                    'category_sort_order', sec.sort_order,
                    'question_text', eiq.question_text,
                    'question_type', eiq.question_type,
                    'max_score', eiq.max_score,
                    'sort_order', eiq.sort_order,

                    'choices',
                    (
                        SELECT COALESCE(
                            json_agg(
                                json_build_object(
                                    'id', eiqc.id,
                                    'label', eiqc.label,
                                    'score', eiqc.score,
                                    'sort_order', eiqc.sort_order
                                )
                                ORDER BY eiqc.sort_order
                            ),
                            '[]'::json
                        )
                        FROM evaluation_instance_question_choices eiqc
                        WHERE eiqc.evaluation_instance_question_id = eiq.id
                    ),

                    'selected_score', es.score,

                    'selected_choice_id',
                    (
                        SELECT eiqc.id
                        FROM evaluation_instance_question_choices eiqc
                        WHERE eiqc.evaluation_instance_question_id = eiq.id
                          AND eiqc.score = es.score
                        LIMIT 1
                    )

                )
                ORDER BY eiq.sort_order
            )
            FROM evaluation_instance_questions eiq
            LEFT JOIN evaluation_sections sec
                ON sec.id = eiq.section_id
            LEFT JOIN evaluation_answers es
                ON es.assignment_id = a.id
               AND es.question_id = eiq.id
            WHERE eiq.evaluation_instance_id = ei.id
        ),
        '[]'::json
    ) AS questions

FROM evaluation_assignments a

JOIN evaluation_instances ei
ON ei.id = a.instance_id
JOIN evaluation_templates tt
ON tt.id = ei.template_id
JOIN evaluation_targets et
ON et.id = a.target_id

LEFT JOIN users u
ON u.id = et.user_id

LEFT JOIN positions pos
ON pos.id = u.position_id

LEFT JOIN prefixes pf
ON pf.id = u.prefix_id

WHERE a.id = $1
AND a.evaluator_id = $2
`

	row := db.DB.QueryRow(
		context.Background(),
		query,
		assignmentId,
		userId,
	)


	var detail evaluationModels.EvaluatorAssignmentDetail
var evaluatorJSON []byte

	var fieldJSON []byte
var questionJSON []byte


	err := row.Scan(
    &detail.ID,
    &detail.TemplateID,
    &detail.TemplateName,
    &detail.TemplateType,
    &detail.InstanceName,
    &detail.Status,
    &detail.StartDate,
    &detail.EndDate,
    &detail.CreatedBy,
    &detail.UpdatedAt,
    &detail.AcademicYear,
    &detail.Round,
    &detail.ShowScoreToVisibility,

    &detail.Target.ID,
    &detail.Target.UserID,
    &detail.Target.Status,
    &detail.Target.Name,
    &detail.Target.Position,
    &evaluatorJSON, // <-- เพิ่มตรงนี้

    &fieldJSON,      // fields
    &questionJSON,   // questions
)


	if err != nil {
		return nil, err
	}

if err := json.Unmarshal(
    evaluatorJSON,
    &detail.Evaluators,
); err != nil {
    return nil, err
}

	if err := json.Unmarshal(fieldJSON, &detail.Fields); err != nil {
    return nil, err
}

if err := json.Unmarshal(questionJSON, &detail.Questions); err != nil {
    return nil, err
}

	if err != nil {
		return nil, err
	}


	return &detail,nil
}

func (r *EvaluationRepository)  SubmitEvaluationAnswers(
	ctx context.Context,
	assignmentID int64,
	evaluatorUserID int64,
	req evaluationModels.SubmitEvaluationRequest,
) (*evaluationModels.SubmitEvaluationResponse, error) {

	if db.DB == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf(
			"เริ่ม transaction ไม่สำเร็จ: %w",
			err,
		)
	}

	committed := false

	defer func() {
		if !committed {
			_ = tx.Rollback(ctx)
		}
	}()

	// --------------------------------------------------
	// 1. ตรวจ Assignment + สิทธิ์ผู้ประเมิน
	// --------------------------------------------------

	var (
		instanceID int64
		status     string
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			a.instance_id,
			a.status
		FROM evaluation_assignments a
		WHERE a.id = $1
		  AND a.evaluator_id = $2
		FOR UPDATE
		`,
		assignmentID,
		evaluatorUserID,
	).Scan(
		&instanceID,
		&status,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf(
				"ไม่พบรายการประเมิน หรือคุณไม่มีสิทธิ์ประเมินรายการนี้",
			)
		}

		return nil, fmt.Errorf(
			"ตรวจสอบ assignment ไม่สำเร็จ: %w",
			err,
		)
	}

	if status == "submitted" {
		return nil, fmt.Errorf(
			"รายการประเมินนี้ถูกส่งคะแนนแล้ว",
		)
	}

	// --------------------------------------------------
	// 2. ตรวจสถานะ Instance
	// --------------------------------------------------

	var instanceStatus string

	err = tx.QueryRow(
		ctx,
		`
		SELECT status
		FROM evaluation_instances
		WHERE id = $1
		`,
		instanceID,
	).Scan(&instanceStatus)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf(
				"ไม่พบรายการประเมิน",
			)
		}

		return nil, fmt.Errorf(
			"ตรวจสอบสถานะการประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	if instanceStatus != "OPEN" {
		return nil, fmt.Errorf(
			"รายการประเมินไม่ได้อยู่ในสถานะเปิด",
		)
	}

	// --------------------------------------------------
	// 3. Validate payload ซ้ำ
	// --------------------------------------------------

	if len(req.Answers) == 0 {
		return nil, fmt.Errorf("ไม่พบคำตอบ")
	}

	seenQuestions := make(map[int64]struct{})

	// --------------------------------------------------
	// 4. ตรวจและบันทึกคำตอบ
	// --------------------------------------------------

	for _, answer := range req.Answers {
   
		if answer.QuestionID <= 0 {
			return nil, fmt.Errorf(
				"question_id ไม่ถูกต้อง",
			)
		}

		if _, exists := seenQuestions[answer.QuestionID]; exists {
			return nil, fmt.Errorf(
				"พบ question_id %d ซ้ำ",
				answer.QuestionID,
			)
		}

		seenQuestions[answer.QuestionID] = struct{}{}

		var (
			questionType string
			maxScore     sql.NullInt64
		)

		// สำคัญ:
		// question_id จาก frontend คือ
		// evaluation_instance_questions.id
		err = tx.QueryRow(
			ctx,
			`
			SELECT
				question_type,
				max_score
			FROM evaluation_instance_questions
			WHERE id = $1
			  AND evaluation_instance_id = $2
			`,
			answer.QuestionID,
			instanceID,
		).Scan(
			&questionType,
			&maxScore,
		)

		if err != nil {
			if err == sql.ErrNoRows {
				return nil, fmt.Errorf(
					"คำถาม id %d ไม่อยู่ในการประเมินนี้",
					answer.QuestionID,
				)
			}

			return nil, fmt.Errorf(
				"ตรวจสอบคำถาม id %d ไม่สำเร็จ: %w",
				answer.QuestionID,
				err,
			)
		}

		// ตอนนี้ ScoringDrawer รองรับ SCALE
		if questionType != "SCALE" {
			return nil, fmt.Errorf(
				"คำถาม id %d ไม่ใช่คำถามแบบให้คะแนน",
				answer.QuestionID,
			)
		}

		if answer.Score < 0 {
			return nil, fmt.Errorf(
				"คะแนนของคำถาม id %d ไม่ถูกต้อง",
				answer.QuestionID,
			)
		}

		if maxScore.Valid &&
			answer.Score > int(maxScore.Int64) {

			return nil, fmt.Errorf(
				"คะแนนของคำถาม id %d ต้องไม่เกิน %d",
				answer.QuestionID,
				maxScore.Int64,
			)
		}

		// --------------------------------------------------
		// บันทึก evaluation_scores
		// --------------------------------------------------

		_, err = tx.Exec(
			ctx,
			`
			INSERT INTO evaluation_answers (
				assignment_id,
				question_id,
				score,
				created_at,
				updated_at
			)
			VALUES (
				$1,
				$2,
				$3,
				NOW(),
				NOW()
			)
			ON CONFLICT (
				assignment_id,
				question_id
			)
			DO UPDATE SET
				score = EXCLUDED.score,
				updated_at = NOW()
			`,
			assignmentID,
			answer.QuestionID,
			answer.Score,
		)

		if err != nil {
			return nil, fmt.Errorf(
				"บันทึกคะแนนคำถาม id %d ไม่สำเร็จ: %w",
				answer.QuestionID,
				err,
			)
		}
	}

	// --------------------------------------------------
	// 5. จำนวนคำถามที่ต้องตอบ
	// --------------------------------------------------

	var totalQuestions int

	err = tx.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM evaluation_instance_questions
		WHERE evaluation_instance_id = $1
		  AND question_type = 'SCALE'
		`,
		instanceID,
	).Scan(&totalQuestions)

	if err != nil {
		return nil, fmt.Errorf(
			"ตรวจสอบจำนวนคำถามไม่สำเร็จ: %w",
			err,
		)
	}

	if totalQuestions == 0 {
		return nil, fmt.Errorf(
			"ไม่พบคำถามสำหรับการประเมินนี้",
		)
	}

	// --------------------------------------------------
	// 6. จำนวนคำตอบของ Assignment นี้
	// --------------------------------------------------

	var totalAnswers int

	err = tx.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM evaluation_answers es
		JOIN evaluation_instance_questions eiq
		  ON eiq.id = es.question_id
		WHERE es.assignment_id = $1
		  AND eiq.evaluation_instance_id = $2
		  AND eiq.question_type = 'SCALE'
		`,
		assignmentID,
		instanceID,
	).Scan(&totalAnswers)

	if err != nil {
		return nil, fmt.Errorf(
			"ตรวจสอบจำนวนคำตอบไม่สำเร็จ: %w",
			err,
		)
	}

	if totalAnswers != totalQuestions {
		return nil, fmt.Errorf(
			"กรุณาให้คะแนนให้ครบทุกข้อ (%d/%d)",
			totalAnswers,
			totalQuestions,
		)
	}

	// --------------------------------------------------
	// 7. เปลี่ยน Assignment เป็น submitted
	// --------------------------------------------------

	result, err := tx.Exec(
		ctx,
		`
		UPDATE evaluation_assignments
		SET
			status = 'submitted',
			submitted_at = NOW()
		WHERE id = $1
		  AND evaluator_id = $2
		`,
		assignmentID,
		evaluatorUserID,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"อัปเดตสถานะการประเมินไม่สำเร็จ: %w",
			err,
		)
	}

	rowsAffected := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf(
			"ตรวจสอบผลการอัปเดต assignment ไม่สำเร็จ: %w",
			err,
		)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf(
			"ไม่สามารถอัปเดตสถานะ assignment ได้",
		)
	}

	// --------------------------------------------------
	// 8. Commit
	// --------------------------------------------------

	if err := tx.Commit(ctx); err != nil {
	return nil, fmt.Errorf(
		"commit transaction ไม่สำเร็จ: %w",
		err,
	)
}

	committed = true

	return &evaluationModels.SubmitEvaluationResponse{
		AssignmentID: assignmentID,
		TotalAnswers: totalAnswers,
		Status:       "submitted",
	}, nil
}