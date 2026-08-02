package evaluationservices

import evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
func (s *EvaluationService) GetEvaluatorAssignmentDetail(
	userId int64,
	assignmentID int64,
) (*evaluationModels.EvaluatorAssignmentDetail, error) {

	return s.repo.GetEvaluatorAssignmentDetail(
		userId,
		assignmentID,
	)
}