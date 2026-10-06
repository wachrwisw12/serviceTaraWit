package attendanceservices

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	attendancemodel "tarawitApi/attendanceFeature/attendance_model"
	attendancerepositories "tarawitApi/attendanceFeature/attendance_repositories"
)

var (
	ErrAlreadyCheckedIn   = errors.New("คุณลงเวลาเข้างานแล้ว")
	ErrNotCheckedIn       = errors.New("ยังไม่ได้ลงเวลาเข้างานวันนี้")
	ErrAlreadyCheckedOut  = errors.New("คุณลงเวลาออกงานแล้ว")
	ErrLocationRequired   = errors.New("กรุณาเปิดตำแหน่งที่ตั้งเพื่อยืนยันพื้นที่ลงเวลา")
	ErrLocationInaccurate = errors.New("ตำแหน่งที่ตั้งคลาดเคลื่อนมากเกินไป กรุณารอให้ GPS แม่นยำแล้วลองใหม่")
	ErrOutsideArea        = errors.New("คุณอยู่นอกพื้นที่ที่อนุญาตให้ลงเวลา")
	ErrNoActiveLocation   = errors.New("ยังไม่ได้กำหนดจุดลงเวลาที่ใช้งาน")
)

type AttendanceService struct {
	repo *attendancerepositories.AttendanceRepository
}

func NewAttendanceService(repo *attendancerepositories.AttendanceRepository) *AttendanceService {
	return &AttendanceService{repo: repo}
}

// schoolNow คำนวณเวลาท้องถิ่นของโรงเรียน (UTC + offset) เพื่อใช้เทียบกับเวลาที่ตั้งค่าไว้
func schoolNow(settings *attendancemodel.AttendanceSettings) time.Time {
	offset := time.Duration(settings.TimezoneOffsetMinutes) * time.Minute
	return time.Now().UTC().Add(offset)
}

// wallClock แปลง "HH:MM:SS" เป็นเวลา (UTC anchor) ของวันเดียวกับ schoolNow
func wallClock(hhmmss string, ref time.Time) (time.Time, error) {
	t, err := time.Parse("15:04:05", hhmmss)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(ref.Year(), ref.Month(), ref.Day(), t.Hour(), t.Minute(), t.Second(), 0, time.UTC), nil
}

func (s *AttendanceService) CheckIn(
	ctx context.Context,
	userID int64,
	location attendancemodel.LocationRequest,
) (*attendancemodel.AttendanceRecord, error) {
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	now := schoolNow(settings)
	if err := validateTimeWindow(now, settings.CheckInOpen, settings.CheckInClose, "ลงเวลาเข้างาน"); err != nil {
		return nil, err
	}
	lateThreshold, err := wallClock(settings.LateThreshold, now)
	if err != nil {
		return nil, err
	}

	status := "working"
	if now.After(lateThreshold) {
		status = "late"
	}

	decision, err := s.ValidateLocation(ctx, userID, settings, location)
	if err != nil {
		return nil, err
	}
	rec, err := s.repo.CreateCheckIn(ctx, userID, status, location, decision)
	if err != nil {
		return nil, err
	}
	if rec == nil {
		return nil, ErrAlreadyCheckedIn
	}
	return rec, nil
}

func (s *AttendanceService) CheckOut(
	ctx context.Context,
	userID int64,
	location attendancemodel.LocationRequest,
) (*attendancemodel.AttendanceRecord, error) {
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	rec, err := s.repo.GetToday(ctx, userID)
	if err != nil {
		return nil, err
	}
	if rec == nil {
		return nil, ErrNotCheckedIn
	}
	if rec.CheckOutAt != nil {
		return nil, ErrAlreadyCheckedOut
	}

	now := schoolNow(settings)
	if err := validateTimeWindow(now, settings.CheckOutOpen, settings.CheckOutClose, "ลงเวลาออกงาน"); err != nil {
		return nil, err
	}
	workEnd, err := wallClock(settings.WorkEnd, now)
	if err != nil {
		return nil, err
	}

	// duration คำนวณจาก timestamp จริง (ไม่ขึ้นกับ timezone)
	workMinutes := int(time.Now().UTC().Sub(*rec.CheckInAt).Minutes())

	status := rec.Status
	if status != "late" {
		if now.Before(workEnd) {
			status = "early_leave"
		} else {
			status = "present"
		}
	}

	decision, err := s.ValidateLocation(ctx, userID, settings, location)
	if err != nil {
		return nil, err
	}
	updated, err := s.repo.UpdateCheckOut(ctx, userID, workMinutes, status, location, decision)
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrAlreadyCheckedOut
	}
	return updated, nil
}

