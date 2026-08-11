package evaluationservices

import (
	"context"
	"fmt"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)
func (s *EvaluationService) GetEvaluatorAssignmentDetail(
	userId int64,
	assignmentID int64,
) (*evaluationModels.EvaluatorAssignmentDetail, error) {

	return s.repo.GetEvaluatorAssignmentDetail(
		userId,
		assignmentID,
	)
}

func (s *EvaluationService) SubmitEvaluationAnswers(
	ctx context.Context,
	assignmentID int64,
	evaluatorUserID int64,
	req evaluationModels.SubmitEvaluationRequest,
) (*evaluationModels.SubmitEvaluationResponse, error) {

	if assignmentID <= 0 {
		return nil, fmt.Errorf("assignment_id ไม่ถูกต้อง")
	}

	if evaluatorUserID <= 0 {
		return nil, fmt.Errorf("ไม่พบผู้ประเมิน")
	}

	if len(req.Answers) == 0 {
		return nil, fmt.Errorf("ไม่พบคำตอบ")
	}

	// ป้องกัน question ซ้ำใน payload
	seen := make(map[int64]bool)

	for _, answer := range req.Answers {
		if answer.QuestionID <= 0 {
			return nil, fmt.Errorf("question_id ไม่ถูกต้อง")
		}

		if seen[answer.QuestionID] {
			return nil, fmt.Errorf(
				"พบ question_id %d ซ้ำ",
				answer.QuestionID,
			)
		}

		seen[answer.QuestionID] = true
	}

	return s.repo.SubmitEvaluationAnswers(
		ctx,
		assignmentID,
		evaluatorUserID,
		req,
	)
}