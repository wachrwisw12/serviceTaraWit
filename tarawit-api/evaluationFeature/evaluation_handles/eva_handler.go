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
