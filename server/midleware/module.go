package middlewares

import (
	"strings"
	"tarawitApi/db"

	"github.com/gofiber/fiber/v2"
)

// RequireModule blocks direct API access when a module is disabled for the requesting client.
func RequireModule(key string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		channel := strings.ToLower(c.Get("X-Client-Platform", "web"))
		column := "show_on_web"
		if channel == "mobile" {
			column = "show_on_mobile"
		}
		var allowed bool
		var message *string
		err := db.DB.QueryRow(c.Context(), `SELECT enabled AND `+column+`, maintenance_message FROM system_modules WHERE module_key=$1`, key).Scan(&allowed, &message)
		if err != nil || !allowed {
			text := "โมดูลนี้ปิดให้บริการชั่วคราว"
			if message != nil && strings.TrimSpace(*message) != "" {
				text = *message
			}
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "module_disabled", "message": text, "module": key})
		}
		return c.Next()
	}
}
