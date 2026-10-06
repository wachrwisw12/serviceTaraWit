package routers

import (
	iqahandlers "tarawitApi/iqaFeature/iqa_handlers"
	middlewares "tarawitApi/midleware"

	"github.com/gofiber/fiber/v2"
)

func SetupIQARoute(iqaRoute fiber.Router) {
	handler := iqahandlers.NewIQAHandler()

	// ═══════════ Read-only (ต้อง login เท่านั้น) ═══════════

	// โครงสร้างมาตรฐานทั้งหมด
	iqaRoute.Get(
		"/tree",
		handler.GetTree,
	)

	// ระดับคุณภาพ
	iqaRoute.Get(
		"/quality-levels",
		handler.GetQualityLevels,
	)

	// ═══════════ Cycles ═══════════

	// รายการรอบการประเมิน
	iqaRoute.Get(
		"/cycles",
		handler.ListCycles,
	)

	// สร้างรอบการประเมินใหม่
	iqaRoute.Post(
		"/cycles",
		middlewares.RequirePermission("setting.manage"),
		handler.CreateCycle,
	)

	// เปลี่ยนสถานะรอบ
	iqaRoute.Patch(
		"/cycles/:id/status",
		middlewares.RequirePermission("setting.manage"),
		handler.UpdateCycleStatus,
	)

	// รายการผู้ประเมินในรอบ
	iqaRoute.Get(
		"/cycles/:cycleId/assessments",
		handler.ListAssessments,
	)

	// สร้าง/ดึงแบบประเมินของฉัน
	iqaRoute.Post(
		"/cycles/:cycleId/assessments",
		handler.GetOrCreateAssessment,
	)

	// สรุปผลระดับโรงเรียน
	iqaRoute.Get(
		"/cycles/:cycleId/summary",
		handler.GetSchoolSummary,
	)

	// ═══════════ Assessment detail ═══════════

	// ดูรายละเอียดแบบประเมิน (รวม scores + evidence)
	iqaRoute.Get(
		"/assessments/:id",
		handler.GetAssessment,
	)

	// บันทึกคะแนน
	iqaRoute.Put(
		"/assessments/:id/scores",
		handler.SaveScores,
	)

	// ส่งผลการประเมิน
	iqaRoute.Post(
		"/assessments/:id/submit",
		handler.SubmitAssessment,
	)

	// ═══════════ Evidence ═══════════

	// อัปโหลดหลักฐาน
	iqaRoute.Post(
		"/assessments/:id/evidence",
		handler.UploadEvidence,
	)

	// ลบหลักฐาน
	iqaRoute.Delete(
		"/assessments/:assessmentId/evidence/:evidenceId",
		handler.DeleteEvidence,
	)

	// ดูไฟล์หลักฐาน
	iqaRoute.Get(
		"/evidence/:id/view",
		handler.ViewEvidence,
	)
}
