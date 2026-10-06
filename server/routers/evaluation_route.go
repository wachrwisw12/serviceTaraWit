package routers

import (
	evaluationhandles "tarawitApi/evaluationFeature/evaluation_handles"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

func SetupEvaluationRoute(evaluationRoute fiber.Router) {

	handler := evaluationhandles.NewEvaluationHandler()

	// สรุปการประเมินสำหรับ Dashboard
	evaluationRoute.Get(
		"/summary",
		middlewares.RequirePermission("instance.view", "evaluation.evaluate"),
		handler.GetEvaluationSummary,
	)

	// แบบประเมิน (template) — ดูได้เมื่อมี template.view
	evaluationRoute.Get(
		"/get-evaluation/template",
		middlewares.RequirePermission("template.view"),
		handler.GetTemplate,
	)

	evaluationRoute.Get(
		"/get-evaluation/templateByid/:id",
		middlewares.RequirePermission("template.view"),
		handler.GetTemplateFullByID,
	)
	evaluationRoute.Post(
		"/templates",
		middlewares.RequirePermission("template.create"),
		handler.CreateTemplate,
	)

	// แก้ไขเทมเพลต
	evaluationRoute.Put(
		"/templates/:id",
		middlewares.RequirePermission("template.create"),
		handler.UpdateTemplate,
	)

	// ลบเทมเพลต
	evaluationRoute.Delete(
		"/templates/:id",
		middlewares.RequirePermission("template.create"),
		handler.DeleteTemplate,
	)

	// คัดลอกเทมเพลต
	evaluationRoute.Post(
		"/templates/:id/duplicate",
		middlewares.RequirePermission("template.create"),
		handler.DuplicateTemplate,
	)

	// เปลี่ยนสถานะเทมเพลต
	evaluationRoute.Patch(
		"/templates/:id/status",
		middlewares.RequirePermission("template.create"),
		handler.UpdateTemplateStatus,
	)

	// instance — สร้างต้องมี instance.create, ดูได้เมื่อมี instance.view
	evaluationRoute.Get(
		"/evaluation-instances/count",
		middlewares.RequirePermission("instance.view"),
		handler.GetCount,
	)
	evaluationRoute.Get(
		"/evaluation-instances/list",
		middlewares.RequirePermission("instance.view"),
		handler.GetInstanceList,
	)
	evaluationRoute.Post(
		"/evaluation-instances/create",
		middlewares.RequirePermission("instance.create"),
		handler.CreateInstance,
	)

	// รายการรับประเมินของฉัน
	evaluationRoute.Get(
		"/instances/get-my-instance",
		middlewares.RequirePermission("instance.view"),
		handler.GetMyinstance,
	)
	evaluationRoute.Get(
		"/instances/get-my-instanceByid/:id",
		middlewares.RequirePermission("instance.view", "instance.create"),
		handler.GetMyInstanceDetail,
	)

	// ไฟล์แนบของผู้ถูกประเมิน — อัปโหลด/ลบ ต้องมีสิทธิ์สร้าง instance หรือประเมิน
	evaluationRoute.Post(
		"/instances/:id/targets/:targetId/attachments",
		middlewares.UploadLimiter(),
		middlewares.RequirePermission("instance.create", "evaluation.evaluate"),
		handler.UploadInstanceAttachment,
	)

	evaluationRoute.Get(
		"/instances/:id/targets/:targetId/attachments",
		middlewares.RequirePermission("instance.view"),
		handler.ListInstanceAttachments,
	)

	evaluationRoute.Delete(
		"/instances/:id/targets/:targetId/attachments/:attachmentId",
		middlewares.RequirePermission("instance.create", "evaluation.evaluate"),
		handler.DeleteInstanceAttachment,
	)
	evaluationRoute.Get(
		"/instances/:id/targets/:targetId/attachments/:attachmentId/view",
		middlewares.RequirePermission("instance.view"),
		handler.ViewInstanceAttachment,
	)

	// update field ของผู้ถูกประเมิน
	evaluationRoute.Put(
		"/instances/:id/fields",
		middlewares.RequirePermission("instance.view"),
		handler.UpdateInstanceFields,
	)

	// mytask / batches / tasks — ดูรายการ
	evaluationRoute.Get(
		"/my-tasks",
		handler.GetMyTasks,
	)
	evaluationRoute.Get(
		"/batches/:batchId/targets",
		handler.GetBatchTargets,
	)

	// การประเมินทั้งหมดในระบบ (ไม่กรองเฉพาะ user ปัจจุบัน)
	evaluationRoute.Get(
		"/tasks",
		middlewares.RequirePermission("instance.view"),
		handler.GetAllTasks,
	)

	// ดูแบบประเมินที่ต้องให้คะแนน — ผู้ประเมิน หรือผู้ที่เห็น instance ได้
	evaluationRoute.Get(
		"/evaluator/assignments/:assignmentId",
		handler.GetEvaluatorAssignmentDetail,
	)
	// บันทึกคะแนน — repository ตรวจว่า assignment นี้เป็นของผู้ใช้ที่ล็อกอิน
	evaluationRoute.Post(
		"/evaluator/assignments/:assignmentId/submit",
		middlewares.EvaluationSubmitLimiter(),
		handler.SubmitEvaluationAnswers,
	)

	// การประเมินที่ฉันสร้าง — ต้องเป็นผู้สร้าง (instance.create)
	evaluationRoute.Get(
		"/evaluation-instances/my-created",
		middlewares.RequirePermission("instance.create"),
		handler.GetMyCreatedEvaluations,
	)
	// สรุปการประเมินที่ฉันสร้าง (จำนวนคน, คะแนนเฉลี่ย, ความครบถ้วน)
	evaluationRoute.Get(
		"/evaluation-instances/:id/summary",
		middlewares.RequirePermission("instance.create"),
		handler.GetMyCreatedEvaluationSummary,
	)
	evaluationRoute.Patch(
		"/evaluation-instances/:id/start",
		middlewares.RequirePermission("instance.create"),
		handler.StartEvaluationInstance,
	)
	// ปิดการประเมิน (เปลี่ยนจาก open เป็น closed)
	evaluationRoute.Patch(
		"/evaluation-instances/:id/close",
		middlewares.RequirePermission("instance.create"),
		handler.CloseEvaluationInstance,
	)

	// แก้ไขผู้เกี่ยวข้องในการประเมิน (เฉพาะ DRAFT)
	evaluationRoute.Get(
		"/evaluation-instances/:id/edit-detail",
		middlewares.RequirePermission("instance.create"),
		handler.GetInstanceEditDetail,
	)
	evaluationRoute.Put(
		"/evaluation-instances/:id/targets",
		middlewares.RequirePermission("instance.create"),
		handler.UpdateInstanceTargets,
	)
	evaluationRoute.Put(
		"/evaluation-instances/:id/evaluators",
		middlewares.RequirePermission("instance.create"),
		handler.UpdateInstanceEvaluators,
	)

	// Audit log ของการแก้ไขผู้เกี่ยวข้อง
	evaluationRoute.Get(
		"/evaluation-instances/:id/audit-log",
		middlewares.RequirePermission("instance.create"),
		handler.GetInstanceAuditLogs,
	)
}
