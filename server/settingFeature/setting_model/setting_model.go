package settingmodel

import "time"

// SchoolInfo — ข้อมูลโรงเรียน (ตาราง organizations)
type SchoolInfo struct {
	ID               int64   `json:"id"`
	Code             *string `json:"code"`
	Name             string  `json:"name"`
	Type             *string `json:"type"`
	Province         *string `json:"province"`
	Address          *string `json:"address"`
	Phone            *string `json:"phone"`
	Email            *string `json:"email"`
	DirectorName     *string `json:"director_name"`
	SystemName       *string `json:"system_name"`
	SystemShortName  *string `json:"system_short_name"`
}

// UpdateSchoolRequest — แก้ไขข้อมูลโรงเรียน
type UpdateSchoolRequest struct {
	Code            *string `json:"code"`
	Name            *string `json:"name"`
	Type            *string `json:"type"`
	Province        *string `json:"province"`
	Address         *string `json:"address"`
	Phone           *string `json:"phone"`
	Email           *string `json:"email"`
	DirectorName    *string `json:"director_name"`
	SystemName      *string `json:"system_name"`
	SystemShortName *string `json:"system_short_name"`
}

// AcademicYear — ปีการศึกษา
type AcademicYear struct {
	ID        int64     `json:"id"`
	Year      int       `json:"year"`
	IsCurrent bool      `json:"is_current"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateAcademicYearRequest — สร้างปีการศึกษา
type CreateAcademicYearRequest struct {
	Year int `json:"year"`
}

// ScoreLevel — ระดับคะแนน (สเกล 1-5)
type ScoreLevel struct {
	ID        int64  `json:"id"`
	Score     int    `json:"score"`
	Label     string `json:"label"`
	Color     string `json:"color"`
	TextColor string `json:"text_color"`
	IsActive  bool   `json:"is_active"`
	SortOrder int    `json:"sort_order"`
}

// UpdateScoreLevelRequest — แก้ไขระดับคะแนน
type UpdateScoreLevelRequest struct {
	Label     *string `json:"label"`
	Color     *string `json:"color"`
	TextColor *string `json:"text_color"`
	SortOrder *int    `json:"sort_order"`
	IsActive  *bool   `json:"is_active"`
}
