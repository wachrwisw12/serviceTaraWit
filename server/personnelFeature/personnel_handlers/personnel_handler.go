package personnelhandlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"tarawitApi/db"
	personnelmodel "tarawitApi/personnelFeature/personnel_model"
	personnelrepositories "tarawitApi/personnelFeature/personnel_repositories"
	personnelservices "tarawitApi/personnelFeature/personnel_services"
)

type PersonnelHandler struct {
	service *personnelservices.PersonnelService
}

func NewPersonnelHandler() *PersonnelHandler {
	repo := personnelrepositories.NewPersonnelRepository()
	service := personnelservices.NewPersonnelService(repo)
	return &PersonnelHandler{service: service}
}

func parseID(c *fiber.Ctx, name string) (int64, error) {
	return strconv.ParseInt(c.Params(name), 10, 64)
}

// ==================== บุคลากร ====================

func (h *PersonnelHandler) ListPersonnel(c *fiber.Ctx) error {

	filter := personnelmodel.ListPersonnelFilter{
		Search:       c.Query("search"),
		PersonTypeID: c.QueryInt("person_type_id"),
		PositionID:   c.QueryInt("position_id"),
		IsActive:     c.Query("is_active"),
		Page:         c.QueryInt("page", 1),
		Limit:        c.QueryInt("limit", 20),
	}

	data, err := h.service.ListPersonnelService(filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *PersonnelHandler) GetPersonnel(c *fiber.Ctx) error {

	id, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	data, err := h.service.GetPersonnelService(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "ไม่พบบุคลากร",
		})
	}

	return c.JSON(data)
}

func (h *PersonnelHandler) CreatePersonnel(c *fiber.Ctx) error {

	var req personnelmodel.CreatePersonnelRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	id, err := h.service.CreatePersonnelService(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "เพิ่มบุคลากรสำเร็จ",
		"id":      id,
	})
}

func (h *PersonnelHandler) UpdatePersonnel(c *fiber.Ctx) error {

	id, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	var req personnelmodel.UpdatePersonnelRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if err := h.service.UpdatePersonnelService(id, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "บันทึกข้อมูลสำเร็จ",
	})
}

func (h *PersonnelHandler) BatchCreatePersonnel(c *fiber.Ctx) error {

	var req personnelmodel.BatchCreatePersonnelRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "กรุณาระบุข้อมูลอย่างน้อย 1 รายการ",
		})
	}

	if len(req.Items) > 200 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "นำเข้าได้ไม่เกิน 200 รายการต่อครั้ง",
		})
	}

	result, err := h.service.BatchCreatePersonnelService(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(result)
}

func (h *PersonnelHandler) AdminResetPassword(c *fiber.Ctx) error {

	id, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	var req personnelmodel.AdminResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if err := h.service.AdminResetPasswordService(id, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "รีเซ็ตรหัสผ่านสำเร็จ",
	})
}

func (h *PersonnelHandler) DeactivatePersonnel(c *fiber.Ctx) error {

	id, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	if err := h.service.SetActiveService(id, false); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "ปิดใช้งานบุคลากรแล้ว",
	})
}

func (h *PersonnelHandler) ActivatePersonnel(c *fiber.Ctx) error {

	id, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	if err := h.service.SetActiveService(id, true); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "เปิดใช้งานบุคลากรแล้ว",
	})
}

// ==================== ตำแหน่ง ====================

func (h *PersonnelHandler) ListPositions(c *fiber.Ctx) error {

	data, err := h.service.ListPositionsService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *PersonnelHandler) CreatePosition(c *fiber.Ctx) error {

	var req personnelmodel.CreatePositionRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	id, err := h.service.CreatePositionService(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "เพิ่มตำแหน่งสำเร็จ",
		"id":      id,
	})
}

func (h *PersonnelHandler) UpdatePosition(c *fiber.Ctx) error {

	id, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	var req personnelmodel.CreatePositionRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if err := h.service.UpdatePositionService(id, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "บันทึกข้อมูลสำเร็จ",
	})
}

