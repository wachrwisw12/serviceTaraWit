package evaluationhandles

import (
	"log"
	"strconv"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

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


func (h *EvaluationHandler)  SubmitEvaluationAnswers(c *fiber.Ctx) error {
	assignmentID, err := strconv.ParseInt(
		c.Params("assignmentId"),
		10,
		64,
	)

	if err != nil || assignmentID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "assignment_id ไม่ถูกต้อง",
		})
	}
userID, ok := c.Locals("user_id").(int64)

if !ok || userID <= 0 {
	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
		"message": "ไม่พบข้อมูลผู้ใช้งาน",
	})
}
	var req evaluationModels.SubmitEvaluationRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "รูปแบบข้อมูลไม่ถูกต้อง",
		})
	}

	if len(req.Answers) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "ไม่พบคำตอบ",
		})
	}

	result, err := h.service.SubmitEvaluationAnswers(
	c.Context(),
	assignmentID,
	userID,
	req,
)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "บันทึกคะแนนสำเร็จ",
		"data":    result,
	})
}