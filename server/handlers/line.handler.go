package handlers

import (
	"net/url"
	"os"
	"strings"

	"tarawitApi/services"

	"github.com/gofiber/fiber/v2"
)

// frontendBase ต้นทางของ frontend สำหรับ redirect หลัง LINE callback
// - ตั้งค่า env APP_FRONTEND_URL → ใช้ค่านั้น (กรณี frontend อยู่คนละ origin)
// - ไม่ตั้ง → redirect แบบ relative (ครอบคลุม dev ผ่าน vite proxy + prod แบบเดียวกัน)
func frontendBase() string {
	base := strings.TrimSuffix(os.Getenv("APP_FRONTEND_URL"), "/")
	return base
}

// LineConfigHandler GET /api/auth/line/config — ให้ frontend รู้ว่าเปิด LINE login หรือยัง
func LineConfigHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"enabled": services.LineEnabled(),
	})
}

// LineLoginRedirect GET /api/auth/line — เริ่ม login ผ่าน LINE (redirect ไปหน้า LINE)
func LineLoginRedirect(c *fiber.Ctx) error {
	authURL, err := services.CreateLineState(c.Context(), "login", 0)
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.Redirect(authURL, fiber.StatusFound)
}

// LineLinkURLHandler GET /api/auth/line/link-url — (ต้อง login แล้ว)
// สร้าง URL สำหรับ "เชื่อมบัญชี LINE" ให้ผู้ใช้เดิม กดจากหน้าโปรไฟล์
func LineLinkURLHandler(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		return fiber.ErrUnauthorized
	}
	authURL, err := services.CreateLineState(c.Context(), "link", userID)
	if err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{"url": authURL})
}

// LineCallbackHandler GET /api/auth/line/callback?code=...&state=...
// LINE redirect กลับมาที่นี่ → ตรวจ state → แลก code → ตรวจ id_token → login / link
// แล้ว redirect ไป frontend พร้อมผลลัพธ์ (token ผ่าน URL fragment — ไม่ส่งไป server)
func LineCallbackHandler(c *fiber.Ctx) error {
	code := c.Query("code")
	state := c.Query("state")

	mode, linkUserID, claims, err := services.ExchangeLineCallback(c.Context(), code, state)
	if err != nil {
		return redirectWithFragment(c, "login", "", "line_error", err.Error())
	}

	// ===== mode: link (เชื่อม LINE กับบัญชีเดิม) =====
	if mode == "link" {
		if linkUserID <= 0 {
			return redirectWithFragment(c, "profile", "", "line_error", "ไม่พบผู้ใช้ที่กำลังเชื่อมบัญชี")
		}
		if err := services.LinkUserToLine(c.Context(), linkUserID, claims.Sub); err != nil {
			return redirectWithFragment(c, "profile", "", "line_error", err.Error())
		}
		return redirectWithFragment(c, "profile", "", "line_linked", "1")
	}

	// ===== mode: login (เข้าสู่ระบบผ่าน LINE) =====
	userID, err := services.FindUserIDByLine(c.Context(), claims.Sub)
	if err != nil {
		// ยังไม่เคยมีบัญชี → สร้างอัตโนมัติ (auto-create)
		userID, err = services.CreateUserFromLine(c.Context(), claims.Sub, claims.Name, claims.Picture)
		if err != nil {
			return redirectWithFragment(c, "login", "", "line_error", err.Error())
		}
	}

	session, err := services.LineLoginSession(c.Context(), userID)
	if err != nil {
		return redirectWithFragment(c, "login", "", "line_error", err.Error())
	}

	return redirectWithFragment(c, "login",
		"line_token="+url.QueryEscape(session.Token)+"&line_refresh_token="+url.QueryEscape(session.RefreshToken),
		"", "")
}

// redirectWithFragment เปลี่ยนเส้นทางไปหน้า frontend พร้อม fragment
// - fragmentPart: string ที่จะใส่ใน fragment ตรงๆ (เช่น token=...&refresh=...)
// - key/value: ถ้า value ไม่ว่าง จะเติมเป็น key=urlencode(value)
func redirectWithFragment(c *fiber.Ctx, path, fragmentPart, key, value string) error {
	var frag strings.Builder
	frag.WriteString(fragmentPart)
	if value != "" && key != "" {
		if frag.Len() > 0 {
			frag.WriteString("&")
		}
		frag.WriteString(key)
		frag.WriteString("=")
		frag.WriteString(url.QueryEscape(value))
	}

	base := frontendBase()
	target := base + "/" + strings.TrimPrefix(path, "/")
	if frag.Len() > 0 {
		target += "#" + frag.String()
	}
	return c.Redirect(target, fiber.StatusFound)
}
