package main

import (
	"fmt"
	"log"
	"os"
	"tarawitApi/config"
	"tarawitApi/db"
	"tarawitApi/routers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
		hash, _ := bcrypt.GenerateFromPassword([]byte("1234"), bcrypt.DefaultCost)
	fmt.Println(string(hash))

	// โหลด env ก่อน
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No .env file, using system env")
	}

	config.Load()

	// connect DB
	db.ConnectDB()
	defer db.DB.Close()

	log.Println("DB_HOST:", os.Getenv("DB_HOST"))
	log.Println("DB_PORT:", os.Getenv("DB_PORT"))
	log.Println("DB_NAME:", os.Getenv("POSTGRES_DB"))

	

	app := fiber.New(fiber.Config{
		ProxyHeader:             fiber.HeaderXForwardedProto,
		EnableTrustedProxyCheck: true,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: os.Getenv("AllowOrigins"),
		AllowMethods: os.Getenv("AllowMethods"),
		AllowHeaders: os.Getenv("AllowHeaders"),
	}))

	routers.SetupRoute(app)
	routers.SetupWS(app)

	log.Println("🚀 API started on :8080")
	log.Fatal(app.Listen(":8080"))
}
