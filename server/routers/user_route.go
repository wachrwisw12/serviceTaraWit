package routers

import (
	userhandlers "tarawitApi/userFeature/user_handlers"

	"github.com/gofiber/fiber/v2"
)
 func SetupUserRoute(userRoute fiber.Router) {
	
handler := userhandlers.NewUserHandler()
	userRoute.Get("/GetAlluser", handler.GetAllUser)
	userRoute.Get("/roles", handler.GetRoles )
	userRoute.Get("/GetpersonType", handler.GetPersonType)
	userRoute.Get("/GetUserById/:id", handler.GetUserByID)
	userRoute.Put("/:id/roles", handler.UpdateUserRole)
 }