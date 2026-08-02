package evaluationservices

import (
	"context"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)


func (s *EvaluationService)GetMyTasks(
	ctx context.Context,
	userID int64,
)(
	[]evaluationModels.MyEvaluationTaskResponse,
	error,
){

	return s.repo.GetMyTasks(
		ctx,
		userID,
	)

}

func (s *EvaluationService) GetBatchTargets(
	ctx context.Context,
	batchId string,
	currentUserID int64,
) ([]evaluationModels.BatchTargetResponse, error) {
	return s.repo.GetBatchTargets(ctx, batchId, currentUserID)
}
func (s *EvaluationService) GetAllTasks(
	ctx context.Context,
) ([]evaluationModels.MyEvaluationTaskResponse, error) {
 
	result, err := s.repo.GetAllTasks(ctx)
	if err != nil {
		return nil, err
	}
 
	return result, nil
}