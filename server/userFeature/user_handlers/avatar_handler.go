package userhandlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"tarawitApi/db"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

const (
	avatarDir   = "./storage/avatars"
	maxAvatarMB = 5 * 1024 * 1024 // 5MB
)

var allowedAvatarTypes = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
	"image/gif":  "gif",
}

// UploadAvatar อัปโหลดรูปโปรไฟล์ของผู้ใช้ปัจจุบัน
// POST /api/user/profile/avatar (multipart/form-data, field "file")
func (h *UserHandler) UploadAvatar(c *fiber.Ctx) error {

	userID, err := middlewares.GetCurrentUserID(c)
	if err != nil {
		return fiber.ErrUnauthorized
	}

	file, err := c.FormFile("file")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ไม่พบไฟล์รูปภาพ")
	}

	if file.Size > maxAvatarMB {
		return fiber.NewError(fiber.StatusBadRequest, "รูปภาพต้องมีขนาดไม่เกิน 5MB")
	}

	contentType := file.Header.Get("Content-Type")

	ext, ok := allowedAvatarTypes[contentType]
	if !ok {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ GIF",
		)
	}

	// --------------------------------------------------
	// 1. อ่าน avatar_url เดิม (เพื่อลบไฟล์เก่า)
	// --------------------------------------------------

	var oldAvatarURL *string

	err = db.DB.QueryRow(
		c.Context(),
		`
		SELECT avatar_url
		FROM users
		WHERE id = $1
		`,
		userID,
	).Scan(&oldAvatarURL)

	if err != nil {
		return fiber.NewError(
			fiber.StatusInternalServerError,
			"ไม่พบข้อมูลผู้ใช้งาน",
		)
	}

	// --------------------------------------------------
	// 2. บันทึกไฟล์ใหม่
	// --------------------------------------------------

	if err := os.MkdirAll(avatarDir, 0o755); err != nil {
		return fiber.NewError(
			fiber.StatusInternalServerError,
			"ไม่สามารถสร้างโฟลเดอร์รูปโปรไฟล์ได้",
		)
	}

	fileName := fmt.Sprintf(
		"%d_%d.%s",
		userID,
		time.Now().UnixMilli(),
		ext,
	)

	savePath := filepath.Join(avatarDir, fileName)

	if err := c.SaveFile(file, savePath); err != nil {
		return fiber.NewError(
			fiber.StatusInternalServerError,
			"บันทึกรูปภาพไม่สำเร็จ",
		)
	}

	avatarURL := "/api/uploads/avatars/" + fileName

	// --------------------------------------------------
	// 3. อัปเดตฐานข้อมูล
	// --------------------------------------------------

	_, err = db.DB.Exec(
		c.Context(),
		`
		UPDATE users
		SET avatar_url = $1,
		    updated_at = NOW()
		WHERE id = $2
		`,
		avatarURL,
		userID,
	)

	if err != nil {
		return fiber.NewError(
			fiber.StatusInternalServerError,
			"อัปเดตรูปโปรไฟล์ไม่สำเร็จ",
		)
	}

	// --------------------------------------------------
	// 4. ลบไฟล์เก่า (ถ้ามี และอยู่ในโฟลเดอร์ avatars เท่านั้น)
	// --------------------------------------------------

	if oldAvatarURL != nil && *oldAvatarURL != "" {
		oldName := strings.TrimPrefix(*oldAvatarURL, "/api/uploads/avatars/")

		// กัน path traversal
		if oldName != "" &&
			filepath.Base(oldName) == oldName &&
			oldName != fileName {
			_ = os.Remove(filepath.Join(avatarDir, oldName))
		}
	}

	return c.JSON(fiber.Map{
		"message":    "อัปเดตรูปโปรไฟล์สำเร็จ",
		"avatar_url": avatarURL,
	})
}

// ViewAvatar ส่งไฟล์รูปโปรไฟล์กลับ (public — รองรับ <img src>)
// GET /api/uploads/avatars/:filename
func ViewAvatar(c *fiber.Ctx) error {

	name := c.Params("filename")

	// กัน path traversal: อนุญาตเฉพาะชื่อไฟล์ธรรมดา
	if name == "" ||
		name != filepath.Base(name) ||
		strings.Contains(name, "..") {
		return fiber.NewError(fiber.StatusBadRequest, "invalid filename")
	}

	filePath := filepath.Join(avatarDir, name)

	if _, err := os.Stat(filePath); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "file not found")
	}

	return c.SendFile(filePath, false)
}
