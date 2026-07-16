package evaluationhandles

import (
	"log"

	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

	"github.com/gofiber/fiber/v2"
)

func (h *EvaluationHandler) CreateInstance(c *fiber.Ctx) error {

	var payload evaluationModels.CreateEvaluationInstancePayload

	// parse json body
	if err := c.BodyParser(&payload); err != nil {

		log.Println("❌ BodyParser Error:", err)

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid request body",
			"error":   err.Error(),
		})
	}

	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		log.Println("❌ user_id not found in context or wrong type")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}
	payload.CreateBy = userID

	// log ดูค่าที่รับมา
	// log.Println("===== Create Evaluation Instance =====")
	// log.Printf("TemplateID: %d\n", payload.TemplateID)
	// log.Printf("AcademicYear: %v\n", payload.AcademicYear)
	// log.Printf("Round: %s\n", payload.Round)
	// log.Printf("TargetMemberIDs: %+v\n", payload.TargetMemberIDs)
	// log.Printf("EvaluatorMemberIDs: %+v\n", payload.EvaluatorMemberIDs)
	// log.Printf("ShowScoreToVisibility: %v\n", payload.ShowScoreToVisibility)
	// log.Println("======================================")

	// เรียก service
	result, err := h.service.CreateInstance(c.Context(), payload)

	if err != nil {

		log.Println("❌ Create Instance Error:", err)

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "สร้างรอบประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
		})
	}

	// response success
	return c.JSON(result)
}
func (h *EvaluationHandler) GetInstanceList(c *fiber.Ctx) error {
	        result ,err := h.service.GetInstanceList()
			if err != nil {

		log.Println("❌ Create Instance Error:", err)

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "กรุณาลองใหม่อีกครั้ง",
		})
	}
	return   c.JSON(result)
}
// func (h *EvaluationHandler) GetAssignmentDetail(c *fiber.Ctx) error {
// 	userID, ok := c.Locals("user_id").(int64)
// 	if !ok {
// 		log.Println("❌ user_id not found in context or wrong type")
// 		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
// 			"success": false,
// 			"message": "unauthorized",
// 		})
// 	}

// 	assignmentID, err := strconv.ParseUint(c.Params("id"), 10, 64)
// 	if err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"success": false,
// 			"message": "invalid assignment id",
// 		})
// 	}

// 	// เรียก service
// 	result, err := h.evaluationService.GetAssignmentDetail(userID, assignmentID)
// 	if err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"success": false,
// 			"message": err.Error(),
// 		})
// 	}

// 	return c.JSON(fiber.Map{
// 		"success": true,
// 		"data": result,
// 	})
// }