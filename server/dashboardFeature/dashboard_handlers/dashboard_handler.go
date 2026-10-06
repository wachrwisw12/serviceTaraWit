package dashboardhandlers

import (
	dashboardrepositories "tarawitApi/dashboardFeature/dashboard_repositories"
	dashboardservices "tarawitApi/dashboardFeature/dashboard_services"

	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct {
	service *dashboardservices.DashboardService
}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{
		service: dashboardservices.NewDashboardService(
			dashboardrepositories.NewDashboardRepository(),
		),
	}
}

// GetExecutiveDashboard สรุปภาพรวมข้ามโมดูลสำหรับผู้บริหาร
func (h *DashboardHandler) GetExecutiveDashboard(c *fiber.Ctx) error {
	data, err := h.service.GetExecutiveDashboard(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}
