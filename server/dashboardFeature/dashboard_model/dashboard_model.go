package dashboardmodel

// ExecutiveDashboard สรุปภาพรวมข้ามโมดูลสำหรับผู้บริหาร
type ExecutiveDashboard struct {
	Personnel  PersonnelStats  `json:"personnel"`
	Attendance AttendanceStats `json:"attendance"`
	Evaluation EvaluationStats `json:"evaluation"`
	Template   TemplateStats   `json:"template"`
}

type PersonnelStats struct {
	Total    int              `json:"total"`
	Active   int              `json:"active"`
	Inactive int              `json:"inactive"`
	ByType   []CountByName    `json:"by_type"`
	ByPos    []CountByName    `json:"by_position"`
}

type CountByName struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type AttendanceStats struct {
	Today AttendanceDay `json:"today"`
	Month AttendanceDay `json:"month"`
	Trend []MonthTrend  `json:"trend"` // 6 เดือนล่าสุด
}

type AttendanceDay struct {
	Working    int `json:"working"`     // ยังอยู่ระหว่างทำงาน (เข้าแล้ว ยังไม่ออก)
	Present    int `json:"present"`     // เข้า-ออกครบ ตรงเวลา
	Late       int `json:"late"`        // เข้าสาย
	EarlyLeave int `json:"early_leave"` // ออกก่อนเวลา
	Absent     int `json:"absent"`      // ยังไม่ได้ลงเวลา (เฉพาะวันนี้)
}

type MonthTrend struct {
	Month      string `json:"month"` // YYYY-MM
	Label      string `json:"label"` // เช่น "มี.ค."
	Working    int    `json:"working"`
	Present    int    `json:"present"`
	Late       int    `json:"late"`
	EarlyLeave int    `json:"early_leave"`
}

type EvaluationStats struct {
	Instances       InstanceStats        `json:"instances"`
	Assignments     AssignmentStats      `json:"assignments"`
	AvgPercent      *float64             `json:"avg_percent"` // คะแนนเฉลี่ยรวม (เปอร์เซ็นต์)
	AvgByTemplate   []TemplateAvg        `json:"avg_by_template"`
}

type InstanceStats struct {
	Total  int `json:"total"`
	Draft  int `json:"draft"`
	Open   int `json:"open"`
	Closed int `json:"closed"`
}

type AssignmentStats struct {
	Total             int     `json:"total"`
	Submitted         int     `json:"submitted"`
	CompletionPercent float64 `json:"completion_percent"`
}

type TemplateStats struct {
	Total    int `json:"total"`
	Active   int `json:"active"`
	Draft    int `json:"draft"`
	Inactive int `json:"inactive"`
}

type TemplateAvg struct {
	TemplateName string   `json:"template_name"`
	Assignments  int      `json:"assignments"`
	AvgPercent   *float64 `json:"avg_percent"`
}