func (s *AttendanceService) ValidateLocation(ctx context.Context, userID int64, settings *attendancemodel.AttendanceSettings, input attendancemodel.LocationRequest) (attendancemodel.GeofenceDecision, error) {
	decision := attendancemodel.GeofenceDecision{Enabled: settings.GeofenceEnabled}
	if !settings.GeofenceEnabled {
		return decision, nil
	}
	if input.Latitude == nil || input.Longitude == nil || input.AccuracyM == nil {
		return decision, ErrLocationRequired
	}
	if *input.Latitude < -90 || *input.Latitude > 90 || *input.Longitude < -180 || *input.Longitude > 180 || *input.AccuracyM < 0 {
		return decision, ErrLocationRequired
	}
	if *input.AccuracyM > settings.MaxLocationAccuracyM {
		return decision, ErrLocationInaccurate
	}

	locations, err := s.repo.ListActiveLocations(ctx)
	if err != nil {
		return decision, err
	}
	if len(locations) == 0 {
		return decision, ErrNoActiveLocation
	}
	nearestDistance := math.MaxFloat64
	for _, location := range locations {
		distance := haversineMeters(*input.Latitude, *input.Longitude, location.Latitude, location.Longitude)
		if distance < nearestDistance {
			nearestDistance = distance
			id, name := location.ID, location.Name
			decision.LocationID, decision.LocationName, decision.DistanceM = &id, &name, &distance
		}
		if distance <= location.RadiusM {
			id, name := location.ID, location.Name
			decision.LocationID, decision.LocationName, decision.DistanceM = &id, &name, &distance
			decision.InsideArea = true
			return decision, nil
		}
	}
	allowed, err := s.repo.UserCanCheckOutside(ctx, userID)
	if err != nil {
		return decision, err
	}
	decision.OutsideAllowed = allowed
	if !allowed {
		return decision, ErrOutsideArea
	}
	return decision, nil
}

func (s *AttendanceService) GetUserGeofencePolicy(ctx context.Context, userID int64) (*attendancemodel.UserGeofencePolicy, error) {
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	locations, err := s.repo.ListActiveLocations(ctx)
	if err != nil {
		return nil, err
	}
	allowed, err := s.repo.UserCanCheckOutside(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &attendancemodel.UserGeofencePolicy{Enabled: settings.GeofenceEnabled, MaxLocationAccuracyM: settings.MaxLocationAccuracyM, OutsideAllowed: allowed, Locations: locations, CheckInOpen: settings.CheckInOpen, CheckInClose: settings.CheckInClose, CheckOutOpen: settings.CheckOutOpen, CheckOutClose: settings.CheckOutClose}, nil
}

func haversineMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusM = 6371000.0
	toRad := math.Pi / 180
	dLat, dLon := (lat2-lat1)*toRad, (lon2-lon1)*toRad
	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1*toRad)*math.Cos(lat2*toRad)*math.Sin(dLon/2)*math.Sin(dLon/2)
	return earthRadiusM * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

func validateTimeWindow(now time.Time, openValue, closeValue, action string) error {
	openTime, err := wallClock(openValue, now)
	if err != nil {
		return err
	}
	closeTime, err := wallClock(closeValue, now)
	if err != nil {
		return err
	}
	allowed := false
	if !closeTime.Before(openTime) {
		allowed = !now.Before(openTime) && !now.After(closeTime)
	} else {
		allowed = !now.Before(openTime) || !now.After(closeTime)
	}
	if !allowed {
		return fmt.Errorf("%sได้เฉพาะเวลา %s-%s น.", action, openValue[:5], closeValue[:5])
	}
	return nil
}

