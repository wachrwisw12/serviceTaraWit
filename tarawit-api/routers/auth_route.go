package routers

import (
	"tarawitApi/handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)



func SetupAuth(auth fiber.Router) {
	auth.Post(
		"/singin",
		middlewares.LoginLimiter(), // 🔒 brute force login
		handlers.Authhandler,
	)

	auth.Post(
		"/register",
		middlewares.RegisterLimiter(), // 🔒 spam account
		handlers.Registerhandler,
	)
//ทดสอบ
	auth.Get(
		"/me",
		middlewares.JWTMiddleware,
		handlers.Me,
	)
}
