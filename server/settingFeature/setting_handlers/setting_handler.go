package settinghandlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	settingmodel "tarawitApi/settingFeature/setting_model"
	settingrepositories "tarawitApi/settingFeature/setting_repositories"
	settingservices "tarawitApi/settingFeature/setting_services"
)

type SettingHandler struct {
	service *settingservices.SettingService
}

func NewSettingHandler() *SettingHandler {
	repo := settingrepositories.NewSettingRepository()
	service := settingservices.NewSettingService(repo)
	return &SettingHandler{service: service}
}

func parseID(c *fiber.Ctx) (int64, error) {
	return strconv.ParseInt(c.Params("id"), 10, 64)
}

func parseParamID(c *fiber.Ctx, name string) (int64, error) {
	return strconv.ParseInt(c.Params(name), 10, 64)
}

// ==================== ข้อมูลโรงเรียน ====================

func (h *SettingHandler) GetSchool(c *fiber.Ctx) error {

	data, err := h.service.GetSchoolService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *SettingHandler) UpdateSchool(c *fiber.Ctx) error {

	var req settingmodel.UpdateSchoolRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if err := h.service.UpdateSchoolService(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "บันทึกข้อมูลโรงเรียนสำเร็จ",
	})
}

// ==================== ปีการศึกษา ====================

func (h *SettingHandler) ListAcademicYears(c *fiber.Ctx) error {

	data, err := h.service.ListAcademicYearsService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *SettingHandler) CreateAcademicYear(c *fiber.Ctx) error {

	var req settingmodel.CreateAcademicYearRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	id, err := h.service.CreateAcademicYearService(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "เพิ่มปีการศึกษาแล้ว",
		"id":      id,
	})
}

func (h *SettingHandler) UpdateAcademicYear(c *fiber.Ctx) error {

	id, err := parseParamID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	var req settingmodel.CreateAcademicYearRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if err := h.service.UpdateAcademicYearService(id, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "บันทึกข้อมูลสำเร็จ",
	})
}

func (h *SettingHandler) SetCurrentYear(c *fiber.Ctx) error {

	id, err := parseParamID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	if err := h.service.SetCurrentYearService(id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "ตั้งเป็นปีการศึกษาปัจจุบันแล้ว",
	})
}

func (h *SettingHandler) DeleteAcademicYear(c *fiber.Ctx) error {

	id, err := parseParamID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	if err := h.service.DeleteAcademicYearService(id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "ลบปีการศึกษาแล้ว",
	})
}

// ==================== ระดับคะแนน ====================

func (h *SettingHandler) ListScoreLevels(c *fiber.Ctx) error {

	// หน้าให้คะแนนเรียกแบบ active เท่านั้น, หน้าตั้งค่าเรียกทั้งหมด
	includeInactive := c.Query("include_inactive") == "true"

	data, err := h.service.ListScoreLevelsService(includeInactive)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *SettingHandler) UpdateScoreLevel(c *fiber.Ctx) error {

	id, err := parseParamID(c, "id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	var req settingmodel.UpdateScoreLevelRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if err := h.service.UpdateScoreLevelService(id, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "บันทึกข้อมูลสำเร็จ",
	})
}
