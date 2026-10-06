package routers

import (
	userhandlers "tarawitApi/userFeature/user_handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoleRoute(userRoute fiber.Router) {
	handler := userhandlers.NewUserHandler()

	// รายการ System Role — ต้องมีสิทธิ์ role.manage หรือ user.view (ใช้ในหน้าจัดการผู้ใช้)
	userRoute.Get(
		"/systemRols",
		middlewares.RequirePermission("role.manage", "user.view"),
		handler.GetRoles,
	)

	// รายการ Role พร้อมสิทธิ์ (permission_ids) — ใช้ในหน้า Role management
	userRoute.Get(
		"/roles",
		middlewares.RequirePermission("role.view", "role.manage"),
		handler.GetRolesWithPermissions,
	)

	// รายการ permission ทั้งหมดในระบบ — ใช้ในหน้า Permission management
	userRoute.Get(
		"/permissions",
		middlewares.RequirePermission("permission.view", "role.manage"),
		handler.GetAllPermissions,
	)

	// ตั้งค่า permission ให้ role — ต้องมีสิทธิ์ role.manage
	userRoute.Put(
		"/:id/permissions",
		middlewares.RequirePermission("role.manage"),
		handler.UpdateRolePermissions,
	)
}
