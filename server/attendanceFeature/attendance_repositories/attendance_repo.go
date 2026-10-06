package attendancerepositories

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"

	attendancemodel "tarawitApi/attendanceFeature/attendance_model"
	"tarawitApi/db"
)

type AttendanceRepository struct{}

func NewAttendanceRepository() *AttendanceRepository {
	return &AttendanceRepository{}
}

const recordColumns = `id, user_id, to_char(record_date, 'YYYY-MM-DD'), check_in_at, check_out_at, status, work_minutes, note,
check_in_latitude, check_in_longitude, check_in_accuracy_m, check_in_distance_m, check_in_location_id, check_in_inside_area, check_in_outside_allowed,
check_out_latitude, check_out_longitude, check_out_accuracy_m, check_out_distance_m, check_out_location_id, check_out_inside_area, check_out_outside_allowed`

func scanRecord(row pgx.Row) (*attendancemodel.AttendanceRecord, error) {
	var rec attendancemodel.AttendanceRecord
	err := row.Scan(
		&rec.ID,
		&rec.UserID,
		&rec.RecordDate,
		&rec.CheckInAt,
		&rec.CheckOutAt,
		&rec.Status,
		&rec.WorkMinutes,
		&rec.Note,
		&rec.CheckInLatitude, &rec.CheckInLongitude, &rec.CheckInAccuracyM,
		&rec.CheckInDistanceM, &rec.CheckInLocationID, &rec.CheckInInsideArea, &rec.CheckInOutsideAllowed,
		&rec.CheckOutLatitude, &rec.CheckOutLongitude, &rec.CheckOutAccuracyM,
		&rec.CheckOutDistanceM, &rec.CheckOutLocationID, &rec.CheckOutInsideArea, &rec.CheckOutOutsideAllowed,
	)
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func (r *AttendanceRepository) GetSettings(ctx context.Context) (*attendancemodel.AttendanceSettings, error) {
	var s attendancemodel.AttendanceSettings
	err := db.DB.QueryRow(ctx, `
		SELECT id,
		       to_char(work_start, 'HH24:MI:SS'),
		       to_char(late_threshold, 'HH24:MI:SS'),
		       to_char(work_end, 'HH24:MI:SS'),
		       to_char(grace_end, 'HH24:MI:SS'),
		       timezone_offset_minutes,
		       is_active,
		       geofence_enabled,
		       max_location_accuracy_m,
		       to_char(check_in_open, 'HH24:MI:SS'),
		       to_char(check_in_close, 'HH24:MI:SS'),
		       to_char(check_out_open, 'HH24:MI:SS'),
		       to_char(check_out_close, 'HH24:MI:SS')
		FROM attendance_settings
		WHERE is_active = true
		ORDER BY id
		LIMIT 1
	`).Scan(
		&s.ID,
		&s.WorkStart,
		&s.LateThreshold,
		&s.WorkEnd,
		&s.GraceEnd,
		&s.TimezoneOffsetMinutes,
		&s.IsActive,
		&s.GeofenceEnabled,
		&s.MaxLocationAccuracyM,
		&s.CheckInOpen,
		&s.CheckInClose,
		&s.CheckOutOpen,
		&s.CheckOutClose,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *AttendanceRepository) GetToday(
	ctx context.Context,
	userID int64,
) (*attendancemodel.AttendanceRecord, error) {
	rec, err := scanRecord(db.DB.QueryRow(ctx, `
		SELECT `+recordColumns+`
		FROM attendance_records
		WHERE user_id = $1 AND record_date = CURRENT_DATE
	`, userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return rec, nil
}

// CreateCheckIn บันทึกเวลาเข้างาน; ถ้ามี record ของวันนี้อยู่แล้วจะคืน nil
func (r *AttendanceRepository) CreateCheckIn(
	ctx context.Context,
	userID int64,
	status string,
	location attendancemodel.LocationRequest,
	decision attendancemodel.GeofenceDecision,
) (*attendancemodel.AttendanceRecord, error) {
	rec, err := scanRecord(db.DB.QueryRow(ctx, `
		INSERT INTO attendance_records (
			user_id, record_date, check_in_at, status,
			check_in_latitude, check_in_longitude, check_in_accuracy_m,
			check_in_distance_m, check_in_location_id, check_in_inside_area, check_in_outside_allowed
		)
		VALUES ($1, CURRENT_DATE, NOW(), $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (user_id, record_date) DO NOTHING
		RETURNING `+recordColumns+`
	`, userID, status, location.Latitude, location.Longitude, location.AccuracyM,
		decision.DistanceM, decision.LocationID, decision.InsideArea, decision.OutsideAllowed))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return rec, nil
}

// UpdateCheckOut บันทึกเวลาออกงาน; คืน nil ถ้ายังไม่ได้เข้างานหรือออกงานแล้ว
func (r *AttendanceRepository) UpdateCheckOut(
	ctx context.Context,
	userID int64,
	workMinutes int,
	status string,
	location attendancemodel.LocationRequest,
	decision attendancemodel.GeofenceDecision,
) (*attendancemodel.AttendanceRecord, error) {
	rec, err := scanRecord(db.DB.QueryRow(ctx, `
		UPDATE attendance_records
		SET check_out_at = NOW(),
		    work_minutes = $2,
		    status = $3,
		    check_out_latitude = $4,
		    check_out_longitude = $5,
		    check_out_accuracy_m = $6,
		    check_out_distance_m = $7,
		    check_out_location_id = $8,
		    check_out_inside_area = $9,
		    check_out_outside_allowed = $10,
		    updated_at = NOW()
		WHERE user_id = $1
		  AND record_date = CURRENT_DATE
		  AND check_in_at IS NOT NULL
		  AND check_out_at IS NULL
		RETURNING `+recordColumns+`
	`, userID, workMinutes, status, location.Latitude, location.Longitude, location.AccuracyM,
		decision.DistanceM, decision.LocationID, decision.InsideArea, decision.OutsideAllowed))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return rec, nil
}

func (r *AttendanceRepository) GetMonth(
	ctx context.Context,
	userID int64,
	month time.Time,
) ([]attendancemodel.AttendanceRecord, error) {
	rows, err := db.DB.Query(ctx, `
		SELECT `+recordColumns+`
		FROM attendance_records
		WHERE user_id = $1
		  AND record_date >= $2::date
		  AND record_date < ($2::date + INTERVAL '1 month')
		ORDER BY record_date DESC
	`, userID, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []attendancemodel.AttendanceRecord{}
	for rows.Next() {
		rec, err := scanRecord(rows)
		if err != nil {
			return nil, err
		}
		records = append(records, *rec)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return records, nil
}

// GetMonthAll ข้อมูลลงเวลาทุกคนในเดือน (ฝั่งผู้ดูแล) พร้อมชื่อผู้ใช้
func (r *AttendanceRepository) GetMonthAll(
	ctx context.Context,
	month time.Time,
) ([]attendancemodel.AttendanceRecordWithUser, error) {
	rows, err := db.DB.Query(ctx, `
		SELECT r.id,
		       r.user_id,
		       u.first_name,
		       u.last_name,
		       u.username,
		       to_char(r.record_date, 'YYYY-MM-DD'),
		       r.check_in_at,
		       r.check_out_at,
		       r.status,
		       r.work_minutes,
		       r.note,
		       r.check_in_distance_m,
		       r.check_in_inside_area,
		       r.check_in_outside_allowed,
		       r.check_out_distance_m,
		       r.check_out_inside_area,
		       r.check_out_outside_allowed
		FROM attendance_records r
		JOIN users u ON u.id = r.user_id
		WHERE r.record_date >= $1::date
		  AND r.record_date < ($1::date + INTERVAL '1 month')
		ORDER BY r.record_date DESC, u.first_name, u.last_name
	`, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []attendancemodel.AttendanceRecordWithUser{}
	for rows.Next() {
		var rec attendancemodel.AttendanceRecordWithUser
		if err := rows.Scan(
			&rec.ID,
			&rec.UserID,
			&rec.FirstName,
			&rec.LastName,
			&rec.Username,
			&rec.RecordDate,
			&rec.CheckInAt,
			&rec.CheckOutAt,
			&rec.Status,
			&rec.WorkMinutes,
			&rec.Note,
			&rec.CheckInDistanceM,
			&rec.CheckInInsideArea,
			&rec.CheckInOutsideAllowed,
			&rec.CheckOutDistanceM,
			&rec.CheckOutInsideArea,
			&rec.CheckOutOutsideAllowed,
		); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return records, nil
}
