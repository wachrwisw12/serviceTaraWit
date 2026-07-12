package userhandlers

import (
	"github.com/gofiber/fiber/v2"

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

func (h *UserHandler) GetUser(c *fiber.Ctx) error {

	data, err := h.service.GetUserService()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}
   println(data)
	return c.JSON(data)
}


// 	func (h *EvaluationHandler) GetTemplateFullByID(c *fiber.Ctx) error {
// 	idStr := c.Params("id")
// 	id, err := strconv.Atoi(idStr)
// 	if err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "invalid template id",
// 		})
// 	}

// 	data, err := h.service.GetTemplateFullByIDService(id)
// 	if err != nil {
// 		return err
// 	}

// 	return c.JSON(data)
// }
