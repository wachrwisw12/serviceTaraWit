package routers

import (
	settinghandlers "tarawitApi/settingFeature/setting_handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

func SetupSettingRoute(settingRoute fiber.Router) {
	handler := settinghandlers.NewSettingHandler()

	// ===== ข้อมูลโรงเรียน =====
	// GET อ่านได้เฉพาะ user ที่ login แล้ว (ทุกคนต้องเห็นชื่อโรงเรียน)
	settingRoute.Get(
		"/school",
		handler.GetSchool,
	)
	settingRoute.Put(
		"/school",
		middlewares.RequirePermission("setting.manage", "setting.school"),
		handler.UpdateSchool,
	)

	// ===== ปีการศึกษา =====
	settingRoute.Get(
		"/academic-years",
		middlewares.RequirePermission("setting.academic", "setting.manage"),
		handler.ListAcademicYears,
	)
	settingRoute.Post(
		"/academic-years",
		middlewares.RequirePermission("setting.manage", "setting.academic"),
		handler.CreateAcademicYear,
	)
	settingRoute.Put(
		"/academic-years/:id",
		middlewares.RequirePermission("setting.manage", "setting.academic"),
		handler.UpdateAcademicYear,
	)
	settingRoute.Patch(
		"/academic-years/:id/current",
		middlewares.RequirePermission("setting.manage", "setting.academic"),
		handler.SetCurrentYear,
	)
	settingRoute.Delete(
		"/academic-years/:id",
		middlewares.RequirePermission("setting.manage", "setting.academic"),
		handler.DeleteAcademicYear,
	)

	// ===== ระดับคะแนน =====
	settingRoute.Get(
		"/score-levels",
		middlewares.RequirePermission("setting.scoring", "setting.manage"),
		handler.ListScoreLevels,
	)
	settingRoute.Put(
		"/score-levels/:id",
		middlewares.RequirePermission("setting.manage", "setting.scoring"),
		handler.UpdateScoreLevel,
	)
}
