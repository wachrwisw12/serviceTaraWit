package evaluationRepositories

import (
	"context"
	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (r *EvaluationRepository) GetMyTasks(
	ctx context.Context,
	evaluatorID int64,
) ([]evaluationModels.MyEvaluationTaskResponse, error) {

	query := `
	SELECT
		ei.batch_id,
		ei.instance_name AS title,
		ei.academic_year,
		ei.round,

		COUNT(ea.id) AS total_target,

		COUNT(
			CASE 
				WHEN ea.status = 'submitted'
				THEN 1
			END
		) AS completed_target,

		CASE
			WHEN bool_and(ei.status = 'CLOSED') THEN 'closed'
			WHEN bool_or(ei.status = 'OPEN') THEN 'open'
			ELSE 'draft'
		END AS status

	FROM evaluation_instances ei

	JOIN evaluation_assignments ea
		ON ea.instance_id = ei.id

	WHERE ea.evaluator_id = $1

	GROUP BY
		ei.batch_id,
		ei.instance_name,
		ei.academic_year,
		ei.round

	ORDER BY ei.batch_id DESC
	`

	rows, err := db.DB.Query(ctx, query, evaluatorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]evaluationModels.MyEvaluationTaskResponse, 0)

	for rows.Next() {
		var item evaluationModels.MyEvaluationTaskResponse

		err := rows.Scan(
			&item.BatchID,
			&item.Title,
			&item.AcademicYear,
			&item.Round,
			&item.TotalTarget,
			&item.CompletedTarget,
			&item.Status,
		)
		if err != nil {
			return nil, err
		}

		result = append(result, item)
	}

	return result, nil
}

type batchTargetRow struct {
	UserID   int64
	Name     string
	Position string

	InstanceID     int64
	InstanceStatus string
	TemplateName   string

	AssignmentID int64
	Status       string
	EvaluatorID  int64

	EvaluatorName     string
	EvaluatorPosition string

	AttachmentID *int64
}

