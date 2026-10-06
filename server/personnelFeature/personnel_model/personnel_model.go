package personnelmodel

import "time"

// Personnel — รายการบุคลากร (ผู้ใช้ที่มีข้อมูลบุคลากรครบ)
type Personnel struct {
	ID             int64     `json:"id"`
	Username       string    `json:"username"`
	Nickname       *string   `json:"nickname"`
	CID            *string   `json:"cid"`
	PrefixID       *int64    `json:"prefix_id"`
	PrefixName     *string   `json:"prefix_name"`
	PrefixCode     *string   `json:"prefix_code"`
	FirstName      *string   `json:"first_name"`
	LastName       *string   `json:"last_name"`
	DepartmentID   *int      `json:"department_id"`
	DepartmentCode *string   `json:"department_code"`
	DepartmentName *string   `json:"department_name"`
	PersonTypeID   *int      `json:"person_type_id"`
	PersonTypeCode *string   `json:"person_type_code"`
	PersonTypeName *string   `json:"person_type_name"`
	PositionID     *int      `json:"position_id"`
	PositionCode   *string   `json:"position_code"`
	PositionName   *string   `json:"position_name"`
	Email          *string   `json:"email"`
	Phone          *string   `json:"phone"`
	PersonLevel    *int      `json:"person_level"`
	IsActive       bool      `json:"is_active"`
	AvatarURL      *string   `json:"avatar_url"`
	CreatedAt      time.Time `json:"created_at"`
}

// ListPersonnelFilter — ตัวกรองจาก query string
type ListPersonnelFilter struct {
	Search       string
	PersonTypeID int
	PositionID   int
	IsActive     string // "", "true", "false"
	Page         int    // หน้า (เริ่มที่ 1)
	Limit        int    // จำนวนรายการต่อหน้า
}

// PaginatedPersonnelResponse — ผลลัพธ์แบบมี pagination
type PaginatedPersonnelResponse struct {
	Items      []Personnel `json:"items"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

// CreatePersonnelRequest — สร้างบุคลากรใหม่ (รวม account)
type CreatePersonnelRequest struct {
	Username     string  `json:"username"`
	Password     string  `json:"password"`
	Nickname     *string `json:"nickname"`
	DepartmentID *int    `json:"department_id"`
	CID          *string `json:"cid"`
	PrefixID     *int64  `json:"prefix_id"`
	FirstName    *string `json:"first_name"`
	LastName     *string `json:"last_name"`
	PersonTypeID *int    `json:"person_type_id"`
	PositionID   *int    `json:"position_id"`
	Email        *string `json:"email"`
	Phone        *string `json:"phone"`
	PersonLevel  *int    `json:"person_level"`
}

// UpdatePersonnelRequest — แก้ไขข้อมูลบุคลากร (ไม่แตะ username/password)
type UpdatePersonnelRequest struct {
	Nickname     *string `json:"nickname"`
	DepartmentID *int    `json:"department_id"`
	CID          *string `json:"cid"`
	PrefixID     *int64  `json:"prefix_id"`
	FirstName    *string `json:"first_name"`
	LastName     *string `json:"last_name"`
	PersonTypeID *int    `json:"person_type_id"`
	PositionID   *int    `json:"position_id"`
	Email        *string `json:"email"`
	Phone        *string `json:"phone"`
	PersonLevel  *int    `json:"person_level"`
	IsActive     *bool   `json:"is_active"`
}

// Position — ตำแหน่ง/วิทยฐานะ
type Position struct {
	ID        int64     `json:"id"`
	Code      string    `json:"code"`
	NameTh    string    `json:"name_th"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"created_at"`
}

// CreatePositionRequest — สร้าง/แก้ไขตำแหน่ง
type CreatePositionRequest struct {
	Code   string `json:"code"`
	NameTh string `json:"name_th"`
	Level  int    `json:"level"`
}

// BatchCreatePersonnelRequest — สร้างบุคลากรหลายคนพร้อมกัน
type BatchCreatePersonnelRequest struct {
	Items []CreatePersonnelRequest `json:"items" validate:"required,min=1"`
}

// BatchCreateResult — ผลลัพธ์จากการสร้างหลายคน
type BatchCreateResult struct {
	Total     int                `json:"total"`
	Success   int                `json:"success"`
	Failed    int                `json:"failed"`
	Errors    []BatchCreateError `json:"errors,omitempty"`
	CreatedIDs []int64           `json:"created_ids,omitempty"`
}

// BatchCreateError — รายการที่สร้างไม่สำเร็จ
type BatchCreateError struct {
	RowIndex int    `json:"row_index"`
	Username string `json:"username"`
	Message  string `json:"message"`
}

// AdminResetPasswordRequest — รีเซ็ตรหัสผ่านโดยแอดมิน (ไม่ต้องตรวจรหัสเดิม)
type AdminResetPasswordRequest struct {
	NewPassword string `json:"new_password"`
}

// OptionItem — รายการตัวเลือกทั่วไป (ประเภทบุคลากร, กลุ่มสาระ, คำนำหน้า)
type OptionItem struct {
	ID    int64  `json:"id"`
	Code  string `json:"code"`
	NameTh string `json:"name_th"`
}
