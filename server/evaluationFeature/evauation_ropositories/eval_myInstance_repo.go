package evaluationRepositories

import (
	"context"
	"encoding/json"

	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)


func (r *EvaluationRepository) GetMyInstance(userId int64) ([]evaluationModels.InstanceListResponce, error) {

	instanceQuery := `SELECT
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
(
    SELECT et.id
    FROM evaluation_targets et
    WHERE et.instance_id = ei.id
      AND et.user_id = $1
    LIMIT 1
) AS target_id,

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
WHERE EXISTS (
    SELECT 1
    FROM evaluation_targets et
    WHERE et.instance_id = ei.id
      AND et.user_id = $1
)
ORDER BY ei.id DESC;
	`

	rows, err := db.DB.Query(context.Background(), instanceQuery,userId)
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
			&instance.TargetUserId,
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


func (r *EvaluationRepository) GetMyInstanceDetail(
	userId int64,
	instanceId int64,
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
                    'position_snapshort', eie.position_snapshot
                )
                ORDER BY eie.id
            )
            FROM evaluation_instance_evaluators eie
            WHERE eie.instance_id = ei.id
        ),
        '[]'::json
    ) AS evaluators,

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

JOIN evaluation_targets et
    ON et.instance_id = ei.id
   AND et.user_id = $1

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

	row := db.DB.QueryRow(context.Background(), instanceQuery, userId, instanceId)

	var detail evaluationModels.InstanceDetailResponse
	var evaluatorJSON []byte
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
	instanceID int64,
	fields map[int64]string,
) error {

	ctx := context.Background()

	for fieldID, value := range fields {

		query := `
		UPDATE evaluation_instance_fields
		SET value = $1,
		    updated_at = NOW()
		WHERE id = $2
		AND instance_id = $3
		`

		_, err := db.DB.Exec(
			ctx,
			query,
			value,
			fieldID,
			instanceID,
		)

		if err != nil {
			return err
		}
	}

	return nil
}