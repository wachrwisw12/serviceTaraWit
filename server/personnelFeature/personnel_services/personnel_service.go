package personnelservices

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"tarawitApi/db"
	personnelmodel "tarawitApi/personnelFeature/personnel_model"
	personnelrepositories "tarawitApi/personnelFeature/personnel_repositories"
)

type PersonnelService struct {
	repo *personnelrepositories.PersonnelRepository
}

func NewPersonnelService(repo *personnelrepositories.PersonnelRepository) *PersonnelService {
	return &PersonnelService{repo: repo}
}

// ==================== บุคลากร ====================

func (s *PersonnelService) ListPersonnelService(
	f personnelmodel.ListPersonnelFilter,
) (*personnelmodel.PaginatedPersonnelResponse, error) {

	ctx := context.Background()

	// Default pagination
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}
	if f.Limit > 100 {
		f.Limit = 100
	}

	total, err := s.repo.CountPersonnel(ctx, f)
	if err != nil {
		return nil, err
	}

	items, err := s.repo.ListPersonnel(ctx, f)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / f.Limit
	if int(total)%f.Limit > 0 {
		totalPages++
	}

	return &personnelmodel.PaginatedPersonnelResponse{
		Items:      items,
		Total:      total,
		Page:       f.Page,
		Limit:      f.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *PersonnelService) GetPersonnelService(id int64) (*personnelmodel.Personnel, error) {
	return s.repo.GetPersonnelByID(context.Background(), id)
}

