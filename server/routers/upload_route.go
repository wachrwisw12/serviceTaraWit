package routers

import (
	userhandlers "tarawitApi/userFeature/user_handlers"

	"github.com/gofiber/fiber/v2"
)

// SetupUploadRoute exposes only validated, read-only file handlers.
func SetupUploadRoute(api fiber.Router) {
	api.Get("/uploads/avatars/:filename", userhandlers.ViewAvatar)
}
