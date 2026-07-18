package main

import (
	"log"

	"tarawitApi/config"
	"tarawitApi/db"
	"tarawitApi/routers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No .env file, using system env")
	}

	// โหลด config ก่อน
	 config.Load()

	// ตรวจสอบ
	if config.Cfg == nil {
		log.Fatal("config is nil")
	}

	if config.Cfg.JWTPrivKey == nil {
		log.Fatal("jwt private key is nil")
	}

	log.Println("✅ JWT keys loaded")


	// connect DB
	db.ConnectDB()
	defer db.DB.Close()


	app := fiber.New(fiber.Config{
		ProxyHeader:             fiber.HeaderXForwardedProto,
		EnableTrustedProxyCheck: true,
	})


	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))


	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})


	routers.SetupRoute(app)
	routers.SetupWS(app)


	log.Println("🚀 API started on :8000")
	log.Fatal(app.Listen(":8000"))
}