func (s *PersonnelService) AdminResetPasswordService(
	id int64,
	req personnelmodel.AdminResetPasswordRequest,
) error {

	if len(req.NewPassword) < 6 {
		return errors.New("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
	}

	ctx := context.Background()

	// ตรวจสอบว่าผู้ใช้มีอยู่จริง
	_, err := s.repo.GetPersonnelByID(ctx, id)
	if err != nil {
		return errors.New("ไม่พบบุคลากรที่ต้องการแก้ไข")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("สร้างรหัสผ่านใหม่ไม่สำเร็จ")
	}

	_, err = db.DB.Exec(
		ctx,
		`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
		string(hashed),
		id,
	)
	if err != nil {
		return errors.New("รีเซ็ตรหัสผ่านไม่สำเร็จ")
	}

	return nil
}

func (s *PersonnelService) CreatePersonnelService(
	req personnelmodel.CreatePersonnelRequest,
) (int64, error) {

	ctx := context.Background()

	req.Username = strings.TrimSpace(req.Username)

	if req.Username == "" {
		return 0, errors.New("กรุณาระบุชื่อผู้ใช้ (username)")
	}

	if len(req.Password) < 6 {
		return 0, errors.New("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
	}

	hashed, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return 0, err
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	exists, err := s.repo.UsernameExists(ctx, tx, req.Username)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, errors.New("ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว")
	}

	if req.CID != nil && strings.TrimSpace(*req.CID) != "" {
		dup, err := s.repo.CIDExists(ctx, tx, strings.TrimSpace(*req.CID), 0)
		if err != nil {
			return 0, err
		}
		if dup {
			return 0, errors.New("เลขบัตรประชาชนนี้มีในระบบแล้ว")
		}
	}

	id, err := s.repo.CreatePersonnel(ctx, tx, req, string(hashed))
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return id, nil
}

func (s *PersonnelService) UpdatePersonnelService(
	id int64,
	req personnelmodel.UpdatePersonnelRequest,
) error {

	ctx := context.Background()

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// ตรวจสอบว่าผู้ใช้มีอยู่จริง
	_, err = s.repo.GetPersonnelByID(ctx, id)
	if err != nil {
		return errors.New("ไม่พบบุคลากรที่ต้องการแก้ไข")
	}

	if req.CID != nil && strings.TrimSpace(*req.CID) != "" {
		dup, err := s.repo.CIDExists(ctx, tx, strings.TrimSpace(*req.CID), id)
		if err != nil {
			return err
		}
		if dup {
			return errors.New("เลขบัตรประชาชนนี้มีในระบบแล้ว")
		}
	}

	if err := s.repo.UpdatePersonnel(ctx, tx, id, req); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *PersonnelService) SetActiveService(id int64, active bool) error {

	ctx := context.Background()

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = s.repo.GetPersonnelByID(ctx, id)
	if err != nil {
		return errors.New("ไม่พบบุคลากรที่ต้องการแก้ไข")
	}

	req := personnelmodel.UpdatePersonnelRequest{IsActive: &active}

	if err := s.repo.UpdatePersonnel(ctx, tx, id, req); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ==================== ตำแหน่ง ====================

func (s *PersonnelService) ListPositionsService() ([]personnelmodel.Position, error) {
	return s.repo.ListPositions(context.Background())
}

func (s *PersonnelService) CreatePositionService(
	req personnelmodel.CreatePositionRequest,
) (int64, error) {

	ctx := context.Background()

	req.Code = strings.TrimSpace(req.Code)
	req.NameTh = strings.TrimSpace(req.NameTh)

	if req.Code == "" || req.NameTh == "" {
		return 0, errors.New("กรุณาระบุรหัสและชื่อตำแหน่ง")
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	dup, err := s.repo.PositionExistsByCode(ctx, tx, req.Code, 0)
	if err != nil {
		return 0, err
	}
	if dup {
		return 0, errors.New("รหัสตำแหน่งนี้มีอยู่แล้ว")
	}

	id, err := s.repo.CreatePosition(ctx, tx, req)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return id, nil
}

func (s *PersonnelService) UpdatePositionService(
	id int64,
	req personnelmodel.CreatePositionRequest,
) error {

	ctx := context.Background()

	req.Code = strings.TrimSpace(req.Code)
	req.NameTh = strings.TrimSpace(req.NameTh)

	if req.Code == "" || req.NameTh == "" {
		return errors.New("กรุณาระบุรหัสและชื่อตำแหน่ง")
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	exists, err := s.repo.PositionExists(ctx, tx, id)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("ไม่พบตำแหน่งที่ต้องการแก้ไข")
	}

	dup, err := s.repo.PositionExistsByCode(ctx, tx, req.Code, id)
	if err != nil {
		return err
	}
	if dup {
		return errors.New("รหัสตำแหน่งนี้มีอยู่แล้ว")
	}

	if err := s.repo.UpdatePosition(ctx, tx, id, req); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *PersonnelService) DeletePositionService(id int64) error {

	ctx := context.Background()

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	exists, err := s.repo.PositionExists(ctx, tx, id)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("ไม่พบตำแหน่งที่ต้องการลบ")
	}

	inUse, err := s.repo.PositionInUse(ctx, tx, id)
	if err != nil {
		return err
	}
	if inUse {
		return errors.New("ไม่สามารถลบได้ — มีบุคลากรใช้ตำแหน่งนี้อยู่")
	}

	if err := s.repo.DeletePosition(ctx, tx, id); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ==================== สร้างหลายคนพร้อมกัน ====================

func (s *PersonnelService) BatchCreatePersonnelService(
	req personnelmodel.BatchCreatePersonnelRequest,
) (*personnelmodel.BatchCreateResult, error) {

	result := &personnelmodel.BatchCreateResult{
		Total: len(req.Items),
	}

	for i, item := range req.Items {
		item.Username = strings.TrimSpace(item.Username)

		if item.Username == "" {
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "กรุณาระบุชื่อผู้ใช้",
			})
			continue
		}

		if len(item.Password) < 6 {
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
			})
			continue
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(item.Password), bcrypt.DefaultCost)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน",
			})
			continue
		}

		ctx := context.Background()
		tx, err := db.DB.Begin(ctx)
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "เกิดข้อผิดพลาดในฐานข้อมูล",
			})
			continue
		}

		exists, err := s.repo.UsernameExists(ctx, tx, item.Username)
		if err != nil {
			tx.Rollback(ctx)
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล",
			})
			continue
		}
		if exists {
			tx.Rollback(ctx)
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว",
			})
			continue
		}

		if item.CID != nil && strings.TrimSpace(*item.CID) != "" {
			dup, err := s.repo.CIDExists(ctx, tx, strings.TrimSpace(*item.CID), 0)
			if err != nil {
				tx.Rollback(ctx)
				result.Failed++
				result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
					RowIndex: i + 1,
					Username: item.Username,
					Message:  "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล",
				})
				continue
			}
			if dup {
				tx.Rollback(ctx)
				result.Failed++
				result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
					RowIndex: i + 1,
					Username: item.Username,
					Message:  "เลขบัตรประชาชนนี้มีในระบบแล้ว",
				})
				continue
			}
		}

		id, err := s.repo.CreatePersonnel(ctx, tx, item, string(hashed))
		if err != nil {
			tx.Rollback(ctx)
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "สร้างบุคลากรไม่สำเร็จ: " + err.Error(),
			})
			continue
		}

		if err := tx.Commit(ctx); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, personnelmodel.BatchCreateError{
				RowIndex: i + 1,
				Username: item.Username,
				Message:  "บันทึกข้อมูลไม่สำเร็จ",
			})
			continue
		}

		result.Success++
		result.CreatedIDs = append(result.CreatedIDs, id)
	}

	return result, nil
}

// ==================== ตัวเลือก ====================

func (s *PersonnelService) ListPersonTypesService() ([]personnelmodel.OptionItem, error) {
	return s.repo.ListPersonTypes(context.Background())
}

func (s *PersonnelService) ListDepartmentsService() ([]personnelmodel.OptionItem, error) {
	return s.repo.ListDepartments(context.Background())
}

func (s *PersonnelService) ListPrefixesService() ([]personnelmodel.OptionItem, error) {
	return s.repo.ListPrefixes(context.Background())
}
