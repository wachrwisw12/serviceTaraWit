package iqahandlers

import (
	"os"
	"strconv"

	"tarawitApi/midleware"

	iqamodels "tarawitApi/iqaFeature/iqa_models"
	iqaservices "tarawitApi/iqaFeature/iqa_services"

	"github.com/gofiber/fiber/v2"
)

type IQAHandler struct {
	service *iqaservices.IQAService
}

func NewIQAHandler() *IQAHandler {
	return &IQAHandler{service: iqaservices.NewIQAService()}
}

// GET /iqa/tree — full standards tree
func (h *IQAHandler) GetTree(c *fiber.Ctx) error {
	tree, err := h.service.GetFullTree(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(tree)
}

// GET /iqa/quality-levels
func (h *IQAHandler) GetQualityLevels(c *fiber.Ctx) error {
	levels, err := h.service.ListQualityLevels(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(levels)
}

// ═══════════ Cycles ═══════════

// GET /iqa/cycles
func (h *IQAHandler) ListCycles(c *fiber.Ctx) error {
	cycles, err := h.service.ListCycles(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(cycles)
}

// POST /iqa/cycles
func (h *IQAHandler) CreateCycle(c *fiber.Ctx) error {
	var req iqamodels.CreateCycleRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}

	userID, err := middlewares.GetCurrentUserID(c)
	if err != nil {
		return fiber.ErrUnauthorized
	}

	id, err := h.service.CreateCycle(c.Context(), req, int64(userID))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"id": id})
}

// PATCH /iqa/cycles/:id/status
func (h *IQAHandler) UpdateCycleStatus(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id ไม่ถูกต้อง")
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}

	if err := h.service.UpdateCycleStatus(c.Context(), int64(id), body.Status); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(fiber.Map{"ok": true})
}

// ═══════════ Assessments ═══════════

// GET /iqa/cycles/:cycleId/assessments
func (h *IQAHandler) ListAssessments(c *fiber.Ctx) error {
	cycleID, err := c.ParamsInt("cycleId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "cycleId ไม่ถูกต้อง")
	}

	list, err := h.service.ListAssessmentsByCycle(c.Context(), int64(cycleID))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(list)
}

// POST /iqa/cycles/:cycleId/assessments — get or create my assessment
func (h *IQAHandler) GetOrCreateAssessment(c *fiber.Ctx) error {
	cycleID, err := c.ParamsInt("cycleId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "cycleId ไม่ถูกต้อง")
	}

	userID, err := middlewares.GetCurrentUserID(c)
	if err != nil {
		return fiber.ErrUnauthorized
	}

	a, err := h.service.GetOrCreateAssessment(c.Context(), int64(cycleID), int64(userID))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(a)
}

// GET /iqa/assessments/:id
func (h *IQAHandler) GetAssessment(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id ไม่ถูกต้อง")
	}

	a, scores, evidence, err := h.service.GetAssessmentDetail(c.Context(), int64(id))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}

	return c.JSON(fiber.Map{
		"assessment": a,
		"scores":     scores,
		"evidence":   evidence,
	})
}

// PUT /iqa/assessments/:id/scores
func (h *IQAHandler) SaveScores(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id ไม่ถูกต้อง")
	}

	var req iqamodels.SubmitScoresRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง")
	}

	if err := h.service.SaveScores(c.Context(), int64(id), req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(fiber.Map{"ok": true})
}

// POST /iqa/assessments/:id/submit
func (h *IQAHandler) SubmitAssessment(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id ไม่ถูกต้อง")
	}

	if err := h.service.SubmitAssessment(c.Context(), int64(id)); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(fiber.Map{"ok": true, "message": "ส่งผลการประเมินสำเร็จ"})
}

// ═══════════ Evidence ═══════════

// POST /iqa/assessments/:id/evidence
func (h *IQAHandler) UploadEvidence(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id ไม่ถูกต้อง")
	}

	userID, err := middlewares.GetCurrentUserID(c)
	if err != nil {
		return fiber.ErrUnauthorized
	}

	file, err := c.FormFile("file")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ไม่พบไฟล์")
	}

	// indicator_id (optional)
	var indicatorID *int64
	if v := c.FormValue("indicator_id"); v != "" {
		if parsed, err := strconv.ParseInt(v, 10, 64); err == nil {
			indicatorID = &parsed
		}
	}

	description := c.FormValue("description")

	e, err := h.service.UploadEvidence(c.Context(), int64(id), indicatorID, description, int64(userID), file)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(e)
}

// DELETE /iqa/assessments/:assessmentId/evidence/:evidenceId
func (h *IQAHandler) DeleteEvidence(c *fiber.Ctx) error {
	assessmentID, err := c.ParamsInt("assessmentId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "assessmentId ไม่ถูกต้อง")
	}
	evidenceID, err := c.ParamsInt("evidenceId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "evidenceId ไม่ถูกต้อง")
	}

	if err := h.service.DeleteEvidence(c.Context(), int64(assessmentID), int64(evidenceID)); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// GET /iqa/evidence/:id/view — ดูไฟล์หลักฐาน
func (h *IQAHandler) ViewEvidence(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id ไม่ถูกต้อง")
	}

	// ดึง file_path จาก DB (ผ่าน repo)
	_ = id
	// TODO: implement view evidence file
	return c.SendStatus(fiber.StatusNotImplemented)
}

// ═══════════ Summary ═══════════

// GET /iqa/cycles/:cycleId/summary
func (h *IQAHandler) GetSchoolSummary(c *fiber.Ctx) error {
	cycleID, err := c.ParamsInt("cycleId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "cycleId ไม่ถูกต้อง")
	}

	summary, err := h.service.GetSchoolSummary(c.Context(), int64(cycleID))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(summary)
}

// ═══════════ View evidence file ═══════════
func init() {
	// ensure storage dir exists
	_ = os.MkdirAll("./storage/iqa", 0755)
}
