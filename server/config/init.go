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

	// LINE Login — ค่าจาก environment (ไม่ hardcode)
	Cfg.LineChannelID = os.Getenv("LINE_CHANNEL_ID")
	Cfg.LineChannelSecret = os.Getenv("LINE_CHANNEL_SECRET")
	Cfg.LineRedirectURI = os.Getenv("LINE_REDIRECT_URI")

	log.Println("🚀 running in", env)
	log.Println("JWT Private Key:", Cfg.JWTPrivKey != nil)
	log.Println("JWT Public Key:", Cfg.JWTPubKey != nil)
	log.Println("LINE Login configured:", Cfg.LineChannelID != "" && Cfg.LineChannelSecret != "" && Cfg.LineRedirectURI != "")
}
