package evaluationservices

import (
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
	evaluationrepositories "tarawitApi/evaluationFeature/evauation_ropositories"
)

type EvaluationService struct {
	repo *evaluationrepositories.EvaluationRepository
}

func NewEvaluationService(repo *evaluationrepositories.EvaluationRepository) *EvaluationService {
	return &EvaluationService{repo: repo}
}

func (s *EvaluationService) GetTemplateService() ([]evaluationModels.EvaTemplateResponse, error) {
	return s.repo.GetTemplate()
}


func (s *EvaluationService) GetTemplateFullByIDService(id int) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
	return s.repo.GetTemplateByID(id)
}

