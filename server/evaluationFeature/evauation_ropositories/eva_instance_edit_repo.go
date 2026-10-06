package evaluationRepositories

import (
	"context"
	"fmt"
	"strings"

	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

	"github.com/jackc/pgx/v5"
)

// insertAuditLogs — บันทึก audit log สำหรับ add/remove members
// เรียกภายใน transaction เดียวกับ UpdateTargets / UpdateEvaluators
func insertAuditLogs(
	ctx context.Context,
	tx pgx.Tx,
	instanceID int64,
	actorUserID int64,
	addUserIDs []string,
	removeUserIDs []string,
	addAction string,
	removeAction string,
) error {

	// ── บันทึก add ──
	for _, uid := range addUserIDs {
		var (
			userName string
			position string
		)

		err := tx.QueryRow(
			ctx,
			`SELECT TRIM(COALESCE(px.name_th,'') || u.first_name || ' ' || u.last_name),
			        COALESCE(pos.name_th, '-')
			FROM users u
			LEFT JOIN prefixes px ON px.id = u.prefix_id
			LEFT JOIN positions pos ON pos.id = u.position_id
			WHERE u.id = $1`,
			uid,
		).Scan(&userName, &position)
		if err != nil {
			// ถ้าหา user ไม่เจอ ให้ใช้ user_id เป็นชื่อ
			userName = fmt.Sprintf("user_%s", uid)
			position = "-"
		}

		detail := fmt.Sprintf(`{"name":"%s","position":"%s"}`,
			strings.ReplaceAll(userName, `"`, `\"`),
			strings.ReplaceAll(position, `"`, `\"`),
		)

		_, err = tx.Exec(
			ctx,
			`INSERT INTO evaluation_instance_audit_log
			 (instance_id, actor_user_id, action, target_user_id, detail)
			 VALUES ($1, $2, $3, $4, $5::jsonb)`,
			instanceID,
			actorUserID,
			addAction,
			uid,
			detail,
		)
		if err != nil {
			return fmt.Errorf("insert audit log (add) ไม่สำเร็จ: %w", err)
		}
	}

	// ── บันทึก remove ──
	for _, uid := range removeUserIDs {
		var (
			userName string
			position string
		)

		err := tx.QueryRow(
			ctx,
			`SELECT TRIM(COALESCE(px.name_th,'') || u.first_name || ' ' || u.last_name),
			        COALESCE(pos.name_th, '-')
			FROM users u
			LEFT JOIN prefixes px ON px.id = u.prefix_id
			LEFT JOIN positions pos ON pos.id = u.position_id
			WHERE u.id = $1`,
			uid,
		).Scan(&userName, &position)
		if err != nil {
			userName = fmt.Sprintf("user_%s", uid)
			position = "-"
		}

		detail := fmt.Sprintf(`{"name":"%s","position":"%s"}`,
			strings.ReplaceAll(userName, `"`, `\"`),
			strings.ReplaceAll(position, `"`, `\"`),
		)

		_, err = tx.Exec(
			ctx,
			`INSERT INTO evaluation_instance_audit_log
			 (instance_id, actor_user_id, action, target_user_id, detail)
			 VALUES ($1, $2, $3, $4, $5::jsonb)`,
			instanceID,
			actorUserID,
			removeAction,
			uid,
			detail,
		)
		if err != nil {
			return fmt.Errorf("insert audit log (remove) ไม่สำเร็จ: %w", err)
		}
	}

	return nil
}