func normalizeClock(value string) (string, error) {
	for _, layout := range []string{"15:04:05", "15:04"} {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed.Format("15:04:05"), nil
		}
	}
	return "", errors.New("รูปแบบเวลาต้องเป็น HH:MM")
}

func (s *AttendanceService) GetGeofenceConfig(ctx context.Context) (*attendancemodel.GeofenceConfig, error) {
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	locations, err := s.repo.ListLocations(ctx)
	if err != nil {
		return nil, err
	}
	return &attendancemodel.GeofenceConfig{Enabled: settings.GeofenceEnabled, MaxLocationAccuracyM: settings.MaxLocationAccuracyM, Locations: locations, CheckInOpen: settings.CheckInOpen, CheckInClose: settings.CheckInClose, CheckOutOpen: settings.CheckOutOpen, CheckOutClose: settings.CheckOutClose}, nil
}
func (s *AttendanceService) UpdateGeofenceConfig(ctx context.Context, req attendancemodel.UpdateGeofenceConfigRequest) error {
	if req.MaxLocationAccuracyM <= 0 || req.MaxLocationAccuracyM > 5000 {
		return errors.New("ค่าความคลาดเคลื่อนต้องอยู่ระหว่าง 1-5000 เมตร")
	}
	if req.Enabled {
		locations, err := s.repo.ListActiveLocations(ctx)
		if err != nil {
			return err
		}
		if len(locations) == 0 {
			return ErrNoActiveLocation
		}
	}
	var err error
	if req.CheckInOpen, err = normalizeClock(req.CheckInOpen); err != nil {
		return fmt.Errorf("เวลาเริ่มเข้างาน: %w", err)
	}
	if req.CheckInClose, err = normalizeClock(req.CheckInClose); err != nil {
		return fmt.Errorf("เวลาสิ้นสุดเข้างาน: %w", err)
	}
	if req.CheckOutOpen, err = normalizeClock(req.CheckOutOpen); err != nil {
		return fmt.Errorf("เวลาเริ่มออกงาน: %w", err)
	}
	if req.CheckOutClose, err = normalizeClock(req.CheckOutClose); err != nil {
		return fmt.Errorf("เวลาสิ้นสุดออกงาน: %w", err)
	}
	return s.repo.UpdateGeofenceConfig(ctx, req)
}
func (s *AttendanceService) SaveLocation(ctx context.Context, id int64, req attendancemodel.SaveLocationRequest) (int64, error) {
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return 0, errors.New("กรุณาระบุชื่อจุดลงเวลา")
	}
	if req.Latitude < -90 || req.Latitude > 90 || req.Longitude < -180 || req.Longitude > 180 {
		return 0, errors.New("พิกัดไม่ถูกต้อง")
	}
	if req.RadiusM <= 0 || req.RadiusM > 50000 {
		return 0, errors.New("รัศมีต้องอยู่ระหว่าง 1-50000 เมตร")
	}
	return s.repo.SaveLocation(ctx, id, req)
}
func (s *AttendanceService) DeleteLocation(ctx context.Context, id int64) error {
	return s.repo.DeleteLocation(ctx, id)
}
func (s *AttendanceService) ListGroups(ctx context.Context) ([]attendancemodel.AttendanceGroup, error) {
	return s.repo.ListGroups(ctx)
}
func (s *AttendanceService) ListAttendanceUsers(ctx context.Context) ([]attendancemodel.AttendanceUserOption, error) {
	return s.repo.ListAttendanceUsers(ctx)
}
func (s *AttendanceService) SaveGroup(ctx context.Context, id int64, req attendancemodel.SaveGroupRequest) (int64, error) {
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return 0, errors.New("กรุณาระบุชื่อกลุ่ม")
	}
	return s.repo.SaveGroup(ctx, id, req)
}
func (s *AttendanceService) DeleteGroup(ctx context.Context, id int64) error {
	return s.repo.DeleteGroup(ctx, id)
}
func (s *AttendanceService) ReplaceGroupMembers(ctx context.Context, id int64, userIDs []int64) error {
	return s.repo.ReplaceGroupMembers(ctx, id, userIDs)
}
func (s *AttendanceService) GetOutsideAccess(ctx context.Context) (attendancemodel.OutsideAccessRequest, error) {
	return s.repo.GetOutsideAccess(ctx)
}
func (s *AttendanceService) ReplaceOutsideAccess(ctx context.Context, req attendancemodel.OutsideAccessRequest) error {
	return s.repo.ReplaceOutsideAccess(ctx, req)
}

