package config

import (
	"log"
	"os"
)

func Load() {

	env := os.Getenv("APP_ENV")

	if env == "" {
		env = "dev"
	}

	switch env {

	case "prod":
		Cfg = loadProd()

	default:
		Cfg = loadDev()
	}


	if Cfg == nil {
		log.Fatal("❌ Config loading failed")
	}

	log.Println("🚀 running in", env)
	log.Println("JWT Private Key:", Cfg.JWTPrivKey != nil)
	log.Println("JWT Public Key:", Cfg.JWTPubKey != nil)
}
