package middlewares

import (
	"github.com/gofiber/fiber/v2"
)

// RequirePermission ตรวจสอบสิทธิ์ (permission) ก่อนเข้าถึง route
// ผู้ใช้ต้องมี permission ใด permission หนึ่งในรายการ (OR) ถึงจะผ่าน
// ต้องเรียกต่อจาก JWTMiddleware เพราะอ่านค่าจาก c.Locals("permissions")
// ซึ่ง JWTMiddleware เติมจาก claim "permissions" ใน token
func RequirePermission(required ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if len(required) == 0 {
			return c.Next()
		}

		raw, ok := c.Locals("permissions").([]interface{})
		if !ok || len(raw) == 0 {
			return fiber.NewError(fiber.StatusForbidden, "ไม่มีสิทธิ์เข้าถึง")
		}

		has := make(map[string]bool, len(raw))
		for _, p := range raw {
			if s, ok := p.(string); ok {
				has[s] = true
			}
		}

		for _, perm := range required {
			if has[perm] {
				return c.Next()
			}
		}

		return fiber.NewError(fiber.StatusForbidden, "ไม่มีสิทธิ์เข้าถึง")
	}
}
