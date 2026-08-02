package userrepositories

import (
	"context"
	"encoding/json"

	"tarawitApi/db"
	"tarawitApi/models"
	usermodel "tarawitApi/userFeature/user_model"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
    return &UserRepository{}
}

func (r *UserRepository) GetAllUser() ([]models.User, error) {
   
	query := `
	SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,

    pt.name_th AS person_type_name,
    pt.code AS person_type_code,

    pst.name_th AS position_name,

    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'role_id', r.id,
                'role_name', r.name
            )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'::jsonb
    ) AS roles

FROM users u

LEFT JOIN person_types pt 
    ON pt.id = u.person_type_id

LEFT JOIN positions pst 
    ON pst.id = u.position_id

LEFT JOIN user_roles ur
    ON ur.user_id = u.id

LEFT JOIN roles r
    ON r.id = ur.role_id


GROUP BY
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    pt.name_th,
    pt.code,
    pst.name_th`
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
    &user.Position,
    &user.Roles,
)
		if err != nil {
			return nil, err
		}
     jsonRoles, err := json.Marshal(user.Roles)
    if err != nil {
        return nil, err
    }

    var roles []models.UserRole
    err = json.Unmarshal(jsonRoles, &roles)
    if err != nil {
        return nil, err
    }
    user.Roles = roles
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}
func (r *UserRepository) GetUserByID(
	id int64,
) (*usermodel.UserInfo,error){

	var user usermodel.UserInfo
query := `
	SELECT
    u.id,
    pf.name_th AS prefixes,
    u.username,
    pos.name_th AS position,
    u.first_name,
    u.last_name,
    u.phone,
    u.is_active,

    pt.id AS person_type_id,
    pt.name_th AS person_type_name,
    
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'role_id', r.id,
                'role_code', r.code,
                'role_name', r.name
            )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'::jsonb
    ) AS roles,

    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'permission_id', p.id,
                'permission_code', p.code,
                'permission_name', p.name,
                'module', p.module
            )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::jsonb
    ) AS permissions
    
FROM users u

LEFT JOIN prefixes pf
    ON pf.id = u.prefix_id

LEFT JOIN positions pos
    ON pos.id = u.position_id

LEFT JOIN person_types pt
    ON pt.id = u.person_type_id

LEFT JOIN user_roles ur
    ON ur.user_id = u.id

LEFT JOIN roles r
    ON r.id = ur.role_id

LEFT JOIN role_permissions rp
    ON rp.role_id = r.id

LEFT JOIN permissions p
    ON p.id = rp.permission_id

WHERE u.id = $1

GROUP BY
    u.id,
    pf.name_th,
    pos.name_th,
    u.username,
    u.first_name,
    u.last_name,
    u.phone,
    u.is_active,
    pt.id,
    pt.name_th;
	`


var rolesJSON []byte
var permissionsJSON []byte
	err := db.DB.QueryRow(
	context.Background(),
	query,
	id,
).Scan(
	&user.ID,
	&user.Prefixes,
	&user.Username,
	&user.Position,
	&user.FirstName,
	&user.LastName,
	&user.Phone,
	&user.IsActive,
	&user.PersonTypeID,
	&user.PersonTypeName,
	&rolesJSON,
	&permissionsJSON,
)

if err != nil {
	return nil, err
}

if len(rolesJSON) > 0 {
	if err := json.Unmarshal(rolesJSON, &user.Roles); err != nil {
		return nil, err
	}
}

if len(permissionsJSON) > 0 {
	if err := json.Unmarshal(permissionsJSON, &user.Permissions); err != nil {
		return nil, err
	}
}

return &user, nil
}

