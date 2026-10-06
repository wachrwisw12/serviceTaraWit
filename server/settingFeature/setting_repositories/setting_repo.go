package settingrepositories

import (
	"context"

	"github.com/jackc/pgx/v5"
	"tarawitApi/db"
	settingmodel "tarawitApi/settingFeature/setting_model"
)

type SettingRepository struct{}

func NewSettingRepository() *SettingRepository {
	return &SettingRepository{}
}

// ==================== ข้อมูลโรงเรียน ====================

// GetSchool — ดึงข้อมูลโรงเรียน (ใช้แถวแรก ระบบมีโรงเรียนเดียว)
func (r *SettingRepository) GetSchool(
	ctx context.Context,
) (*settingmodel.SchoolInfo, error) {

	var s settingmodel.SchoolInfo

	err := db.DB.QueryRow(
		ctx,
		`
		SELECT id, code, name, type, province, address, phone, email, director_name,
		       COALESCE(system_name, ''), COALESCE(system_short_name, '')
		FROM organizations
		ORDER BY id
		LIMIT 1
		`,
	).Scan(
		&s.ID,
		&s.Code,
		&s.Name,
		&s.Type,
		&s.Province,
		&s.Address,
		&s.Phone,
		&s.Email,
		&s.DirectorName,
		&s.SystemName,
		&s.SystemShortName,
	)

	if err != nil {
		return nil, err
	}

	return &s, nil
}

// UpdateSchool — แก้ไขข้อมูลโรงเรียน
func (r *SettingRepository) UpdateSchool(
	ctx context.Context,
	tx pgx.Tx,
	req settingmodel.UpdateSchoolRequest,
) error {

	_, err := tx.Exec(
		ctx,
		`
		UPDATE organizations SET
			code = COALESCE($1, code),
			name = COALESCE($2, name),
			type = COALESCE($3, type),
			province = COALESCE($4, province),
			address = COALESCE($5, address),
			phone = COALESCE($6, phone),
			email = COALESCE($7, email),
			director_name = COALESCE($8, director_name),
			system_name = COALESCE($9, system_name),
			system_short_name = COALESCE($10, system_short_name)
		WHERE id = (SELECT id FROM organizations ORDER BY id LIMIT 1)
		`,
		req.Code,
		req.Name,
		req.Type,
		req.Province,
		req.Address,
		req.Phone,
		req.Email,
		req.DirectorName,
		req.SystemName,
		req.SystemShortName,
	)

	return err
}

// ==================== ปีการศึกษา ====================

func (r *SettingRepository) ListAcademicYears(
	ctx context.Context,
) ([]settingmodel.AcademicYear, error) {

	rows, err := db.DB.Query(
		ctx,
		`
		SELECT id, year, is_current, created_at
		FROM academic_years
		ORDER BY year DESC
		`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []settingmodel.AcademicYear

	for rows.Next() {
		var y settingmodel.AcademicYear
		if err := rows.Scan(&y.ID, &y.Year, &y.IsCurrent, &y.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, y)
	}

	return list, rows.Err()
}

// YearExists — ปีซ้ำหรือไม่ (excludeID ใช้ตอนแก้ไข)
func (r *SettingRepository) YearExists(
	ctx context.Context,
	tx pgx.Tx,
	year int,
	excludeID int64,
) (bool, error) {

	var exists bool

	query := `
		SELECT EXISTS(
			SELECT 1 FROM academic_years
			WHERE year = $1 AND ($2 = 0 OR id <> $2)
		)
	`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, year, excludeID).Scan(&exists)
	} else {
		err = db.DB.QueryRow(ctx, query, year, excludeID).Scan(&exists)
	}

	if err != nil {
		return false, err
	}

	return exists, nil
}

// CreateAcademicYear — เพิ่มปีการศึกษา
func (r *SettingRepository) CreateAcademicYear(
	ctx context.Context,
	tx pgx.Tx,
	year int,
) (int64, error) {

	var id int64

	err := tx.QueryRow(
		ctx,
		`INSERT INTO academic_years (year) VALUES ($1) RETURNING id`,
		year,
	).Scan(&id)

	if err != nil {
		return 0, err
	}

	return id, nil
}

