package usermodel

type Roles struct {
	ID              int64   `json:"id"`
	Name            string  `json:"name"`
	Code            string  `json:"code"`
	PermissionCount int8    `json:"permissionCount"`
	Description     string  `json:"description"`
	Icon            string  `json:"icon"`
	Colors          string  `json:"color"`
	IsActive        bool    `json:"is_active"`
	PermissionIDs   []int64 `json:"permission_ids"`
}

// PermissionDef — รายการ permission ทั้งหมดในระบบ (ใช้ในหน้า Role/Permission)
type PermissionDef struct {
	ID          int64  `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Module      string `json:"module"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
}

// UpdateRolePermissionsRequest — ตั้งค่า permission ใหม่ทั้งหมดของ role
type UpdateRolePermissionsRequest struct {
	PermissionIDs []int64 `json:"permission_ids"`
}