func (s *AttendanceService) UpdateRecord(ctx context.Context, recordID, editorID int64, req attendancemodel.UpdateAttendanceRecordRequest) (*attendancemodel.AttendanceRecord, error) {
	req.Reason = strings.TrimSpace(req.Reason)
	if len([]rune(req.Reason)) < 3 {
		return nil, errors.New("กรุณาระบุเหตุผลการแก้ไขอย่างน้อย 3 ตัวอักษร")
	}
	if req.CheckInAt == nil {
		return nil, errors.New("กรุณาระบุเวลาเข้างาน")
	}
	if req.CheckOutAt != nil && req.CheckOutAt.Before(*req.CheckInAt) {
		return nil, errors.New("เวลาออกงานต้องไม่ก่อนเวลาเข้างาน")
	}
	allowedStatuses := map[string]bool{"working": true, "present": true, "late": true, "early_leave": true, "missed_checkout": true}
	if !allowedStatuses[req.Status] {
		return nil, errors.New("สถานะการลงเวลาไม่ถูกต้อง")
	}
	return s.repo.UpdateRecordWithAudit(ctx, recordID, editorID, req)
}

func (s *AttendanceService) ListRecordAuditLogs(ctx context.Context, recordID int64) ([]attendancemodel.AttendanceAuditLog, error) {
	return s.repo.ListRecordAuditLogs(ctx, recordID)
}

func (s *AttendanceService) GetToday(
	ctx context.Context,
	userID int64,
) (*attendancemodel.AttendanceRecord, error) {
	return s.repo.GetToday(ctx, userID)
}

func (s *AttendanceService) GetMonth(
	ctx context.Context,
	userID int64,
	month time.Time,
) (*attendancemodel.MyRecordsResponse, error) {
	records, err := s.repo.GetMonth(ctx, userID, month)
	if err != nil {
		return nil, err
	}

	return &attendancemodel.MyRecordsResponse{
		Records: records,
		Summary: summarize(records),
	}, nil
}

func (s *AttendanceService) GetMonthAll(
	ctx context.Context,
	month time.Time,
) (*attendancemodel.AllRecordsResponse, error) {
	records, err := s.repo.GetMonthAll(ctx, month)
	if err != nil {
		return nil, err
	}

	return &attendancemodel.AllRecordsResponse{
		Records: records,
		Summary: summarizeAll(records),
	}, nil
}

func summarize(records []attendancemodel.AttendanceRecord) attendancemodel.MonthSummary {
	s := attendancemodel.MonthSummary{}
	for _, r := range records {
		switch r.Status {
		case "working":
			s.Working++
		case "present":
			s.Present++
		case "late":
			s.Late++
		case "early_leave":
			s.EarlyLeave++
		case "missed_checkout":
			s.MissedCheckout++
		}
	}
	return s
}

func summarizeAll(records []attendancemodel.AttendanceRecordWithUser) attendancemodel.MonthSummary {
	s := attendancemodel.MonthSummary{}
	for _, r := range records {
		switch r.Status {
		case "working":
			s.Working++
		case "present":
			s.Present++
		case "late":
			s.Late++
		case "early_leave":
			s.EarlyLeave++
		case "missed_checkout":
			s.MissedCheckout++
		}
	}
	return s
}
