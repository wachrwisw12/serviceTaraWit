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

	evaluationRoute.Get(
		"/evaluation-instances/count",
		handler.GetCount,
	)
	evaluationRoute.Post(
		"/evaluation-instances/list/me",
		handler.CreateInstance,
	)

	// Create Evaluation Instance
	evaluationRoute.Get(
		"/evaluation-instances/list",
		handler.GetInstanceList,
	)
}