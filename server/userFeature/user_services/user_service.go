package userservices

import (
	"context"
	"errors"
	"tarawitApi/db"
	"tarawitApi/models"

	usermodel "tarawitApi/userFeature/user_model"
	userrepositories "tarawitApi/userFeature/user_repositories"
)

type UserService struct {
	repo *userrepositories.UserRepository
}

func NewUserService(repo *userrepositories.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUserService() ([]models.User, error) {
	return s.repo.GetAllUser()
}

func (s *UserService) GetUserByIDService(
	id int64,
) (*usermodel.UserInfo, error) {

	return s.repo.GetUserByID(id)

}
func (s *UserService) GetRolesService() ([]usermodel.Roles, error) {
	return s.repo.GetRolesRepo()
}
func (s *UserService) GetPersonTypeService() ([]usermodel.PersonType, error) {
	return s.repo.GetPersonTypeRepo()
}

func (s *UserService) UpdateUserPermission(
	userID int64,
	req usermodel.UpdateUserRoleRequest,
) error {

	ctx := context.Background()

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}

	defer tx.Rollback(ctx)
exists, err := s.repo.CheckUserExists(
	ctx,
	tx,
	userID,
)
if err != nil {
	return err
}

if !exists {
	return errors.New("user not found")
}
valid, err := s.repo.CheckRoleIDs(
	ctx,
	tx,
	req.RoleIDs,
)
if err != nil {
	return err
}

if !valid {
	return errors.New("invalid role")
}
	// 1. Update Person Type
	if err := s.repo.UpdatePersonType(
		ctx,
		tx,
		userID,
		req.PersonTypeID,
	); err != nil {
		return err
	}

	// 2. Role เดิม
	oldRoles, err := s.repo.GetUserRoleIDs(
		ctx,
		tx,
		userID,
	)
	if err != nil {
		return err
	}

	// 3. คำนวณความแตกต่าง
	insertRoles, deleteRoles := DiffRole(
		oldRoles,
		req.RoleIDs,
	)

	// 4. ลบ Role
	if err := s.repo.DeleteUserRoles(
		ctx,
		tx,
		userID,
		deleteRoles,
	); err != nil {
		return err
	}

	// 5. เพิ่ม Role
	if err := s.repo.InsertUserRoles(
		ctx,
		tx,
		userID,
		insertRoles,
	); err != nil {
		return err
	}

	// 6. Commit
	return tx.Commit(ctx)
}