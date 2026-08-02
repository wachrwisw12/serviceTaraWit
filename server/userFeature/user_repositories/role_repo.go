package userrepositories

import (
	"context"
	"tarawitApi/db"
	usermodel "tarawitApi/userFeature/user_model"
)


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