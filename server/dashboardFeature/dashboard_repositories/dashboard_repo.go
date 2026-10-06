package dashboardrepositories

import (
	"context"
	"fmt"

	"tarawitApi/db"
	dashboardmodel "tarawitApi/dashboardFeature/dashboard_model"
)

type DashboardRepository struct{}

func NewDashboardRepository() *DashboardRepository {
	return &DashboardRepository{}
}

// GetPersonnelStats สรุปบุคลากร: จำนวนทั้งหมด/ใช้งาน/ไม่ใช้งาน + แยกตามประเภทและตำแหน่ง
func (r *DashboardRepository) GetPersonnelStats(
	ctx context.Context,
) (*dashboardmodel.PersonnelStats, error) {
	var stats dashboardmodel.PersonnelStats
	err := db.DB.QueryRow(ctx, `
		SELECT COUNT(*),
		       COUNT(*) FILTER (WHERE is_active),
		       COUNT(*) FILTER (WHERE NOT is_active)
		FROM users
	`).Scan(&stats.Total, &stats.Active, &stats.Inactive)
	if err != nil {
		return nil, fmt.Errorf("นับบุคลากรไม่สำเร็จ: %w", err)
	}

	stats.ByType = []dashboardmodel.CountByName{}
	rows, err := db.DB.Query(ctx, `
		SELECT COALESCE(pt.id, 0), COALESCE(pt.name_th, 'ไม่ระบุ'), COUNT(u.id)
		FROM users u
		LEFT JOIN person_types pt ON pt.id = u.person_type_id
		GROUP BY pt.id, pt.name_th
		ORDER BY COUNT(u.id) DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("สรุปตามประเภทบุคลากรไม่สำเร็จ: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var c dashboardmodel.CountByName
		if err := rows.Scan(&c.ID, &c.Name, &c.Count); err != nil {
			return nil, err
		}
		stats.ByType = append(stats.ByType, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	stats.ByPos = []dashboardmodel.CountByName{}
	rows, err = db.DB.Query(ctx, `
		SELECT COALESCE(p.id, 0), COALESCE(p.name_th, 'ไม่ระบุ'), COUNT(u.id)
		FROM users u
		LEFT JOIN positions p ON p.id = u.position_id
		GROUP BY p.id, p.name_th
		ORDER BY COUNT(u.id) DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("สรุปตามตำแหน่งไม่สำเร็จ: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var c dashboardmodel.CountByName
		if err := rows.Scan(&c.ID, &c.Name, &c.Count); err != nil {
			return nil, err
		}
		stats.ByPos = append(stats.ByPos, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &stats, nil
}

// GetAttendanceStats สรุปการลงเวลา: วันนี้, เดือนนี้ และแนวโน้ม 6 เดือนล่าสุด
func (r *DashboardRepository) GetAttendanceStats(
	ctx context.Context,
) (*dashboardmodel.AttendanceStats, error) {
	var stats dashboardmodel.AttendanceStats

	// วันนี้ (รวมคนที่ยังไม่ลงเวลาด้วย)
	err := db.DB.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE r.status = 'working'),
			COUNT(*) FILTER (WHERE r.status = 'present'),
			COUNT(*) FILTER (WHERE r.status = 'late'),
			COUNT(*) FILTER (WHERE r.status = 'early_leave'),
			(SELECT COUNT(*) FROM users u
			  WHERE u.is_active
			    AND NOT EXISTS (
			      SELECT 1 FROM attendance_records rr
			      WHERE rr.user_id = u.id AND rr.record_date = CURRENT_DATE
			    ))
		FROM attendance_records r
		WHERE r.record_date = CURRENT_DATE
	`).Scan(
		&stats.Today.Working,
		&stats.Today.Present,
		&stats.Today.Late,
		&stats.Today.EarlyLeave,
		&stats.Today.Absent,
	)
	if err != nil {
		return nil, fmt.Errorf("สรุปการลงเวลาวันนี้ไม่สำเร็จ: %w", err)
	}

	// เดือนนี้ (ไม่มีแนวคิด "absent" เพราะยังเหลือวันในเดือน)
	err = db.DB.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE status = 'working'),
			COUNT(*) FILTER (WHERE status = 'present'),
			COUNT(*) FILTER (WHERE status = 'late'),
			COUNT(*) FILTER (WHERE status = 'early_leave')
		FROM attendance_records
		WHERE record_date >= date_trunc('month', CURRENT_DATE)
		  AND record_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
	`).Scan(
		&stats.Month.Working,
		&stats.Month.Present,
		&stats.Month.Late,
		&stats.Month.EarlyLeave,
	)
	if err != nil {
		return nil, fmt.Errorf("สรุปการลงเวลาเดือนนี้ไม่สำเร็จ: %w", err)
	}

	// แนวโน้ม 6 เดือนล่าสุด (นับครั้งตามสถานะ ต่อเดือน)
	stats.Trend = []dashboardmodel.MonthTrend{}
	rows, err := db.DB.Query(ctx, `
		SELECT to_char(record_date, 'YYYY-MM'),
		       COUNT(*) FILTER (WHERE status = 'working'),
		       COUNT(*) FILTER (WHERE status = 'present'),
		       COUNT(*) FILTER (WHERE status = 'late'),
		       COUNT(*) FILTER (WHERE status = 'early_leave')
		FROM attendance_records
		WHERE record_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
		GROUP BY 1
		ORDER BY 1
	`)
	if err != nil {
		return nil, fmt.Errorf("โหลดแนวโน้มการลงเวลาไม่สำเร็จ: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var m dashboardmodel.MonthTrend
		if err := rows.Scan(
			&m.Month,
			&m.Working,
			&m.Present,
			&m.Late,
			&m.EarlyLeave,
		); err != nil {
			return nil, err
		}
		m.Label = thaiMonthShort(m.Month)
		stats.Trend = append(stats.Trend, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &stats, nil
}

// GetTemplateStats สรุปเทมเพลตประเมิน: จำนวนทั้งหมด/ใช้งาน/ฉบับร่าง/ปิดใช้งาน
func (r *DashboardRepository) GetTemplateStats(
	ctx context.Context,
) (*dashboardmodel.TemplateStats, error) {
	var stats dashboardmodel.TemplateStats
	err := db.DB.QueryRow(ctx, `
		SELECT COUNT(*),
		       COUNT(*) FILTER (WHERE status = 'ACTIVE'),
		       COUNT(*) FILTER (WHERE status = 'DRAFT'),
		       COUNT(*) FILTER (WHERE status = 'INACTIVE')
		FROM evaluation_templates
	`).Scan(&stats.Total, &stats.Active, &stats.Draft, &stats.Inactive)
	if err != nil {
		return nil, fmt.Errorf("นับเทมเพลตไม่สำเร็จ: %w", err)
	}
	return &stats, nil
}

// GetEvaluationStats สรุปการประเมิน: จำนวน instance/assignment + คะแนนเฉลี่ย
func (r *DashboardRepository) GetEvaluationStats(
	ctx context.Context,
) (*dashboardmodel.EvaluationStats, error) {
	var stats dashboardmodel.EvaluationStats

	// instance แยกตามสถานะ
	err := db.DB.QueryRow(ctx, `
		SELECT COUNT(*),
		       COUNT(*) FILTER (WHERE status = 'DRAFT'),
		       COUNT(*) FILTER (WHERE status = 'OPEN'),
		       COUNT(*) FILTER (WHERE status = 'CLOSED')
		FROM evaluation_instances
	`).Scan(&stats.Instances.Total, &stats.Instances.Draft, &stats.Instances.Open, &stats.Instances.Closed)
	if err != nil {
		return nil, fmt.Errorf("นับรายการประเมินไม่สำเร็จ: %w", err)
	}

	// assignment + ความครบถ้วน
	err = db.DB.QueryRow(ctx, `
		SELECT COUNT(*),
		       COUNT(*) FILTER (WHERE status = 'submitted'),
		       CASE WHEN COUNT(*) > 0
		            THEN COUNT(*) FILTER (WHERE status = 'submitted')::numeric / COUNT(*) * 100
		            ELSE 0 END
		FROM evaluation_assignments
	`).Scan(
		&stats.Assignments.Total,
		&stats.Assignments.Submitted,
		&stats.Assignments.CompletionPercent,
	)
	if err != nil {
		return nil, fmt.Errorf("นับการประเมินที่ส่งไม่สำเร็จ: %w", err)
	}

	// คะแนนเฉลี่ยรวม (เปอร์เซ็นต์ เฉลี่ยจากทุก assignment ที่ส่งแล้ว)
	var avg *float64
	err = db.DB.QueryRow(ctx, `
		SELECT AVG(sub.pct)
		FROM (
			SELECT es.assignment_id,
			       SUM(es.score)::numeric / NULLIF(SUM(COALESCE(eiq.max_score, 0)), 0) * 100 AS pct
			FROM evaluation_answers es
			JOIN evaluation_instance_questions eiq ON eiq.id = es.question_id
			JOIN evaluation_assignments ea ON ea.id = es.assignment_id
			WHERE ea.status = 'submitted'
			GROUP BY es.assignment_id
		) sub
	`).Scan(&avg)
	if err != nil {
		return nil, fmt.Errorf("คำนวณคะแนนเฉลี่ยไม่สำเร็จ: %w", err)
	}
	stats.AvgPercent = avg

	// คะแนนเฉลี่ยแยกรายแม่แบบ
	stats.AvgByTemplate = []dashboardmodel.TemplateAvg{}
	rows, err := db.DB.Query(ctx, `
		SELECT t.template_name, COUNT(*) AS assignments, AVG(t.pct) AS avg_pct
		FROM (
			SELECT ei.template_name,
			       es.assignment_id,
			       SUM(es.score)::numeric / NULLIF(SUM(COALESCE(eiq.max_score, 0)), 0) * 100 AS pct
			FROM evaluation_answers es
			JOIN evaluation_instance_questions eiq ON eiq.id = es.question_id
			JOIN evaluation_assignments ea ON ea.id = es.assignment_id
			JOIN evaluation_instances ei ON ei.id = ea.instance_id
			WHERE ea.status = 'submitted'
			GROUP BY ei.template_name, es.assignment_id
		) t
		GROUP BY t.template_name
		ORDER BY AVG(t.pct) DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("คำนวณคะแนนเฉลี่ยรายแม่แบบไม่สำเร็จ: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var t dashboardmodel.TemplateAvg
		if err := rows.Scan(&t.TemplateName, &t.Assignments, &t.AvgPercent); err != nil {
			return nil, err
		}
		stats.AvgByTemplate = append(stats.AvgByTemplate, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &stats, nil
}

var thaiMonths = []string{
	"", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
	"ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
}

func thaiMonthShort(ym string) string {
	if len(ym) != 7 {
		return ym
	}
	var y, m int
	if _, err := fmt.Sscanf(ym, "%d-%d", &y, &m); err != nil || m < 1 || m > 12 {
		return ym
	}
	// แปลง ค.ศ. เป็น พ.ศ.
	return fmt.Sprintf("%s %d", thaiMonths[m], y+543)
}
