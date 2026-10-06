package usermodel

type UserInfo struct {
	ID             int64   `json:"id"`
	Prefixes       string  `json:"prefixes"`
	Username       string  `json:"username"`
	PasswordHash   string  `json:"-"`
	Position       string  `json:"position"`
	FirstName      *string `json:"first_name,omitempty"`
	LastName       *string `json:"last_name,omitempty"`
	Phone          *string `json:"phone,omitempty"`
	AvatarURL      *string `json:"avatar_url,omitempty"`
	IsActive       bool    `json:"is_active"`
	Email          *string `json:"email,omitempty"`
	PersonTypeID   string  `json:"person_type_id"`
	PersonTypeName string  `json:"person_type_name"`

	Roles       []UserRole   `json:"roles"`
	Permissions []Permission `json:"permissions"`
}

type UserRole struct {
	RoleID   int64  `json:"role_id"`
	RoleCode string `json:"role_code"`
	RoleName string `json:"role_name"`
}

type Permission struct {
	PermissionID   int64  `json:"permission_id"`
	PermissionCode string `json:"permission_code"`
	PermissionName string `json:"permission_name"`
	Module         string `json:"module"`
}

type UpdateUserRoleRequest struct {
	PersonTypeID *int64  `json:"person_type_id"`
	RoleIDs      []int64 `json:"role_ids"`
}
