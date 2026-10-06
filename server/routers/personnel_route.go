package routers

import (
	personnelhandlers "tarawitApi/personnelFeature/personnel_handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

func SetupPersonnelRoute(personnelRoute fiber.Router) {
	handler := personnelhandlers.NewPersonnelHandler()

	// ตัวเลือกสำหรับฟอร์ม — ดูบุคลากรก็พอ
	personnelRoute.Get(
		"/person-types",
		middlewares.RequirePermission("personnel.view"),
		handler.ListPersonTypes,
	)
	personnelRoute.Get(
		"/departments",
		middlewares.RequirePermission("personnel.view"),
		handler.ListDepartments,
	)
	personnelRoute.Get(
		"/prefixes",
		middlewares.RequirePermission("personnel.view"),
		handler.ListPrefixes,
	)

	// รายการบุคลากร — กรองด้วย query: search, person_type_id, position_id, is_active
	personnelRoute.Get(
		"/",
		middlewares.RequirePermission("personnel.view"),
		handler.ListPersonnel,
	)

	// รายละเอียดบุคลากร 1 คน
	personnelRoute.Get(
		"/:id",
		middlewares.RequirePermission("personnel.view"),
		handler.GetPersonnel,
	)

	// สร้างบุคลากร — ต้องมีสิทธิ์ personnel.create
	personnelRoute.Post(
		"/",
		middlewares.RequirePermission("personnel.create"),
		handler.CreatePersonnel,
	)

	// นำเข้าบุคลากรหลายคนพร้อมกัน
	personnelRoute.Post(
		"/batch",
		middlewares.RequirePermission("personnel.create"),
		handler.BatchCreatePersonnel,
	)

	// อัปโหลดรูปโปรไฟล์บุคลากร
	personnelRoute.Post(
		"/:id/avatar",
		middlewares.RequirePermission("personnel.create", "user.update"),
		middlewares.UploadLimiter(),
		handler.UploadPersonnelAvatar,
	)

	// รีเซ็ตรหัสผ่านโดยแอดมิน
	personnelRoute.Put(
		"/:id/reset-password",
		middlewares.RequirePermission("personnel.create", "user.update"),
		middlewares.SensitiveActionLimiter(),
		handler.AdminResetPassword,
	)

	// แก้ไขบุคลากร / ปิด-เปิดใช้งาน
	personnelRoute.Put(
		"/:id",
		middlewares.RequirePermission("personnel.create", "user.update"),
		handler.UpdatePersonnel,
	)
	personnelRoute.Delete(
		"/:id",
		middlewares.RequirePermission("personnel.create", "user.update"),
		handler.DeactivatePersonnel,
	)
	personnelRoute.Patch(
		"/:id/activate",
		middlewares.RequirePermission("personnel.create", "user.update"),
		handler.ActivatePersonnel,
	)
}

func SetupPositionRoute(positionRoute fiber.Router) {
	handler := personnelhandlers.NewPersonnelHandler()

	positionRoute.Get(
		"/",
		middlewares.RequirePermission("position.view"),
		handler.ListPositions,
	)

	positionRoute.Post(
		"/",
		middlewares.RequirePermission("personnel.create", "user.update"),
		handler.CreatePosition,
	)

	positionRoute.Put(
		"/:id",
		middlewares.RequirePermission("personnel.create", "user.update"),
		handler.UpdatePosition,
	)

	positionRoute.Delete(
		"/:id",
		middlewares.RequirePermission("personnel.create", "user.update"),
		handler.DeletePosition,
	)
}
