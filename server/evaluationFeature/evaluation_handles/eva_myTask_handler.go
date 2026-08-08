package evaluationhandles

import (
	"github.com/gofiber/fiber/v2"
)

// GET /evaluation/my-tasks
func (h *EvaluationHandler) GetMyTasks(c *fiber.Ctx) error {
	 userID := c.Locals("user_id").(int64)
    // userID ,err := middlewares.GetCurrentUserID(c)
	result, err := h.service.GetMyTasks(
		c.Context(),
		userID ,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": result,
	})
}

func (h *EvaluationHandler) GetAllTasks(c *fiber.Ctx) error {
	result, err := h.service.GetAllTasks(
		c.Context(),
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": result,
	})
}

// GET /evaluation/batches/:batchId/targets
func (h *EvaluationHandler) GetBatchTargets(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)
	batchID := c.Params("batchId")

	result, err := h.service.GetBatchTargets(
		c.Context(),
		batchID,
		userID,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": result,
	})
}