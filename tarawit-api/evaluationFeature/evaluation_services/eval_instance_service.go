package evaluationservices

import (
	"context"

	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (s *EvaluationService) CountByTemplateAndYear(
	templateID int64,
	academicYear int,
) (int, error) {

	return s.repo.CountByTemplateAndYear(
		templateID,
		academicYear,
	)
}

func (s *EvaluationService) CreateInstance(
	ctx context.Context,
	payload evaluationModels.CreateEvaluationInstancePayload,
) (evaluationModels.CreateEvaluationInstanceResponse, error) {

	err := s.repo.CreateInstance(ctx, payload)

	if err != nil {
		return evaluationModels.CreateEvaluationInstanceResponse{
			Success: false,
			Message: "สร้างรอบประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
		}, err
	}

	return evaluationModels.CreateEvaluationInstanceResponse{
		Success:        true,
		Message:        "สร้างรอบประเมินสำเร็จ",
		TargetCount:    len(payload.TargetMemberIDs),
		EvaluatorCount: len(payload.EvaluatorMemberIDs),
	}, nil
}
func (s *EvaluationService) GetInstanceList() ([]evaluationModels.InstanceListResponce,error){
	return s.repo.GetInstanceList()
}
// func (s *EvaluationService) GetAssignmentDetail(userID int64, assignmentID uint64) (*repositories.AssignmentDetail, error) {
// 	// ตรวจสอบสิทธิ์เพิ่มเติมได้ที่นี่
// 	return s.repo.GetAssignmentDetail(userID, assignmentID)
// }