// UpdateAcademicYear — แก้ไขค่าปี
func (r *SettingRepository) UpdateAcademicYear(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
	year int,
) error {

	_, err := tx.Exec(
		ctx,
		`UPDATE academic_years SET year = $2 WHERE id = $1`,
		id,
		year,
	)

	return err
}

// SetCurrentYear — ตั้งปีปัจจุบัน (และเคลียร์ปีอื่น)
func (r *SettingRepository) SetCurrentYear(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
) error {

	if _, err := tx.Exec(
		ctx,
		`UPDATE academic_years SET is_current = FALSE`,
	); err != nil {
		return err
	}

	_, err := tx.Exec(
		ctx,
		`UPDATE academic_years SET is_current = TRUE WHERE id = $1`,
		id,
	)

	return err
}

// DeleteAcademicYear — ลบปีการศึกษา
func (r *SettingRepository) DeleteAcademicYear(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
) error {

	_, err := tx.Exec(ctx, `DELETE FROM academic_years WHERE id = $1`, id)

	return err
}

// AcademicYearExists — ปีนี้มีอยู่จริงหรือไม่
func (r *SettingRepository) AcademicYearExists(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
) (bool, error) {

	var exists bool

	query := `SELECT EXISTS(SELECT 1 FROM academic_years WHERE id = $1)`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, id).Scan(&exists)
	} else {
		err = db.DB.QueryRow(ctx, query, id).Scan(&exists)
	}

	if err != nil {
		return false, err
	}

	return exists, nil
}

// YearInUse — มีการประเมินอ้างอิงปีนี้อยู่หรือไม่ (กันลบปีที่ใช้แล้ว)
func (r *SettingRepository) YearInUse(
	ctx context.Context,
	tx pgx.Tx,
	year int,
) (bool, error) {

	var inUse bool

	query := `SELECT EXISTS(SELECT 1 FROM evaluation_instances WHERE academic_year = $1)`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, year).Scan(&inUse)
	} else {
		err = db.DB.QueryRow(ctx, query, year).Scan(&inUse)
	}

	if err != nil {
		return false, err
	}

	return inUse, nil
}

// ==================== ระดับคะแนน ====================

func (r *SettingRepository) ListScoreLevels(
	ctx context.Context,
	includeInactive bool,
) ([]settingmodel.ScoreLevel, error) {

	query := `
		SELECT id, score, label, color, text_color, is_active, sort_order
		FROM score_levels
	`
	if !includeInactive {
		query += ` WHERE is_active = TRUE`
	}
	query += ` ORDER BY sort_order, score DESC`

	rows, err := db.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []settingmodel.ScoreLevel

	for rows.Next() {
		var l settingmodel.ScoreLevel
		if err := rows.Scan(
			&l.ID,
			&l.Score,
			&l.Label,
			&l.Color,
			&l.TextColor,
			&l.IsActive,
			&l.SortOrder,
		); err != nil {
			return nil, err
		}
		list = append(list, l)
	}

	return list, rows.Err()
}

// UpdateScoreLevel — แก้ไขระดับคะแนน (อัปเดตเฉพาะ field ที่ส่งมา)
func (r *SettingRepository) UpdateScoreLevel(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
	req settingmodel.UpdateScoreLevelRequest,
) error {

	_, err := tx.Exec(
		ctx,
		`
		UPDATE score_levels SET
			label = COALESCE($2, label),
			color = COALESCE($3, color),
			text_color = COALESCE($4, text_color),
			sort_order = COALESCE($5, sort_order),
			is_active = COALESCE($6, is_active),
			updated_at = NOW()
		WHERE id = $1
		`,
		id,
		req.Label,
		req.Color,
		req.TextColor,
		req.SortOrder,
		req.IsActive,
	)

	return err
}

// ScoreLevelExists — ระดับนี้มีอยู่จริงหรือไม่
func (r *SettingRepository) ScoreLevelExists(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
) (bool, error) {

	var exists bool

	query := `SELECT EXISTS(SELECT 1 FROM score_levels WHERE id = $1)`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, id).Scan(&exists)
	} else {
		err = db.DB.QueryRow(ctx, query, id).Scan(&exists)
	}

	if err != nil {
		return false, err
	}

	return exists, nil
}
