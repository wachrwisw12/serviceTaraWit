package attendancemodel

import (
	"encoding/json"
	"time"
)

// AttendanceSettings ตั้งค่าการลงเวลาปฏิบัติงาน
type AttendanceSettings struct {
	ID                    int64   `json:"id"`
	WorkStart             string  `json:"work_start"`              // HH:MM:SS (เวลาท้องถิ่น)
	LateThreshold         string  `json:"late_threshold"`          // สายเมื่อเข้าเกินเวลานี้
	WorkEnd               string  `json:"work_end"`                // เวลาเลิกงาน
	GraceEnd              string  `json:"grace_end"`               // เวลาออกงานล่าสุด
	TimezoneOffsetMinutes int64   `json:"timezone_offset_minutes"` // เช่น 420 = UTC+7 (ไทย)
	IsActive              bool    `json:"is_active"`
	GeofenceEnabled       bool    `json:"geofence_enabled"`
	MaxLocationAccuracyM  float64 `json:"max_location_accuracy_m"`
	CheckInOpen           string  `json:"check_in_open"`
	CheckInClose          string  `json:"check_in_close"`
	CheckOutOpen          string  `json:"check_out_open"`
	CheckOutClose         string  `json:"check_out_close"`
}

// AttendanceRecord บันทึกการลงเวลาของผู้ใช้ 1 คนต่อ 1 วัน
type AttendanceRecord struct {
	ID                     int64      `json:"id"`
	UserID                 int64      `json:"user_id"`
	RecordDate             string     `json:"record_date"` // YYYY-MM-DD
	CheckInAt              *time.Time `json:"check_in_at"`
	CheckOutAt             *time.Time `json:"check_out_at"`
	Status                 string     `json:"status"` // working | present | late | early_leave
	WorkMinutes            *int       `json:"work_minutes"`
	Note                   *string    `json:"note"`
	CheckInLatitude        *float64   `json:"check_in_latitude,omitempty"`
	CheckInLongitude       *float64   `json:"check_in_longitude,omitempty"`
	CheckInAccuracyM       *float64   `json:"check_in_accuracy_m,omitempty"`
	CheckInDistanceM       *float64   `json:"check_in_distance_m,omitempty"`
	CheckInLocationID      *int64     `json:"check_in_location_id,omitempty"`
	CheckInInsideArea      *bool      `json:"check_in_inside_area,omitempty"`
	CheckInOutsideAllowed  bool       `json:"check_in_outside_allowed"`
	CheckOutLatitude       *float64   `json:"check_out_latitude,omitempty"`
	CheckOutLongitude      *float64   `json:"check_out_longitude,omitempty"`
	CheckOutAccuracyM      *float64   `json:"check_out_accuracy_m,omitempty"`
	CheckOutDistanceM      *float64   `json:"check_out_distance_m,omitempty"`
	CheckOutLocationID     *int64     `json:"check_out_location_id,omitempty"`
	CheckOutInsideArea     *bool      `json:"check_out_inside_area,omitempty"`
	CheckOutOutsideAllowed bool       `json:"check_out_outside_allowed"`
}

type LocationRequest struct {
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
	AccuracyM *float64 `json:"accuracy_m"`
}

type AttendanceLocation struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	RadiusM   float64 `json:"radius_m"`
	IsActive  bool    `json:"is_active"`
}

type GeofenceDecision struct {
	Enabled        bool     `json:"enabled"`
	InsideArea     bool     `json:"inside_area"`
	OutsideAllowed bool     `json:"outside_allowed"`
	LocationID     *int64   `json:"location_id,omitempty"`
	LocationName   *string  `json:"location_name,omitempty"`
	DistanceM      *float64 `json:"distance_m,omitempty"`
}

type AttendanceGroup struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	IsActive    bool    `json:"is_active"`
	MemberIDs   []int64 `json:"member_ids"`
}

type AttendanceUserOption struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type GeofenceConfig struct {
	Enabled              bool                 `json:"enabled"`
	MaxLocationAccuracyM float64              `json:"max_location_accuracy_m"`
	Locations            []AttendanceLocation `json:"locations"`
	CheckInOpen          string               `json:"check_in_open"`
	CheckInClose         string               `json:"check_in_close"`
	CheckOutOpen         string               `json:"check_out_open"`
	CheckOutClose        string               `json:"check_out_close"`
}

