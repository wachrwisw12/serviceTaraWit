package evaluationhandles

import (
	"github.com/gofiber/fiber/v2"
)

// GET /evaluation/my-tasks
func (h *EvaluationHandler) GetMyTasks(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	result, err := h.service.GetMyTasks(
		c.Context(),
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

// GET /evaluation/tasks
// Same as GetMyTasks but not scoped to the requesting user - returns every
// evaluation batch in the system. The frontend uses this + evaluator_id on
// each item to separate "batches I evaluate" from "batches others evaluate".
//
// TODO: this calls h.service.GetAllTasks(ctx), which does not exist yet.
// Add it to the service (see note below) — I don't have that file yet so
// I can't write its internals to match your actual query/repository layer.
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