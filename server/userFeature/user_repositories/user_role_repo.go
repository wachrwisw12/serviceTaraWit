package userrepositories

import (
	"context"

	"github.com/jackc/pgx/v5"
)
func (r *UserRepository) UpdatePersonType(
	ctx context.Context,
	tx pgx.Tx,
	userID int64,
	personTypeID *int64,
) error {

	query := `
	UPDATE users
	SET person_type_id = $1
	WHERE id = $2
	`

	_, err := tx.Exec(
		ctx,
		query,
		personTypeID,
		userID,
	)

	return err
}
func (r *UserRepository) GetUserRoleIDs(
	ctx context.Context,
	tx pgx.Tx,
	userID int64,
) ([]int64, error) {

	query := `
	SELECT role_id
	FROM user_roles
	WHERE user_id = $1
	ORDER BY role_id
	`

	rows, err := tx.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roleIDs []int64

	for rows.Next() {
		var roleID int64

		if err := rows.Scan(&roleID); err != nil {
			return nil, err
		}

		roleIDs = append(roleIDs, roleID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return roleIDs, nil
}

func (r *UserRepository) DeleteUserRoles(
	ctx context.Context,
	tx pgx.Tx,
	userID int64,
	roleIDs []int64,
) error {

	if len(roleIDs) == 0 {
		return nil
	}

	query := `
	DELETE FROM user_roles
	WHERE user_id = $1
	AND role_id = ANY($2)
	`

	_, err := tx.Exec(
		ctx,
		query,
		userID,
		roleIDs,
	)

	return err
}

func (r *UserRepository) InsertUserRoles(
	ctx context.Context,
	tx pgx.Tx,
	userID int64,
	roleIDs []int64,
) error {

	for _, roleID := range roleIDs {

		_, err := tx.Exec(
			ctx,
			`
			INSERT INTO user_roles(
				user_id,
				role_id
			)
			VALUES ($1,$2)
			`,
			userID,
			roleID,
		)

		if err != nil {
			return err
		}
	}

	return nil
}

func (r *UserRepository) CheckUserExists(
	ctx context.Context,
	tx pgx.Tx,
	userID int64,
) (bool, error) {

	var exists bool

	err := tx.QueryRow(
		ctx,
		`
		SELECT EXISTS(
			SELECT 1
			FROM users
			WHERE id = $1
		)
		`,
		userID,
	).Scan(&exists)

	if err != nil {
		return false, err
	}

	return exists, nil
}
func (r *UserRepository) CheckRoleIDs(
	ctx context.Context,
	tx pgx.Tx,
	roleIDs []int64,
) (bool, error) {

	if len(roleIDs) == 0 {
		return true, nil
	}

	var count int

	err := tx.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM roles
		WHERE id = ANY($1)
		`,
		roleIDs,
	).Scan(&count)

	if err != nil {
		return false, err
	}

	return count == len(roleIDs), nil
}