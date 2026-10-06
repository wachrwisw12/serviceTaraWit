package handlers

import (
	"tarawitApi/config"
	middlewares "tarawitApi/midleware"
	"tarawitApi/models"
	"tarawitApi/services"

	"github.com/gofiber/fiber/v2"
)

func Registerhandler(c *fiber.Ctx) error {
	var body models.User
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request json body", "nil": body})
	}
	user, err := services.AuthRegisterService(body)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"body": user})
}

func Authhandler(c *fiber.Ctx) error {
	var body models.AuthRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"error": "invalid request json body"})
	}

	result, err := services.AuthLoginService(config.Cfg, body)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(result)
}

func Me(c *fiber.Ctx) error {
	username, ok := c.Locals("username").(string)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}
	result, err := services.FindUserByUsername(username)
	if err != nil {
		return fiber.ErrUnauthorized
	}

	return c.JSON(fiber.Map{
		"user": result,
	})
}

// RefreshTokenHandler ต่ออายุ session ด้วย refresh token (rotation)
// POST /api/auth/refresh  body: { "refresh_token": "..." }
func RefreshTokenHandler(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&body); err != nil || body.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "refresh_token ไม่ถูกต้อง",
		})
	}

	// 1. ตรวจ + rotation (revoke เก่า, ออกใหม่)
	newRefresh, userID, err := services.RotateRefreshToken(
		c.Context(),
		body.RefreshToken,
		c.Get("User-Agent"),
	)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "session หมดอายุ กรุณาเข้าสู่ระบบใหม่",
		})
	}

	// 2. โหลด user — ถ้าถูกปิดใช้งาน ห้ามต่ออายุ session
	username, err := services.FindUsernameByID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "ไม่พบผู้ใช้งาน",
		})
	}
	user, err := services.FindUserByUsername(username)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "ไม่พบผู้ใช้งาน",
		})
	}
	if !user.IsActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "บัญชีถูกปิดใช้งาน โปรดติดต่อผู้ดูแลระบบ",
		})
	}

	// 3. ออก access token ใหม่
	roles := []string{}
	for _, r := range user.Roles {
		roles = append(roles, r.RoleName)
	}
	permissions := []string{}
	for _, p := range user.Permissions {
		permissions = append(permissions, p.PermissionName)
	}

	token, err := middlewares.GenerateJWT(
		config.Cfg,
		user.ID,
		user.Username,
		roles,
		permissions,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถสร้าง token ได้",
		})
	}

	user.PasswordHash = ""

	return c.JSON(fiber.Map{
		"token":         token,
		"refresh_token": newRefresh,
		"user":          user,
	})
}

// LogoutHandler เพิกถอน refresh token ฝั่ง server (logout ทุกอุปกรณ์ด้วย token นั้น)
// POST /api/auth/logout  body: { "refresh_token": "..." }
func LogoutHandler(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.BodyParser(&body) // ไม่ error ถ้าไม่มี body

	_ = services.RevokeRefreshToken(c.Context(), body.RefreshToken)

	return c.JSON(fiber.Map{
		"message": "ออกจากระบบแล้ว",
	})
}
