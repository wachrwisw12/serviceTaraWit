package evaluationhandles

import (
	"log"
	"strconv"

	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

	"github.com/gofiber/fiber/v2"
)

// GetInstanceEditDetail — ดึงข้อมูล instance สำหรับหน้าแก้ไข
func (h *EvaluationHandler) GetInstanceEditDetail(c *fiber.Ctx) error {

	instanceID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil || instanceID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "instance_id ไม่ถูกต้อง",
		})
	}

	userID, ok := c.Locals("user_id").(int64)
	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "ไม่พบข้อมูลผู้ใช้งาน",
		})
	}

	detail, err := h.service.GetInstanceEditDetail(c.Context(), instanceID, userID)
	if err != nil {
		log.Println("❌ GetInstanceEditDetail Error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": detail,
	})
}

// UpdateInstanceTargets — เพิ่ม/ลบ targets
func (h *EvaluationHandler) UpdateInstanceTargets(c *fiber.Ctx) error {

	instanceID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil || instanceID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "instance_id ไม่ถูกต้อง",
		})
	}

	userID, ok := c.Locals("user_id").(int64)
	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "ไม่พบข้อมูลผู้ใช้งาน",
		})
	}

	var payload evaluationModels.UpdateInstanceMembersPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "รูปแบบข้อมูลไม่ถูกต้อง",
		})
	}

	targetCount, err := h.service.UpdateTargets(
		c.Context(),
		instanceID,
		userID,
		payload.AddUserIDs,
		payload.RemoveUserIDs,
	)

	if err != nil {
		log.Println("❌ UpdateTargets Error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	// นับ evaluator count ปัจจุบันด้วย
	summary, err := h.service.GetInstanceEditDetail(c.Context(), instanceID, userID)
	evaluatorCount := 0
	if err == nil {
		evaluatorCount = len(summary.Evaluators)
	}

	return c.JSON(evaluationModels.UpdateInstanceMembersResponse{
		Success:        true,
		Message:        "อัปเดตผู้ถูกประเมินสำเร็จ",
		TargetCount:    targetCount,
		EvaluatorCount: evaluatorCount,
	})
}

// GetInstanceAuditLogs — ดึง audit log ของ instance
func (h *EvaluationHandler) GetInstanceAuditLogs(c *fiber.Ctx) error {

	instanceID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil || instanceID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "instance_id ไม่ถูกต้อง",
		})
	}

	limit := 50
	if l, err := strconv.Atoi(c.Query("limit", "50")); err == nil && l > 0 && l <= 200 {
		limit = l
	}

	logs, err := h.service.GetAuditLogs(c.Context(), instanceID, limit)
	if err != nil {
		log.Println("❌ GetAuditLogs Error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"data": logs,
	})
}

// UpdateInstanceEvaluators — เพิ่ม/ลบ evaluators
func (h *EvaluationHandler) UpdateInstanceEvaluators(c *fiber.Ctx) error {

	instanceID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil || instanceID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "instance_id ไม่ถูกต้อง",
		})
	}

	userID, ok := c.Locals("user_id").(int64)
	if !ok || userID <= 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "ไม่พบข้อมูลผู้ใช้งาน",
		})
	}

	var payload evaluationModels.UpdateInstanceMembersPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "รูปแบบข้อมูลไม่ถูกต้อง",
		})
	}

	evaluatorCount, err := h.service.UpdateEvaluators(
		c.Context(),
		instanceID,
		userID,
		payload.AddUserIDs,
		payload.RemoveUserIDs,
		payload.EvaluatorSettings,
	)

	if err != nil {
		log.Println("❌ UpdateEvaluators Error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	// นับ target count ปัจจุบันด้วย
	summary, err := h.service.GetInstanceEditDetail(c.Context(), instanceID, userID)
	targetCount := 0
	if err == nil {
		targetCount = len(summary.Targets)
	}

	return c.JSON(evaluationModels.UpdateInstanceMembersResponse{
		Success:        true,
		Message:        "อัปเดตผู้ประเมินสำเร็จ",
		TargetCount:    targetCount,
		EvaluatorCount: evaluatorCount,
	})
}
