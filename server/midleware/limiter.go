package middlewares

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func limitReached(c *fiber.Ctx) error {
	c.Set(fiber.HeaderRetryAfter, "60")
	return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
		"error": "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
	})
}

func userKey(c *fiber.Ctx) string {
	if userID := c.Locals("user_id"); userID != nil {
		return fmt.Sprintf("user:%v", userID)
	}
	return "ip:" + c.IP()
}

func newLimiter(max int, expiration time.Duration, keyGenerator func(*fiber.Ctx) string) fiber.Handler {
	return limiter.New(limiter.Config{
		Max:          max,
		Expiration:   expiration,
		KeyGenerator: keyGenerator,
		LimitReached: limitReached,
	})
}

func LoginLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:                    5,
		Expiration:             time.Minute,
		SkipSuccessfulRequests: true,
		LimitReached:           limitReached,
	})
}

func RefreshLimiter() fiber.Handler {
	return newLimiter(20, time.Minute, nil)
}

func AuthenticatedLimiter() fiber.Handler {
	return newLimiter(300, time.Minute, userKey)
}

func SensitiveActionLimiter() fiber.Handler {
	return newLimiter(10, 10*time.Minute, userKey)
}

func UploadLimiter() fiber.Handler {
	return newLimiter(10, time.Minute, userKey)
}

func EvaluationSubmitLimiter() fiber.Handler {
	return newLimiter(10, time.Minute, userKey)
}

func PublicLimiter() fiber.Handler {
	return newLimiter(120, time.Minute, nil)
}