func (h *PersonnelHandler) DeletePosition(c *fiber.Ctx) error {

	id, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	if err := h.service.DeletePositionService(id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "ลบตำแหน่งสำเร็จ",
	})
}

// ==================== อัปโหลดรูปโปรไฟล์ ====================

const (
	personnelAvatarDir   = "./storage/avatars"
	personnelMaxAvatarMB = 5 * 1024 * 1024 // 5MB
)

var personnelAllowedAvatarTypes = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
	"image/gif":  "gif",
}

// UploadPersonnelAvatar อัปโหลดรูปโปรไฟล์ของบุคลากร (แอดมินจัดการให้)
// POST /api/personnel/:id/avatar (multipart/form-data, field "file")
func (h *PersonnelHandler) UploadPersonnelAvatar(c *fiber.Ctx) error {

	targetID, err := parseID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	// ตรวจสอบว่าบุคลากรมีอยู่จริง
	p, err := h.service.GetPersonnelService(targetID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "ไม่พบบุคลากร",
		})
	}

	file, err := c.FormFile("file")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ไม่พบไฟล์รูปภาพ")
	}

	if file.Size > personnelMaxAvatarMB {
		return fiber.NewError(fiber.StatusBadRequest, "รูปภาพต้องมีขนาดไม่เกิน 5MB")
	}

	contentType := file.Header.Get("Content-Type")
	ext, ok := personnelAllowedAvatarTypes[contentType]
	if !ok {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ GIF",
		)
	}

	// 1. อ่าน avatar_url เดิม (เพื่อลบไฟล์เก่า)
	var oldAvatarURL *string
	err = db.DB.QueryRow(
		c.Context(),
		`SELECT avatar_url FROM users WHERE id = $1`,
		targetID,
	).Scan(&oldAvatarURL)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "ไม่สามารถอ่านข้อมูลเดิมได้")
	}

	// 2. บันทึกไฟล์ใหม่
	if err := os.MkdirAll(personnelAvatarDir, 0o755); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "ไม่สามารถสร้างโฟลเดอร์รูปโปรไฟล์ได้")
	}

	fileName := fmt.Sprintf(
		"%d_%d.%s",
		targetID,
		time.Now().UnixMilli(),
		ext,
	)
	savePath := filepath.Join(personnelAvatarDir, fileName)

	if err := c.SaveFile(file, savePath); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "บันทึกรูปภาพไม่สำเร็จ")
	}

	avatarURL := "/api/uploads/avatars/" + fileName

	// 3. อัปเดตฐานข้อมูล
	_, err = db.DB.Exec(
		c.Context(),
		`UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`,
		avatarURL,
		targetID,
	)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "อัปเดตรูปโปรไฟล์ไม่สำเร็จ")
	}

	// 4. ลบไฟล์เก่า (ถ้ามี และอยู่ในโฟลเดอร์ avatars เท่านั้น)
	if oldAvatarURL != nil && *oldAvatarURL != "" {
		oldName := strings.TrimPrefix(*oldAvatarURL, "/api/uploads/avatars/")
		if oldName != "" &&
			filepath.Base(oldName) == oldName &&
			oldName != fileName {
			_ = os.Remove(filepath.Join(personnelAvatarDir, oldName))
		}
	}

	return c.JSON(fiber.Map{
		"message":    "อัปเดตรูปโปรไฟล์สำเร็จ",
		"avatar_url": avatarURL,
		"personnel":  p,
	})
}

// ==================== ตัวเลือก ====================

func (h *PersonnelHandler) ListPersonTypes(c *fiber.Ctx) error {

	data, err := h.service.ListPersonTypesService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *PersonnelHandler) ListDepartments(c *fiber.Ctx) error {

	data, err := h.service.ListDepartmentsService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *PersonnelHandler) ListPrefixes(c *fiber.Ctx) error {

	data, err := h.service.ListPrefixesService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}
