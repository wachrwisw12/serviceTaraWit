package routers

import (
	"log"
	userhandlers "tarawitApi/userFeature/user_handlers"

	"github.com/gofiber/fiber/v2"
)
 func SetupUserRoute(userRoute fiber.Router) {
	
log.Println("dfdf")
	userRoute.Get("/GetAlluser", userhandlers.NewUserHandler().GetUser)
	// evaluationRoute.Get(
    // "/get-evaluation/templateByid/:id",
    // evaluationhandles.NewEvaluationHandler().GetTemplateFullByID,)
}