package userrepositories

import (
	"context"
	"tarawitApi/db"
	"tarawitApi/models"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
    return &UserRepository{}
}

func (r *UserRepository) GetUser() ([]models.User, error) {
   
	query := `
	SELECT u.id,u.username,u.first_name,u.last_name,pt.name_th AS person_type_name,pt.code AS person_type_code
    FROM users u
    LEFT JOIN person_types pt ON pt.id = u.person_type_id
	`

	rows, err := db.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User

	for rows.Next() {

		var user models.User

		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.FirstName,
			&user.LastName,
			&user.PersonTypeName,
			&user.PersonTypeCode,
			
		)
		if err != nil {
			return nil, err
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

// func (r *UserRepository) GetUserByID(id int) (*models.User, error) {

// 	var result evaluationModels.EvalTemplateFullByIDResponse

// 	query := `
// 	SELECT
// 		id,
// 		code,
// 		template_name,
// 		versions,
// 		status
// 	FROM evaluation_templates
// 	WHERE id=$1
// 	`

// 	err := db.DB.QueryRow(context.Background(), query, id).Scan(
// 		&result.ID,
// 		&result.Code,
// 		&result.TemplateName,
// 		&result.Versions,
// 		&result.Status,
// 	)

// 	if err != nil {
// 		return nil, err
// 	}

// 	// โหลด Sections
// 	sections, err := r.GetSections(id)
// 	if err != nil {
// 		return nil, err
// 	}

// 	result.Sections = sections

// 	return &result, nil
// }
// func (r *EvaluationRepository) GetSections(sectionId int ) ([]evaluationModels.SectionResponses, error) {

// 	query := `
// 	SELECT id,name
// 	FROM evaluation_sections
// 	WHERE template_id=$1
// 	ORDER BY sort_order
// 	`

// 	rows, err := db.DB.Query(context.Background(), query, sectionId)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer rows.Close()

// 	var sections []evaluationModels.SectionResponses

// 	for rows.Next() {

// 		var s evaluationModels.SectionResponses

// 		err := rows.Scan(
// 			&s.SectionID,
// 			&s.Name,
// 		)

// 		if err != nil {
// 			return nil, err
// 		}

// 		questions, err := r.GetQuestions(s.SectionID)
// 		if err != nil {
// 			return nil, err
// 		}

// 		s.Questions = questions

// 		sections = append(sections, s)
// 	}

// 	return sections, nil
// }
// func (r *EvaluationRepository) GetQuestions(sectionID int) ([]evaluationModels.QuestionResponses, error) {

// 	query := `
// 	SELECT
// 		id,
// 		question,
// 		question_type,
// 		sort_order
// 	FROM evaluation_questions
// 	WHERE section_id=$1
// 	ORDER BY sort_order
// 	`

// 	rows, err := db.DB.Query(context.Background(), query, sectionID)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer rows.Close()

// 	var questions []evaluationModels.QuestionResponses

// 	for rows.Next() {

// 		var q evaluationModels.QuestionResponses

// 		err := rows.Scan(
// 			&q.ID,
// 			&q.Question,
// 			&q.QuestionType,
// 			&q.SortOrder,
// 		)

// 		if err != nil {
// 			return nil, err
// 		}


// 		// โหลดตัวเลือกคะแนน
// 		options, err := r.GetQuestionOptions(q.ID)
// 		if err != nil {
// 			return nil, err
// 		}

// 		q.QuestionScore = options


// 		questions = append(questions, q)
// 	}

// 	return questions, nil
// }
// func (r *EvaluationRepository) GetQuestionOptions(questionID int) ([]evaluationModels.QuestionScoreResponses,error){

// 	query := `
// 	SELECT
// 		id,
// 		label,
// 		sort_order
// 	FROM evaluation_question_choices
// 	WHERE question_id=$1
// 	ORDER BY sort_order
// 	`

// 	rows, err := db.DB.Query(
// 		context.Background(),
// 		query,
// 		questionID,
// 	)

// 	if err != nil {
// 		return nil,err
// 	}

// 	defer rows.Close()


// 	var options []evaluationModels.QuestionScoreResponses


// 	for rows.Next(){

// 		var option evaluationModels.QuestionScoreResponses


// 		err := rows.Scan(
// 			&option.ID,
// 			&option.Label,
// 			&option.SortOrder,
// 		)


// 		if err != nil {
// 			return nil,err
// 		}


// 		options = append(options,option)
// 	}


// 	return options,nil
// }