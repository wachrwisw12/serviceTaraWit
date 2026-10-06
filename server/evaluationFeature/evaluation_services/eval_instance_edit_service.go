package evaluationservices

import (
	"context"
	"fmt"

	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (s *EvaluationService) GetInstanceEditDetail(
	ctx context.Context,
	instanceID int64,
	userID int64,
) (*evaluationModels.InstanceEditDetail, error) {

	if instanceID <= 0 {
		return nil, fmt.Errorf("instance_id ไม่ถูกต้อง")
	}

	return s.repo.GetInstanceEditDetail(ctx, instanceID, userID)
}

func (s *EvaluationService) UpdateTargets(
	ctx context.Context,
	instanceID int64,
	userID int64,
	addUserIDs []string,
	removeUserIDs []string,
) (int, error) {

	if instanceID <= 0 {
		return 0, fmt.Errorf("instance_id ไม่ถูกต้อง")
	}

	return s.repo.UpdateTargets(ctx, instanceID, userID, addUserIDs, removeUserIDs)
}

func (s *EvaluationService) UpdateEvaluators(
	ctx context.Context,
	instanceID int64,
	userID int64,
	addUserIDs []string,
	removeUserIDs []string,
	evaluatorSettings []evaluationModels.EvaluatorSettingInput,
) (int, error) {

	if instanceID <= 0 {
		return 0, fmt.Errorf("instance_id ไม่ถูกต้อง")
	}

	return s.repo.UpdateEvaluators(ctx, instanceID, userID, addUserIDs, removeUserIDs, evaluatorSettings)
}

func (s *EvaluationService) GetAuditLogs(
	ctx context.Context,
	instanceID int64,
	limit int,
) ([]evaluationModels.AuditLogEntry, error) {

	if instanceID <= 0 {
		return nil, fmt.Errorf("instance_id ไม่ถูกต้อง")
	}

	return s.repo.GetAuditLogs(ctx, instanceID, limit)
}
