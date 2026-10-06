package models

type AuthRequest struct {
	Uid      string `json:"uid"`
	Username string `json:"username"`
	Password string `json:"password"`
}
type AuthResponse struct {
	Token        string `json:"token"`         // access token (อายุสั้น ~1 ชม.)
	RefreshToken string `json:"refresh_token"` // refresh token (30 วัน, ใช้ต่ออายุ)
	User         User   `json:"user"`
}
type User struct {
	ID            int64          `json:"id" db:"id"`
	Username      string       `json:"username" db:"username"`
	PasswordHash  string       `json:"-" db:"password_hash"`
    Position       string      `json:"position"`
	FirstName     *string       `json:"first_name,omitempty" db:"first_name"`
	LastName      *string       `json:"last_name,omitempty" db:"last_name"`
    Phone         *string       `json:"phone,omitempty"`
	IsActive      bool          `json:"is_active"`
	Email         *string      `json:"email,omitempty" db:"email"`
    AvatarURL     *string      `json:"avatar_url,omitempty" db:"avatar_url"`
    PersonTypeCode string `json:"person_type_code"`
	PersonTypeName string `json:"person_type_name"`
    Prefixes      string       `json:"prefixes"`
    PrefixCode    string       `json:"prefix_code"`
	Roles         []UserRole   `json:"roles"`
	Permissions   []Permission `json:"permissions"`
}


type UserRole struct {
	RoleID    int 	`json:"role_id"`
	RoleName string `json:"role_name"`
}


type Permission struct {
	PermissionName string `json:"permission_name"`
}
