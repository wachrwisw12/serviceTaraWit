package evaluationRepositories

import (
	"context"
	"encoding/json"
	"errors"

	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (r *EvaluationRepository) GetMyInstance(userId int64) ([]evaluationModels.InstanceListResponce, error) {

	// ค้น instance ที่ user เป็น target หรือ evaluator (หรือทั้งคู่)
	// พร้อมคำนวณ role, ดึงข้อมูล assignment สำหรับ evaluator
	instanceQuery := `
WITH user_instances AS (
    SELECT ei.id AS instance_id, et.id AS target_row_id, 'target' AS src
    FROM evaluation_instances ei
    JOIN evaluation_targets et ON et.instance_id = ei.id AND et.user_id = $1
    UNION
    SELECT ei.id AS instance_id, NULL::bigint AS target_row_id, 'evaluator' AS src
    FROM evaluation_instances ei
    JOIN evaluation_instance_evaluators eie ON eie.instance_id = ei.id AND eie.user_id = $1
),
instance_roles AS (
    SELECT
        instance_id,
        CASE
            WHEN count(*) FILTER (WHERE src = 'target') > 0
             AND count(*) FILTER (WHERE src = 'evaluator') > 0 THEN 'both'
            WHEN count(*) FILTER (WHERE src = 'evaluator') > 0 THEN 'evaluator'
            ELSE 'target'
        END AS my_role,
        MAX(target_row_id) AS target_row_id
    FROM user_instances
    GROUP BY instance_id
)
SELECT
    ei.id,
    ei.template_name,
    ei.template_id,
    COALESCE(ei.template_type, 'EVALUATION'),
    ei.status,
    ei.start_date,
    ei.end_date,
    ei.created_by,
    ei.updated_at,
    ei.academic_year,
    COALESCE(ei.round, ''),
    COALESCE(ei.batch_id::text, ''),
    ir.my_role,
    COALESCE((SELECT eie.can_score FROM evaluation_instance_evaluators eie WHERE eie.instance_id=ei.id AND eie.user_id=$1), FALSE),
    COALESCE((SELECT eie.requires_signature FROM evaluation_instance_evaluators eie WHERE eie.instance_id=ei.id AND eie.user_id=$1), FALSE),
    ir.target_row_id,
    -- target name/position
    TRIM(COALESCE(pf.name_th, '') || ' ' || COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
    pos.name_th,
    -- evaluators JSON
    COALESCE(
        (
            SELECT json_agg(
	                json_build_object(
	                    'user_id', eie.user_id,
	                    'name_snapshort', eie.name_snapshot,
	                    'position_snapshort', eie.position_snapshot,
	                    'submitted', EXISTS (
	                        SELECT 1
	                        FROM evaluation_assignments ea_status
	                        WHERE ea_status.instance_id = ei.id
	                          AND ea_status.target_id = ir.target_row_id
	                          AND ea_status.evaluator_id = eie.user_id
	                          AND ea_status.status = 'submitted'
	                    )
	                )
                ORDER BY eie.id
            )
            FROM evaluation_instance_evaluators eie
            WHERE eie.instance_id = ei.id
        ),
        '[]'::json
    ),
    -- evaluator assignment counts
    (
        SELECT count(*)
        FROM evaluation_assignments ea
        WHERE ea.instance_id = ei.id AND ea.evaluator_id = $1
    ),
	    (
	        SELECT count(*)
	        FROM evaluation_assignments ea
	        WHERE ea.instance_id = ei.id AND ea.evaluator_id = $1 AND ea.status = 'submitted'
	    ),
	    -- target progress: evaluators assigned to me / evaluators who submitted
	    (
	        SELECT count(*)
	        FROM evaluation_assignments ea
	        WHERE ea.instance_id = ei.id
	          AND ea.target_id = ir.target_row_id
	    ),
	    (
	        SELECT count(*)
	        FROM evaluation_assignments ea
	        WHERE ea.instance_id = ei.id
	          AND ea.target_id = ir.target_row_id
	          AND ea.status = 'submitted'
	    ),
	    -- pending assignment id (first non-submitted)
    (
        SELECT min(ea.id)
        FROM evaluation_assignments ea
        WHERE ea.instance_id = ei.id AND ea.evaluator_id = $1 AND ea.status != 'submitted'
    ),
    -- my assignments JSON (targets I need to evaluate)
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'assignment_id', ea.id,
                    'target_user_id', et2.user_id,
                    'target_name', TRIM(COALESCE(pf2.name_th, '') || ' ' || COALESCE(u2.first_name, '') || ' ' || COALESCE(u2.last_name, '')),
                    'target_position', pos2.name_th,
                    'status', CASE WHEN ea.status = 'submitted' THEN 'submitted' ELSE 'pending' END
                )
                ORDER BY ea.id
            )
            FROM evaluation_assignments ea
            JOIN evaluation_targets et2 ON et2.id = ea.target_id
            LEFT JOIN users u2 ON u2.id = et2.user_id
            LEFT JOIN positions pos2 ON pos2.id = u2.position_id
            LEFT JOIN prefixes pf2 ON pf2.id = u2.prefix_id
            WHERE ea.instance_id = ei.id AND ea.evaluator_id = $1
        ),
        '[]'::json
    )
FROM evaluation_instances ei
JOIN instance_roles ir ON ir.instance_id = ei.id
LEFT JOIN evaluation_targets et ON et.id = ir.target_row_id
LEFT JOIN users u ON u.id = et.user_id
LEFT JOIN positions pos ON pos.id = u.position_id
LEFT JOIN prefixes pf ON pf.id = u.prefix_id
ORDER BY ei.id DESC;
	`

	rows, err := db.DB.Query(context.Background(), instanceQuery, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var instanceList []evaluationModels.InstanceListResponce

	for rows.Next() {

		var instance evaluationModels.InstanceListResponce
		var evaluatorJSON []byte
		var targetRowID *int64
		var targetName *string
		var targetPosition *string
		var myAssignmentsJSON []byte

		err = rows.Scan(
			&instance.ID,
			&instance.TemplateName,
			&instance.TemplateId,
			&instance.TemplateType,
			&instance.Status,
			&instance.StartDate,
			&instance.EndDate,
			&instance.CreatedBy,
			&instance.UpdatedAt,
			&instance.AcademicYear,
			&instance.Round,
			&instance.BatchID,
			&instance.Role,
			&instance.MyCanScore,
			&instance.MyRequiresSignature,
			&targetRowID,
			&targetName,
			&targetPosition,
			&evaluatorJSON,
			&instance.MyAssignmentCount,
			&instance.MySubmittedCount,
			&instance.TargetEvaluatorCount,
			&instance.TargetSubmittedCount,
			&instance.MyPendingAssignmentID,
			&myAssignmentsJSON,
		)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(evaluatorJSON, &instance.Evaluators); err != nil {
			return nil, err
		}

		// ใส่ข้อมูล target (เฉพาะเมื่อ user เป็น target ใน instance นี้)
		if targetRowID != nil {
			instance.TargetUserId = *targetRowID
			instance.Target.ID = uint(*targetRowID)
		}
		if targetName != nil {
			instance.Target.Name = *targetName
		}
		if targetPosition != nil {
			instance.Target.Position = *targetPosition
		}

		if err := json.Unmarshal(myAssignmentsJSON, &instance.MyAssignments); err != nil {
			return nil, err
		}

		instanceList = append(instanceList, instance)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return instanceList, nil
}

func (r *EvaluationRepository) GetMyInstanceDetail(
	userId int64,
	instanceId int64,
	targetId *int64,
) (*evaluationModels.InstanceDetailResponse, error) {

	instanceQuery := `
SELECT
    ei.id,
    ei.template_id,
    COALESCE(ei.template_name, '') AS template_name,
    t.template_type,
    ei.instance_name,
    ei.status,
    ei.start_date,
    ei.end_date,
    ei.created_by,
    ei.updated_at,
    ei.academic_year,
    COALESCE(ei.round, '') AS round,
    ei.show_score_to_visibility,
    et.id AS target_row_id,
    et.user_id AS target_user_id,
    et.status AS target_status,
TRIM(
        COALESCE(pf.name_th, '') || ' ' ||
        u.first_name || ' ' ||
        u.last_name
    ) AS target_name,

    pos.name_th AS target_position,


    -- evaluators
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'user_id', eie.user_id,
                    'name_snapshort', eie.name_snapshot,
                    'position_snapshort', eie.position_snapshot,
                    'can_score', eie.can_score,
                    'requires_signature', eie.requires_signature,
                    'signature_order', eie.signature_order,
                    'signature_role', eie.signature_role
                )
                ORDER BY eie.signature_order, eie.id
            )
            FROM evaluation_instance_evaluators eie
            WHERE eie.instance_id = ei.id
        ),
        '[]'::json
    ) AS evaluators,

    -- targets ที่ผู้ใช้มีสิทธิ์เปิดดู (เจ้าตัวเห็นตนเอง, ผู้ลงนามเห็นทุกคนในรอบ)
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id', target_list.id,
                    'user_id', target_list.user_id,
                    'name', TRIM(COALESCE(target_prefix.name_th, '') || ' ' || COALESCE(target_user.first_name, '') || ' ' || COALESCE(target_user.last_name, '')),
                    'position', target_position.name_th
                )
                ORDER BY target_list.id
            )
            FROM evaluation_targets target_list
            LEFT JOIN users target_user ON target_user.id = target_list.user_id
            LEFT JOIN positions target_position ON target_position.id = target_user.position_id
            LEFT JOIN prefixes target_prefix ON target_prefix.id = target_user.prefix_id
            WHERE target_list.instance_id = ei.id
              AND (
                target_list.user_id = $1
				OR ei.created_by = $1
                OR EXISTS (
                  SELECT 1 FROM evaluation_instance_evaluators signer
                  WHERE signer.instance_id = ei.id
                    AND signer.user_id = $1
                    AND signer.requires_signature = TRUE
                )
              )
        ),
        '[]'::json
    ) AS accessible_targets,

    -- fields
    COALESCE(
(
SELECT json_agg(
	json_build_object(

	'id',eif.id,'instance_id',eif.instance_id,'target_id',eif.target_id,'target_user_id',
et.user_id,'template_field_id',eif.template_field_id,'field_key',eif.field_key,'label',
	eif.label,'field_type',
	eif.field_type,'placeholder',eif.placeholder,

'value',
	eif.value,

	'required',
	eif.required,

	'sort_order',
	eif.sort_order

	)
	ORDER BY eif.sort_order
)

FROM evaluation_instance_fields eif

WHERE eif.instance_id = ei.id
AND eif.target_id = et.id

),
'[]'::json
)
AS fields,

    -- questions
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id', eiq.id,
                    'section_id', eiq.section_id,
                    'category', es.name,
                    'category_sort_order', es.sort_order,
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

                    'evaluator_scores',
                    (
                        SELECT COALESCE(
                            json_agg(
                                json_build_object(
                                    'evaluator_id', easg.evaluator_id,
                                    'evaluator_name', eie.name_snapshot,
                                    'score', ea.score::float
                                )
                            ),
                            '[]'::json
                        )
                        FROM evaluation_answers ea
                        JOIN evaluation_assignments easg ON easg.id = ea.assignment_id
                        LEFT JOIN evaluation_instance_evaluators eie
                            ON eie.user_id = easg.evaluator_id AND eie.instance_id = ei.id
                        WHERE ea.question_id = eiq.id
                          AND easg.target_id = et.id
                          AND easg.status = 'submitted'
                    )
                )
                ORDER BY eiq.sort_order
            )
            FROM evaluation_instance_questions eiq
            LEFT JOIN evaluation_sections es
                ON es.id = eiq.section_id
            WHERE eiq.evaluation_instance_id = ei.id
        ),
        '[]'::json
    ) AS questions


FROM evaluation_instances ei

JOIN LATERAL (
    SELECT etx.*
    FROM evaluation_targets etx
    WHERE etx.instance_id = ei.id
	  AND ($3::bigint IS NULL OR etx.id = $3)
      AND (
        etx.user_id = $1
		OR ei.created_by = $1
        OR EXISTS (
          SELECT 1 FROM evaluation_instance_evaluators access_eie
          WHERE access_eie.instance_id = ei.id
            AND access_eie.user_id = $1
            AND access_eie.requires_signature = TRUE
        )
      )
    ORDER BY (etx.user_id = $1) DESC, etx.id
    LIMIT 1
) et ON TRUE

LEFT JOIN users u
    ON u.id = et.user_id

LEFT JOIN positions pos
    ON pos.id = u.position_id

LEFT JOIN prefixes pf
    ON pf.id = u.prefix_id

LEFT JOIN evaluation_templates t
    ON t.id = ei.template_id

WHERE ei.id = $2;
`

	row := db.DB.QueryRow(context.Background(), instanceQuery, userId, instanceId, targetId)

	var detail evaluationModels.InstanceDetailResponse
	var evaluatorJSON []byte
	var accessibleTargetsJSON []byte
	var fieldJSON []byte
	var questionJSON []byte

	err := row.Scan(
		&detail.ID,
		&detail.TemplateId,
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
		&detail.Target.UserId,
		&detail.Target.Status,
		&detail.Target.Name,
		&detail.Target.Position,
		&evaluatorJSON,
		&accessibleTargetsJSON,
		&fieldJSON,
		&questionJSON,
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

	if err := json.Unmarshal(accessibleTargetsJSON, &detail.AccessibleTargets); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(
		fieldJSON,
		&detail.Fields,
	); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(
		questionJSON,
		&detail.Questions,
	); err != nil {
		return nil, err
	}

	return &detail, nil
}

func (r *EvaluationRepository) UpdateFields(
	userID int64,
	instanceID int64,
	fields map[int64]string,
) error {

	ctx := context.Background()
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background()) //nolint:errcheck

	var allowed bool
	if err := tx.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1 FROM evaluation_targets
			WHERE instance_id = $1 AND user_id = $2
		)`,
		instanceID,
		userID,
	).Scan(&allowed); err != nil {
		return err
	}
	if !allowed {
		return errors.New("ไม่มีสิทธิ์แก้ไขรายการนี้")
	}

	for fieldID, value := range fields {

		query := `
		UPDATE evaluation_instance_fields
		SET value = $1,
		    updated_at = NOW()
		WHERE id = $2
		AND instance_id = $3
		`

		result, err := tx.Exec(
			ctx,
			query,
			value,
			fieldID,
			instanceID,
		)

		if err != nil {
			return err
		}
		if result.RowsAffected() != 1 {
			return errors.New("ไม่พบช่องข้อมูลที่ต้องการแก้ไข")
		}
	}

	return tx.Commit(ctx)
}
