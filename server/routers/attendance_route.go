package routers

import (
	attendancehandles "tarawitApi/attendanceFeature/attendance_handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

// SetupAttendanceRoute โมดูลลงเวลาปฏิบัติงาน
func SetupAttendanceRoute(attendanceRoute fiber.Router) {
	handler := attendancehandles.NewAttendanceHandler()

	// ลงเวลาเข้างาน / ออกงาน และดูประวัติของตัวเอง
	attendanceRoute.Post("/check-in", middlewares.RequirePermission("attendance.view"), handler.CheckIn)
	attendanceRoute.Post("/check-out", middlewares.RequirePermission("attendance.view"), handler.CheckOut)
	attendanceRoute.Get("/today", middlewares.RequirePermission("attendance.view"), handler.GetToday)
	attendanceRoute.Get("/my", middlewares.RequirePermission("attendance.view"), handler.GetMyRecords)
	attendanceRoute.Get("/location-policy", middlewares.RequirePermission("attendance.view"), handler.GetMyLocationPolicy)

	// ข้อมูลลงเวลาทุกคน — เฉพาะผู้ที่มีสิทธิ์จัดการ
	attendanceRoute.Get("/records", middlewares.RequirePermission("attendance.manage"), handler.GetAllRecords)
	attendanceRoute.Put("/records/:id", middlewares.RequirePermission("attendance.manage"), handler.UpdateRecord)
	attendanceRoute.Get("/records/:id/audit-logs", middlewares.RequirePermission("attendance.manage"), handler.ListRecordAuditLogs)
	attendanceRoute.Get("/geofence-config", middlewares.RequirePermission("attendance.manage"), handler.GetGeofenceConfig)
	attendanceRoute.Put("/geofence-config", middlewares.RequirePermission("attendance.manage"), handler.UpdateGeofenceConfig)
	attendanceRoute.Post("/locations", middlewares.RequirePermission("attendance.manage"), handler.CreateLocation)
	attendanceRoute.Put("/locations/:id", middlewares.RequirePermission("attendance.manage"), handler.UpdateLocation)
	attendanceRoute.Delete("/locations/:id", middlewares.RequirePermission("attendance.manage"), handler.DeleteLocation)
	attendanceRoute.Get("/groups", middlewares.RequirePermission("attendance.manage"), handler.ListGroups)
	attendanceRoute.Get("/users", middlewares.RequirePermission("attendance.manage"), handler.ListAttendanceUsers)
	attendanceRoute.Post("/groups", middlewares.RequirePermission("attendance.manage"), handler.CreateGroup)
	attendanceRoute.Put("/groups/:id", middlewares.RequirePermission("attendance.manage"), handler.UpdateGroup)
	attendanceRoute.Delete("/groups/:id", middlewares.RequirePermission("attendance.manage"), handler.DeleteGroup)
	attendanceRoute.Put("/groups/:id/members", middlewares.RequirePermission("attendance.manage"), handler.ReplaceGroupMembers)
	attendanceRoute.Get("/outside-access", middlewares.RequirePermission("attendance.manage"), handler.GetOutsideAccess)
	attendanceRoute.Put("/outside-access", middlewares.RequirePermission("attendance.manage"), handler.ReplaceOutsideAccess)
}
