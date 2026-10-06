package storage

import (
	"context"
	"os"
	"time"

	"github.com/minio/minio-go/v7"
)

// PresignedGetURL สร้าง URL สำหรับดาวน์โหลด/ดูไฟล์
func PresignedGetURL(
	ctx context.Context,
	objectPath string,
	expire time.Duration,
) (string, error) {
	u, err := Minio.PresignedGetObject(
		ctx,
		Bucket,
		objectPath,
		expire,
		nil,
	)
	if err != nil {
		return "", err
	}

	// ===== override public =====
	scheme := os.Getenv("MINIO_PUBLIC_SCHEME")
	host := os.Getenv("MINIO_PUBLIC_HOST")
	publicPath := os.Getenv("MINIO_PUBLIC_PATH")

	if scheme != "" {
		u.Scheme = scheme
	}
	if host != "" {
		u.Host = host
	}
	if publicPath != "" {
		u.Path = publicPath + u.Path
	}

	return u.String(), nil
}

// PresignedPutURL สร้าง URL สำหรับอัปโหลดไฟล์ (Pre-Signed URL)
func PresignedPutURL(
	ctx context.Context,
	objectPath string,
	contentType string,
	expire time.Duration,
) (string, error) {
	u, err := Minio.PresignedPutObject(ctx, Bucket, objectPath, expire)
	if err != nil {
		return "", err
	}

	// ===== override public =====
	scheme := os.Getenv("MINIO_PUBLIC_SCHEME")
	host := os.Getenv("MINIO_PUBLIC_HOST")
	publicPath := os.Getenv("MINIO_PUBLIC_PATH")

	if scheme != "" {
		u.Scheme = scheme
	}
	if host != "" {
		u.Host = host
	}
	if publicPath != "" {
		u.Path = publicPath + u.Path
	}

	// เพิ่ม query parameter สำหรับ content type
	if contentType != "" {
		q := u.Query()
		q.Set("Content-Type", contentType)
		u.RawQuery = q.Encode()
	}

	return u.String(), nil
}

// DeleteObject ลบไฟล์จาก MinIO
func DeleteObject(
	ctx context.Context,
	objectPath string,
) error {
	return Minio.RemoveObject(ctx, Bucket, objectPath, minio.RemoveObjectOptions{})
}
