package evaluationhandles

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)
func (h *EvaluationHandler) GetMyCreatedEvaluations(
	c *fiber.Ctx,
) error {

	userID, ok := c.Locals("user_id").(int64)

	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(
			fiber.Map{
				"message": "ไม่พบข้อมูลผู้ใช้งาน",
			},
		)
	}

	data, err := h.service.GetMyCreatedEvaluations(
		c.Context(),
		userID,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(
			fiber.Map{
				"message": err.Error(),
			},
		)
	}

	return c.JSON(
		fiber.Map{
			"data": data,
		},
	)
}
func (h *EvaluationHandler) StartEvaluationInstance(
	c *fiber.Ctx,
) error {

	instanceID, err := strconv.ParseInt(
		c.Params("id"),
		10,
		64,
	)

	if err != nil || instanceID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(
			fiber.Map{
				"message": "instance_id ไม่ถูกต้อง",
			},
		)
	}

	userID, ok := c.Locals("user_id").(int64)

	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(
			fiber.Map{
				"message": "ไม่พบข้อมูลผู้ใช้งาน",
			},
		)
	}

	err = h.service.StartEvaluationInstance(
		c.Context(),
		instanceID,
		userID,
	)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(
			fiber.Map{
				"message": err.Error(),
			},
		)
	}

	return c.JSON(
		fiber.Map{
			"message": "เริ่มการประเมินเรียบร้อยแล้ว",
		},
	)
}