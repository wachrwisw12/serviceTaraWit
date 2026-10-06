package attendancerepositories

import (
	"context"
	"encoding/json"

	attendancemodel "tarawitApi/attendanceFeature/attendance_model"
	"tarawitApi/db"
)

func (r *AttendanceRepository) UpdateRecordWithAudit(
	ctx context.Context,
	recordID int64,
	editorID int64,
	req attendancemodel.UpdateAttendanceRecordRequest,
) (*attendancemodel.AttendanceRecord, error) {
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var oldData json.RawMessage
	if err := tx.QueryRow(ctx, `SELECT to_jsonb(r) FROM attendance_records r WHERE id=$1 FOR UPDATE`, recordID).Scan(&oldData); err != nil {
		return nil, err
	}

	record, err := scanRecord(tx.QueryRow(ctx, `
		UPDATE attendance_records SET
			check_in_at=$2,
			check_out_at=$3,
			work_minutes=CASE WHEN $2::timestamp IS NOT NULL AND $3::timestamp IS NOT NULL THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ($3::timestamp-$2::timestamp))/60)::int) ELSE NULL END,
			status=$4,
			note=$5,
			updated_at=NOW()
		WHERE id=$1
		RETURNING `+recordColumns,
		recordID, req.CheckInAt, req.CheckOutAt, req.Status, req.Note,
	))
	if err != nil {
		return nil, err
	}

	var newData json.RawMessage
	if err := tx.QueryRow(ctx, `SELECT to_jsonb(r) FROM attendance_records r WHERE id=$1`, recordID).Scan(&newData); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO attendance_record_audit_logs(attendance_record_id,edited_by,reason,old_data,new_data) VALUES($1,$2,$3,$4,$5)`, recordID, editorID, req.Reason, oldData, newData); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return record, nil
}

func (r *AttendanceRepository) ListRecordAuditLogs(ctx context.Context, recordID int64) ([]attendancemodel.AttendanceAuditLog, error) {
	rows, err := db.DB.Query(ctx, `
		SELECT l.id,l.attendance_record_id,l.edited_by,
		       COALESCE(NULLIF(TRIM(CONCAT(u.first_name,' ',u.last_name)),''),u.username),
		       l.reason,l.old_data,l.new_data,l.edited_at
		FROM attendance_record_audit_logs l
		JOIN users u ON u.id=l.edited_by
		WHERE l.attendance_record_id=$1
		ORDER BY l.edited_at DESC`, recordID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []attendancemodel.AttendanceAuditLog{}
	for rows.Next() {
		var item attendancemodel.AttendanceAuditLog
		if err := rows.Scan(&item.ID, &item.AttendanceRecordID, &item.EditedBy, &item.EditorName, &item.Reason, &item.OldData, &item.NewData, &item.EditedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
