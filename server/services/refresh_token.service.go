package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"tarawitApi/db"
)

const (
	refreshTokenTTL = 30 * 24 * time.Hour // อายุ refresh token: 30 วัน
)

// refreshTokenRow ข้อมูล refresh token ในฐานข้อมูล
type refreshTokenRow struct {
	ID        int64
	UserID    int64
	ExpiresAt time.Time
	RevokedAt *time.Time
}

var (
	ErrRefreshTokenInvalid = errors.New("refresh token ไม่ถูกต้องหรือหมดอายุ")
)

// hashToken แปลง raw token เป็น SHA-256 hex (เก็บเฉพาะ hash ใน DB)
func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return fmt.Sprintf("%x", sum)
}

// generateRawToken สร้าง token สุ่ม 32 ไบต์ (เอนโทรปี ~256 bit)
func generateRawToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// IssueRefreshToken สร้าง refresh token ใหม่ให้ user (เก็บ hash ใน DB, คืน raw ให้ client)
func IssueRefreshToken(
	ctx context.Context,
	userID int64,
	userAgent string,
) (string, error) {
	raw, err := generateRawToken()
	if err != nil {
		return "", err
	}

	_, err = db.DB.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
		VALUES ($1, $2, $3, $4)
	`, userID, hashToken(raw), time.Now().Add(refreshTokenTTL), userAgent)
	if err != nil {
		return "", fmt.Errorf("บันทึก refresh token ไม่สำเร็จ: %w", err)
	}
	return raw, nil
}

// findRefreshToken โหลด row จาก raw token (โดย hash) — ไม่เช็คสถานะ
func findRefreshToken(
	ctx context.Context,
	raw string,
) (*refreshTokenRow, error) {
	var row refreshTokenRow
	err := db.DB.QueryRow(ctx, `
		SELECT id, user_id, expires_at, revoked_at
		FROM refresh_tokens
		WHERE token_hash = $1
	`, hashToken(raw)).Scan(
		&row.ID,
		&row.UserID,
		&row.ExpiresAt,
		&row.RevokedAt,
	)
	if err != nil {
		return nil, ErrRefreshTokenInvalid
	}
	return &row, nil
}

// ValidateRefreshToken ตรวจว่า token ยัง valid (มีใน DB, ไม่ถูก revoke, ยังไม่หมดอายุ)
func ValidateRefreshToken(ctx context.Context, raw string) (*refreshTokenRow, error) {
	row, err := findRefreshToken(ctx, raw)
	if err != nil {
		return nil, err
	}
	if row.RevokedAt != nil {
		return nil, ErrRefreshTokenInvalid
	}
	if time.Now().After(row.ExpiresAt) {
		return nil, ErrRefreshTokenInvalid
	}
	return row, nil
}

// RotateRefreshToken ต่ออายุแบบ rotation: revoke token เก่า + ออก token ใหม่ (ลูกโซ่)
// คืน (raw token ใหม่, userID, error)
func RotateRefreshToken(
	ctx context.Context,
	oldRaw string,
	userAgent string,
) (string, int64, error) {
	row, err := ValidateRefreshToken(ctx, oldRaw)
	if err != nil {
		return "", 0, err
	}

	newRaw, err := generateRawToken()
	if err != nil {
		return "", 0, err
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return "", 0, err
	}
	defer tx.Rollback(ctx)

	// 1. ออก token ใหม่
	var newID int64
	err = tx.QueryRow(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, row.UserID, hashToken(newRaw), time.Now().Add(refreshTokenTTL), userAgent).
		Scan(&newID)
	if err != nil {
		return "", 0, fmt.Errorf("ออก refresh token ใหม่ไม่สำเร็จ: %w", err)
	}

	// 2. revoke token เก่า + ระบุตัวที่แทน (ลูกโซ่)
	_, err = tx.Exec(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = NOW(), replaced_by_id = $2
		WHERE id = $1
	`, row.ID, newID)
	if err != nil {
		return "", 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", 0, err
	}

	return newRaw, row.UserID, nil
}

// RevokeRefreshToken เพิกถอน token (logout) — ไม่ error ถ้า token ไม่มีอยู่แล้ว
func RevokeRefreshToken(ctx context.Context, raw string) error {
	if raw == "" {
		return nil
	}
	_, err := db.DB.Exec(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE token_hash = $1 AND revoked_at IS NULL
	`, hashToken(raw))
	return err
}
