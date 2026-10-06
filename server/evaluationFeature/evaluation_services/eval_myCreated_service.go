package evaluationservices

import (
	"context"
	"fmt"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)
func (s *EvaluationService) StartEvaluationInstance(
	ctx context.Context,
	instanceID int64,
	userID int64,
) error {

	if instanceID <= 0 {
		return fmt.Errorf("instance_id ไม่ถูกต้อง")
	}

	return s.repo.StartEvaluationInstance(
		ctx,
		instanceID,
		userID,
	)
}

func (s *EvaluationService) CloseEvaluationInstance(
	ctx context.Context,
	instanceID int64,
	userID int64,
) error {

	if instanceID <= 0 {
		return fmt.Errorf("instance_id ไม่ถูกต้อง")
	}

	return s.repo.CloseEvaluationInstance(
		ctx,
		instanceID,
		userID,
	)
}

func (s *EvaluationService) GetMyCreatedEvaluations(
	ctx context.Context,
	userID int64,
) ([]evaluationModels.MyCreatedEvaluation, error) {

	return s.repo.GetMyCreatedEvaluations(
		ctx,
		userID,
	)
}

func (s *EvaluationService) GetMyCreatedEvaluationSummary(
	ctx context.Context,
	instanceID int64,
	userID int64,
) (*evaluationModels.MyCreatedEvaluationSummary, error) {

	if instanceID <= 0 {
		return nil, fmt.Errorf("instance_id ไม่ถูกต้อง")
	}

	return s.repo.GetMyCreatedEvaluationSummary(
		ctx,
		instanceID,
		userID,
	)
}