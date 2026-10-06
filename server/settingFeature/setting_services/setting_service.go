package settingservices

import (
	"context"
	"errors"
	"strings"

	"tarawitApi/db"
	settingmodel "tarawitApi/settingFeature/setting_model"
	settingrepositories "tarawitApi/settingFeature/setting_repositories"
)

type SettingService struct {
	repo *settingrepositories.SettingRepository
}

func NewSettingService(repo *settingrepositories.SettingRepository) *SettingService {
	return &SettingService{repo: repo}
}

// ==================== ข้อมูลโรงเรียน ====================

func (s *SettingService) GetSchoolService() (*settingmodel.SchoolInfo, error) {
	return s.repo.GetSchool(context.Background())
}

func (s *SettingService) UpdateSchoolService(
	req settingmodel.UpdateSchoolRequest,
) error {

	ctx := context.Background()

	if req.Name != nil && strings.TrimSpace(*req.Name) == "" {
		return errors.New("ชื่อโรงเรียนต้องไม่เป็นค่าว่าง")
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := s.repo.UpdateSchool(ctx, tx, req); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ==================== ปีการศึกษา ====================

func (s *SettingService) ListAcademicYearsService() ([]settingmodel.AcademicYear, error) {
	return s.repo.ListAcademicYears(context.Background())
}

func (s *SettingService) CreateAcademicYearService(
	req settingmodel.CreateAcademicYearRequest,
) (int64, error) {

	ctx := context.Background()

	if req.Year < 2500 || req.Year > 2700 {
		return 0, errors.New("ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2500-2700")
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	dup, err := s.repo.YearExists(ctx, tx, req.Year, 0)
	if err != nil {
		return 0, err
	}
	if dup {
		return 0, errors.New("ปีการศึกษานี้มีอยู่แล้ว")
	}

	id, err := s.repo.CreateAcademicYear(ctx, tx, req.Year)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return id, nil
}

func (s *SettingService) UpdateAcademicYearService(
	id int64,
	req settingmodel.CreateAcademicYearRequest,
) error {

	ctx := context.Background()

	if req.Year < 2500 || req.Year > 2700 {
		return errors.New("ปีการศึกษาต้องอยู่ในช่วง พ.ศ. 2500-2700")
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	exists, err := s.repo.AcademicYearExists(ctx, tx, id)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("ไม่พบปีการศึกษาที่ต้องการแก้ไข")
	}

	dup, err := s.repo.YearExists(ctx, tx, req.Year, id)
	if err != nil {
		return err
	}
	if dup {
		return errors.New("ปีการศึกษานี้มีอยู่แล้ว")
	}

	if err := s.repo.UpdateAcademicYear(ctx, tx, id, req.Year); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *SettingService) SetCurrentYearService(id int64) error {

	ctx := context.Background()

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	exists, err := s.repo.AcademicYearExists(ctx, tx, id)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("ไม่พบปีการศึกษาที่ต้องการตั้งเป็นปีปัจจุบัน")
	}

	if err := s.repo.SetCurrentYear(ctx, tx, id); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *SettingService) DeleteAcademicYearService(id int64) error {

	ctx := context.Background()

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var year int

	exists, err := s.repo.AcademicYearExists(ctx, tx, id)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("ไม่พบปีการศึกษาที่ต้องการลบ")
	}

	// หาค่าปีเพื่อตรวจว่ามีการประเมินอ้างอิงหรือไม่
	years, err := s.repo.ListAcademicYears(ctx)
	if err != nil {
		return err
	}
	for _, y := range years {
		if y.ID == id {
			year = y.Year
			break
		}
	}

	inUse, err := s.repo.YearInUse(ctx, tx, year)
	if err != nil {
		return err
	}
	if inUse {
		return errors.New("ไม่สามารถลบได้ — ปีการศึกษานี้มีการประเมินใช้งานอยู่")
	}

	if err := s.repo.DeleteAcademicYear(ctx, tx, id); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ==================== ระดับคะแนน ====================

func (s *SettingService) ListScoreLevelsService(
	includeInactive bool,
) ([]settingmodel.ScoreLevel, error) {
	return s.repo.ListScoreLevels(context.Background(), includeInactive)
}

func (s *SettingService) UpdateScoreLevelService(
	id int64,
	req settingmodel.UpdateScoreLevelRequest,
) error {

	ctx := context.Background()

	if req.Label != nil && strings.TrimSpace(*req.Label) == "" {
		return errors.New("ชื่อระดับต้องไม่เป็นค่าว่าง")
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	exists, err := s.repo.ScoreLevelExists(ctx, tx, id)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("ไม่พบระดับคะแนนที่ต้องการแก้ไข")
	}

	if err := s.repo.UpdateScoreLevel(ctx, tx, id, req); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
