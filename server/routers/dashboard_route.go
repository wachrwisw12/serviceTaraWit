package routers

import (
	dashboardhandles "tarawitApi/dashboardFeature/dashboard_handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

// SetupDashboardRoute สถิติภาพรวมข้ามโมดูลสำหรับผู้บริหาร
func SetupDashboardRoute(dashboardRoute fiber.Router) {
	handler := dashboardhandles.NewDashboardHandler()

	dashboardRoute.Get(
		"/executive",
		middlewares.RequirePermission("report.view"),
		handler.GetExecutiveDashboard,
	)
}
