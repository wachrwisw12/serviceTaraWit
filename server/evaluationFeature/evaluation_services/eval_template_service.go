package evaluationservices

import (
	"context"
	"fmt"
	"strings"
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

func (s *EvaluationService) CreateTemplate(ctx context.Context, payload evaluationModels.TemplateWritePayload, userID int64) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
	payload.Code = strings.TrimSpace(payload.Code)
	payload.TemplateName = strings.TrimSpace(payload.TemplateName)
	payload.EvaluationTargetID = strings.ToUpper(strings.TrimSpace(payload.EvaluationTargetID))
	payload.TemplateType = strings.ToUpper(strings.TrimSpace(payload.TemplateType))
	if payload.Code == "" || payload.TemplateName == "" || payload.EvaluationTargetID == "" {
		return nil, fmt.Errorf("กรุณากรอกรหัส ชื่อแม่แบบ และกลุ่มเป้าหมาย")
	}
	if payload.TemplateType != "EVALUATION" && payload.TemplateType != "SURVEY" {
		return nil, fmt.Errorf("ประเภทแม่แบบไม่ถูกต้อง")
	}
	if len(payload.Sections) == 0 {
		return nil, fmt.Errorf("ต้องมีอย่างน้อยหนึ่งหมวดคำถาม")
	}
	for _, field := range payload.Fields {
		kind := strings.ToUpper(strings.TrimSpace(field.FieldType))
		if strings.TrimSpace(field.Label) == "" || (kind != "TEXT" && kind != "TEXTAREA" && kind != "NUMBER" && kind != "DATE") {
			return nil, fmt.Errorf("ข้อมูลหัวฟิลด์ไม่ถูกต้อง")
		}
	}
	for _, section := range payload.Sections {
		if strings.TrimSpace(section.Name) == "" || len(section.Questions) == 0 {
			return nil, fmt.Errorf("แต่ละหมวดต้องมีชื่อและคำถามอย่างน้อยหนึ่งข้อ")
		}
		for _, question := range section.Questions {
			kind := strings.ToUpper(strings.TrimSpace(question.QuestionType))
			if strings.TrimSpace(question.Question) == "" || (kind != "SCALE" && kind != "TEXT" && kind != "CHOICE") {
				return nil, fmt.Errorf("ข้อมูลคำถามไม่ถูกต้อง")
			}
			if (kind == "SCALE" || kind == "CHOICE") && len(question.Choices) == 0 {
				return nil, fmt.Errorf("คำถามแบบเลือกตอบต้องมีตัวเลือก")
			}
		}
	}
	return s.repo.CreateTemplate(ctx, payload, userID)
}

// UpdateTemplate — อัปเดตเทมเพลต
func (s *EvaluationService) UpdateTemplate(ctx context.Context, templateID int, payload evaluationModels.TemplateWritePayload, userID int64) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
	payload.Code = strings.TrimSpace(payload.Code)
	payload.TemplateName = strings.TrimSpace(payload.TemplateName)
	payload.EvaluationTargetID = strings.ToUpper(strings.TrimSpace(payload.EvaluationTargetID))
	payload.TemplateType = strings.ToUpper(strings.TrimSpace(payload.TemplateType))

	if payload.Code == "" || payload.TemplateName == "" || payload.EvaluationTargetID == "" {
		return nil, fmt.Errorf("กรุณากรอกรหัส ชื่อแม่แบบ และกลุ่มเป้าหมาย")
	}
	if payload.TemplateType != "EVALUATION" && payload.TemplateType != "SURVEY" {
		return nil, fmt.Errorf("ประเภทแม่แบบไม่ถูกต้อง")
	}
	if len(payload.Sections) == 0 {
		return nil, fmt.Errorf("ต้องมีอย่างน้อยหนึ่งหมวดคำถาม")
	}

	exists, err := s.repo.TemplateExists(ctx, templateID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("ไม่พบแม่แบบที่ต้องการแก้ไข")
	}

	for _, field := range payload.Fields {
		kind := strings.ToUpper(strings.TrimSpace(field.FieldType))
		if strings.TrimSpace(field.Label) == "" || (kind != "TEXT" && kind != "TEXTAREA" && kind != "NUMBER" && kind != "DATE") {
			return nil, fmt.Errorf("ข้อมูลหัวฟิลด์ไม่ถูกต้อง")
		}
	}
	for _, section := range payload.Sections {
		if strings.TrimSpace(section.Name) == "" || len(section.Questions) == 0 {
			return nil, fmt.Errorf("แต่ละหมวดต้องมีชื่อและคำถามอย่างน้อยหนึ่งข้อ")
		}
		for _, question := range section.Questions {
			kind := strings.ToUpper(strings.TrimSpace(question.QuestionType))
			if strings.TrimSpace(question.Question) == "" || (kind != "SCALE" && kind != "TEXT" && kind != "CHOICE") {
				return nil, fmt.Errorf("ข้อมูลคำถามไม่ถูกต้อง")
			}
			if (kind == "SCALE" || kind == "CHOICE") && len(question.Choices) == 0 {
				return nil, fmt.Errorf("คำถามแบบเลือกตอบต้องมีตัวเลือก")
			}
		}
	}

	return s.repo.UpdateTemplate(ctx, templateID, payload, userID)
}

// DeleteTemplate — ลบเทมเพลต
func (s *EvaluationService) DeleteTemplate(ctx context.Context, templateID int) error {
	exists, err := s.repo.TemplateExists(ctx, templateID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("ไม่พบแม่แบบที่ต้องการลบ")
	}

	inUse, err := s.repo.TemplateInUse(ctx, templateID)
	if err != nil {
		return err
	}
	if inUse {
		return fmt.Errorf("ไม่สามารถลบได้ — มีการประเมินใช้แม่แบบนี้อยู่")
	}

	return s.repo.DeleteTemplate(ctx, templateID)
}

// DuplicateTemplate — คัดลอกเทมเพลต
func (s *EvaluationService) DuplicateTemplate(ctx context.Context, sourceID int, userID int64) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
	exists, err := s.repo.TemplateExists(ctx, sourceID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("ไม่พบแม่แบบต้นฉบับ")
	}

	return s.repo.DuplicateTemplate(ctx, sourceID, userID)
}

// UpdateTemplateStatus — เปลี่ยนสถานะเทมเพลต
func (s *EvaluationService) UpdateTemplateStatus(ctx context.Context, templateID int, status string) error {
	status = strings.ToUpper(strings.TrimSpace(status))
	if status != "DRAFT" && status != "ACTIVE" && status != "INACTIVE" {
		return fmt.Errorf("สถานะไม่ถูกต้อง")
	}

	exists, err := s.repo.TemplateExists(ctx, templateID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("ไม่พบแม่แบบที่ต้องการแก้ไข")
	}

	return s.repo.UpdateTemplateStatus(ctx, templateID, status)
}
