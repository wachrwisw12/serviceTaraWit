package evaluationRepositories

import (
	"context"
	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

type EvaluationRepository struct{}

func NewEvaluationRepository() *EvaluationRepository {
    return &EvaluationRepository{}
}

func (r *EvaluationRepository) GetTemplate() ([]evaluationModels.EvaTemplateResponse, error) {

	query := `
	SELECT
		id,
		code,
		template_name,
		description,
		evaluation_target_id,
		versions,
		status,
		created_by,
		created_at
	FROM evaluation_templates
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
			&template.CreatedBy,
			&template.CreatedAt,
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
		versions,
		status
	FROM evaluation_templates
	WHERE id=$1
	`

	err := db.DB.QueryRow(context.Background(), query, id).Scan(
		&result.ID,
		&result.Code,
		&result.TemplateName,
		&result.Versions,
		&result.Status,
	)

	if err != nil {
		return nil, err
	}

	// โหลด Sections
	sections, err := r.GetSections(id)
	if err != nil {
		return nil, err
	}

	result.Sections = sections

	return &result, nil
}
func (r *EvaluationRepository) GetSections(sectionId int ) ([]evaluationModels.SectionResponses, error) {

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
func (r *EvaluationRepository) GetQuestionOptions(questionID int) ([]evaluationModels.QuestionScoreResponses,error){

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
		return nil,err
	}

	defer rows.Close()


	var options []evaluationModels.QuestionScoreResponses


	for rows.Next(){

		var option evaluationModels.QuestionScoreResponses


		err := rows.Scan(
			&option.ID,
			&option.Label,
			&option.SortOrder,
		)


		if err != nil {
			return nil,err
		}


		options = append(options,option)
	}


	return options,nil
}