package main

import (
	"log"
	"os"
	"strings"

	"tarawitApi/config"
	"tarawitApi/db"
	"tarawitApi/routers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {

	// ใช้ .env ถ้ามี
	// Production Docker จะใช้ environment จาก docker-compose
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No .env file, using system env")
	}

	// โหลด config
	config.Load()

	if config.Cfg == nil {
		log.Fatal("config is nil")
	}

	if config.Cfg.JWTPrivKey == nil {
		log.Fatal("jwt private key is nil")
	}

	log.Println("✅ JWT keys loaded")

	// Connect DB
	db.ConnectDB()
	defer db.DB.Close()

	// Trusted proxies
	trustedProxies := []string{"127.0.0.1", "::1"}

	if configured := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES")); configured != "" {
		trustedProxies = strings.Split(configured, ",")

		for index := range trustedProxies {
			trustedProxies[index] = strings.TrimSpace(trustedProxies[index])
		}
	}

	app := fiber.New(fiber.Config{
		ProxyHeader:             fiber.HeaderXForwardedFor,
		EnableIPValidation:      true,
		EnableTrustedProxyCheck: true,
		TrustedProxies:          trustedProxies,
	})

	// CORS
	allowOrigins := strings.TrimSpace(
		os.Getenv("CORS_ALLOW_ORIGINS"),
	)

	if allowOrigins == "" {
		allowOrigins = "http://localhost:5173,http://localhost:8000,https://folio-me.com"

	}

	log.Println("🌐 CORS:", allowOrigins)

	app.Use(cors.New(cors.Config{
		AllowOrigins: allowOrigins,
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	routers.SetupRoute(app)

	log.Println("🚀 API started on :8000")

	log.Fatal(app.Listen(":8000"))
}
