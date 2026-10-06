package routers

import (
	middlewares "tarawitApi/midleware"
	modulefeature "tarawitApi/moduleFeature"

	"github.com/gofiber/fiber/v2"
)

func SetupModuleRoute(route fiber.Router) {
	route.Get("/my", modulefeature.ListMine)
	route.Get("/", middlewares.RequirePermission("setting.manage"), modulefeature.ListAll)
	route.Put("/:key", middlewares.RequirePermission("setting.manage"), modulefeature.Update)
}
