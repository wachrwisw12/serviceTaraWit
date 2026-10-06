// internal/repository/evaluation_instance_repo.go
package evaluationRepositories

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)

func (r *EvaluationRepository) CountByTemplateAndYear(
	templateID int64, academicYear int,
) (int, error) {
	query := `SELECT COUNT(*) FROM evaluation_instances WHERE template_id = $1 AND academic_year = $2 AND deleted_at IS NULL`
	var count int
	err := db.DB.QueryRow(context.Background(), query, templateID, academicYear).Scan(&count)
	return count, err
}

func (r *EvaluationRepository) GetInstanceList() ([]evaluationModels.InstanceListResponce, error) {

	instanceQuery := `
	SELECT
		ei.id,
		ei.template_name,
		ei.template_id,
		COALESCE(ei.template_type, 'EVALUATION'),
		ei.status,
		ei.start_date,
		ei.end_date,
		ei.created_by,
		ei.updated_at,
		ei.academic_year,
		ei.round,

		COALESCE(
			(
				SELECT json_agg(
					json_build_object(
						'user_id', eie.user_id,
						'name_snapshort', eie.name_snapshot,
						'position_snapshort', eie.position_snapshot
					)
					ORDER BY eie.id
				)
				FROM evaluation_instance_evaluators eie
				WHERE eie.instance_id = ei.id
			),
			'[]'::json
		) AS evaluators

	FROM evaluation_instances ei
	ORDER BY ei.id DESC;
	`

	rows, err := db.DB.Query(context.Background(), instanceQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var instanceList []evaluationModels.InstanceListResponce

	for rows.Next() {

		var instance evaluationModels.InstanceListResponce
		var evaluatorJSON []byte

		err = rows.Scan(
			&instance.ID,
			&instance.TemplateName,
			&instance.TemplateId,
			&instance.TemplateType,
			&instance.Status,
			&instance.StartDate,
			&instance.EndDate,
			&instance.CreatedBy,
			&instance.UpdatedAt,
			&instance.AcademicYear,
			&instance.Round,
			&evaluatorJSON,
		)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(evaluatorJSON, &instance.Evaluators); err != nil {
			return nil, err
		}

		instanceList = append(instanceList, instance)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return instanceList, nil
}
func (r *EvaluationRepository) CreateInstance(
	ctx context.Context,
	payload evaluationModels.CreateEvaluationInstancePayload,
) (err error) {

	// ป้องกัน transaction ค้าง — 60 วินาทีพอสำหรับ instance ขนาดใหญ่
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			tx.Rollback(context.Background())
		}
	}()

	// =====================================
	// 1. Get Template Snapshot
	// =====================================

	var (
		templateName string
		templateType string
	)

	templateQuery := `
		SELECT template_name, COALESCE(template_type, 'EVALUATION')
		FROM evaluation_templates
		WHERE id = $1
		AND deleted_at IS NULL
	`

	err = tx.QueryRow(
		ctx,
		templateQuery,
		payload.TemplateID,
	).Scan(&templateName, &templateType)

	if err != nil {
		return err
	}

	// ประเภทของ instance — รับจาก payload แต่ถ้าไม่ส่ง/ไม่รู้จัก ให้ยึดจากแม่แบบ
	instanceType := strings.ToUpper(strings.TrimSpace(payload.TemplateType))
	if instanceType != "SURVEY" && instanceType != "EVALUATION" {
		instanceType = strings.ToUpper(strings.TrimSpace(templateType))
	}
	if instanceType != "SURVEY" {
		instanceType = "EVALUATION"
	}
	templateType = instanceType

	// =====================================
	// 2. Create Evaluation Instance
	// =====================================

	var instanceID int64

	instanceQuery := `
		INSERT INTO evaluation_instances
		(   
			template_id,
			template_name,
			template_type,
			academic_year,
			round,
			show_score_to_visibility,
			created_by,
			batch_id,
			instance_name,
			status
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'DRAFT')
		RETURNING id
	`

	err = tx.QueryRow(
		ctx,
		instanceQuery,
		payload.TemplateID,
		templateName,
		templateType,
		payload.AcademicYear,
		payload.Round,
		payload.ShowScoreToVisibility,
		payload.CreateBy,
		payload.BatchID,
		payload.InstanceName,
	).Scan(&instanceID)

	if err != nil {
		return err
	}

	// =====================================
	// 3. Copy Questions Snapshot (+ choices)
	// =====================================

	// ── 3. Copy Questions Snapshot (+ choices) ── batch ─────────

	type questionSnapshot struct {
		oldID        int64
		sectionID    int64
		questionText string
		questionType string
		sortOrder    int
		maxScore     float64
	}

	var questions []questionSnapshot

	// 3a. ดึงคำถามทั้งหมด
	questionRows, err := tx.Query(ctx, `
		SELECT q.id, q.section_id, q.question, q.question_type, q.sort_order
		FROM evaluation_questions q
		JOIN evaluation_sections s ON s.id = q.section_id
		WHERE s.template_id = $1 AND q.deleted_at IS NULL
		ORDER BY q.sort_order
	`, payload.TemplateID)
	if err != nil {
		return err
	}
	for questionRows.Next() {
		var q questionSnapshot
		if err = questionRows.Scan(&q.oldID, &q.sectionID, &q.questionText, &q.questionType, &q.sortOrder); err != nil {
			questionRows.Close()
			return err
		}
		questions = append(questions, q)
	}
	if err = questionRows.Err(); err != nil {
		questionRows.Close()
		return err
	}
	questionRows.Close()

	if len(questions) > 0 {
		// 3b. ดึง max_score ทั้งหมดใน query เดียว
		oldIDs := make([]int64, len(questions))
		for i, q := range questions {
			oldIDs[i] = q.oldID
		}
		maxScoreRows, err := tx.Query(ctx, `
			SELECT question_id, COALESCE(MAX(score), 0)
			FROM evaluation_question_choices
			WHERE question_id = ANY($1) AND deleted_at IS NULL
			GROUP BY question_id
		`, oldIDs)
		if err != nil {
			return err
		}
		maxScoreMap := make(map[int64]float64)
		for maxScoreRows.Next() {
			var qid int64
			var ms float64
			if err = maxScoreRows.Scan(&qid, &ms); err != nil {
				maxScoreRows.Close()
				return err
			}
			maxScoreMap[qid] = ms
		}
		maxScoreRows.Close()

		for i := range questions {
			questions[i].maxScore = maxScoreMap[questions[i].oldID]
		}

		// 3c. Insert คำถามทั้งหมดใน query เดียว — RETURNING id, oldID
		valStrs := make([]string, len(questions))
		args := make([]interface{}, 0, len(questions)*6)
		for i, q := range questions {
			off := i * 6
			args = append(args, instanceID, q.sectionID, q.questionText, q.questionType, q.maxScore, q.sortOrder)
			valStrs[i] = fmt.Sprintf("($%d,$%d,$%d,$%d,$%d,$%d)", off+1, off+2, off+3, off+4, off+5, off+6)
		}
		batchQ := fmt.Sprintf(
			`INSERT INTO evaluation_instance_questions
			 (evaluation_instance_id, section_id, question_text, question_type, max_score, sort_order)
			 VALUES %s RETURNING id`,
			strings.Join(valStrs, ","),
		)
		qRows, err := tx.Query(ctx, batchQ, args...)
		if err != nil {
			return err
		}
		newIDs := make([]int64, 0, len(questions))
		for qRows.Next() {
			var nid int64
			if err = qRows.Scan(&nid); err != nil {
				qRows.Close()
				return err
			}
			newIDs = append(newIDs, nid)
		}
		qRows.Close()

		// 3d. Copy choices ทั้งหมด — INSERT ... SELECT จาก old question
		for i, q := range questions {
			if i < len(newIDs) {
				_, err = tx.Exec(ctx, `
					INSERT INTO evaluation_instance_question_choices
					  (evaluation_instance_question_id, label, score, sort_order)
					SELECT $1, label, score, sort_order
					FROM evaluation_question_choices
					WHERE question_id = $2 AND deleted_at IS NULL
				`, newIDs[i], q.oldID)
				if err != nil {
					return err
				}
			}
		}
	}

	// =====================================
	// 4. Insert Target Members
	// =====================================

	targetIDMap := make(map[string]int64) // user_id (string) -> evaluation_targets.id

	if len(payload.TargetMemberIDs) > 0 {
		tValStrs := make([]string, len(payload.TargetMemberIDs))
		tArgs := make([]interface{}, 0, len(payload.TargetMemberIDs)*2)
		for i, memberID := range payload.TargetMemberIDs {
			off := i * 2
			tArgs = append(tArgs, instanceID, memberID)
			tValStrs[i] = fmt.Sprintf("($%d,$%d)", off+1, off+2)
		}
		tBatch := fmt.Sprintf(
			`INSERT INTO evaluation_targets (instance_id, user_id) VALUES %s RETURNING id, user_id`,
			strings.Join(tValStrs, ","),
		)
		tRows, err := tx.Query(ctx, tBatch, tArgs...)
		if err != nil {
			return err
		}
		for tRows.Next() {
			var rowID int64
			var userID string
			if err = tRows.Scan(&rowID, &userID); err != nil {
				tRows.Close()
				return err
			}
			targetIDMap[userID] = rowID
		}
		tRows.Close()
	}
	// =====================================
	// 4.5 Copy Template Fields per Target
	// =====================================

	copyFieldsQuery := `
INSERT INTO evaluation_instance_fields
(
    instance_id,
    target_id,
    template_field_id,
    field_key,
    label,
    field_type,
    placeholder,
    value,
    required,
    sort_order
)
SELECT
    $1,
    $2,
    id,
    field_key,
    label,
    field_type,
    placeholder,
    NULL,
    required,
    sort_order
FROM evaluation_template_fields
WHERE template_id=$3
AND deleted_at IS NULL
ORDER BY sort_order;
`

	for _, targetID := range targetIDMap {

		_, err = tx.Exec(
			ctx,
			copyFieldsQuery,
			instanceID,
			targetID,
			payload.TemplateID,
		)

		if err != nil {
			return err
		}
	} // =====================================
	// 5. Insert Evaluators (เฉพาะแบบประเมิน — แบบสอบถามไม่มีผู้ประเมินแยก)
	// =====================================
	// join users + positions เพื่อ snapshot ชื่อ-ตำแหน่งจริง ณ ตอนสร้าง instance
	// ใช้ COALESCE กันกรณี position_id เป็น NULL หรือหา position ไม่เจอ

	if templateType != "SURVEY" && len(payload.EvaluatorMemberIDs) > 0 {
		settingsByUser := make(map[string]evaluationModels.EvaluatorSettingInput, len(payload.EvaluatorSettings))
		for _, setting := range payload.EvaluatorSettings {
			settingsByUser[setting.UserID] = setting
		}
		eValStrs := make([]string, len(payload.EvaluatorMemberIDs))
		eArgs := make([]interface{}, 0, len(payload.EvaluatorMemberIDs)*6)
		for i, evaluatorID := range payload.EvaluatorMemberIDs {
			setting, ok := settingsByUser[evaluatorID]
			if !ok {
				setting = evaluationModels.EvaluatorSettingInput{UserID: evaluatorID, CanScore: true, RequiresSignature: true, SignatureOrder: i + 1, SignatureRole: "ผู้ประเมิน"}
			}
			if setting.SignatureOrder <= 0 {
				setting.SignatureOrder = i + 1
			}
			if setting.SignatureRole == "" {
				setting.SignatureRole = "ผู้ประเมิน"
			}
			off := i * 6
			eArgs = append(eArgs, instanceID, evaluatorID, setting.CanScore, setting.RequiresSignature, setting.SignatureOrder, setting.SignatureRole)
			eValStrs[i] = fmt.Sprintf(
				`($%d,$%d, (SELECT CONCAT(px.name_th,u.first_name,' ',u.last_name) FROM users u LEFT JOIN prefixes px ON px.id = u.prefix_id WHERE u.id=$%d), (SELECT COALESCE(p.name_th,'-') FROM users u LEFT JOIN positions p ON p.id = u.position_id WHERE u.id=$%d),$%d,$%d,$%d,$%d)`,
				off+1, off+2, off+2, off+2, off+3, off+4, off+5, off+6,
			)
		}
		eBatch := fmt.Sprintf(
			`INSERT INTO evaluation_instance_evaluators (instance_id, user_id, name_snapshot, position_snapshot, can_score, requires_signature, signature_order, signature_role) VALUES %s`,
			strings.Join(eValStrs, ","),
		)
		_, err = tx.Exec(ctx, eBatch, eArgs...)
		if err != nil {
			return err
		}
	}

	// =====================================
	// 6. Create Assignment
	// ใครประเมินใคร
	// - EVALUATION: ผู้ประเมิน x ผู้ถูกประเมิน (ทุกคู่)
	// - SURVEY: ผู้ตอบตอบเอง — evaluator_id = user ของผู้ตอบ (self-answer)
	// =====================================

	// ── 6. Create Assignment (batch) ───────────────────────────
	// สร้าง assignment ทั้งหมดใน query เดียว แทนที่จะ loop ทีละ row
	// ลด round-trip ลงอย่างมาก ป้องกัน conn busy

	type assignmentPair struct {
		evaluatorID string
		targetRowID int64
	}

	var pairs []assignmentPair

	if templateType == "SURVEY" {
		for _, respondentUserID := range payload.TargetMemberIDs {
			targetRowID, ok := targetIDMap[respondentUserID]
			if !ok {
				return fmt.Errorf("target row id not found for user_id %s", respondentUserID)
			}
			pairs = append(pairs, assignmentPair{evaluatorID: respondentUserID, targetRowID: targetRowID})
		}
	} else {
		scorerIDs := make(map[string]bool, len(payload.EvaluatorMemberIDs))
		for _, evaluatorID := range payload.EvaluatorMemberIDs {
			scorerIDs[evaluatorID] = true
		}
		for _, setting := range payload.EvaluatorSettings {
			scorerIDs[setting.UserID] = setting.CanScore
		}
		for _, evaluatorID := range payload.EvaluatorMemberIDs {
			if !scorerIDs[evaluatorID] {
				continue
			}
			for _, targetUserID := range payload.TargetMemberIDs {
				targetRowID, ok := targetIDMap[targetUserID]
				if !ok {
					return fmt.Errorf("target row id not found for user_id %s", targetUserID)
				}
				pairs = append(pairs, assignmentPair{evaluatorID: evaluatorID, targetRowID: targetRowID})
			}
		}
	}

	if len(pairs) > 0 {
		// สร้าง placeholders: ($1,$2,$3,'pending'), ($4,$5,$6,'pending'), ...
		valStrings := make([]string, len(pairs))
		args := make([]interface{}, 0, len(pairs)*3)
		for i, p := range pairs {
			args = append(args, instanceID, p.evaluatorID, p.targetRowID)
			off := i * 3
			valStrings[i] = fmt.Sprintf("($%d,$%d,$%d,'pending')", off+1, off+2, off+3)
		}

		batchQuery := fmt.Sprintf(
			`INSERT INTO evaluation_assignments (instance_id, evaluator_id, target_id, status) VALUES %s`,
			strings.Join(valStrings, ","),
		)

		_, err = tx.Exec(ctx, batchQuery, args...)
		if err != nil {
			return err
		}
	}

	// =====================================
	// Commit
	// =====================================

	err = tx.Commit(ctx)

	return err
}
