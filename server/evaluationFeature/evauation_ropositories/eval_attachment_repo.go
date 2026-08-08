package evaluationRepositories

import (
	"context"
	"tarawitApi/db"
	evaluationModels "tarawitApi/evaluationFeature/evaluation_models"
)
func (r *EvaluationRepository) CreateAttachment(
	ctx context.Context,
	attachment *evaluationModels.InstanceAttachment,
) (*evaluationModels.InstanceAttachment, error) {

	query := `
		INSERT INTO evaluation_instance_attachments
		(
			instance_id,
			target_id,
			uploaded_by,
			file_name,
			stored_name,
			file_path,
			file_size,
			mime_type
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		RETURNING
			id,
			created_at
	`

	err := db.DB.QueryRow(
		ctx,
		query,
		attachment.InstanceID,
		attachment.TargetID,
		attachment.UploadedBy,
		attachment.FileName,
		attachment.StoredName,
		attachment.FilePath,
		attachment.FileSize,
		attachment.MimeType,
	).Scan(
		&attachment.ID,
		&attachment.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return attachment, nil
}
func (r *EvaluationRepository) GetTargetByID(
	targetID int,
) (*evaluationModels.EvaluationTargetInfo, error) {

	query := `
		SELECT
			id,
			instance_id,
			user_id
		FROM evaluation_targets
		WHERE id = $1
	`

	var target evaluationModels.EvaluationTargetInfo

	err := db.DB.QueryRow(
		context.Background(),
		query,
		targetID,
	).Scan(
		&target.ID,
		&target.InstanceID,
		&target.UserID,
	)

	if err != nil {
		return nil, err
	}

	return &target, nil
}
func (r *EvaluationRepository) ListAttachments(
	instanceID int,
	targetID int,
) ([]evaluationModels.InstanceAttachment,error){

	query := `
		SELECT
			id,
			instance_id,
			target_id,
			uploaded_by,
			file_name,
			stored_name,
			file_path,
			file_size,
			mime_type,
			created_at
		FROM evaluation_instance_attachments
		WHERE instance_id=$1
		AND target_id=$2
		ORDER BY created_at DESC
	`

	rows, err := db.DB.Query(
		context.Background(),
		query,
		instanceID,
		targetID,
	)

	if err != nil {
		return nil,err
	}

	defer rows.Close()


	var list []evaluationModels.InstanceAttachment


	for rows.Next(){

		var att evaluationModels.InstanceAttachment

		err := rows.Scan(
			&att.ID,
			&att.InstanceID,
			&att.TargetID,
			&att.UploadedBy,
			&att.FileName,
			&att.StoredName,
			&att.FilePath,
			&att.FileSize,
			&att.MimeType,
			&att.CreatedAt,
		)

		if err != nil {
			return nil,err
		}


		list = append(list,att)
	}


	return list,nil
}

func (r *EvaluationRepository) GetAttachmentByID(
	id int,
) (*evaluationModels.InstanceAttachment,error){

	query := `
		SELECT
			id,
			instance_id,
			target_id,
			uploaded_by,
			file_path
		FROM evaluation_instance_attachments
		WHERE id=$1
	`

	var att evaluationModels.InstanceAttachment


	err := db.DB.QueryRow(
		context.Background(),
		query,
		id,
	).Scan(
		&att.ID,
		&att.InstanceID,
		&att.TargetID,
		&att.UploadedBy,
		&att.FilePath,
	)


	if err != nil {
		return nil,err
	}


	return &att,nil
}

func (r *EvaluationRepository) DeleteAttachment(
	id int,
) error {

	query := `
		DELETE FROM evaluation_instance_attachments
		WHERE id=$1
	`

	_,err := db.DB.Exec(
		context.Background(),
		query,
		id,
	)

	return err
}

