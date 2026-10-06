package dashboardservices

import (
	"context"

	dashboardmodel "tarawitApi/dashboardFeature/dashboard_model"
	dashboardrepositories "tarawitApi/dashboardFeature/dashboard_repositories"
)

type DashboardService struct {
	repo *dashboardrepositories.DashboardRepository
}

func NewDashboardService(repo *dashboardrepositories.DashboardRepository) *DashboardService {
	return &DashboardService{repo: repo}
}

// GetExecutiveDashboard รวมสถิติข้ามโมดูลในครั้งเดียว
func (s *DashboardService) GetExecutiveDashboard(
	ctx context.Context,
) (*dashboardmodel.ExecutiveDashboard, error) {
	personnel, err := s.repo.GetPersonnelStats(ctx)
	if err != nil {
		return nil, err
	}
	attendance, err := s.repo.GetAttendanceStats(ctx)
	if err != nil {
		return nil, err
	}
	evaluation, err := s.repo.GetEvaluationStats(ctx)
	if err != nil {
		return nil, err
	}
	template, err := s.repo.GetTemplateStats(ctx)
	if err != nil {
		return nil, err
	}
	return &dashboardmodel.ExecutiveDashboard{
		Personnel:  *personnel,
		Attendance: *attendance,
		Evaluation: *evaluation,
		Template:   *template,
	}, nil
}
