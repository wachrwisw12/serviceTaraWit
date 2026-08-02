package usermodel


type Roles struct {
	ID  int64 `json:"id"`
	Name string `json:"name"`
	Code string `json:"code"`
	PermissionCount int8 `json:"permissionCount"`
	Description string `json:"description"`
	Icon string `json:"icon"`
	Colors string `json:"color"`
	IsActive bool `json:"is_active"`
}