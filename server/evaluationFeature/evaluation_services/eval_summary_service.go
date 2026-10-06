package evaluationservices

import (
	"context"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (s *EvaluationService) GetEvaluationSummary(
	ctx context.Context,
	userID int64,
	academicYear *int,
) (*evaluationModels.EvaluationSummary, error) {
	return s.repo.GetEvaluationSummary(ctx, userID, academicYear)
}
