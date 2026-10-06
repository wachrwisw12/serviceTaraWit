package personnelrepositories

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5"
	"tarawitApi/db"
	personnelmodel "tarawitApi/personnelFeature/personnel_model"
)

type PersonnelRepository struct{}

func NewPersonnelRepository() *PersonnelRepository {
	return &PersonnelRepository{}
}

const personnelSelect = `
	SELECT
		u.id,
		u.username,
		u.nickname,
		u.cid,
		u.prefix_id,
		pf.name_th AS prefix_name,
		pf.code AS prefix_code,
		u.first_name,
		u.last_name,
		u.department_id,
		d.code AS department_code,
		d.name_th AS department_name,
		u.person_type_id,
		pt.code AS person_type_code,
		pt.name_th AS person_type_name,
		u.position_id,
		pos.code AS position_code,
		pos.name_th AS position_name,
		u.email,
		u.phone,
		u.person_level,
		u.is_active,
		u.avatar_url,
		u.created_at
	FROM users u
	LEFT JOIN prefixes pf ON pf.id = u.prefix_id
	LEFT JOIN departments d ON d.id = u.department_id
	LEFT JOIN person_types pt ON pt.id = u.person_type_id
	LEFT JOIN positions pos ON pos.id = u.position_id
`

// buildPersonnelWhere — สร้าง WHERE clause จาก filter (reuse ระหว่าง COUNT + SELECT)
func buildPersonnelWhere(f personnelmodel.ListPersonnelFilter) (string, []interface{}) {
	var conditions []string
	var args []interface{}

	if f.PersonTypeID > 0 {
		args = append(args, f.PersonTypeID)
		conditions = append(conditions, "u.person_type_id = $"+itoa(len(args)))
	}

	if f.PositionID > 0 {
		args = append(args, f.PositionID)
		conditions = append(conditions, "u.position_id = $"+itoa(len(args)))
	}

	if f.IsActive == "true" || f.IsActive == "false" {
		args = append(args, f.IsActive == "true")
		conditions = append(conditions, "u.is_active = $"+itoa(len(args)))
	}

	if strings.TrimSpace(f.Search) != "" {
		args = append(args, "%"+strings.TrimSpace(f.Search)+"%")
		conditions = append(
			conditions,
			`(
				COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')
				ILIKE $`+itoa(len(args))+`
				OR u.username ILIKE $`+itoa(len(args))+`
				OR COALESCE(u.nickname, '') ILIKE $`+itoa(len(args))+`
				OR COALESCE(u.cid, '') ILIKE $`+itoa(len(args))+`
				OR COALESCE(u.email, '') ILIKE $`+itoa(len(args))+`
				OR COALESCE(u.phone, '') ILIKE $`+itoa(len(args))+`
			)`,
		)
	}

	if len(conditions) > 0 {
		return " WHERE " + strings.Join(conditions, " AND "), args
	}
	return "", args
}

// CountPersonnel — นับจำนวนบุคลากรตาม filter
func (r *PersonnelRepository) CountPersonnel(
	ctx context.Context,
	f personnelmodel.ListPersonnelFilter,
) (int64, error) {

	where, args := buildPersonnelWhere(f)
	query := `SELECT COUNT(*) FROM users u` + where

	var total int64
	err := db.DB.QueryRow(ctx, query, args...).Scan(&total)
	return total, err
}

