package evaluationhandles

import (
	"errors"
	"log"
	"strconv"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

func (h *EvaluationHandler) GetMyinstance(c *fiber.Ctx) error {

	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		log.Println("❌ user_id not found in context or wrong type")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}
	result, err := h.service.GetMyInstance(userID)
	if err != nil {

		log.Println("❌ Create Instance Error:", err)

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "กรุณาลองใหม่อีกครั้ง",
		})
	}
	return c.JSON(result)
}

// GetMyInstanceDetail คืนรายละเอียดของ target ที่ผู้ใช้เป็นเจ้าตัวหรือเป็นผู้ลงนามของ instance
func (h *EvaluationHandler) GetMyInstanceDetail(c *fiber.Ctx) error {

	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		log.Println("❌ user_id not found in context or wrong type")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}

	instanceID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		log.Println("❌ Invalid instance id:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "รหัสรายการไม่ถูกต้อง",
		})
	}

	var targetID *int64
	if rawTargetID := c.Query("target_id"); rawTargetID != "" {
		parsedTargetID, parseErr := strconv.ParseInt(rawTargetID, 10, 64)
		if parseErr != nil || parsedTargetID <= 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": "รหัสผู้ถูกประเมินไม่ถูกต้อง",
			})
		}
		targetID = &parsedTargetID
	}

	result, err := h.service.GetMyInstanceDetail(userID, instanceID, targetID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "ไม่พบรายการที่ต้องการ",
			})
		}

		log.Println("❌ Get Instance Detail Error:", err)

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "กรุณาลองใหม่อีกครั้ง",
		})
	}

	return c.JSON(result)
}

func (h *EvaluationHandler) UpdateInstanceFields(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int64)

	instanceID, err := strconv.ParseInt(
		c.Params("id"),
		10,
		64,
	)

	if err != nil {
		return c.Status(400).JSON(
			fiber.Map{
				"message": "invalid instance id",
			},
		)
	}

	var req evaluationModels.UpdateInstanceFieldsRequest

	if err := c.BodyParser(&req); err != nil {

		return c.Status(400).JSON(
			fiber.Map{
				"message": "invalid body",
			},
		)

	}

	err = h.service.UpdateInstanceFields(
		userID,
		instanceID,
		req.Fields,
	)

	if err != nil {

		return c.Status(fiber.StatusForbidden).JSON(
			fiber.Map{
				"message": err.Error(),
			},
		)

	}

	return c.JSON(
		fiber.Map{
			"message": "updated",
		},
	)
}
