package moduleFeature

import (
	"encoding/json"
	"strings"
	"tarawitApi/db"

	"github.com/gofiber/fiber/v2"
)

type Module struct {
	Key                string  `json:"key"`
	Name               string  `json:"name"`
	Description        string  `json:"description"`
	Enabled            bool    `json:"enabled"`
	ShowOnWeb          bool    `json:"show_on_web"`
	ShowOnMobile       bool    `json:"show_on_mobile"`
	SortOrder          int     `json:"sort_order"`
	MaintenanceMessage *string `json:"maintenance_message"`
}

func list(c *fiber.Ctx, onlyAvailable bool) error {
	channel := strings.ToLower(c.Query("channel", "web"))
	query := `SELECT module_key,name,description,enabled,show_on_web,show_on_mobile,sort_order,maintenance_message FROM system_modules`
	if onlyAvailable {
		if channel == "mobile" {
			query += ` WHERE enabled=TRUE AND show_on_mobile=TRUE`
		} else {
			query += ` WHERE enabled=TRUE AND show_on_web=TRUE`
		}
	}
	query += ` ORDER BY sort_order,module_key`
	rows, err := db.DB.Query(c.Context(), query)
	if err != nil {
		return fiber.NewError(500, "โหลดการตั้งค่าโมดูลไม่สำเร็จ")
	}
	defer rows.Close()
	items := make([]Module, 0)
	for rows.Next() {
		var item Module
		if err := rows.Scan(&item.Key, &item.Name, &item.Description, &item.Enabled, &item.ShowOnWeb, &item.ShowOnMobile, &item.SortOrder, &item.MaintenanceMessage); err != nil {
			return fiber.NewError(500, "โหลดการตั้งค่าโมดูลไม่สำเร็จ")
		}
		items = append(items, item)
	}
	return c.JSON(items)
}

func ListMine(c *fiber.Ctx) error { return list(c, true) }
func ListAll(c *fiber.Ctx) error  { return list(c, false) }

func Update(c *fiber.Ctx) error {
	key := c.Params("key")
	var req struct {
		Enabled            bool    `json:"enabled"`
		ShowOnWeb          bool    `json:"show_on_web"`
		ShowOnMobile       bool    `json:"show_on_mobile"`
		MaintenanceMessage *string `json:"maintenance_message"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(400, "ข้อมูลไม่ถูกต้อง")
	}
	tx, err := db.DB.Begin(c.Context())
	if err != nil {
		return fiber.NewError(500, "บันทึกไม่สำเร็จ")
	}
	defer tx.Rollback(c.Context()) //nolint:errcheck
	var before Module
	err = tx.QueryRow(c.Context(), `SELECT module_key,name,description,enabled,show_on_web,show_on_mobile,sort_order,maintenance_message FROM system_modules WHERE module_key=$1 FOR UPDATE`, key).
		Scan(&before.Key, &before.Name, &before.Description, &before.Enabled, &before.ShowOnWeb, &before.ShowOnMobile, &before.SortOrder, &before.MaintenanceMessage)
	if err != nil {
		return fiber.NewError(404, "ไม่พบโมดูล")
	}
	userID, _ := c.Locals("user_id").(int64)
	_, err = tx.Exec(c.Context(), `UPDATE system_modules SET enabled=$2,show_on_web=$3,show_on_mobile=$4,maintenance_message=$5,updated_by=$6,updated_at=NOW() WHERE module_key=$1`, key, req.Enabled, req.ShowOnWeb, req.ShowOnMobile, req.MaintenanceMessage, userID)
	if err != nil {
		return fiber.NewError(500, "บันทึกไม่สำเร็จ")
	}
	after := before
	after.Enabled, after.ShowOnWeb, after.ShowOnMobile, after.MaintenanceMessage = req.Enabled, req.ShowOnWeb, req.ShowOnMobile, req.MaintenanceMessage
	beforeJSON, _ := json.Marshal(before)
	afterJSON, _ := json.Marshal(after)
	_, err = tx.Exec(c.Context(), `INSERT INTO system_module_audit_logs(module_key,before_value,after_value,changed_by) VALUES($1,$2,$3,$4)`, key, beforeJSON, afterJSON, userID)
	if err != nil {
		return fiber.NewError(500, "บันทึกประวัติไม่สำเร็จ")
	}
	if err := tx.Commit(c.Context()); err != nil {
		return fiber.NewError(500, "บันทึกไม่สำเร็จ")
	}
	return c.JSON(after)
}
