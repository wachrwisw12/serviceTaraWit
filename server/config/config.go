package config

import (
	"crypto/rsa"
	"tarawitApi/models"
)

type Config struct {
	AppEnv     string
	JWTPrivKey *rsa.PrivateKey
	JWTPubKey  *rsa.PublicKey
	DB         models.DBConfig

	// LINE Login (OAuth) — ถ้าไม่ตั้งค่า LINE ช่องทาง login จะถูกปิด
	LineChannelID     string
	LineChannelSecret string
	LineRedirectURI   string
}

var Cfg *Config
