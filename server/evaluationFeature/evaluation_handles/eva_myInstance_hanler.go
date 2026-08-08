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

// GetMyInstanceDetail คืนรายละเอียดของ instance เดียว สำหรับ user ที่เป็น target ของ instance นั้นเท่านั้น
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

	result, err := h.service.GetMyInstanceDetail(userID, instanceID)
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


	instanceID, err := strconv.ParseInt(
		c.Params("id"),
		10,
		64,
	)

	if err != nil {
		return c.Status(400).JSON(
			fiber.Map{
				"message":"invalid instance id",
			},
		)
	}


	var req evaluationModels.UpdateInstanceFieldsRequest


	if err := c.BodyParser(&req); err != nil {

		return c.Status(400).JSON(
			fiber.Map{
				"message":"invalid body",
			},
		)

	}



	err = h.service.UpdateInstanceFields(
		instanceID,
		req.Fields,
	)


	if err != nil {

		return c.Status(500).JSON(
			fiber.Map{
				"message":err.Error(),
			},
		)

	}



	return c.JSON(
		fiber.Map{
			"message":"updated",
		},
	)
}