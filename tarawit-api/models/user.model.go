package models

type User struct {
	ID            int64          `json:"id" db:"id"`
	Username      string       `json:"username" db:"username"`
	PasswordHash  string       `json:"-" db:"password_hash"`

	FirstName     *string       `json:"first_name,omitempty" db:"first_name"`
	LastName      *string       `json:"last_name,omitempty" db:"last_name"`
    Phone         *string       `json:"phone,omitempty `
	IsActive      bool          `json:"is_active"`
	Email         *string      `json:"email,omitempty" db:"email"`
    PersonTypeCode string `json:"person_type_code"`
	PersonTypeName string `json:"person_type_name"`
	Roles         []UserRole   `json:"roles"`
	Permissions   []Permission `json:"permissions"`
}


type UserRole struct {
	RoleName string `json:"role_name"`
}


type Permission struct {
	PermissionName string `json:"permission_name"`
}
