package iqaservices

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"

	iqamodels "tarawitApi/iqaFeature/iqa_models"
	iqarepos "tarawitApi/iqaFeature/iqa_repositories"
)

type IQAService struct {
	repo *iqarepos.IQARepository
}

func NewIQAService() *IQAService {
	return &IQAService{repo: iqarepos.NewIQARepository()}
}

// ═══════════════ Read-only ═══════════════

func (s *IQAService) GetFullTree(ctx context.Context) ([]iqamodels.StandardTree, error) {
	return s.repo.GetFullTree(ctx)
}

func (s *IQAService) ListQualityLevels(ctx context.Context) ([]iqamodels.QualityLevel, error) {
	return s.repo.ListQualityLevels(ctx)
}

// ═══════════════ Cycles ═══════════════

func (s *IQAService) ListCycles(ctx context.Context) ([]iqamodels.AssessmentCycle, error) {
	return s.repo.ListCycles(ctx)
}

func (s *IQAService) CreateCycle(ctx context.Context, req iqamodels.CreateCycleRequest, userID int64) (int64, error) {
	if req.AcademicYear == 0 {
		return 0, fmt.Errorf("กรุณาระบุปีการศึกษา")
	}
	if req.Name == "" {
		req.Name = fmt.Sprintf("รอบการประเมิน ป.ม. %d", req.AcademicYear)
	}
	return s.repo.CreateCycle(ctx, req, userID)
}

func (s *IQAService) UpdateCycleStatus(ctx context.Context, cycleID int64, status string) error {
	valid := map[string]bool{"DRAFT": true, "IN_PROGRESS": true, "COMPLETED": true}
	if !valid[status] {
		return fmt.Errorf("สถานะไม่ถูกต้อง")
	}
	return s.repo.UpdateCycleStatus(ctx, cycleID, status)
}

// ═══════════════ Assessments ═══════════════

func (s *IQAService) ListAssessmentsByCycle(ctx context.Context, cycleID int64) ([]iqamodels.Assessment, error) {
	return s.repo.ListAssessmentsByCycle(ctx, cycleID)
}

func (s *IQAService) GetOrCreateAssessment(ctx context.Context, cycleID, assessorID int64) (*iqamodels.Assessment, error) {
	return s.repo.GetOrCreateAssessment(ctx, cycleID, assessorID)
}

func (s *IQAService) GetAssessmentDetail(ctx context.Context, assessmentID int64) (*iqamodels.Assessment, []iqamodels.AssessmentScore, []iqamodels.Evidence, error) {
	a, err := s.repo.GetAssessment(ctx, assessmentID)
	if err != nil {
		return nil, nil, nil, err
	}
	scores, err := s.repo.GetScores(ctx, assessmentID)
	if err != nil {
		return nil, nil, nil, err
	}
	evidence, err := s.repo.ListEvidence(ctx, assessmentID)
	if err != nil {
		return nil, nil, nil, err
	}
	return a, scores, evidence, nil
}

func (s *IQAService) SaveScores(ctx context.Context, assessmentID int64, req iqamodels.SubmitScoresRequest) error {
	a, err := s.repo.GetAssessment(ctx, assessmentID)
	if err != nil {
		return err
	}
	if a.Status == "SUBMITTED" {
		return fmt.Errorf("ส่งผลการประเมินแล้ว ไม่สามารถแก้ไขได้")
	}

	if err := s.repo.UpsertScores(ctx, assessmentID, req.Scores); err != nil {
		return err
	}
	return s.repo.CalculateAssessmentTotals(ctx, assessmentID)
}

func (s *IQAService) SubmitAssessment(ctx context.Context, assessmentID int64) error {
	a, err := s.repo.GetAssessment(ctx, assessmentID)
	if err != nil {
		return err
	}
	if a.Status == "SUBMITTED" {
		return fmt.Errorf("ส่งผลการประเมินแล้ว")
	}

	// ต้องมีคะแนนอย่างน้อย 1 ข้อ
	scores, err := s.repo.GetScores(ctx, assessmentID)
	if err != nil {
		return err
	}
	if len(scores) == 0 {
		return fmt.Errorf("กรุณาให้คะแนนอย่างน้อย 1 ตัวชี้วัด")
	}

	if err := s.repo.SubmitAssessment(ctx, assessmentID); err != nil {
		return err
	}

	// คำนวณ summary ของโรงเรียน
	_ = s.repo.RecalculateSchoolSummary(ctx, a.CycleID)
	return nil
}

// ═══════════════ Evidence ═══════════════

func (s *IQAService) UploadEvidence(ctx context.Context, assessmentID int64, indicatorID *int64, description string, userID int64, file *multipart.FileHeader) (*iqamodels.Evidence, error) {
	a, err := s.repo.GetAssessment(ctx, assessmentID)
	if err != nil {
		return nil, err
	}
	if a.Status == "SUBMITTED" {
		return nil, fmt.Errorf("ส่งผลการประเมินแล้ว ไม่สามารถเพิ่มหลักฐานได้")
	}

	// upload file
	ext := ""
	if file != nil {
		saveDir := fmt.Sprintf("./storage/iqa/assessments/%d", assessmentID)
		_ = os.MkdirAll(saveDir, 0755)
		ext = fmt.Sprintf("%s/%s", saveDir, file.Filename)

		src, err := file.Open()
		if err != nil {
			return nil, err
		}
		defer src.Close()

		dst, err := os.Create(ext)
		if err != nil {
			return nil, err
		}
		defer dst.Close()
		io.Copy(dst, src)
	}

	e := &iqamodels.Evidence{
		AssessmentID: assessmentID,
		IndicatorID:  indicatorID,
		FileName:     file.Filename,
		StoredName:   ext,
		FilePath:     ext,
		FileSize:     file.Size,
		MimeType:     file.Header.Get("Content-Type"),
		Description:  description,
		UploadedBy:   &userID,
	}

	if err := s.repo.CreateEvidence(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *IQAService) DeleteEvidence(ctx context.Context, assessmentID, evidenceID int64) error {
	a, err := s.repo.GetAssessment(ctx, assessmentID)
	if err != nil {
		return err
	}
	if a.Status == "SUBMITTED" {
		return fmt.Errorf("ส่งผลการประเมินแล้ว ไม่สามารถลบหลักฐานได้")
	}

	filePath, err := s.repo.DeleteEvidence(ctx, evidenceID)
	if err != nil {
		return err
	}

	// ลบไฟล์ (best effort)
	os.Remove(filePath)

	return nil
}

// ═══════════════ Summary ═══════════════

func (s *IQAService) GetSchoolSummary(ctx context.Context, cycleID int64) ([]iqamodels.SchoolSummary, error) {
	return s.repo.GetSchoolSummary(ctx, cycleID)
}