// GetBatchTargets คืนรายชื่อทุกคนที่ถูกประเมินใน batch นี้ พร้อมสถานะของ
// ผู้ประเมินแต่ละคน (รวมของผู้เรียก API เอง) และเอกสารแนบต่อ instance+target
func (r *EvaluationRepository) GetBatchTargets(
	ctx context.Context,
	batchID string,
	currentUserID int64,
) ([]evaluationModels.BatchTargetResponse, error) {

	query := `
	SELECT
		et.user_id,
		COALESCE(p.name_th, '') || 
        COALESCE(u.first_name, '') || ' ' ||
        COALESCE(u.last_name, '') AS target_name,

        COALESCE(pos.name_th, '') AS target_position,
		ei.id AS instance_id,
		ei.status AS instance_status,
		ei.template_name,

		ea.id AS assignment_id,
		ea.status,
		ea.evaluator_id,

		eie.name_snapshot AS evaluator_name,
		eie.position_snapshot AS evaluator_position,

		eia.id AS attachment_id

	FROM evaluation_instances ei
	JOIN evaluation_assignments ea ON ea.instance_id = ei.id
	JOIN evaluation_targets et ON et.id = ea.target_id
	JOIN users u ON u.id = et.user_id
	LEFT JOIN prefixes p ON p.id = u.prefix_id
	LEFT JOIN positions pos ON pos.id = u.position_id
	JOIN evaluation_instance_evaluators eie
		ON eie.instance_id = ei.id
		AND eie.user_id = ea.evaluator_id
	LEFT JOIN evaluation_instance_attachments eia
		ON eia.instance_id = ei.id
		AND eia.target_id = et.id

	WHERE ei.batch_id = $1
	  AND EXISTS (
		SELECT 1
		FROM evaluation_assignments access_assignment
		WHERE access_assignment.instance_id = ei.id
		  AND access_assignment.evaluator_id = $2
	  )

	ORDER BY et.user_id, ei.id, ea.evaluator_id
	`

	rows, err := db.DB.Query(ctx, query, batchID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var raw []batchTargetRow

	for rows.Next() {
		var row batchTargetRow

		err := rows.Scan(
			&row.UserID,
			&row.Name,
			&row.Position,
			&row.InstanceID,
			&row.InstanceStatus,
			&row.TemplateName,
			&row.AssignmentID,
			&row.Status,
			&row.EvaluatorID,
			&row.EvaluatorName,
			&row.EvaluatorPosition,
			&row.AttachmentID,
		)
		if err != nil {
			return nil, err
		}

		raw = append(raw, row)
	}

	return groupBatchTargets(raw, currentUserID), nil
}

// groupBatchTargets พับแถวดิบ (1 แถวต่อ instance x evaluator x attachment)
// ให้เป็น 1 รายการต่อคนที่ถูกประเมิน โดยแต่ละคนมีลิสต์ instance และแต่ละ
// instance มีลิสต์ evaluator + attachment ของตัวเอง
func groupBatchTargets(
	rows []batchTargetRow,
	currentUserID int64,
) []evaluationModels.BatchTargetResponse {

	targetIndex := make(map[int64]int)
	instanceIndex := make(map[int64]map[int64]int)         // userID -> instanceID -> idx ใน Instances
	attachSeen := make(map[int64]map[int64]map[int64]bool) // userID -> instanceID -> attachmentID -> seen

	result := make([]evaluationModels.BatchTargetResponse, 0)

	for _, row := range rows {
		tIdx, exists := targetIndex[row.UserID]

		if !exists {
			result = append(result, evaluationModels.BatchTargetResponse{
				UserID:    row.UserID,
				Name:      row.Name,
				Position:  &row.Position,
				Instances: []evaluationModels.TargetInstanceStatus{},
			})

			tIdx = len(result) - 1
			targetIndex[row.UserID] = tIdx
			instanceIndex[row.UserID] = make(map[int64]int)
			attachSeen[row.UserID] = make(map[int64]map[int64]bool)
		}

		target := &result[tIdx]

		iIdx, hasInstance := instanceIndex[row.UserID][row.InstanceID]

		if !hasInstance {
			target.Instances = append(target.Instances, evaluationModels.TargetInstanceStatus{
				InstanceID:     row.InstanceID,
				InstanceStatus: row.InstanceStatus,
				TemplateName:   row.TemplateName,
				AttachmentIDs:  []int64{},
				Evaluators:     []evaluationModels.EvaluatorStatus{},
			})

			iIdx = len(target.Instances) - 1
			instanceIndex[row.UserID][row.InstanceID] = iIdx
			attachSeen[row.UserID][row.InstanceID] = make(map[int64]bool)

			target.TotalInstances++
		}

		inst := &target.Instances[iIdx]

		isMe := row.EvaluatorID == currentUserID

		inst.Evaluators = append(inst.Evaluators, evaluationModels.EvaluatorStatus{
			EvaluatorID: row.EvaluatorID,
			Name:        row.EvaluatorName,
			Position:    &row.EvaluatorPosition,
			Status:      row.Status,
			IsMe:        isMe,
		})

		if isMe {
			assignmentID := row.AssignmentID
			status := row.Status
			inst.MyAssignmentID = &assignmentID
			inst.MyStatus = &status

			if row.Status == "submitted" {
				target.CompletedCount++
			}
		}

		if row.AttachmentID != nil && !attachSeen[row.UserID][row.InstanceID][*row.AttachmentID] {
			attachSeen[row.UserID][row.InstanceID][*row.AttachmentID] = true
			inst.AttachmentIDs = append(inst.AttachmentIDs, *row.AttachmentID)
		}
	}

	return result
}
func (r *EvaluationRepository) GetAllTasks(
	ctx context.Context,
) ([]evaluationModels.MyEvaluationTaskResponse, error) {

	query := `
	SELECT
		ei.batch_id,
		ei.instance_name AS title,
		ei.academic_year,
		ei.round,

		COUNT(ea.id) AS total_target,

		COUNT(
			CASE 
				WHEN ea.status = 'submitted'
				THEN 1
			END
		) AS completed_target,

		CASE
			WHEN bool_and(ei.status = 'CLOSED') THEN 'closed'
			WHEN bool_or(ei.status = 'OPEN') THEN 'open'
			ELSE 'draft'
		END AS status

	FROM evaluation_instances ei

	JOIN evaluation_assignments ea
		ON ea.instance_id = ei.id

	GROUP BY
		ei.batch_id,
		ei.instance_name,
		ei.academic_year,
		ei.round

	ORDER BY ei.batch_id DESC
	`

	rows, err := db.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]evaluationModels.MyEvaluationTaskResponse, 0)

	for rows.Next() {
		var item evaluationModels.MyEvaluationTaskResponse

		err := rows.Scan(
			&item.BatchID,
			&item.Title,
			&item.AcademicYear,
			&item.Round,
			&item.TotalTarget,
			&item.CompletedTarget,
			&item.Status,
		)

		if err != nil {
			return nil, err
		}

		result = append(result, item)
	}

	return result, nil
}
