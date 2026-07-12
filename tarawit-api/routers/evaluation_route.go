package routers

import (
	evaluationhandles "tarawitApi/evaluationFeature/evaluation_handles"

	"github.com/gofiber/fiber/v2"
)




func SetupEvaluationRoute(evaluationRoute fiber.Router) {
	

	evaluationRoute.Get("/get-evaluation/template", evaluationhandles.NewEvaluationHandler().GetTemplate)
	evaluationRoute.Get(
    "/get-evaluation/templateByid/:id",
    evaluationhandles.NewEvaluationHandler().GetTemplateFullByID,
)
}
