package routers

import (
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoute(app *fiber.App) {
	api := app.Group("/api")

	SetupAuth(api.Group("/auth"))

	protected := func(path string) fiber.Router {
		return api.Group(
			path,
			middlewares.JWTMiddleware,
			middlewares.AuthenticatedLimiter(),
		)
	}

	SetupModuleRoute(protected("/modules"))
	evaluation := protected("/evaluation")
	evaluation.Use(middlewares.RequireModule("evaluation"))
	SetupEvaluationRoute(evaluation)
	users := protected("/user")
	users.Use(middlewares.RequireModule("users"))
	SetupUserRoute(users)
	roles := protected("/role")
	roles.Use(middlewares.RequireModule("users"))
	SetupRoleRoute(roles)
	attendance := protected("/attendance")
	attendance.Use(middlewares.RequireModule("attendance"))
	SetupAttendanceRoute(attendance)
	personnel := protected("/personnel")
	personnel.Use(middlewares.RequireModule("personnel"))
	SetupPersonnelRoute(personnel)
	positions := protected("/positions")
	positions.Use(middlewares.RequireModule("personnel"))
	SetupPositionRoute(positions)
	settings := protected("/settings")
	settings.Use(middlewares.RequireModule("settings"))
	SetupSettingRoute(settings)
	reports := protected("/dashboard")
	reports.Use(middlewares.RequireModule("reports"))
	SetupDashboardRoute(reports)
	iqa := protected("/iqa")
	iqa.Use(middlewares.RequireModule("evaluation"))
	SetupIQARoute(iqa)
	SetupUploadRoute(api)
}
