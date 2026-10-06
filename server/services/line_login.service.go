package services

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"tarawitApi/config"
	"tarawitApi/db"
	middlewares "tarawitApi/midleware"
	"tarawitApi/models"
)

/* ================== Endpoints ของ LINE Platform ================== */

const (
	lineAuthorizeURL = "https://access.line.me/oauth2/v2.1/authorize"
	lineTokenURL     = "https://api.line.me/oauth2/v2.1/token"
	lineVerifyURL    = "https://api.line.me/oauth2/v2.1/verify"
	lineStateTTL     = 10 * time.Minute // state + nonce หมดอายุเร็ว
)

/* ================== Config ================== */

// LineEnabled ตรวจว่าตั้งค่า LINE Login ครบหรือยัง (Channel ID/Secret/Redirect URI)
func LineEnabled() bool {
	cfg := config.Cfg
	return cfg != nil &&
		cfg.LineChannelID != "" &&
		cfg.LineChannelSecret != "" &&
		cfg.LineRedirectURI != ""
}

/* ================== State / nonce (กัน CSRF + replay) ================== */

type lineStateRow struct {
	ID     int64
	Nonce  string
	Mode   string
	UserID sql.NullInt64
}

func randomToken(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// CreateLineState สร้าง state + nonce เก็บใน DB แล้วคืน authorize URL
// mode: "login" (ไม่มี userID) หรือ "link" (ผูกกับ userID ที่ login อยู่)
func CreateLineState(ctx context.Context, mode string, userID int64) (string, error) {
	if !LineEnabled() {
		return "", errors.New("ยังไม่ได้ตั้งค่า LINE Login")
	}

	state, err := randomToken(24)
	if err != nil {
		return "", err
	}
	nonce, err := randomToken(24)
	if err != nil {
		return "", err
	}

	// ลบ state เก่าที่หมดอายุแล้ว (กันตารางโต)
	_, _ = db.DB.Exec(ctx, `DELETE FROM line_login_states WHERE created_at < NOW() - interval '15 minutes'`)

	var uid any
	if mode == "link" {
		uid = userID
	}
	_, err = db.DB.Exec(ctx, `
		INSERT INTO line_login_states (state, nonce, mode, user_id)
		VALUES ($1, $2, $3, $4)
	`, state, nonce, mode, uid)
	if err != nil {
		return "", err
	}

	cfg := config.Cfg
	q := url.Values{}
	q.Set("response_type", "code")
	q.Set("client_id", cfg.LineChannelID)
	q.Set("redirect_uri", cfg.LineRedirectURI)
	q.Set("state", state)
	q.Set("nonce", nonce)
	q.Set("scope", "openid profile") // profile = ชื่อ + รูป (email ต้องขออนุมัติเพิ่ม ไม่ใช้)

	return lineAuthorizeURL + "?" + q.Encode(), nil
}

// ConsumeLineState ตรวจ state (ต้องยังไม่หมดอายุ + ยังไม่ถูกใช้) แล้ว mark ว่าใช้แล้ว
// คืน nonce + mode + userID เพื่อใช้ต่อใน callback
func ConsumeLineState(ctx context.Context, state string) (*lineStateRow, error) {
	if state == "" {
		return nil, errors.New("state ไม่ถูกต้อง")
	}

	var row lineStateRow
	err := db.DB.QueryRow(ctx, `
		SELECT id, nonce, mode, user_id
		FROM line_login_states
		WHERE state = $1 AND used_at IS NULL AND created_at > NOW() - interval '10 minutes'
	`, state).Scan(&row.ID, &row.Nonce, &row.Mode, &row.UserID)
	if err != nil {
		return nil, errors.New("state ไม่ถูกต้องหรือหมดอายุ")
	}

	_, err = db.DB.Exec(ctx, `UPDATE line_login_states SET used_at = NOW() WHERE id = $1`, row.ID)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

/* ================== เรียก LINE API ================== */

type lineTokenResponse struct {
	AccessToken string `json:"access_token"`
	IDToken     string `json:"id_token"`
}

// exchangeLineCode แลก code → id_token + access_token
func exchangeLineCode(ctx context.Context, code string) (*lineTokenResponse, error) {
	cfg := config.Cfg

	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("code", code)
	form.Set("redirect_uri", cfg.LineRedirectURI)
	form.Set("client_id", cfg.LineChannelID)
	form.Set("client_secret", cfg.LineChannelSecret)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, lineTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("เชื่อมต่อ LINE ไม่สำเร็จ: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("LINE ตอบกลับไม่สำเร็จ (HTTP %d)", resp.StatusCode)
	}

	var tok lineTokenResponse
	if err := json.Unmarshal(body, &tok); err != nil {
		return nil, err
	}
	if tok.IDToken == "" {
		return nil, errors.New("LINE ไม่ได้คืน id_token")
	}
	return &tok, nil
}

// lineIDTokenClaims ข้อมูลที่ LINE ยืนยันแล้วจาก id_token (ผ่าน /verify)
type lineIDTokenClaims struct {
	Iss     string `json:"iss"`
	Sub     string `json:"sub"`
	Aud     string `json:"aud"`
	Exp     int64  `json:"exp"`
	Nonce   string `json:"nonce"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// verifyLineIDToken ส่ง id_token ให้ LINE ตรวจ (POST /oauth2/v2.1/verify)
// แล้วตรวจ claims เองอีกชั้น (iss / aud / nonce / exp) — กันปลอมแปลง
func verifyLineIDToken(ctx context.Context, idToken, nonce string) (*lineIDTokenClaims, error) {
	cfg := config.Cfg

	form := url.Values{}
	form.Set("id_token", idToken)
	form.Set("client_id", cfg.LineChannelID)
	form.Set("nonce", nonce)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, lineVerifyURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ตรวจสอบ LINE ไม่สำเร็จ: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("LINE ปฏิเสธ id_token")
	}

	var claims lineIDTokenClaims
	if err := json.Unmarshal(body, &claims); err != nil {
		return nil, err
	}

	// ตรวจ claims เองอีกชั้น
	if claims.Iss != "https://access.line.me" {
		return nil, errors.New("iss ไม่ถูกต้อง")
	}
	if claims.Aud != cfg.LineChannelID {
		return nil, errors.New("aud ไม่ตรงกับ channel")
	}
	if claims.Nonce != nonce {
		return nil, errors.New("nonce ไม่ตรงกัน")
	}
	if claims.Sub == "" {
		return nil, errors.New("ไม่มี sub ใน id_token")
	}
	if claims.Exp > 0 && time.Now().Unix() > claims.Exp {
		return nil, errors.New("id_token หมดอายุ")
	}
	return &claims, nil
}

/* ================== ค้นหา / สร้าง / เชื่อมผู้ใช้ ================== */

// FindUserIDByLine ค้นหา user ตาม line_user_id
func FindUserIDByLine(ctx context.Context, lineUserID string) (int64, error) {
	var id int64
	err := db.DB.QueryRow(ctx,
		`SELECT id FROM users WHERE line_user_id = $1`,
		lineUserID,
	).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// CreateUserFromLine สร้างบัญชีใหม่จากข้อมูล LINE (auto-create)
// ได้ role เริ่มต้นตาม env LINE_DEFAULT_ROLE (ค่าเริ่มต้น TECHER)
func CreateUserFromLine(ctx context.Context, lineUserID, name, picture string) (int64, error) {
	// username อัตโนมัติจาก LINE sub (ไม่ซ้ำกัน) — ใช้ login ด้วยรหัสไม่ได้
	username := "line_" + lineUserID
	if len(username) > 100 {
		username = username[:100]
	}

	// รหัสผ่านสุ่ม — ผู้ใช้ LINE ไม่ได้ใช้รหัส (กันช่องว่างถ้าต้องตั้งทีหลัง)
	rawPass, err := randomToken(24)
	if err != nil {
		return 0, err
	}
	passHash, err := hashPassword(rawPass)
	if err != nil {
		return 0, err
	}

	// role เริ่มต้น (ค่าเริ่มต้น: TECHER) — หาจาก code ให้ยืดหยุ่น
	defaultRoleCode := "TECHER"

	var roleID int
	err = db.DB.QueryRow(ctx, `SELECT id FROM roles WHERE code = $1`, defaultRoleCode).Scan(&roleID)
	if err != nil {
		return 0, fmt.Errorf("ไม่พบ role เริ่มต้น %s", defaultRoleCode)
	}

	var firstName any
	if name != "" {
		firstName = name
	}
	var avatar any
	if picture != "" {
		avatar = picture
	}

	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var userID int64
	err = tx.QueryRow(ctx, `
		INSERT INTO users (username, password_hash, first_name, avatar_url, line_user_id, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id
	`, username, passHash, firstName, avatar, lineUserID).Scan(&userID)
	if err != nil {
		// username ซ้ำโดยบังเอิญ (ไม่ควรเกิด) — ต่อท้ายเลขสุ่มแล้วลองอีกครั้ง
		if strings.Contains(err.Error(), "uq_users_cid") || strings.Contains(err.Error(), "users_username_key") {
			username = fmt.Sprintf("%s_%d", username, time.Now().UnixNano()%100000)
			err = tx.QueryRow(ctx, `
				INSERT INTO users (username, password_hash, first_name, avatar_url, line_user_id, is_active)
				VALUES ($1, $2, $3, $4, $5, true)
				RETURNING id
			`, username, passHash, firstName, avatar, lineUserID).Scan(&userID)
		}
		if err != nil {
			return 0, fmt.Errorf("สร้างบัญชี LINE ไม่สำเร็จ: %w", err)
		}
	}

	if _, err := tx.Exec(ctx,
		`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
		userID, roleID,
	); err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return userID, nil
}

// LinkUserToLine เชื่อม LINE กับบัญชีเดิม — คืน error ถ้า LINE account ถูกเชื่อมกับคนอื่นแล้ว
func LinkUserToLine(ctx context.Context, userID int64, lineUserID string) error {
	if lineUserID == "" {
		return errors.New("line_user_id ว่าง")
	}

	// LINE account นี้ถูกผูกกับบัญชีอื่นแล้วหรือยัง
	var ownerID int64
	err := db.DB.QueryRow(ctx,
		`SELECT id FROM users WHERE line_user_id = $1 AND id <> $2`,
		lineUserID, userID,
	).Scan(&ownerID)
	if err == nil {
		return errors.New("บัญชี LINE นี้เชื่อมกับผู้ใช้รายอื่นแล้ว")
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	// ผูกใหม่ (ถ้า user นี้เคยผูก LINE อื่นมาก่อน จะถูกแทนที่)
	_, err = db.DB.Exec(ctx,
		`UPDATE users SET line_user_id = $1 WHERE id = $2`,
		lineUserID, userID,
	)
	return err
}

/* ================== Login ผ่าน LINE (เข้า session จริง) ================== */

// LineLoginSession ออก token + refresh token เหมือน login ปกติ
func LineLoginSession(ctx context.Context, userID int64) (*models.AuthResponse, error) {
	username, err := FindUsernameByID(ctx, userID)
	if err != nil {
		return nil, errors.New("ไม่พบผู้ใช้งาน")
	}
	user, err := FindUserByUsername(username)
	if err != nil {
		return nil, errors.New("ไม่พบผู้ใช้งาน")
	}
	if !user.IsActive {
		return nil, errors.New("บัญชีถูกปิดใช้งาน โปรดติดต่อผู้ดูแลระบบ")
	}

	roles := []string{}
	for _, r := range user.Roles {
		roles = append(roles, r.RoleName)
	}
	permissions := []string{}
	for _, p := range user.Permissions {
		permissions = append(permissions, p.PermissionName)
	}

	token, err := middlewares.GenerateJWT(config.Cfg, user.ID, user.Username, roles, permissions)
	if err != nil {
		return nil, errors.New("ไม่สามารถสร้าง token ได้")
	}
	refreshToken, _ := IssueRefreshToken(ctx, user.ID, "line")

	_ = updateLastLogin(ctx, user.ID)
	user.PasswordHash = ""

	return &models.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}

// ExchangeLineCallback ทำงานหลัง LINE redirect กลับมา:
// ตรวจ state → แลก code → ตรวจ id_token → login หรือ link
// คืน (mode, userID, claims, error)
func ExchangeLineCallback(ctx context.Context, code, state string) (string, int64, *lineIDTokenClaims, error) {
	if code == "" {
		return "", 0, nil, errors.New("LINE ไม่ได้คืน code")
	}

	stateRow, err := ConsumeLineState(ctx, state)
	if err != nil {
		return "", 0, nil, err
	}

	tok, err := exchangeLineCode(ctx, code)
	if err != nil {
		return "", 0, nil, err
	}

	claims, err := verifyLineIDToken(ctx, tok.IDToken, stateRow.Nonce)
	if err != nil {
		return "", 0, nil, err
	}

	return stateRow.Mode, stateRow.UserID.Int64, claims, nil
}
