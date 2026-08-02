package routers

import (
	evaluationhandles "tarawitApi/evaluationFeature/evaluation_handles"

	"github.com/gofiber/fiber/v2"
)

func SetupEvaluationRoute(evaluationRoute fiber.Router) {

	handler := evaluationhandles.NewEvaluationHandler()

	evaluationRoute.Get(
		"/get-evaluation/template",
		handler.GetTemplate,
	)

	evaluationRoute.Get(
		"/get-evaluation/templateByid/:id",
		handler.GetTemplateFullByID,
	)

	//instance ใช้งานแล้ว
	evaluationRoute.Get(
		"/evaluation-instances/count",
		handler.GetCount,
	)
	evaluationRoute.Get(
		"/evaluation-instances/list",
		handler.GetInstanceList,
	)
	evaluationRoute.Post(
		"/evaluation-instances/create",
		handler.CreateInstance,
	)

	//ทดสอบ getmyinstance

	evaluationRoute.Get(
		"/instances/get-my-instance",
		handler.GetMyinstance,
	)
	evaluationRoute.Get(
		"/instances/get-my-instanceByid/:id",
		handler.GetMyInstanceDetail,
	)

	evaluationRoute.Post(
		"/instances/:id/targets/:targetId/attachments",
		handler.UploadInstanceAttachment,
	)

	evaluationRoute.Get(
		"/instances/:id/targets/:targetId/attachments",
		handler.ListInstanceAttachments,
	)

	evaluationRoute.Delete(
		"/instances/:id/targets/:targetId/attachments/:attachmentId",
		handler.DeleteInstanceAttachment,
	)
	evaluationRoute.Get(
		"/instances/:id/targets/:targetId/attachments/:attachmentId/view",
		handler.ViewInstanceAttachment,
	)
	// update field ของผู้ถูกประเมิน
	evaluationRoute.Put(
		"/instances/:id/fields",
		handler.UpdateInstanceFields,
	)
	//mytask
	evaluationRoute.Get(
		"/my-tasks", handler.GetMyTasks,
	)
	evaluationRoute.Get("/batches/:batchId/targets", handler.GetBatchTargets)

	// ★ ใหม่: การประเมินทั้งหมดในระบบ (ไม่กรองเฉพาะ user ปัจจุบัน)
	// ตรงกับที่ frontend เรียก axios.get("/evaluation/tasks")
	evaluationRoute.Get(
		"/tasks", handler.GetAllTasks,
	)

	// ดึงแบบประเมินที่ผู้ประเมินต้องให้คะแนน
evaluationRoute.Get(
    "/evaluator/assignments/:assignmentId",
    handler.GetEvaluatorAssignmentDetail,
)
}