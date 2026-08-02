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
	maxAttachmentSize = 20 << 20 // 20 MB
	attachmentDir     = "./storage/attachments"
)

var allowedExt = map[string]bool{
	".pdf":  true,
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".doc":  true,
	".docx": true,
	".ppt":  true,
	".pptx": true,
}
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

	// ตรวจสิทธิ์ user
	if target.UserID != int64(userID) {
		return nil, fmt.Errorf("permission denied")
	}


	// ตรวจขนาด
	if file.Size > maxAttachmentSize {
		return nil, fmt.Errorf("file size exceeds 20MB")
	}


	// ตรวจนามสกุล
	ext := strings.ToLower(filepath.Ext(file.Filename))

	if !allowedExt[ext] {
		return nil, fmt.Errorf("unsupported file type")
	}


	// สร้าง path
	saveDir := filepath.Join(
		attachmentDir,
		"instances",
		fmt.Sprint(instanceID),
		"targets",
		fmt.Sprint(targetID),
	)


	if err := os.MkdirAll(saveDir,0755); err != nil {
		return nil, err
	}


	// ชื่อไฟล์ใหม่
	storedName := uuid.NewString()+ext

	savePath := filepath.Join(
		saveDir,
		storedName,
	)


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


	if _, err := io.Copy(dst,src); err != nil {
		return nil, err
	}


	attachment := &evaluationModels.InstanceAttachment{
		InstanceID: int64(instanceID),
		TargetID:   int64(targetID),

		UploadedBy: int64(userID),

		FileName: file.Filename,
		StoredName: storedName,
		FilePath: savePath,

		FileSize:file.Size,
		MimeType:file.Header.Get("Content-Type"),
	}


	att, err := s.repo.CreateAttachment(
		context.Background(),
		attachment,
	)

	if err != nil {
		_ = os.Remove(savePath)
		return nil,err
	}


	return att,nil
}
func (s *EvaluationService) ListInstanceAttachments(
	instanceID int,
	targetID int,
) ([]evaluationModels.InstanceAttachment,error){

	return s.repo.ListAttachments(
		instanceID,
		targetID,
	)
}

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


	if att.InstanceID != int64(instanceID) ||
	   att.TargetID != int64(targetID) {

		return fmt.Errorf("invalid attachment")
	}


	if att.UploadedBy != int64(userID) {
		return fmt.Errorf("permission denied")
	}


	os.Remove(att.FilePath)


	return s.repo.DeleteAttachment(attachmentID)
}

func (s *EvaluationService) GetAttachmentByID(
	id int,
	
) (*evaluationModels.InstanceAttachment,error){

	return s.repo.GetAttachmentByID(id)

}