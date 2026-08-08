package evaluationhandles

// import (
// 	"errors"
// 	"strconv"
// 	"tarawitApi/core"
// 	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

// 	"github.com/go-playground/validator/v10"
// 	"github.com/gofiber/fiber/v2"
// )

// var answerValidator = validator.New()

// func (h *EvaluationHandler) SaveEvaluationAnswersHandler(c *fiber.Ctx) error {
// 	assignmentID, err := strconv.ParseInt(
// 		c.Params("assignmentId"),
// 		10,
// 		64,
// 	)

// 	if err != nil || assignmentID <= 0 {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"success": false,
// 			"message": "assignmentId ไม่ถูกต้อง",
// 		})
// 	}

// 	/*
// 		ปรับชื่อ local ให้ตรงกับ JWT middleware ของระบบคุณ

// 		ตัวอย่าง middleware:
// 		c.Locals("user_id", claims.UserID)
// 	*/
// 	evaluatorID, err := core.GetAuthenticatedUserID(c)
// 	if err != nil {
// 		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
// 			"success": false,
// 			"message": err.Error(),
// 		})
// 	}

// 	// var req evaluationModels.SaveAnswersRequest

// 	// if err := c.BodyParser(&req); err != nil {
// 	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 	// 		"success": false,
// 	// 		"message": "รูปแบบข้อมูลไม่ถูกต้อง",
// 	// 		"error":   err.Error(),
// 	// 	})
// 	// }

// 	if err := answerValidator.Struct(req); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"success": false,
// 			"message": "ข้อมูลคำตอบไม่ครบถ้วน",
// 			"error":   err.Error(),
// 		})
// 	}

// 	result, err := SaveEvaluationAnswers(
// 		c.UserContext(),
// 		assignmentID,
// 		evaluatorID,
// 		req,
// 	)

// 	if err != nil {
// 		switch {
// 		case errors.Is(err, ErrAssignmentNotFound):
// 			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
// 				"success": false,
// 				"message": "ไม่พบรายการประเมิน",
// 			})

// 		case errors.Is(err, ErrAssignmentForbidden):
// 			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
// 				"success": false,
// 				"message": "คุณไม่มีสิทธิ์บันทึกคะแนนรายการนี้",
// 			})

// 		case errors.Is(err, ErrAssignmentSubmitted):
// 			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
// 				"success": false,
// 				"message": "รายการนี้ส่งผลประเมินแล้ว",
// 			})

// 		case errors.Is(err, ErrInstanceNotOpen):
// 			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
// 				"success": false,
// 				"message": "รอบการประเมินยังไม่เปิดหรือปิดแล้ว",
// 			})

// 		case errors.Is(err, ErrInvalidAnswer):
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 				"success": false,
// 				"message": err.Error(),
// 			})

// 		case errors.Is(err, ErrIncompleteAnswers):
// 			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 				"success": false,
// 				"message": err.Error(),
// 			})

// 		default:
// 			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 				"success": false,
// 				"message": "บันทึกคะแนนไม่สำเร็จ",
// 				"error":   err.Error(),
// 			})
// 		}
// 	}

// 	return c.Status(fiber.StatusOK).JSON(fiber.Map{
// 		"success": true,
// 		"message": func() string {
// 			if req.Submit {
// 				return "ส่งผลการประเมินเรียบร้อยแล้ว"
// 			}

// 			return "บันทึกร่างคะแนนเรียบร้อยแล้ว"
// 		}(),
// 		"data": result,
// 	})
// }

