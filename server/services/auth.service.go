package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
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

// ตั้งค่าล็อกบัญชีเมื่อกรอกรหัสผิดซ้ำ
const (
	maxFailedAttempts  = 5           // กรอกรหัสผิดติดต่อกันเกินกว่านี้ → ล็อก
	lockDuration       = 15          // นาที
)

// loginAccount ข้อมูลพื้นฐานจากตาราง users สำหรับตรวจสอบการเข้าสู่ระบบ
// (ไม่ join role — ผู้ใช้ที่ยังไม่มี role ก็ถูกนับความพยายามและล็อกได้)
type loginAccount struct {
	ID             int64
	Username       string
	PasswordHash   string
	IsActive       bool
	FailedAttempts int
	LockedUntil    *time.Time
}

// GetLoginAccount โหลดข้อมูลบัญชีจากตาราง users เท่านั้น (ไม่ต้องมี role)
func GetLoginAccount(username string) (*loginAccount, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var acc loginAccount
	err := db.DB.QueryRow(ctx, `
		SELECT id, username, password_hash, is_active, failed_attempts, locked_until
		FROM users
		WHERE username = $1
	`, username).Scan(
		&acc.ID,
		&acc.Username,
		&acc.PasswordHash,
		&acc.IsActive,
		&acc.FailedAttempts,
		&acc.LockedUntil,
	)
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

// registerFailedAttempt บันทึกความพยายามผิดพลาด; คืน lock ใหม่ถ้าครบกำหนด
func registerFailedAttempt(ctx context.Context, userID int64, current int) (*time.Time, error) {
	newCount := current + 1
	if newCount >= maxFailedAttempts {
		lockedUntil := time.Now().Add(lockDuration * time.Minute)
		_, err := db.DB.Exec(ctx, `
			UPDATE users
			SET failed_attempts = 0,
			    locked_until = $2
			WHERE id = $1
		`, userID, lockedUntil)
		return &lockedUntil, err
	}
	_, err := db.DB.Exec(ctx, `
		UPDATE users SET failed_attempts = $2 WHERE id = $1
	`, userID, newCount)
	return nil, err
}

// resetFailedAttempts ล้างตัวนับเมื่อ login สำเร็จ
func resetFailedAttempts(ctx context.Context, userID int64) error {
	_, err := db.DB.Exec(ctx, `
		UPDATE users
		SET failed_attempts = 0,
		    locked_until = NULL
		WHERE id = $1
	`, userID)
	return err
}

func AuthLoginService(
	cfg *config.Config,
	req models.AuthRequest,
) (*models.AuthResponse, error) {
	ctx := context.Background()

	// 1. โหลดบัญชีจากตาราง users (ไม่ต้องมี role ถึงจะเจอ)
	account, err := GetLoginAccount(req.Username)
	if err != nil {
		// ไม่เจอ user → ข้อความกลาง ๆ ไม่ให้เดาว่ามีบัญชีหรือไม่
		return nil, errors.New("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
	}

	// 2. บัญชีถูกล็อกชั่วคราวจากการกรอกรหัสผิดซ้ำ
	if account.LockedUntil != nil && account.LockedUntil.After(time.Now()) {
		minutes := int(time.Until(*account.LockedUntil).Minutes()) + 1
		return nil, fmt.Errorf(
			"กรอกรหัสผิดเกินกำหนด บัญชีถูกระงับชั่วคราว กรุณาลองใหม่ในอีก %d นาที",
			minutes,
		)
	}

	// 3. กันบัญชีที่ถูกปิดใช้งาน (is_active = false) เข้าสู่ระบบ
	if !account.IsActive {
		return nil, errors.New("บัญชีถูกปิดใช้งาน โปรดติดต่อผู้ดูแลระบบ")
	}

	// 4. ตรวจรหัสผ่าน
	if bcrypt.CompareHashAndPassword(
		[]byte(account.PasswordHash),
		[]byte(req.Password),
	) != nil {
		// นับความพยายามที่ผิดพลาด
		lockedUntil, updateErr := registerFailedAttempt(ctx, account.ID, account.FailedAttempts)
		if updateErr != nil {
			return nil, errors.New("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
		}
		if lockedUntil != nil {
			return nil, fmt.Errorf(
				"กรอกรหัสผิดติดต่อกัน %d ครั้ง บัญชีถูกระงับชั่วคราว %d นาที",
				maxFailedAttempts,
				lockDuration,
			)
		}
		remaining := maxFailedAttempts - (account.FailedAttempts + 1)
		return nil, fmt.Errorf(
			"ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลืออีก %d ครั้ง)",
			remaining,
		)
	}

	// 5. สำเร็จ: ล้างตัวนับ + บันทึกเวลาเข้าสู่ระบบล่าสุด (best-effort)
	_ = resetFailedAttempts(ctx, account.ID)
	_ = updateLastLogin(ctx, account.ID)

	// 6. โหลด role + permission แล้วออก token
	user, err := FindUserByUsername(req.Username)
	if err != nil {
		return nil, errors.New("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
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

	// ออก refresh token (session ระยะยาว — รองรับ mobile app)
	// ล้มเหลวไม่ควรบล็อกการ login; จะไม่มี refresh ก็แค่ต้อง login ใหม่เมื่อ access หมดอายุ
	refreshToken, _ := IssueRefreshToken(ctx, user.ID, "")

	user.PasswordHash = ""

	return &models.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}

func FindUserByUsername(username string) (*models.User, error) {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 🔧 ใช้ LEFT JOIN เพื่อให้ผู้ใช้ที่ยังไม่มี role/permission ก็ login ได้
	query := `
	SELECT 
		u.id,
		u.username,
		u.password_hash,
		u.is_active,
		u.first_name,
		u.last_name,
		u.email,
		u.avatar_url,
		pf.name_th AS prefixes,
		pf.code AS prefix_code,
		ur.id AS role_id,
		r.name AS role,
		p.code AS permission

	FROM users u

	LEFT JOIN prefixes pf
	ON pf.id = u.prefix_id

	LEFT JOIN user_roles ur 
	ON u.id = ur.user_id

	LEFT JOIN roles r 
	ON ur.role_id = r.id

	LEFT JOIN role_permissions rp
	ON r.id = rp.role_id

	LEFT JOIN permissions p
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
			isActive bool
			firstName *string
			lastName *string
			email sql.NullString
			avatarURL sql.NullString
			prefixes sql.NullString
			prefixCode sql.NullString
            roleID sql.NullInt64
			role sql.NullString
			permission sql.NullString
		)


		err := rows.Scan(
			&id,
			&username,
			&passwordHash,
			&isActive,
			&firstName,
			&lastName,
			&email,
			&avatarURL,
			&prefixes,
			&prefixCode,
			&roleID,
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

			var avatarURLPtr *string

			if avatarURL.Valid {
				avatarURLPtr = &avatarURL.String
			}

			user = &models.User{
				ID: id,
				Username: username,
				PasswordHash: passwordHash,
				IsActive: isActive,
				FirstName: firstName,
				LastName: lastName,
				Email: emailPtr,
				AvatarURL: avatarURLPtr,
				Prefixes: prefixes.String,
				PrefixCode: prefixCode.String,

				Roles: []models.UserRole{},
				Permissions: []models.Permission{},
			}
		}


		// กัน Role ซ้ำ (ข้ามถ้า role เป็น NULL จาก LEFT JOIN)
	if roleID.Valid && role.Valid {
			if !roleMap[role.String] {
				user.Roles = append(
					user.Roles,
					models.UserRole{
						RoleID: int(roleID.Int64),
						RoleName: role.String,
					},
				)
				roleMap[role.String] = true
			}
		}


		// กัน Permission ซ้ำ (ข้ามถ้า permission เป็น NULL จาก LEFT JOIN)
	if permission.Valid {
			if !permissionMap[permission.String] {
				user.Permissions = append(
					user.Permissions,
					models.Permission{
						PermissionName: permission.String,
					},
				)
				permissionMap[permission.String] = true
			}
		}

	}


	if user == nil {
		return nil, errors.New("user not found")
	}


	return user,nil
}

// FindUsernameByID ดึง username จาก id (ใช้ตอนต่ออายุ refresh token)
func FindUsernameByID(ctx context.Context, id int64) (string, error) {
	var username string
	err := db.DB.QueryRow(
		ctx,
		`SELECT username FROM users WHERE id = $1`,
		id,
	).Scan(&username)
	if err != nil {
		return "", err
	}
	return username, nil
}

// updateLastLogin บันทึกเวลาเข้าสู่ระบบล่าสุด (best-effort — ไม่ return error)
func updateLastLogin(ctx context.Context, userID int64) error {
	_, err := db.DB.Exec(
		ctx,
		`UPDATE users SET last_login = NOW() WHERE id = $1`,
		userID,
	)
	return err
}

