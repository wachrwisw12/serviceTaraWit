package evaluationRepositories

import (
	"context"
	"fmt"
	"strings"
	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

type EvaluationRepository struct {
}

func NewEvaluationRepository() *EvaluationRepository {
	return &EvaluationRepository{}
}

func (r *EvaluationRepository) GetTemplate() ([]evaluationModels.EvaTemplateResponse, error) {

	query := `
	SELECT
		t.id,
		t.code,
		t.template_name,
		COALESCE(t.description, ''),
		t.evaluation_target_id,
		t.versions,
		t.status,
		t.template_type,
		t.created_by,
		t.created_at,
		(SELECT COUNT(*) FROM evaluation_sections WHERE template_id = t.id) AS section_count,
		(SELECT COUNT(*) FROM evaluation_questions q
		 JOIN evaluation_sections s ON s.id = q.section_id
		 WHERE s.template_id = t.id) AS question_count
	FROM evaluation_templates t
	ORDER BY t.id
	`

	rows, err := db.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []evaluationModels.EvaTemplateResponse

	for rows.Next() {

		var template evaluationModels.EvaTemplateResponse

		err := rows.Scan(
			&template.ID,
			&template.Code,
			&template.TemplateName,
			&template.Description,
			&template.EvaluationTargetID,
			&template.Versions,
			&template.Status,
			&template.TemplateType,
			&template.CreatedBy,
			&template.CreatedAt,
			&template.SectionCount,
			&template.QuestionCount,
		)
		if err != nil {
			return nil, err
		}

		templates = append(templates, template)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return templates, nil
}

func (r *EvaluationRepository) GetTemplateByID(id int) (*evaluationModels.EvalTemplateFullByIDResponse, error) {

	var result evaluationModels.EvalTemplateFullByIDResponse

	query := `
	SELECT
		id,
		code,
		template_name,
		COALESCE(description, ''),
		template_type,
		versions,
		status
	FROM evaluation_templates
	WHERE id=$1
	`

	err := db.DB.QueryRow(context.Background(), query, id).Scan(
		&result.ID,
		&result.Code,
		&result.TemplateName,
		&result.Description,
		&result.TemplateType,
		&result.Versions,
		&result.Status,
	)

	if err != nil {
		return nil, err
	}

	// โหลด Sections
	fields, err := r.GetTemplateFields(id)
	if err != nil {
		return nil, err
	}
	result.Fields = fields

	// โหลด Sections
	sections, err := r.GetSections(id)
	if err != nil {
		return nil, err
	}

	result.Sections = sections

	return &result, nil
}

func (r *EvaluationRepository) GetTemplateFields(templateID int) ([]evaluationModels.TemplateFieldResponse, error) {
	rows, err := db.DB.Query(context.Background(), `
		SELECT id, label, field_type, COALESCE(placeholder, ''), required, sort_order
		FROM evaluation_template_fields
		WHERE template_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order`, templateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	fields := make([]evaluationModels.TemplateFieldResponse, 0)
	for rows.Next() {
		var field evaluationModels.TemplateFieldResponse
		if err := rows.Scan(&field.ID, &field.Label, &field.FieldType, &field.Placeholder, &field.Required, &field.SortOrder); err != nil {
			return nil, err
		}
		fields = append(fields, field)
	}
	return fields, rows.Err()
}
func (r *EvaluationRepository) GetSections(sectionId int) ([]evaluationModels.SectionResponses, error) {

	query := `
	SELECT id,name
	FROM evaluation_sections
	WHERE template_id=$1
	ORDER BY sort_order
	`

	rows, err := db.DB.Query(context.Background(), query, sectionId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sections []evaluationModels.SectionResponses

	for rows.Next() {

		var s evaluationModels.SectionResponses

		err := rows.Scan(
			&s.SectionID,
			&s.Name,
		)

		if err != nil {
			return nil, err
		}

		questions, err := r.GetQuestions(s.SectionID)
		if err != nil {
			return nil, err
		}

		s.Questions = questions

		sections = append(sections, s)
	}

	return sections, nil
}
func (r *EvaluationRepository) GetQuestions(sectionID int) ([]evaluationModels.QuestionResponses, error) {

	query := `
	SELECT
		id,
		question,
		question_type,
		sort_order
	FROM evaluation_questions
	WHERE section_id=$1
	ORDER BY sort_order
	`

	rows, err := db.DB.Query(context.Background(), query, sectionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []evaluationModels.QuestionResponses

	for rows.Next() {

		var q evaluationModels.QuestionResponses

		err := rows.Scan(
			&q.ID,
			&q.Question,
			&q.QuestionType,
			&q.SortOrder,
		)

		if err != nil {
			return nil, err
		}

		// โหลดตัวเลือกคะแนน
		options, err := r.GetQuestionOptions(q.ID)
		if err != nil {
			return nil, err
		}

		q.QuestionScore = options

		questions = append(questions, q)
	}

	return questions, nil
}
func (r *EvaluationRepository) GetQuestionOptions(questionID int) ([]evaluationModels.QuestionScoreResponses, error) {

	query := `
	SELECT
		id,
		label,
		sort_order
	FROM evaluation_question_choices
	WHERE question_id=$1
	ORDER BY sort_order
	`

	rows, err := db.DB.Query(
		context.Background(),
		query,
		questionID,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var options []evaluationModels.QuestionScoreResponses

	for rows.Next() {

		var option evaluationModels.QuestionScoreResponses

		err := rows.Scan(
			&option.ID,
			&option.Label,
			&option.SortOrder,
		)

		if err != nil {
			return nil, err
		}

		options = append(options, option)
	}

	return options, nil
}

func (r *EvaluationRepository) CreateTemplate(ctx context.Context, payload evaluationModels.TemplateWritePayload, userID int64) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("เริ่มบันทึกแม่แบบไม่สำเร็จ: %w", err)
	}
	defer tx.Rollback(context.Background()) //nolint:errcheck

	var templateID int
	err = tx.QueryRow(ctx, `
		INSERT INTO evaluation_templates (code, template_name, description, evaluation_target_id, status, created_by, owner_id, template_type)
		VALUES ($1, $2, $3, $4, 'DRAFT', $5, $5, $6)
		RETURNING id`, payload.Code, payload.TemplateName, strings.TrimSpace(payload.Description), payload.EvaluationTargetID, userID, payload.TemplateType).Scan(&templateID)
	if err != nil {
		return nil, fmt.Errorf("บันทึกแม่แบบไม่สำเร็จ: %w", err)
	}

	for fieldIndex, field := range payload.Fields {
		_, err = tx.Exec(ctx, `
			INSERT INTO evaluation_template_fields (template_id, field_key, label, field_type, placeholder, required, sort_order, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			templateID, fmt.Sprintf("field_%d", fieldIndex+1), strings.TrimSpace(field.Label), strings.ToUpper(strings.TrimSpace(field.FieldType)), strings.TrimSpace(field.Placeholder), field.Required, fieldIndex+1, userID)
		if err != nil {
			return nil, fmt.Errorf("บันทึกหัวฟิลด์ไม่สำเร็จ: %w", err)
		}
	}

	for sectionIndex, section := range payload.Sections {
		var sectionID int
		err = tx.QueryRow(ctx, `INSERT INTO evaluation_sections (template_id, name, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`, templateID, strings.TrimSpace(section.Name), strings.TrimSpace(section.Description), sectionIndex+1).Scan(&sectionID)
		if err != nil {
			return nil, fmt.Errorf("บันทึกหมวดคำถามไม่สำเร็จ: %w", err)
		}
		for questionIndex, question := range section.Questions {
			var questionID int
			kind := strings.ToUpper(strings.TrimSpace(question.QuestionType))
			err = tx.QueryRow(ctx, `INSERT INTO evaluation_questions (section_id, question, question_type, required, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id`, sectionID, strings.TrimSpace(question.Question), kind, question.Required, questionIndex+1).Scan(&questionID)
			if err != nil {
				return nil, fmt.Errorf("บันทึกคำถามไม่สำเร็จ: %w", err)
			}
			for choiceIndex, choice := range question.Choices {
				if strings.TrimSpace(choice.Label) == "" {
					return nil, fmt.Errorf("ตัวเลือกคำตอบต้องมีชื่อ")
				}
				_, err = tx.Exec(ctx, `INSERT INTO evaluation_question_choices (question_id, label, score, sort_order) VALUES ($1, $2, $3, $4)`, questionID, strings.TrimSpace(choice.Label), choice.Score, choiceIndex+1)
				if err != nil {
					return nil, fmt.Errorf("บันทึกตัวเลือกไม่สำเร็จ: %w", err)
				}
			}
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("ยืนยันการบันทึกแม่แบบไม่สำเร็จ: %w", err)
	}
	return r.GetTemplateByID(templateID)
}

// UpdateTemplate — อัปเดตข้อมูลเทมเพลต (ลบของเก่า แล้วใส่ใหม่)
func (r *EvaluationRepository) UpdateTemplate(ctx context.Context, templateID int, payload evaluationModels.TemplateWritePayload, userID int64) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("เริ่มอัปเดตแม่แบบไม่สำเร็จ: %w", err)
	}
	defer tx.Rollback(context.Background())

	// อัปเดตข้อมูลหลัก
	_, err = tx.Exec(ctx, `
		UPDATE evaluation_templates
		SET code = $2, template_name = $3, description = $4,
		    evaluation_target_id = $5, template_type = $6,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`,
		templateID, payload.Code, payload.TemplateName,
		strings.TrimSpace(payload.Description),
		payload.EvaluationTargetID, payload.TemplateType)
	if err != nil {
		return nil, fmt.Errorf("อัปเดตแม่แบบไม่สำเร็จ: %w", err)
	}

	// ลบฟิลด์เดิม
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_template_fields WHERE template_id = $1`, templateID)
	if err != nil {
		return nil, fmt.Errorf("ลบฟิลด์เดิมไม่สำเร็จ: %w", err)
	}

	// ลบคำถามเดิม (cascade ผ่าน choices)
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_question_choices WHERE question_id IN (SELECT id FROM evaluation_questions WHERE section_id IN (SELECT id FROM evaluation_sections WHERE template_id = $1))`, templateID)
	if err != nil {
		return nil, fmt.Errorf("ลบตัวเลือกเดิมไม่สำเร็จ: %w", err)
	}
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_questions WHERE section_id IN (SELECT id FROM evaluation_sections WHERE template_id = $1)`, templateID)
	if err != nil {
		return nil, fmt.Errorf("ลบคำถามเดิมไม่สำเร็จ: %w", err)
	}
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_sections WHERE template_id = $1`, templateID)
	if err != nil {
		return nil, fmt.Errorf("ลบหมวดเดิมไม่สำเร็จ: %w", err)
	}

	// ใส่ฟิลด์ใหม่
	for fieldIndex, field := range payload.Fields {
		_, err = tx.Exec(ctx, `
			INSERT INTO evaluation_template_fields (template_id, field_key, label, field_type, placeholder, required, sort_order, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			templateID, fmt.Sprintf("field_%d", fieldIndex+1), strings.TrimSpace(field.Label), strings.ToUpper(strings.TrimSpace(field.FieldType)), strings.TrimSpace(field.Placeholder), field.Required, fieldIndex+1, userID)
		if err != nil {
			return nil, fmt.Errorf("บันทึกหัวฟิลด์ไม่สำเร็จ: %w", err)
		}
	}

	// ใส่หมวดคำถามใหม่
	for sectionIndex, section := range payload.Sections {
		var sectionID int
		err = tx.QueryRow(ctx, `INSERT INTO evaluation_sections (template_id, name, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`, templateID, strings.TrimSpace(section.Name), strings.TrimSpace(section.Description), sectionIndex+1).Scan(&sectionID)
		if err != nil {
			return nil, fmt.Errorf("บันทึกหมวดคำถามไม่สำเร็จ: %w", err)
		}
		for questionIndex, question := range section.Questions {
			var questionID int
			kind := strings.ToUpper(strings.TrimSpace(question.QuestionType))
			err = tx.QueryRow(ctx, `INSERT INTO evaluation_questions (section_id, question, question_type, required, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id`, sectionID, strings.TrimSpace(question.Question), kind, question.Required, questionIndex+1).Scan(&questionID)
			if err != nil {
				return nil, fmt.Errorf("บันทึกคำถามไม่สำเร็จ: %w", err)
			}
			for choiceIndex, choice := range question.Choices {
				if strings.TrimSpace(choice.Label) == "" {
					continue
				}
				_, err = tx.Exec(ctx, `INSERT INTO evaluation_question_choices (question_id, label, score, sort_order) VALUES ($1, $2, $3, $4)`, questionID, strings.TrimSpace(choice.Label), choice.Score, choiceIndex+1)
				if err != nil {
					return nil, fmt.Errorf("บันทึกตัวเลือกไม่สำเร็จ: %w", err)
				}
			}
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("ยืนยันการอัปเดตแม่แบบไม่สำเร็จ: %w", err)
	}

	return r.GetTemplateByID(templateID)
}

// DeleteTemplate — ลบเทมเพลต (hard delete)
func (r *EvaluationRepository) DeleteTemplate(ctx context.Context, templateID int) error {
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("เริ่มลบแม่แบบไม่สำเร็จ: %w", err)
	}
	defer tx.Rollback(context.Background())

	// ลบ choices
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_question_choices WHERE question_id IN (SELECT id FROM evaluation_questions WHERE section_id IN (SELECT id FROM evaluation_sections WHERE template_id = $1))`, templateID)
	if err != nil {
		return fmt.Errorf("ลบตัวเลือกไม่สำเร็จ: %w", err)
	}

	// ลบ questions
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_questions WHERE section_id IN (SELECT id FROM evaluation_sections WHERE template_id = $1)`, templateID)
	if err != nil {
		return fmt.Errorf("ลบคำถามไม่สำเร็จ: %w", err)
	}

	// ลบ sections
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_sections WHERE template_id = $1`, templateID)
	if err != nil {
		return fmt.Errorf("ลบหมวดไม่สำเร็จ: %w", err)
	}

	// ลบ fields
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_template_fields WHERE template_id = $1`, templateID)
	if err != nil {
		return fmt.Errorf("ลบฟิลด์ไม่สำเร็จ: %w", err)
	}

	// ลบ template
	_, err = tx.Exec(ctx, `DELETE FROM evaluation_templates WHERE id = $1`, templateID)
	if err != nil {
		return fmt.Errorf("ลบแม่แบบไม่สำเร็จ: %w", err)
	}

	return tx.Commit(ctx)
}

// DuplicateTemplate — คัดลอกเทมเพลตเป็นฉบับร่างใหม่
func (r *EvaluationRepository) DuplicateTemplate(ctx context.Context, sourceID int, userID int64) (*evaluationModels.EvalTemplateFullByIDResponse, error) {
	// ดึงข้อมูลเทมเพลตต้นฉบับ
	source, err := r.GetTemplateByID(sourceID)
	if err != nil {
		return nil, fmt.Errorf("ไม่พบแม่แบบต้นฉบับ: %w", err)
	}

	// ดึง fields
	sourceFields, err := r.GetTemplateFields(sourceID)
	if err != nil {
		return nil, err
	}

	// แปลงเป็น payload
	payload := evaluationModels.TemplateWritePayload{
		Code:               source.Code + "-COPY",
		TemplateName:       source.TemplateName + " (สำเนา)",
		Description:        "",
		EvaluationTargetID: source.EvaluationTargetID,
		TemplateType:       source.TemplateType,
		Fields:             make([]evaluationModels.TemplateFieldInput, 0, len(sourceFields)),
		Sections:           make([]evaluationModels.TemplateSectionInput, 0, len(source.Sections)),
	}

	for _, f := range sourceFields {
		payload.Fields = append(payload.Fields, evaluationModels.TemplateFieldInput{
			Label:       f.Label,
			FieldType:   f.FieldType,
			Placeholder: f.Placeholder,
			Required:    f.Required,
		})
	}

	for _, sec := range source.Sections {
		secInput := evaluationModels.TemplateSectionInput{
			Name:        sec.Name,
			Description: "",
			Questions:   make([]evaluationModels.TemplateQuestionInput, 0, len(sec.Questions)),
		}
		for _, q := range sec.Questions {
			qInput := evaluationModels.TemplateQuestionInput{
				Question:     q.Question,
				QuestionType: q.QuestionType,
				Required:     true,
				Choices:      make([]evaluationModels.TemplateChoiceInput, 0, len(q.QuestionScore)),
			}
			for _, sc := range q.QuestionScore {
				qInput.Choices = append(qInput.Choices, evaluationModels.TemplateChoiceInput{
					Label: sc.Label,
				})
			}
			secInput.Questions = append(secInput.Questions, qInput)
		}
		payload.Sections = append(payload.Sections, secInput)
	}

	return r.CreateTemplate(ctx, payload, userID)
}

// UpdateTemplateStatus — เปลี่ยนสถานะเทมเพลต
func (r *EvaluationRepository) UpdateTemplateStatus(ctx context.Context, templateID int, status string) error {
	_, err := db.DB.Exec(ctx,
		`UPDATE evaluation_templates SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
		templateID, status,
	)
	return err
}

// TemplateExists — เช็คว่าเทมเพลตมีอยู่จริง
func (r *EvaluationRepository) TemplateExists(ctx context.Context, templateID int) (bool, error) {
	var exists bool
	err := db.DB.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM evaluation_templates WHERE id = $1)`,
		templateID,
	).Scan(&exists)
	return exists, err
}

// TemplateInUse — เทมเพลตถูกใช้สร้าง instance แล้วหรือยัง
func (r *EvaluationRepository) TemplateInUse(ctx context.Context, templateID int) (bool, error) {
	var inUse bool
	err := db.DB.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM evaluation_instances WHERE template_id = $1)`,
		templateID,
	).Scan(&inUse)
	return inUse, err
}
