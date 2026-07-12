package services

import (
	"context"
	"database/sql"
	"errors"
	"tarawitApi/config"
	"tarawitApi/db"
	middlewares "tarawitApi/midleware"
	"tarawitApi/models"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func AuthRegisterService(user models.User) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if len(user.PasswordHash) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}
	// 1️⃣ hash password
	hashedPassword, err := hashPassword(user.PasswordHash)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO users (username, password, role_id, fullname)
		VALUES ($1, $2, $3, $4)
		RETURNING username, role_id, fullname
	`

	// 2️⃣ insert + returning
	err = db.DB.QueryRow(
		ctx,
		query,
		user.Username,
		hashedPassword,
		
	).Scan(
		&user.Username,
		
	)
	if err != nil {
		return nil, err
	}

	// 3️⃣ ไม่ส่ง password กลับ
	user.PasswordHash = ""

	return &user, nil
}

func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost, // cost = 10
	)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

func AuthLoginService(
	cfg *config.Config,
	req models.AuthRequest,
) (*models.AuthResponse, error) {
	user, err := FindUserByUsername(req.Username)
	if err != nil {
		return nil, err
	}

	if err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	); err != nil {
		return nil, errors.New("รหัสผ่านไม่ถูกต้อง")
	}

	roles := []string{}

for _, r := range user.Roles {
    roles = append(roles, r.RoleName)
}


permissions := []string{}

for _, p := range user.Permissions {
    permissions = append(permissions, p.PermissionName)
}


token, err := middlewares.GenerateJWT(
    cfg,
    user.ID,
    user.Username,
    roles,
    permissions,
)
	if err != nil {
		return nil, errors.New("ไม่สามารถสร้าง token ได้")
	}

	user.PasswordHash = ""

	return &models.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func FindUserByUsername(username string) (*models.User, error) {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
	SELECT 
		u.id,
		u.username,
		u.password_hash,
		u.first_name,
		u.last_name,
		u.email,
		r.code AS role,
		p.code AS permission

	FROM users u

	JOIN user_roles ur 
	ON u.id = ur.user_id

	JOIN roles r 
	ON ur.role_id = r.id

	JOIN role_permissions rp
	ON r.id = rp.role_id

	JOIN permissions p
	ON rp.permission_id = p.id

	WHERE u.username = $1
	`


	rows, err := db.DB.Query(ctx, query, username)
	if err != nil {
		return nil, err
	}

	defer rows.Close()


	var user *models.User


	roleMap := make(map[string]bool)
	permissionMap := make(map[string]bool)


	for rows.Next() {

		var (
			id int64
			username string
			passwordHash string
			firstName *string
			lastName *string
			email sql.NullString

			role string
			permission string
		)


		err := rows.Scan(
			&id,
			&username,
			&passwordHash,
			&firstName,
			&lastName,
			&email,
			&role,
			&permission,
		)


		if err != nil {
			return nil,err
		}


		// สร้าง User ครั้งแรก
		if user == nil {

			var emailPtr *string

			if email.Valid {
				emailPtr = &email.String
			}


			user = &models.User{
				ID: id,
				Username: username,
				PasswordHash: passwordHash,
				FirstName: firstName,
				LastName: lastName,
				Email: emailPtr,

				Roles: []models.UserRole{},
				Permissions: []models.Permission{},
			}
		}



		// กัน Role ซ้ำ

		if !roleMap[role] {

			user.Roles = append(
				user.Roles,
				models.UserRole{
					RoleName: role,
				},
			)

			roleMap[role] = true
		}



		// กัน Permission ซ้ำ

		if !permissionMap[permission] {

			user.Permissions = append(
				user.Permissions,
				models.Permission{
					PermissionName: permission,
				},
			)

			permissionMap[permission] = true
		}

	}


	if user == nil {
		return nil, errors.New("user not found")
	}


	return user,nil
}