type UserGeofencePolicy struct {
	Enabled              bool                 `json:"enabled"`
	MaxLocationAccuracyM float64              `json:"max_location_accuracy_m"`
	OutsideAllowed       bool                 `json:"outside_allowed"`
	Locations            []AttendanceLocation `json:"locations"`
	CheckInOpen          string               `json:"check_in_open"`
	CheckInClose         string               `json:"check_in_close"`
	CheckOutOpen         string               `json:"check_out_open"`
	CheckOutClose        string               `json:"check_out_close"`
}

type UpdateGeofenceConfigRequest struct {
	Enabled              bool    `json:"enabled"`
	MaxLocationAccuracyM float64 `json:"max_location_accuracy_m"`
	CheckInOpen          string  `json:"check_in_open"`
	CheckInClose         string  `json:"check_in_close"`
	CheckOutOpen         string  `json:"check_out_open"`
	CheckOutClose        string  `json:"check_out_close"`
}

type SaveLocationRequest struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	RadiusM   float64 `json:"radius_m"`
	IsActive  *bool   `json:"is_active"`
}

type SaveGroupRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

type ReplaceMembersRequest struct {
	UserIDs []int64 `json:"user_ids"`
}

type OutsideAccessRequest struct {
	UserIDs  []int64 `json:"user_ids"`
	GroupIDs []int64 `json:"group_ids"`
}

type MonthSummary struct {
	Working        int `json:"working"`
	Present        int `json:"present"`
	Late           int `json:"late"`
	EarlyLeave     int `json:"early_leave"`
	MissedCheckout int `json:"missed_checkout"`
}

type MyRecordsResponse struct {
	Records []AttendanceRecord `json:"records"`
	Summary MonthSummary       `json:"summary"`
}

// AttendanceRecordWithUser บันทึกการลงเวลาพร้อมข้อมูลผู้ใช้ (ใช้ฝั่งผู้ดูแล)
type AttendanceRecordWithUser struct {
	ID                     int64      `json:"id"`
	UserID                 int64      `json:"user_id"`
	FirstName              *string    `json:"first_name"`
	LastName               *string    `json:"last_name"`
	Username               string     `json:"username"`
	RecordDate             string     `json:"record_date"`
	CheckInAt              *time.Time `json:"check_in_at"`
	CheckOutAt             *time.Time `json:"check_out_at"`
	Status                 string     `json:"status"`
	WorkMinutes            *int       `json:"work_minutes"`
	Note                   *string    `json:"note"`
	CheckInDistanceM       *float64   `json:"check_in_distance_m,omitempty"`
	CheckInInsideArea      *bool      `json:"check_in_inside_area,omitempty"`
	CheckInOutsideAllowed  bool       `json:"check_in_outside_allowed"`
	CheckOutDistanceM      *float64   `json:"check_out_distance_m,omitempty"`
	CheckOutInsideArea     *bool      `json:"check_out_inside_area,omitempty"`
	CheckOutOutsideAllowed bool       `json:"check_out_outside_allowed"`
}

type AllRecordsResponse struct {
	Records []AttendanceRecordWithUser `json:"records"`
	Summary MonthSummary               `json:"summary"`
}

type UpdateAttendanceRecordRequest struct {
	CheckInAt  *time.Time `json:"check_in_at"`
	CheckOutAt *time.Time `json:"check_out_at"`
	Status     string     `json:"status"`
	Note       *string    `json:"note"`
	Reason     string     `json:"reason"`
}

type AttendanceAuditLog struct {
	ID                 int64           `json:"id"`
	AttendanceRecordID int64           `json:"attendance_record_id"`
	EditedBy           int64           `json:"edited_by"`
	EditorName         string          `json:"editor_name"`
	Reason             string          `json:"reason"`
	OldData            json.RawMessage `json:"old_data"`
	NewData            json.RawMessage `json:"new_data"`
	EditedAt           time.Time       `json:"edited_at"`
}
