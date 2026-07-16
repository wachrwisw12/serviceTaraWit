package evaluationhandles

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

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