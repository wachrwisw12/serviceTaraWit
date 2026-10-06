package userrepositories

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"tarawitApi/db"
	usermodel "tarawitApi/userFeature/user_model"
)

// GetRolesWithPermissionsRepo — รายการ role พร้อม permission_ids (ใช้หน้า Role/Permission)
func (r *UserRepository) GetRolesWithPermissionsRepo() ([]usermodel.Roles, error) {
	query := `
		SELECT
			r.id,
			r.code,
			r.name,
			r.description,
			r.icon,
			r.color,
			r.is_active,
			COALESCE(
				(SELECT jsonb_agg(rp.permission_id)
				 FROM role_permissions rp
				 WHERE rp.role_id = r.id),
				'[]'::jsonb
			) AS permission_ids
		FROM roles r
		ORDER BY r.id
	`

	rows, err := db.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []usermodel.Roles

	for rows.Next() {
		var role usermodel.Roles
		var permissionIDsJSON []byte

		err := rows.Scan(
			&role.ID,
			&role.Code,
			&role.Name,
			&role.Description,
			&role.Icon,
			&role.Colors,
			&role.IsActive,
			&permissionIDsJSON,
		)
		if err != nil {
			return nil, err
		}

		if len(permissionIDsJSON) > 0 {
			if err := json.Unmarshal(permissionIDsJSON, &role.PermissionIDs); err != nil {
				return nil, err
			}
		}

		role.PermissionCount = int8(len(role.PermissionIDs))
		roles = append(roles, role)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return roles, nil
}

// GetAllPermissionsRepo — รายการ permission ทั้งหมด (catalog สำหรับตั้งสิทธิ์)
func (r *UserRepository) GetAllPermissionsRepo() ([]usermodel.PermissionDef, error) {
	query := `
		SELECT id, code, name, module, COALESCE(description, ''), is_active
		FROM permissions
		WHERE is_active = true
		ORDER BY module, id
	`

	rows, err := db.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []usermodel.PermissionDef

	for rows.Next() {
		var p usermodel.PermissionDef

		err := rows.Scan(
			&p.ID,
			&p.Code,
			&p.Name,
			&p.Module,
			&p.Description,
			&p.IsActive,
		)
		if err != nil {
			return nil, err
		}

		permissions = append(permissions, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return permissions, nil
}

// RoleExistsRepo — เช็คว่า role มีอยู่จริง (ใช้ใน transaction)
func (r *UserRepository) RoleExistsRepo(
	ctx context.Context,
	tx pgx.Tx,
	roleID int64,
) (bool, error) {

	var exists bool

	err := tx.QueryRow(
		ctx,
		`
		SELECT EXISTS(
			SELECT 1
			FROM roles
			WHERE id = $1
		)
		`,
		roleID,
	).Scan(&exists)

	if err != nil {
		return false, err
	}

	return exists, nil
}

// UpdateRolePermissionsRepo — แทนที่ permission ทั้งหมดของ role
func (r *UserRepository) UpdateRolePermissionsRepo(
	ctx context.Context,
	tx pgx.Tx,
	roleID int64,
	permissionIDs []int64,
) error {

	if _, err := tx.Exec(
		ctx,
		`DELETE FROM role_permissions WHERE role_id = $1`,
		roleID,
	); err != nil {
		return err
	}

	for _, permissionID := range permissionIDs {
		if _, err := tx.Exec(
			ctx,
			`
			INSERT INTO role_permissions(role_id, permission_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
			`,
			roleID,
			permissionID,
		); err != nil {
			return err
		}
	}

	return nil
}

func (r *UserRepository) GetRolesRepo() ([]usermodel.Roles, error) {
	query := `
		SELECT r.id,r.code,r.name,r.description,r.icon,r.color,count(rp.role_id) as role_permision,r.is_active FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r."id"
GROUP BY r."id"
	`

	rows, err := db.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []usermodel.Roles

	for rows.Next() {
		var role usermodel.Roles

		err := rows.Scan(
			&role.ID,
			&role.Code,
			&role.Name,
			&role.Description,
			&role.Icon,
			&role.Colors,
			&role.PermissionCount,
			&role.IsActive,
		)
		if err != nil {
			return nil, err
		}

		roles = append(roles, role)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return roles, nil
}