package evaluationhandles

import (
	"os"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

// POST /evaluation/instances/:id/targets/:targetId/attachments
func (h *EvaluationHandler) UploadInstanceAttachment(c *fiber.Ctx) error {

	instanceID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid instance id",
		)
	}

	targetID, err := c.ParamsInt("targetId")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid target id",
		)
	}

	userID, err := middlewares.GetCurrentUserID(c)
	if err != nil {
		return fiber.ErrUnauthorized
	}

	file, err := c.FormFile("file")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"ไม่พบไฟล์",
		)
	}

	attachment, err := h.service.UploadInstanceAttachment(
		instanceID,
		targetID,
		int(userID),
		file,
	)

	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			err.Error(),
		)
	}

	return c.Status(fiber.StatusCreated).JSON(attachment)
}


// GET /evaluation/instances/:id/targets/:targetId/attachments
func (h *EvaluationHandler) ListInstanceAttachments(c *fiber.Ctx) error {

	instanceID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid instance id",
		)
	}

	targetID, err := c.ParamsInt("targetId")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid target id",
		)
	}


	attachments, err := h.service.ListInstanceAttachments(
		instanceID,
		targetID,
	)

	if err != nil {
		return fiber.NewError(
			fiber.StatusInternalServerError,
			err.Error(),
		)
	}

	return c.JSON(attachments)
}


// DELETE /evaluation/instances/:id/targets/:targetId/attachments/:attachmentId
func (h *EvaluationHandler) DeleteInstanceAttachment(c *fiber.Ctx) error {

	instanceID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid instance id",
		)
	}

	targetID, err := c.ParamsInt("targetId")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid target id",
		)
	}

	attachmentID, err := c.ParamsInt("attachmentId")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid attachment id",
		)
	}


	userID, err := middlewares.GetCurrentUserID(c)
	if err != nil {
		return fiber.ErrUnauthorized
	}


	err = h.service.DeleteInstanceAttachment(
		instanceID,
		targetID,
		attachmentID,
		int(userID),
	)

	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			err.Error(),
		)
	}


	return c.SendStatus(fiber.StatusNoContent)
}

func (h *EvaluationHandler) ViewInstanceAttachment(c *fiber.Ctx) error {

	attachmentID, err := c.ParamsInt("attachmentId")
	if err != nil {
		return fiber.NewError(
			fiber.StatusBadRequest,
			"invalid attachment id",
		)
	}


	attachment, err := h.service.GetAttachmentByID(
		attachmentID,
	)

	if err != nil {
		return fiber.NewError(
			fiber.StatusNotFound,
			"attachment not found",
		)
	}


	// ตรวจว่ามีไฟล์จริงไหม
	if _, err := os.Stat(attachment.FilePath); err != nil {
		return fiber.NewError(
			fiber.StatusNotFound,
			"file not found",
		)
	}


	// ส่งไฟล์ให้ browser
	return c.SendFile(
		attachment.FilePath,
		false,
	)
}