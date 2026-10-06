package evaluationhandles

import (
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GET /evaluation/summary
// Query params: academic_year (optional)
func (h *EvaluationHandler) GetEvaluationSummary(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		log.Println("❌ user_id not found in context or wrong type")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}

	// academic_year is optional
	var academicYear *int
	if ay := c.Query("academic_year"); ay != "" {
		v, err := strconv.Atoi(ay)
		if err == nil {
			academicYear = &v
		}
	}

	result, err := h.service.GetEvaluationSummary(c.Context(), userID, academicYear)
	if err != nil {
		log.Println("❌ GetEvaluationSummary Error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "โหลดสรุปการประเมินไม่สำเร็จ",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}