// ListPersonnel — รายการบุคลากร พร้อมกรอง + pagination
func (r *PersonnelRepository) ListPersonnel(
	ctx context.Context,
	f personnelmodel.ListPersonnelFilter,
) ([]personnelmodel.Personnel, error) {

	where, args := buildPersonnelWhere(f)

	query := personnelSelect + where + " ORDER BY u.id"

	if f.Limit > 0 {
		query += " LIMIT " + itoa(f.Limit)
		if f.Page > 1 {
			offset := (f.Page - 1) * f.Limit
			query += " OFFSET " + itoa(offset)
		}
	}

	rows, err := db.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []personnelmodel.Personnel

	for rows.Next() {
		var p personnelmodel.Personnel
		if err := rows.Scan(
			&p.ID,
			&p.Username,
			&p.Nickname,
			&p.CID,
			&p.PrefixID,
			&p.PrefixName,
			&p.PrefixCode,
			&p.FirstName,
			&p.LastName,
			&p.DepartmentID,
			&p.DepartmentCode,
			&p.DepartmentName,
			&p.PersonTypeID,
			&p.PersonTypeCode,
			&p.PersonTypeName,
			&p.PositionID,
			&p.PositionCode,
			&p.PositionName,
			&p.Email,
			&p.Phone,
			&p.PersonLevel,
			&p.IsActive,
			&p.AvatarURL,
			&p.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

// GetPersonnelByID — รายละเอียดบุคลากร 1 คน
func (r *PersonnelRepository) GetPersonnelByID(
	ctx context.Context,
	id int64,
) (*personnelmodel.Personnel, error) {

	var p personnelmodel.Personnel

	err := db.DB.QueryRow(
		ctx,
		personnelSelect+` WHERE u.id = $1`,
		id,
	).Scan(
		&p.ID,
		&p.Username,
		&p.Nickname,
		&p.CID,
		&p.PrefixID,
		&p.PrefixName,
		&p.PrefixCode,
	&p.FirstName,
	&p.LastName,
	&p.DepartmentID,
	&p.DepartmentCode,
	&p.DepartmentName,
	&p.PersonTypeID,
	&p.PersonTypeCode,
	&p.PersonTypeName,
		&p.PositionID,
		&p.PositionCode,
		&p.PositionName,
		&p.Email,
		&p.Phone,
		&p.PersonLevel,
		&p.IsActive,
		&p.AvatarURL,
		&p.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &p, nil
}

// UsernameExists — เช็ค username ซ้ำ (true = ซ้ำ)
func (r *PersonnelRepository) UsernameExists(
	ctx context.Context,
	tx pgx.Tx,
	username string,
) (bool, error) {

	var exists bool

	query := `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, username).Scan(&exists)
	} else {
		err = db.DB.QueryRow(ctx, query, username).Scan(&exists)
	}

	if err != nil {
		return false, err
	}

	return exists, nil
}

// CIDExists — เช็คเลขบัตรประชาชนซ้ำ (excludeID ใช้ตอนแก้ไข)
func (r *PersonnelRepository) CIDExists(
	ctx context.Context,
	tx pgx.Tx,
	cid string,
	excludeID int64,
) (bool, error) {

	var exists bool

	query := `
		SELECT EXISTS(
			SELECT 1 FROM users
			WHERE cid = $1 AND ($2 = 0 OR id <> $2)
		)
	`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, cid, excludeID).Scan(&exists)
	} else {
		err = db.DB.QueryRow(ctx, query, cid, excludeID).Scan(&exists)
	}

	if err != nil {
		return false, err
	}

	return exists, nil
}

// CreatePersonnel — insert ผู้ใช้ใหม่พร้อมข้อมูลบุคลากร
func (r *PersonnelRepository) CreatePersonnel(
	ctx context.Context,
	tx pgx.Tx,
	req personnelmodel.CreatePersonnelRequest,
	passwordHash string,
) (int64, error) {

	var id int64

	err := tx.QueryRow(
		ctx,
		`
		INSERT INTO users (
			username,
			password_hash,
			nickname,
			department_id,
			cid,
			prefix_id,
			first_name,
			last_name,
			person_type_id,
			position_id,
			email,
			phone,
			person_level,
			is_active
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
		RETURNING id
		`,
		req.Username,
		passwordHash,
		req.Nickname,
		req.DepartmentID,
		req.CID,
		req.PrefixID,
		req.FirstName,
		req.LastName,
		req.PersonTypeID,
		req.PositionID,
		req.Email,
		req.Phone,
		req.PersonLevel,
	).Scan(&id)

	if err != nil {
		return 0, err
	}

	return id, nil
}

// UpdatePersonnel — แก้ไขข้อมูลบุคลากร (อัปเดตเฉพาะ field ที่ส่งมา)
func (r *PersonnelRepository) UpdatePersonnel(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
	req personnelmodel.UpdatePersonnelRequest,
) error {

	query := `
		UPDATE users SET
			nickname = COALESCE($2, nickname),
			department_id = COALESCE($3, department_id),
			cid = COALESCE($4, cid),
			prefix_id = COALESCE($5, prefix_id),
			first_name = COALESCE($6, first_name),
			last_name = COALESCE($7, last_name),
			person_type_id = COALESCE($8, person_type_id),
			position_id = COALESCE($9, position_id),
			email = COALESCE($10, email),
			phone = COALESCE($11, phone),
			person_level = COALESCE($12, person_level),
			is_active = COALESCE($13, is_active),
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	_, err := tx.Exec(
		ctx,
		query,
		id,
		req.Nickname,
		req.DepartmentID,
		req.CID,
		req.PrefixID,
		req.FirstName,
		req.LastName,
		req.PersonTypeID,
		req.PositionID,
		req.Email,
		req.Phone,
		req.PersonLevel,
		req.IsActive,
	)

	return err
}

// ==================== ตำแหน่ง/วิทยฐานะ ====================

// ListPositions — รายการตำแหน่งทั้งหมด
func (r *PersonnelRepository) ListPositions(
	ctx context.Context,
) ([]personnelmodel.Position, error) {

	rows, err := db.DB.Query(
		ctx,
		`
		SELECT id, code, name_th, level, created_at
		FROM positions
		ORDER BY id
		`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []personnelmodel.Position

	for rows.Next() {
		var p personnelmodel.Position
		if err := rows.Scan(&p.ID, &p.Code, &p.NameTh, &p.Level, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

// PositionExistsByCode — เช็ค code ซ้ำ (excludeID ใช้ตอนแก้ไข)
func (r *PersonnelRepository) PositionExistsByCode(
	ctx context.Context,
	tx pgx.Tx,
	code string,
	excludeID int64,
) (bool, error) {

	var exists bool

	query := `
		SELECT EXISTS(
			SELECT 1 FROM positions
			WHERE code = $1 AND ($2 = 0 OR id <> $2)
		)
	`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, code, excludeID).Scan(&exists)
	} else {
		err = db.DB.QueryRow(ctx, query, code, excludeID).Scan(&exists)
	}

	if err != nil {
		return false, err
	}

	return exists, nil
}

// PositionInUse — ตำแหน่งถูกอ้างอิงโดยผู้ใช้อยู่หรือไม่ (กันลบ)
func (r *PersonnelRepository) PositionInUse(
	ctx context.Context,
	tx pgx.Tx,
	positionID int64,
) (bool, error) {

	var inUse bool

	query := `SELECT EXISTS(SELECT 1 FROM users WHERE position_id = $1)`

	var err error
	if tx != nil {
		err = tx.QueryRow(ctx, query, positionID).Scan(&inUse)
	} else {
		err = db.DB.QueryRow(ctx, query, positionID).Scan(&inUse)
	}

	if err != nil {
		return false, err
	}

	return inUse, nil
}

// CreatePosition — เพิ่มตำแหน่ง
func (r *PersonnelRepository) CreatePosition(
	ctx context.Context,
	tx pgx.Tx,
	req personnelmodel.CreatePositionRequest,
) (int64, error) {

	var id int64

	err := tx.QueryRow(
		ctx,
		`
		INSERT INTO positions (code, name_th, level)
		VALUES ($1, $2, $3)
		RETURNING id
		`,
		req.Code,
		req.NameTh,
		req.Level,
	).Scan(&id)

	if err != nil {
		return 0, err
	}

	return id, nil
}

// UpdatePosition — แก้ไขตำแหน่ง
func (r *PersonnelRepository) UpdatePosition(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
	req personnelmodel.CreatePositionRequest,
) error {

	_, err := tx.Exec(
		ctx,
		`
		UPDATE positions
		SET code = $2, name_th = $3, level = $4
		WHERE id = $1
		`,
		id,
		req.Code,
		req.NameTh,
		req.Level,
	)

	return err
}

// DeletePosition — ลบตำแหน่ง
func (r *PersonnelRepository) DeletePosition(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
) error {

	_, err := tx.Exec(ctx, `DELETE FROM positions WHERE id = $1`, id)

	return err
}

// PositionExists — เช็คว่าตำแหน่งมีอยู่จริง
func (r *PersonnelRepository) PositionExists(
	ctx context.Context,
	tx pgx.Tx,
	id int64,
) (bool, error) {

	var exists bool

	query := `SELECT EXISTS(SELECT 1 FROM positions WHERE id = $1)`

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

// ==================== ตัวเลือก ====================

// ListPersonTypes — ประเภทบุคลากร
func (r *PersonnelRepository) ListPersonTypes(
	ctx context.Context,
) ([]personnelmodel.OptionItem, error) {

	rows, err := db.DB.Query(
		ctx,
		`SELECT id, code, name_th FROM person_types ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []personnelmodel.OptionItem

	for rows.Next() {
		var o personnelmodel.OptionItem
		if err := rows.Scan(&o.ID, &o.Code, &o.NameTh); err != nil {
			return nil, err
		}
		list = append(list, o)
	}

	return list, rows.Err()
}

// ListDepartments — กลุ่มสาระ/หน่วยงาน
func (r *PersonnelRepository) ListDepartments(
	ctx context.Context,
) ([]personnelmodel.OptionItem, error) {

	rows, err := db.DB.Query(
		ctx,
		`SELECT id, code, name_th FROM departments ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []personnelmodel.OptionItem

	for rows.Next() {
		var o personnelmodel.OptionItem
		if err := rows.Scan(&o.ID, &o.Code, &o.NameTh); err != nil {
			return nil, err
		}
		list = append(list, o)
	}

	return list, rows.Err()
}

// ListPrefixes — คำนำหน้า
func (r *PersonnelRepository) ListPrefixes(
	ctx context.Context,
) ([]personnelmodel.OptionItem, error) {

	rows, err := db.DB.Query(
		ctx,
		`SELECT id, code, name_th FROM prefixes ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []personnelmodel.OptionItem

	for rows.Next() {
		var o personnelmodel.OptionItem
		if err := rows.Scan(&o.ID, &o.Code, &o.NameTh); err != nil {
			return nil, err
		}
		list = append(list, o)
	}

	return list, rows.Err()
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var digits []byte
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}
