package routers

import (
	"log"
	userhandlers "tarawitApi/userFeature/user_handlers"

	"github.com/gofiber/fiber/v2"
)
 func SetupRoleRoute(userRoute fiber.Router) {
	
log.Println("dfdf")
	userRoute.Get("/systemRols", userhandlers.NewUserHandler().GetRoles )
	
	
}