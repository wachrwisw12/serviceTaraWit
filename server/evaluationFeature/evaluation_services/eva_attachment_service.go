package evaluationservices

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"

	"github.com/google/uuid"
)

const (
	maxAttachmentSize = 200 << 20 // 200 MB สำหรับวิดีโอ
	attachmentDir     = "./storage/attachments"
)

// ชนิดไฟล์ที่อนุญาต
var allowedExt = map[string]bool{
	// Documents
	".pdf":  true,
	".doc":  true,
	".docx": true,
	".ppt":  true,
	".pptx": true,
	".xls":  true,
	".xlsx": true,
	// Images
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	// Video
	".mp4":  true,
	".mov":  true,
	".avi":  true,
	".mkv":  true,
	".webm": true,
	// Audio
	".mp3":  true,
	".wav":  true,
	".m4a":  true,
	".ogg":  true,
}

// GetMaxFileSize คืนค่าขนาดไฟล์สูงสุดตามชนิดไฟล์
func GetMaxFileSize(fileName string) int64 {
	ext := strings.ToLower(filepath.Ext(fileName))

	// วิดีโอ: 200 MB
	videoExts := map[string]bool{
		".mp4": true, ".mov": true, ".avi": true,
		".mkv": true, ".webm": true,
	}
	if videoExts[ext] {
		return 200 << 20 // 200 MB
	}

	// เสียง: 50 MB
	audioExts := map[string]bool{
		".mp3": true, ".wav": true, ".m4a": true, ".ogg": true,
	}
	if audioExts[ext] {
		return 50 << 20 // 50 MB
	}

	// ไฟล์อื่นๆ: 20 MB
	return 20 << 20
}

// UploadInstanceAttachment อัปโหลดไฟล์แนบ
func (s *EvaluationService) UploadInstanceAttachment(
	instanceID int,
	targetID int,
	userID int,
	file *multipart.FileHeader,
) (*evaluationModels.InstanceAttachment, error) {

	// ตรวจว่า target อยู่ใน instance นี้หรือไม่
	target, err := s.repo.GetTargetByID(targetID)
	if err != nil {
		return nil, fmt.Errorf("target not found")
	}

	if target.InstanceID != int64(instanceID) {
		return nil, fmt.Errorf("target not belong to instance")
	}

	// ตรวจสิทธิ์ user — ต้องเป็น target หรือ evaluator ใน instance นี้
	isTarget := target.UserID == int64(userID)
	if !isTarget {
		isEvaluator, err := s.repo.IsUserEvaluatorForInstance(instanceID, userID)
		if err != nil || !isEvaluator {
			return nil, fmt.Errorf("permission denied")
		}
	}

	// ตรวจขนาดไฟล์ (ตามชนิดไฟล์)
	maxSize := GetMaxFileSize(file.Filename)
	if file.Size > maxSize {
		return nil, fmt.Errorf("file size exceeds %d MB", maxSize/(1<<20))
	}

	// ตรวจนามสกุล
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		return nil, fmt.Errorf("unsupported file type: %s", ext)
	}

	// อัปโหลดบน server
	return s.uploadToLocal(instanceID, targetID, userID, file)
}

// uploadToLocal อัปโหลดไฟล์บน server
func (s *EvaluationService) uploadToLocal(
	instanceID int,
	targetID int,
	userID int,
	file *multipart.FileHeader,
) (*evaluationModels.InstanceAttachment, error) {

	// สร้าง path
	saveDir := filepath.Join(
		attachmentDir,
		"instances",
		fmt.Sprint(instanceID),
		"targets",
		fmt.Sprint(targetID),
	)

	if err := os.MkdirAll(saveDir, 0755); err != nil {
		return nil, err
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	storedName := uuid.NewString() + ext
	savePath := filepath.Join(saveDir, storedName)

	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	dst, err := os.Create(savePath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return nil, err
	}

	attachment := &evaluationModels.InstanceAttachment{
		InstanceID: int64(instanceID),
		TargetID:   int64(targetID),
		UploadedBy: int64(userID),
		FileName:   file.Filename,
		StoredName: storedName,
		FilePath:   savePath,
		FileSize:   file.Size,
		MimeType:   file.Header.Get("Content-Type"),
	}

	ctx := context.Background()
	return s.repo.CreateAttachment(ctx, attachment)
}

// ListInstanceAttachments ดูรายการไฟล์แนบ
func (s *EvaluationService) ListInstanceAttachments(
	instanceID int,
	targetID int,
) ([]evaluationModels.InstanceAttachment, error) {
	return s.repo.ListAttachments(instanceID, targetID)
}

// DeleteInstanceAttachment ลบไฟล์แนบ
func (s *EvaluationService) DeleteInstanceAttachment(
	instanceID int,
	targetID int,
	attachmentID int,
	userID int,
) error {
	att, err := s.repo.GetAttachmentByID(attachmentID)
	if err != nil {
		return err
	}

	if att.InstanceID != int64(instanceID) || att.TargetID != int64(targetID) {
		return fmt.Errorf("invalid attachment")
	}

	if att.UploadedBy != int64(userID) {
		return fmt.Errorf("permission denied")
	}

	os.Remove(att.FilePath)

	return s.repo.DeleteAttachment(attachmentID)
}

// GetAttachmentByID ดึงข้อมูลไฟล์แนบ
func (s *EvaluationService) GetAttachmentByID(id int) (*evaluationModels.InstanceAttachment, error) {
	return s.repo.GetAttachmentByID(id)
}
