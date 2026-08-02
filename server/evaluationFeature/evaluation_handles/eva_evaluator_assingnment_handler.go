package evaluationhandles

import (
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (h *EvaluationHandler) GetEvaluatorAssignmentDetail(c *fiber.Ctx) error {

	assignmentID, err := strconv.ParseInt(
		c.Params("assignmentId"),
		10,
		64,
	)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "invalid assignment id",
		})
	}


	// เอา user id จาก JWT middleware
	userID, ok := c.Locals("user_id").(int64)
     if !ok {
		log.Println("❌ user_id not found in context or wrong type")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}


	detail, err := h.service.GetEvaluatorAssignmentDetail(
		userID,
		assignmentID,
	)


	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": err.Error(),
		})
	}


	return c.JSON(detail)
}