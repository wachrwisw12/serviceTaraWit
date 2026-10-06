package evaluationhandles

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
	evaluationservices "tarawitApi/evaluationFeature/evaluation_services"
	evaluationRepositories "tarawitApi/evaluationFeature/evauation_ropositories"
)

type EvaluationHandler struct {
	service *evaluationservices.EvaluationService
}

func NewEvaluationHandler() *EvaluationHandler {

	repo := evaluationRepositories.NewEvaluationRepository()

	service := evaluationservices.NewEvaluationService(repo)

	return &EvaluationHandler{
		service: service,
	}
}

func (h *EvaluationHandler) GetTemplate(c *fiber.Ctx) error {

	data, err := h.service.GetTemplateService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}
	println(data)
	return c.JSON(data)
}

func (h *EvaluationHandler) CreateTemplate(c *fiber.Ctx) error {
	var payload evaluationModels.TemplateWritePayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}
	userID, ok := c.Locals("user_id").(int64)
	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "ไม่พบข้อมูลผู้ใช้งาน"})
	}
	result, err := h.service.CreateTemplate(c.Context(), payload, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": result})
}

func (h *EvaluationHandler) GetTemplateFullByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid template id",
		})
	}

	data, err := h.service.GetTemplateFullByIDService(id)
	if err != nil {
		return err
	}

	return c.JSON(data)
}

// UpdateTemplate — แก้ไขเทมเพลต
func (h *EvaluationHandler) UpdateTemplate(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "invalid template id"})
	}

	var payload evaluationModels.TemplateWritePayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	userID, ok := c.Locals("user_id").(int64)
	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "ไม่พบข้อมูลผู้ใช้งาน"})
	}

	result, err := h.service.UpdateTemplate(c.Context(), id, payload, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "อัปเดตแม่แบบสำเร็จ", "data": result})
}

// DeleteTemplate — ลบเทมเพลต
func (h *EvaluationHandler) DeleteTemplate(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "invalid template id"})
	}

	if err := h.service.DeleteTemplate(c.Context(), id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "ลบแม่แบบสำเร็จ"})
}

// DuplicateTemplate — คัดลอกเทมเพลต
func (h *EvaluationHandler) DuplicateTemplate(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "invalid template id"})
	}

	userID, ok := c.Locals("user_id").(int64)
	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "ไม่พบข้อมูลผู้ใช้งาน"})
	}

	result, err := h.service.DuplicateTemplate(c.Context(), id, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "คัดลอกแม่แบบสำเร็จ", "data": result})
}

// UpdateTemplateStatus — เปลี่ยนสถานะเทมเพลต
func (h *EvaluationHandler) UpdateTemplateStatus(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "invalid template id"})
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	if err := h.service.UpdateTemplateStatus(c.Context(), id, body.Status); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "อัปเดตสถานะสำเร็จ"})
}

// internal/handler/evaluation_instance_handler.go

func (h *EvaluationHandler) GetCount(c *fiber.Ctx) error {
	templateID, err := strconv.ParseInt(c.Query("template_id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "template_id ไม่ถูกต้อง"})
	}
	academicYear, err := strconv.Atoi(c.Query("academic_year"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "academic_year ไม่ถูกต้อง"})
	}

	count, err := h.service.CountByTemplateAndYear(templateID, academicYear)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "นับรอบไม่สำเร็จ"})
	}

	return c.JSON(fiber.Map{"count": count})
}
