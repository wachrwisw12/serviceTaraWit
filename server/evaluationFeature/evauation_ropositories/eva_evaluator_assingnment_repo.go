package evaluationRepositories

import (
	"context"
	"encoding/json"

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
            LEFT JOIN evaluation_scores es
                ON es.assignment_id = a.id
               AND es.question_id = eiq.id
            WHERE eiq.evaluation_instance_id = ei.id
        ),
        '[]'::json
    ) AS questions

FROM evaluation_assignments a

JOIN evaluation_instances ei
ON ei.id = a.instance_id

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