// GetAuditLogs — ดึง audit log ของ instance
func (r *EvaluationRepository) GetAuditLogs(
	ctx context.Context,
	instanceID int64,
	limit int,
) ([]evaluationModels.AuditLogEntry, error) {

	if limit <= 0 {
		limit = 50
	}

	rows, err := db.DB.Query(
		ctx,
		`SELECT
			al.id,
			al.instance_id,
			al.actor_user_id,
			TRIM(COALESCE(px.name_th,'') || au.first_name || ' ' || au.last_name) AS actor_name,
			al.action,
			al.target_user_id,
			COALESCE(al.detail->>'name', 'user_' || al.target_user_id::text) AS target_name,
			COALESCE(al.detail->>'position', '-') AS detail_position,
			al.created_at
		FROM evaluation_instance_audit_log al
		LEFT JOIN users au ON au.id = al.actor_user_id
		LEFT JOIN prefixes px ON px.id = au.prefix_id
		WHERE al.instance_id = $1
		ORDER BY al.created_at DESC
		LIMIT $2`,
		instanceID,
		limit,
	)
	if err != nil {
		return nil, fmt.Errorf("โหลด audit log ไม่สำเร็จ: %w", err)
	}
	defer rows.Close()

	var result []evaluationModels.AuditLogEntry
	for rows.Next() {
		var entry evaluationModels.AuditLogEntry
		var detailPosition string

		err := rows.Scan(
			&entry.ID,
			&entry.InstanceID,
			&entry.ActorUserID,
			&entry.ActorName,
			&entry.Action,
			&entry.TargetUserID,
			&entry.TargetName,
			&detailPosition,
			&entry.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("อ่าน audit log ไม่สำเร็จ: %w", err)
		}

		entry.Detail = fmt.Sprintf(`{"position":"%s"}`, detailPosition)
		result = append(result, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

// GetInstanceEditDetail — ดึงข้อมูล instance + targets + evaluators สำหรับหน้าแก้ไข
func (r *EvaluationRepository) GetInstanceEditDetail(
	ctx context.Context,
	instanceID int64,
	userID int64,
) (*evaluationModels.InstanceEditDetail, error) {

	// 1. ตรวจ instance + เจ้าของ
	var detail evaluationModels.InstanceEditDetail

	err := db.DB.QueryRow(
		ctx,
		`
		SELECT
			ei.id,
			ei.template_name,
			COALESCE(ei.template_type, 'EVALUATION'),
			COALESCE(ei.instance_name, ''),
			ei.academic_year,
			ei.round,
			ei.status
		FROM evaluation_instances ei
		WHERE ei.id = $1
		  AND ei.created_by = $2
		`,
		instanceID,
		userID,
	).Scan(
		&detail.ID,
		&detail.TemplateName,
		&detail.TemplateType,
		&detail.InstanceName,
		&detail.AcademicYear,
		&detail.Round,
		&detail.Status,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("ไม่พบการประเมิน หรือคุณไม่มีสิทธิ์จัดการรายการนี้")
		}
		return nil, fmt.Errorf("โหลดข้อมูลการประเมินไม่สำเร็จ: %w", err)
	}

	// 2. ดึง targets
	targetRows, err := db.DB.Query(
		ctx,
		`
		SELECT
			et.user_id,
			TRIM(
				COALESCE(px.name_th, '') ||
				u.first_name || ' ' ||
				u.last_name
			) AS name,
			pos.name_th AS position,
			COALESCE(sub.assignment_count, 0) AS assignment_count,
			COALESCE(sub.completed_count, 0) AS completed_count,
			COALESCE(sub.has_submitted, FALSE) AS has_submitted
		FROM evaluation_targets et
		JOIN users u ON u.id = et.user_id
		LEFT JOIN prefixes px ON px.id = u.prefix_id
		LEFT JOIN positions pos ON pos.id = u.position_id
		LEFT JOIN LATERAL (
			SELECT
				COUNT(*) AS assignment_count,
				COUNT(*) FILTER (WHERE ea.status = 'submitted') AS completed_count,
				BOOL_OR(ea.status = 'submitted') AS has_submitted
			FROM evaluation_assignments ea
			WHERE ea.instance_id = et.instance_id
			  AND ea.target_id = et.id
		) sub ON TRUE
		WHERE et.instance_id = $1
		ORDER BY et.id
		`,
		instanceID,
	)

	if err != nil {
		return nil, fmt.Errorf("โหลดรายชื่อผู้ถูกประเมินไม่สำเร็จ: %w", err)
	}
	defer targetRows.Close()

	detail.Targets = make([]evaluationModels.InstanceEditMember, 0)

	for targetRows.Next() {
		var m evaluationModels.InstanceEditMember
		if err := targetRows.Scan(
			&m.UserID,
			&m.Name,
			&m.Position,
			&m.AssignmentCount,
			&m.CompletedCount,
			&m.HasSubmitted,
		); err != nil {
			return nil, fmt.Errorf("อ่านข้อมูลผู้ถูกประเมินไม่สำเร็จ: %w", err)
		}
		detail.Targets = append(detail.Targets, m)
	}

	if err := targetRows.Err(); err != nil {
		return nil, err
	}

	// 3. ดึง evaluators
	evaluatorRows, err := db.DB.Query(
		ctx,
		`
		SELECT
			eie.user_id,
			eie.name_snapshot AS name,
			eie.position_snapshot AS position,
			COALESCE(sub.assignment_count, 0) AS assignment_count,
			COALESCE(sub.completed_count, 0) AS completed_count,
			COALESCE(sub.has_submitted, FALSE) AS has_submitted,
			eie.can_score,
			eie.requires_signature,
			COALESCE(eie.signature_order, eie.id::integer),
			eie.signature_role
		FROM evaluation_instance_evaluators eie
		LEFT JOIN LATERAL (
			SELECT
				COUNT(*) AS assignment_count,
				COUNT(*) FILTER (WHERE ea.status = 'submitted') AS completed_count,
				BOOL_OR(ea.status = 'submitted') AS has_submitted
			FROM evaluation_assignments ea
			WHERE ea.instance_id = eie.instance_id
			  AND ea.evaluator_id = eie.user_id
		) sub ON TRUE
		WHERE eie.instance_id = $1
		ORDER BY eie.id
		`,
		instanceID,
	)

	if err != nil {
		return nil, fmt.Errorf("โหลดรายชื่อผู้ประเมินไม่สำเร็จ: %w", err)
	}
	defer evaluatorRows.Close()

	detail.Evaluators = make([]evaluationModels.InstanceEditMember, 0)

	for evaluatorRows.Next() {
		var m evaluationModels.InstanceEditMember
		if err := evaluatorRows.Scan(
			&m.UserID,
			&m.Name,
			&m.Position,
			&m.AssignmentCount,
			&m.CompletedCount,
			&m.HasSubmitted,
			&m.CanScore,
			&m.RequiresSignature,
			&m.SignatureOrder,
			&m.SignatureRole,
		); err != nil {
			return nil, fmt.Errorf("อ่านข้อมูลผู้ประเมินไม่สำเร็จ: %w", err)
		}
		detail.Evaluators = append(detail.Evaluators, m)
	}

	if err := evaluatorRows.Err(); err != nil {
		return nil, err
	}

	return &detail, nil
}

// UpdateTargets — เพิ่ม/ลบ targets (เฉพาะ DRAFT status เท่านั้น)
func (r *EvaluationRepository) UpdateTargets(
	ctx context.Context,
	instanceID int64,
	userID int64,
	addUserIDs []string,
	removeUserIDs []string,
) (int, error) {

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("เริ่ม transaction ไม่สำเร็จ: %w", err)
	}
	defer func() {
		_ = tx.Rollback(context.Background())
	}()

	// 1. ตรวจ instance + status (ต้องเป็น DRAFT เท่านั้น)
	var status string
	err = tx.QueryRow(
		ctx,
		`SELECT status FROM evaluation_instances WHERE id = $1 AND created_by = $2 FOR UPDATE`,
		instanceID,
		userID,
	).Scan(&status)

	if err != nil {
		if err == pgx.ErrNoRows {
			return 0, fmt.Errorf("ไม่พบการประเมิน หรือคุณไม่มีสิทธิ์จัดการรายการนี้")
		}
		return 0, fmt.Errorf("ตรวจสอบการประเมินไม่สำเร็จ: %w", err)
	}

	if status != "DRAFT" {
		return 0, fmt.Errorf("สามารถแก้ไขได้เฉพาะการประเมินที่เป็นฉบับร่างเท่านั้น")
	}

	// 2. ลบ targets ที่ต้องการลบ (เฉพาะที่ยังไม่มี assignment ส่งแล้ว)
	for _, uid := range removeUserIDs {
		// ตรวจว่ามี assignment ที่ส่งแล้วหรือยัง
		var hasSubmitted bool
		err = tx.QueryRow(
			ctx,
			`
			SELECT EXISTS (
				SELECT 1 FROM evaluation_assignments ea
				JOIN evaluation_targets et ON et.id = ea.target_id
				WHERE et.instance_id = $1
				  AND et.user_id = $2
				  AND ea.status = 'submitted'
			)
			`,
			instanceID,
			uid,
		).Scan(&hasSubmitted)

		if err != nil {
			return 0, fmt.Errorf("ตรวจสอบสถานะการประเมินไม่สำเร็จ: %w", err)
		}

		if hasSubmitted {
			return 0, fmt.Errorf("ไม่สามารถลบผู้ถูกประเมินที่มีผู้ประเมินส่งผลแล้วได้")
		}

		// ลบ assignment ที่เกี่ยวข้องก่อน
		_, err = tx.Exec(
			ctx,
			`
			DELETE FROM evaluation_assignments
			WHERE instance_id = $1
			  AND target_id IN (
				SELECT id FROM evaluation_targets
				WHERE instance_id = $1 AND user_id = $2
			  )
			`,
			instanceID,
			uid,
		)
		if err != nil {
			return 0, fmt.Errorf("ลบ assignment ไม่สำเร็จ: %w", err)
		}

		// ลบ instance_fields ที่เกี่ยวข้อง
		_, err = tx.Exec(
			ctx,
			`
			DELETE FROM evaluation_instance_fields
			WHERE instance_id = $1
			  AND target_id IN (
				SELECT id FROM evaluation_targets
				WHERE instance_id = $1 AND user_id = $2
			  )
			`,
			instanceID,
			uid,
		)
		if err != nil {
			return 0, fmt.Errorf("ลบ instance fields ไม่สำเร็จ: %w", err)
		}

		// ลบ target
		_, err = tx.Exec(
			ctx,
			`DELETE FROM evaluation_targets WHERE instance_id = $1 AND user_id = $2`,
			instanceID,
			uid,
		)
		if err != nil {
			return 0, fmt.Errorf("ลบผู้ถูกประเมินไม่สำเร็จ: %w", err)
		}
	}

	// 3. เพิ่ม targets ใหม่
	var templateID int64
	err = tx.QueryRow(
		ctx,
		`SELECT template_id FROM evaluation_instances WHERE id = $1`,
		instanceID,
	).Scan(&templateID)
	if err != nil {
		return 0, fmt.Errorf("โหลด template_id ไม่สำเร็จ: %w", err)
	}

	for _, uid := range addUserIDs {
		// ตรวจว่ามีอยู่แล้วหรือยัง
		var exists bool
		err = tx.QueryRow(
			ctx,
			`SELECT EXISTS(SELECT 1 FROM evaluation_targets WHERE instance_id = $1 AND user_id = $2)`,
			instanceID,
			uid,
		).Scan(&exists)
		if err != nil {
			return 0, fmt.Errorf("ตรวจสอบ target ซ้ำไม่สำเร็จ: %w", err)
		}
		if exists {
			continue
		}

		// เพิ่ม target
		var targetRowID int64
		err = tx.QueryRow(
			ctx,
			`INSERT INTO evaluation_targets (instance_id, user_id) VALUES ($1, $2) RETURNING id`,
			instanceID,
			uid,
		).Scan(&targetRowID)
		if err != nil {
			return 0, fmt.Errorf("เพิ่มผู้ถูกประเมินไม่สำเร็จ: %w", err)
		}

		// Copy template fields สำหรับ target ใหม่
		_, err = tx.Exec(
			ctx,
			`
			INSERT INTO evaluation_instance_fields
			(instance_id, target_id, template_field_id, field_key, label, field_type, placeholder, value, required, sort_order)
			SELECT
				$1, $2, id, field_key, label, field_type, placeholder, NULL, required, sort_order
			FROM evaluation_template_fields
			WHERE template_id = $3 AND deleted_at IS NULL
			ORDER BY sort_order
			`,
			instanceID,
			targetRowID,
			templateID,
		)
		if err != nil {
			return 0, fmt.Errorf("คัดลอก template fields ไม่สำเร็จ: %w", err)
		}

		// สร้าง assignment สำหรับ evaluator ทุกคนที่มีอยู่แล้ว
		var templateType string
		err = tx.QueryRow(
			ctx,
			`SELECT COALESCE(template_type, 'EVALUATION') FROM evaluation_instances WHERE id = $1`,
			instanceID,
		).Scan(&templateType)
		if err != nil {
			return 0, fmt.Errorf("โหลด template_type ไม่สำเร็จ: %w", err)
		}

		if templateType == "SURVEY" {
			// แบบสอบถาม: assignment = ผู้ตอบตอบเอง
			_, err = tx.Exec(
				ctx,
				`INSERT INTO evaluation_assignments (instance_id, evaluator_id, target_id, status) VALUES ($1, $2, $3, 'pending')`,
				instanceID,
				uid,
				targetRowID,
			)
			if err != nil {
				return 0, fmt.Errorf("สร้าง assignment ไม่สำเร็จ: %w", err)
			}
		} else {
			// แบบประเมิน: ทุก evaluator x target ใหม่
			evaluatorRows, err := tx.Query(
				ctx,
				`SELECT user_id FROM evaluation_instance_evaluators WHERE instance_id = $1`,
				instanceID,
			)
			if err != nil {
				return 0, fmt.Errorf("โหลด evaluator list ไม่สำเร็จ: %w", err)
			}

			var evaluatorIDs []int64
			for evaluatorRows.Next() {
				var evaluatorID int64
				if err := evaluatorRows.Scan(&evaluatorID); err != nil {
					evaluatorRows.Close()
					return 0, fmt.Errorf("อ่าน evaluator ID ไม่สำเร็จ: %w", err)
				}
				evaluatorIDs = append(evaluatorIDs, evaluatorID)
			}
			if err := evaluatorRows.Err(); err != nil {
				evaluatorRows.Close()
				return 0, err
			}
			evaluatorRows.Close()

			for _, evaluatorID := range evaluatorIDs {
				_, err = tx.Exec(
					ctx,
					`INSERT INTO evaluation_assignments (instance_id, evaluator_id, target_id, status) VALUES ($1, $2, $3, 'pending')`,
					instanceID,
					evaluatorID,
					targetRowID,
				)
				if err != nil {
					return 0, fmt.Errorf("สร้าง assignment ไม่สำเร็จ: %w", err)
				}
			}
		}
	}

	// 4. นับจำนวน target ปัจจุบัน
	var targetCount int
	err = tx.QueryRow(
		ctx,
		`SELECT COUNT(*) FROM evaluation_targets WHERE instance_id = $1`,
		instanceID,
	).Scan(&targetCount)
	if err != nil {
		return 0, fmt.Errorf("นับจำนวน target ไม่สำเร็จ: %w", err)
	}

	// อัปเดต updated_at
	_, err = tx.Exec(
		ctx,
		`UPDATE evaluation_instances SET updated_at = NOW() WHERE id = $1`,
		instanceID,
	)
	if err != nil {
		return 0, fmt.Errorf("อัปเดต updated_at ไม่สำเร็จ: %w", err)
	}

	// ── Audit Log ──
	auditErr := insertAuditLogs(ctx, tx, instanceID, userID, addUserIDs, removeUserIDs, evaluationModels.AuditActionAddTarget, evaluationModels.AuditActionRemoveTarget)
	if auditErr != nil {
		return 0, fmt.Errorf("บันทึก audit log ไม่สำเร็จ: %w", auditErr)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit ไม่สำเร็จ: %w", err)
	}

	return targetCount, nil
}

// UpdateEvaluators — เพิ่ม/ลบ evaluators (เฉพาะ DRAFT status เท่านั้น)
func (r *EvaluationRepository) UpdateEvaluators(
	ctx context.Context,
	instanceID int64,
	userID int64,
	addUserIDs []string,
	removeUserIDs []string,
	evaluatorSettings []evaluationModels.EvaluatorSettingInput,
) (int, error) {

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("เริ่ม transaction ไม่สำเร็จ: %w", err)
	}
	defer func() {
		_ = tx.Rollback(context.Background())
	}()

	// 1. ตรวจ instance + status (แก้ได้จนกว่าจะปิดรอบ)
	var (
		status       string
		templateType string
	)
	err = tx.QueryRow(
		ctx,
		`SELECT status, COALESCE(template_type, 'EVALUATION') FROM evaluation_instances WHERE id = $1 AND created_by = $2 FOR UPDATE`,
		instanceID,
		userID,
	).Scan(&status, &templateType)

	if err != nil {
		if err == pgx.ErrNoRows {
			return 0, fmt.Errorf("ไม่พบการประเมิน หรือคุณไม่มีสิทธิ์จัดการรายการนี้")
		}
		return 0, fmt.Errorf("ตรวจสอบการประเมินไม่สำเร็จ: %w", err)
	}

	if status == "CLOSED" {
		return 0, fmt.Errorf("ไม่สามารถแก้ไขผู้ประเมินหลังปิดการประเมินแล้ว")
	}

	// แบบสอบถามไม่มี evaluator แยก — ไม่ต้องแก้ไข
	if templateType == "SURVEY" {
		return 0, fmt.Errorf("แบบสอบถามไม่มีผู้ประเมินแยก ไม่สามารถแก้ไขได้")
	}

	// 2. ลบ evaluators ที่ต้องการลบ (เฉพาะที่ยังไม่มี assignment ส่งแล้ว)
	for _, uid := range removeUserIDs {
		// ตรวจว่ามี assignment ที่ส่งแล้วหรือยัง
		var hasSubmitted bool
		err = tx.QueryRow(
			ctx,
			`
			SELECT EXISTS (
				SELECT 1 FROM evaluation_assignments ea
				WHERE ea.instance_id = $1
				  AND ea.evaluator_id = $2
				  AND ea.status = 'submitted'
			)
			`,
			instanceID,
			uid,
		).Scan(&hasSubmitted)

		if err != nil {
			return 0, fmt.Errorf("ตรวจสอบสถานะการประเมินไม่สำเร็จ: %w", err)
		}

		if hasSubmitted {
			return 0, fmt.Errorf("ไม่สามารถลบผู้ประเมินที่ส่งผลประเมินแล้วได้")
		}

		// ลบ assignment ที่เกี่ยวข้อง
		_, err = tx.Exec(
			ctx,
			`DELETE FROM evaluation_assignments WHERE instance_id = $1 AND evaluator_id = $2`,
			instanceID,
			uid,
		)
		if err != nil {
			return 0, fmt.Errorf("ลบ assignment ไม่สำเร็จ: %w", err)
		}

		// ลบ evaluator
		_, err = tx.Exec(
			ctx,
			`DELETE FROM evaluation_instance_evaluators WHERE instance_id = $1 AND user_id = $2`,
			instanceID,
			uid,
		)
		if err != nil {
			return 0, fmt.Errorf("ลบผู้ประเมินไม่สำเร็จ: %w", err)
		}
	}

	// 3. เพิ่ม evaluators ใหม่
	for _, uid := range addUserIDs {
		// ตรวจว่ามีอยู่แล้วหรือยัง
		var exists bool
		err = tx.QueryRow(
			ctx,
			`SELECT EXISTS(SELECT 1 FROM evaluation_instance_evaluators WHERE instance_id = $1 AND user_id = $2)`,
			instanceID,
			uid,
		).Scan(&exists)
		if err != nil {
			return 0, fmt.Errorf("ตรวจสอบ evaluator ซ้ำไม่สำเร็จ: %w", err)
		}
		if exists {
			continue
		}

		// เพิ่ม evaluator (join users + positions เพื่อ snapshot ชื่อ-ตำแหน่ง)
		_, err = tx.Exec(
			ctx,
			`
			INSERT INTO evaluation_instance_evaluators
			(instance_id, user_id, name_snapshot, position_snapshot)
			SELECT
				$1,
				u.id,
				CONCAT(px.name_th, u.first_name, ' ', u.last_name),
				COALESCE(p.name_th, '-')
			FROM users u
			LEFT JOIN positions p ON p.id = u.position_id
			LEFT JOIN prefixes px ON px.id = u.prefix_id
			WHERE u.id = $2
			`,
			instanceID,
			uid,
		)
		if err != nil {
			return 0, fmt.Errorf("เพิ่มผู้ประเมินไม่สำเร็จ: %w", err)
		}

		// สร้าง assignment สำหรับ target ทุกคนที่มีอยู่แล้ว
		targetRows, err := tx.Query(
			ctx,
			`SELECT id FROM evaluation_targets WHERE instance_id = $1`,
			instanceID,
		)
		if err != nil {
			return 0, fmt.Errorf("โหลด target list ไม่สำเร็จ: %w", err)
		}

		var targetIDs []int64
		for targetRows.Next() {
			var targetRowID int64
			if err := targetRows.Scan(&targetRowID); err != nil {
				targetRows.Close()
				return 0, fmt.Errorf("อ่าน target ID ไม่สำเร็จ: %w", err)
			}
			targetIDs = append(targetIDs, targetRowID)
		}
		if err := targetRows.Err(); err != nil {
			targetRows.Close()
			return 0, err
		}
		targetRows.Close()

		for _, targetRowID := range targetIDs {
			_, err = tx.Exec(
				ctx,
				`INSERT INTO evaluation_assignments (instance_id, evaluator_id, target_id, status) VALUES ($1, $2, $3, 'pending')`,
				instanceID,
				uid,
				targetRowID,
			)
			if err != nil {
				return 0, fmt.Errorf("สร้าง assignment ไม่สำเร็จ: %w", err)
			}
		}
	}

	// 4. อัปเดตหน้าที่ของคณะผู้ประเมิน และซิงก์ assignment เฉพาะผู้ลงคะแนน
	for _, setting := range evaluatorSettings {
		if setting.SignatureOrder <= 0 {
			setting.SignatureOrder = 1
		}
		if setting.SignatureRole == "" {
			setting.SignatureRole = "ผู้ประเมิน"
		}

		var hasSubmitted bool
		err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM evaluation_assignments WHERE instance_id=$1 AND evaluator_id=$2 AND status='submitted')`, instanceID, setting.UserID).Scan(&hasSubmitted)
		if err != nil {
			return 0, fmt.Errorf("ตรวจสอบคะแนนเดิมไม่สำเร็จ: %w", err)
		}
		if !setting.CanScore && hasSubmitted {
			return 0, fmt.Errorf("ไม่สามารถปิดสิทธิ์ลงคะแนนของผู้ที่ส่งคะแนนแล้วได้")
		}

		result, updateErr := tx.Exec(ctx, `
			UPDATE evaluation_instance_evaluators
			SET can_score=$3, requires_signature=$4, signature_order=$5, signature_role=$6
			WHERE instance_id=$1 AND user_id=$2`, instanceID, setting.UserID, setting.CanScore, setting.RequiresSignature, setting.SignatureOrder, setting.SignatureRole)
		if updateErr != nil {
			return 0, fmt.Errorf("อัปเดตหน้าที่ผู้ประเมินไม่สำเร็จ: %w", updateErr)
		}
		if result.RowsAffected() == 0 {
			continue
		}

		if setting.CanScore {
			_, err = tx.Exec(ctx, `
				INSERT INTO evaluation_assignments (instance_id, evaluator_id, target_id, status)
				SELECT $1, $2, et.id, 'pending'
				FROM evaluation_targets et WHERE et.instance_id=$1
				ON CONFLICT (instance_id, evaluator_id, target_id) DO NOTHING`, instanceID, setting.UserID)
		} else {
			_, err = tx.Exec(ctx, `DELETE FROM evaluation_assignments WHERE instance_id=$1 AND evaluator_id=$2 AND status <> 'submitted'`, instanceID, setting.UserID)
		}
		if err != nil {
			return 0, fmt.Errorf("ซิงก์งานลงคะแนนไม่สำเร็จ: %w", err)
		}
	}

	// 5. นับจำนวน evaluator ปัจจุบัน
	var evaluatorCount int
	err = tx.QueryRow(
		ctx,
		`SELECT COUNT(DISTINCT user_id) FROM evaluation_instance_evaluators WHERE instance_id = $1`,
		instanceID,
	).Scan(&evaluatorCount)
	if err != nil {
		return 0, fmt.Errorf("นับจำนวน evaluator ไม่สำเร็จ: %w", err)
	}

	// อัปเดต updated_at
	_, err = tx.Exec(
		ctx,
		`UPDATE evaluation_instances SET updated_at = NOW() WHERE id = $1`,
		instanceID,
	)
	if err != nil {
		return 0, fmt.Errorf("อัปเดต updated_at ไม่สำเร็จ: %w", err)
	}

	// ── Audit Log ──
	auditErr := insertAuditLogs(ctx, tx, instanceID, userID, addUserIDs, removeUserIDs, evaluationModels.AuditActionAddEvaluator, evaluationModels.AuditActionRemoveEvaluator)
	if auditErr != nil {
		return 0, fmt.Errorf("บันทึก audit log ไม่สำเร็จ: %w", auditErr)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit ไม่สำเร็จ: %w", err)
	}

	return evaluatorCount, nil
}
