package routers

import (
	"tarawitApi/handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

func SetupAuth(auth fiber.Router) {
	auth.Post(
		"/signin",
		middlewares.LoginLimiter(), // 🔒 brute force login
		handlers.Authhandler,
	)

	// ❌ ปิดสมัครสมาชิกสาธารณะ — สร้างผู้ใช้ต้องผ่าน /user หรือ /personnel เท่านั้น
	// (เดิม /auth/register เปิดให้ทุกคน และ query ก็อ้างคอลัมน์ที่ไม่มีในตาราง users)
	// auth.Post(
	// 	"/register",
	// 	middlewares.RegisterLimiter(), // 🔒 spam account
	// 	handlers.Registerhandler,
	// )

	auth.Get(
		"/me",
		middlewares.JWTMiddleware,
		handlers.Me,
	)

	// ต่ออายุ session ด้วย refresh token (rotation) — ไม่ต้องมี access token
	auth.Post(
		"/refresh",
		middlewares.RefreshLimiter(),
		handlers.RefreshTokenHandler,
	)

	// ออกจากระบบ — เพิกถอน refresh token ฝั่ง server
	auth.Post(
		"/logout",
		middlewares.RefreshLimiter(),
		handlers.LogoutHandler,
	)

	auth.Get("/test", middlewares.PublicLimiter(), func(c *fiber.Ctx) error {
		return c.SendString("test ok")
	})

	// ===== LINE Login (OAuth 2.1 + OpenID Connect) =====
	// ต้องตั้งค่า env: LINE_CHANNEL_ID / LINE_CHANNEL_SECRET / LINE_REDIRECT_URI
	// (ถ้ายังไม่ตั้ง หน้า login จะซ่อนปุ่ม LINE ผ่าน /auth/line/config)
	auth.Get(
		"/line",
		handlers.LineLoginRedirect,
	)
	auth.Get(
		"/line/callback",
		handlers.LineCallbackHandler,
	)
	auth.Get(
		"/line/config",
		handlers.LineConfigHandler,
	)
	auth.Get(
		"/line/link-url",
		middlewares.JWTMiddleware, // ต้อง login username/password ก่อนถึงจะเชื่อม LINE ได้
		handlers.LineLinkURLHandler,
	)
}
