package evaluationservices

import (
	"errors"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (s *EvaluationService) GetMyInstance(userId int64) ([]evaluationModels.InstanceListResponce, error) {
	return s.repo.GetMyInstance(userId)
}

func (s *EvaluationService) GetMyInstanceDetail(userId int64, instanceId int64, targetId *int64) (*evaluationModels.InstanceDetailResponse, error) {
	return s.repo.GetMyInstanceDetail(userId, instanceId, targetId)
}

func (s *EvaluationService) UpdateInstanceFields(
	userID int64,
	instanceID int64,
	fields map[int64]string,
) error {

	if len(fields) == 0 {
		return errors.New("ไม่มีข้อมูล")
	}

	return s.repo.UpdateFields(
		userID,
		instanceID,
		fields,
	)
}
