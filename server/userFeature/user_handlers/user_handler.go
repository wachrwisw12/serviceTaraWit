package userhandlers

import (
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"

	usermodel "tarawitApi/userFeature/user_model"
	userrepositories "tarawitApi/userFeature/user_repositories"
	userservices "tarawitApi/userFeature/user_services"
)

type UserHandler struct {
	service *userservices.UserService
}

func NewUserHandler() *UserHandler {

	repo := userrepositories.NewUserRepository()

	service := userservices.NewUserService(repo)

	return &UserHandler{
		service: service,
	}
}

func (h *UserHandler) GetAllUser(c *fiber.Ctx) error {

	data, err := h.service.GetUserService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}
	println(data)
	return c.JSON(data)
}
func (h *UserHandler) GetUserByID(c *fiber.Ctx) error {
	idStr := c.Params("id")

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid id",
		})
	}

	log.Println("ID =", id)

	user, err := h.service.GetUserByIDService(id)
	if err != nil {
		return err
	}

	return c.JSON(user)
}
func (h *UserHandler) GetRoles(c *fiber.Ctx) error {

	data, err := h.service.GetRolesService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *UserHandler) GetRolesWithPermissions(c *fiber.Ctx) error {
	data, err := h.service.GetRolesWithPermissions()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(data)
}

func (h *UserHandler) GetAllPermissions(c *fiber.Ctx) error {
	data, err := h.service.GetAllPermissions()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(data)
}

func (h *UserHandler) UpdateRolePermissions(c *fiber.Ctx) error {
	roleID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid role id")
	}

	var req usermodel.UpdateRolePermissionsRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := h.service.UpdateRolePermissions(roleID, req.PermissionIDs); err != nil {
		if err.Error() == "role not found" {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"message": "บันทึกสิทธิ์สำเร็จ"})
}
func (h *UserHandler) GetPersonType(c *fiber.Ctx) error {

	data, err := h.service.GetPersonTypeService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(data)
}

func (h *UserHandler) UpdateUserRole(c *fiber.Ctx) error {

	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid user id",
		})
	}

	var req usermodel.UpdateUserRoleRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if err := h.service.UpdateUserPermission(id, req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "บันทึกข้อมูลสำเร็จ",
	})
}
