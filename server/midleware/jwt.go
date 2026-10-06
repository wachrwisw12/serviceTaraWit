package middlewares

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"tarawitApi/config"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func JWTMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(401).SendString("Invalid token nok")
	}

	tokenStr := parts[1]

	// 3. Parse + Verify token
	token, err := jwt.Parse(
		tokenStr,
		func(t *jwt.Token) (interface{}, error) {
			// 3.1 เช็ค algorithm
			if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, fiber.ErrUnauthorized
			}
			// 3.2 ใช้ Public key
			return config.Cfg.JWTPubKey, nil
		},
	)

	// 4. token ไม่ valid หรือ error (รวมหมดอายุ)
	if err != nil || !token.Valid {
		return fiber.ErrUnauthorized
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return fiber.ErrUnauthorized
	}

	// แปลง sub เป็น int64 อย่างปลอดภัย (ไม่ panic ถ้าเป็น string/number)
	userID, err := safeSubToInt64(claims["sub"])
	if err != nil {
		return fiber.ErrUnauthorized
	}

	// เก็บข้อมูลไว้ใช้ใน Handler
	c.Locals("user_id", userID)
	c.Locals("username", claims["username"])
	c.Locals("roles", claims["roles"])
	c.Locals("permissions", claims["permissions"])
	// ✅ ผ่าน = token ถูก + ยังไม่หมดอายุ
	return c.Next()
}

func safeSubToInt64(v interface{}) (int64, error) {
	switch n := v.(type) {
	case float64:
		return int64(n), nil
	case json.Number:
		return n.Int64()
	case string:
		return strconv.ParseInt(n, 10, 64)
	default:
		return 0, fmt.Errorf("invalid sub claim type: %T", v)
	}
}

// func OptionalJWT() fiber.Handler {
// 	return func(c *fiber.Ctx) error {
// 		auth := c.Get("Authorization")

// 		// ไม่มี token → guest
// 		if auth == "" {
// 			return c.Next()
// 		}

// 		tokenStr := strings.TrimPrefix(auth, "Bearer ")

// 		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
// 			if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
// 				return nil, errors.New("unexpected signing method")
// 			}
// 			return config.Cfg.JWTPubKey, nil
// 		})

// 		if err != nil || !token.Valid {
// 			// token พัง → ถือเป็น guest (ไม่ throw)
// 			return c.Next()
// 		}

// 		claims, ok := token.Claims.(jwt.MapClaims)
// 		if !ok {
// 			return c.Next()
// 		}

// 		// 🔑 set context
// 		c.Locals("user_id", claims["sub"])
// 		c.Locals("role", claims["role"])

// 		return c.Next()
// 	}
// }

func GenerateJWT(
    cfg *config.Config,
    id int64,
    username string,
    roles []string,
    permissions []string,
) (string, error) {

    if cfg == nil {
        return "", errors.New("jwt config is nil")
    }

    if cfg.JWTPrivKey == nil {
        return "", errors.New("jwt private key is nil")
    }

    // access token อายุสั้น (1 ชม.) — ต่ออายุผ่าน refresh token (/auth/refresh)
    // ไม่ใช้ sliding renewal ใน /auth/me แล้ว เนื่องจากมี refresh token เป็นตัวหลัก
    claims := jwt.MapClaims{
        "sub": id,
        "username": username,
        "roles": roles,
        "permissions": permissions,
        "iat": time.Now().Unix(),
        "exp": time.Now().Add(time.Hour).Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)

    return token.SignedString(cfg.JWTPrivKey)
}

func GetCurrentUserID(c *fiber.Ctx) (int64, error) {
	userID, ok := c.Locals("user_id").(int64)
	if !ok {
		return 0, fmt.Errorf("user_id not found in context")
	}

	return userID, nil
}

