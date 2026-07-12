package userservices

import (
	"tarawitApi/models"

	userrepositories "tarawitApi/userFeature/user_repositories"
)

type UserService struct {
	repo *userrepositories.UserRepository
}

func NewUserService(repo *userrepositories.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUserService() ([]models.User, error) {
	return s.repo.GetUser()
}


// func (s *EvaluationService) GetTemplateFullByIDService(id int) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
// 	return s.repo.GetTemplateByID(id)
// }