package attendancehandlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	attendancemodel "tarawitApi/attendanceFeature/attendance_model"
	attendancerepositories "tarawitApi/attendanceFeature/attendance_repositories"
	attendanceservices "tarawitApi/attendanceFeature/attendance_services"
	middlewares "tarawitApi/midleware"
)

type AttendanceHandler struct {
	service *attendanceservices.AttendanceService
}

func NewAttendanceHandler() *AttendanceHandler {
	repo := attendancerepositories.NewAttendanceRepository()
	return &AttendanceHandler{
		service: attendanceservices.NewAttendanceService(repo),
	}
}

func currentUser(c *fiber.Ctx) (int64, error) {
	return middlewares.GetCurrentUserID(c)
}

// CheckIn POST /api/attendance/check-in
func (h *AttendanceHandler) CheckIn(c *fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	var req attendancemodel.LocationRequest
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลพิกัดไม่ถูกต้อง")
		}
	}
	rec, err := h.service.CheckIn(c.Context(), userID, req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(rec)
}

// CheckOut POST /api/attendance/check-out
func (h *AttendanceHandler) CheckOut(c *fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	var req attendancemodel.LocationRequest
	if len(c.Body()) > 0 {
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลพิกัดไม่ถูกต้อง")
		}
	}
	rec, err := h.service.CheckOut(c.Context(), userID, req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(rec)
}

func parseAttendanceID(c *fiber.Ctx) (int64, error) { return strconv.ParseInt(c.Params("id"), 10, 64) }

func (h *AttendanceHandler) GetMyLocationPolicy(c *fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}
	data, err := h.service.GetUserGeofencePolicy(c.Context(), userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(data)
}

func (h *AttendanceHandler) GetGeofenceConfig(c *fiber.Ctx) error {
	data, err := h.service.GetGeofenceConfig(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(data)
}
func (h *AttendanceHandler) UpdateGeofenceConfig(c *fiber.Ctx) error {
	var req attendancemodel.UpdateGeofenceConfigRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}
	if err := h.service.UpdateGeofenceConfig(c.Context(), req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"message": "บันทึกการตั้งค่าพื้นที่แล้ว"})
}
func (h *AttendanceHandler) CreateLocation(c *fiber.Ctx) error { return h.saveLocation(c, 0) }
func (h *AttendanceHandler) UpdateLocation(c *fiber.Ctx) error {
	id, err := parseAttendanceID(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	return h.saveLocation(c, id)
}
func (h *AttendanceHandler) saveLocation(c *fiber.Ctx, id int64) error {
	var req attendancemodel.SaveLocationRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}
	savedID, err := h.service.SaveLocation(c.Context(), id, req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"id": savedID, "message": "บันทึกจุดลงเวลาแล้ว"})
}
func (h *AttendanceHandler) DeleteLocation(c *fiber.Ctx) error {
	id, err := parseAttendanceID(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	if err := h.service.DeleteLocation(c.Context(), id); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}
func (h *AttendanceHandler) ListGroups(c *fiber.Ctx) error {
	data, err := h.service.ListGroups(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(data)
}
func (h *AttendanceHandler) ListAttendanceUsers(c *fiber.Ctx) error {
	data, err := h.service.ListAttendanceUsers(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(data)
}
func (h *AttendanceHandler) CreateGroup(c *fiber.Ctx) error { return h.saveGroup(c, 0) }
func (h *AttendanceHandler) UpdateGroup(c *fiber.Ctx) error {
	id, err := parseAttendanceID(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	return h.saveGroup(c, id)
}
func (h *AttendanceHandler) saveGroup(c *fiber.Ctx, id int64) error {
	var req attendancemodel.SaveGroupRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}
	savedID, err := h.service.SaveGroup(c.Context(), id, req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"id": savedID, "message": "บันทึกกลุ่มแล้ว"})
}
func (h *AttendanceHandler) DeleteGroup(c *fiber.Ctx) error {
	id, err := parseAttendanceID(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	if err := h.service.DeleteGroup(c.Context(), id); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}
func (h *AttendanceHandler) ReplaceGroupMembers(c *fiber.Ctx) error {
	id, err := parseAttendanceID(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	var req attendancemodel.ReplaceMembersRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}
	if err := h.service.ReplaceGroupMembers(c.Context(), id, req.UserIDs); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"message": "บันทึกสมาชิกกลุ่มแล้ว"})
}
func (h *AttendanceHandler) GetOutsideAccess(c *fiber.Ctx) error {
	data, err := h.service.GetOutsideAccess(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(data)
}
func (h *AttendanceHandler) ReplaceOutsideAccess(c *fiber.Ctx) error {
	var req attendancemodel.OutsideAccessRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}
	if err := h.service.ReplaceOutsideAccess(c.Context(), req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"message": "บันทึกสิทธิ์ลงเวลานอกพื้นที่แล้ว"})
}

func (h *AttendanceHandler) UpdateRecord(c *fiber.Ctx) error {
	recordID, err := parseAttendanceID(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	editorID, err := currentUser(c)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}
	var req attendancemodel.UpdateAttendanceRecordRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}
	record, err := h.service.UpdateRecord(c.Context(), recordID, editorID, req)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"message": "แก้ไขบันทึกการลงเวลาแล้ว", "record": record})
}

func (h *AttendanceHandler) ListRecordAuditLogs(c *fiber.Ctx) error {
	recordID, err := parseAttendanceID(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid id")
	}
	logs, err := h.service.ListRecordAuditLogs(c.Context(), recordID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(logs)
}

// GetToday GET /api/attendance/today — record ของวันนี้ของผู้ใช้ปัจจุบัน (null ถ้ายังไม่ลง)
func (h *AttendanceHandler) GetToday(c *fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	rec, err := h.service.GetToday(c.Context(), userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	if rec == nil {
		return c.JSON(nil)
	}
	return c.JSON(rec)
}

// GetAllRecords GET /api/attendance/records?month=YYYY-MM — ข้อมูลลงเวลาทุกคน (ฝั่งผู้ดูแล)
func (h *AttendanceHandler) GetAllRecords(c *fiber.Ctx) error {
	monthStr := c.Query("month", time.Now().Format("2006-01"))
	month, err := time.Parse("2006-01", monthStr)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "รูปแบบเดือนไม่ถูกต้อง (YYYY-MM)")
	}

	resp, err := h.service.GetMonthAll(c.Context(), month)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(resp)
}

// GetMyRecords GET /api/attendance/my?month=YYYY-MM — ประวัติรายเดือนของผู้ใช้ปัจจุบัน
func (h *AttendanceHandler) GetMyRecords(c *fiber.Ctx) error {
	userID, err := currentUser(c)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	monthStr := c.Query("month", time.Now().Format("2006-01"))
	month, err := time.Parse("2006-01", monthStr)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "รูปแบบเดือนไม่ถูกต้อง (YYYY-MM)")
	}

	resp, err := h.service.GetMonth(c.Context(), userID, month)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(resp)
}
