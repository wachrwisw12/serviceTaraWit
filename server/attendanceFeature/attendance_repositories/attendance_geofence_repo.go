package attendancerepositories

import (
	"context"

	attendancemodel "tarawitApi/attendanceFeature/attendance_model"
	"tarawitApi/db"
)

func (r *AttendanceRepository) ListActiveLocations(ctx context.Context) ([]attendancemodel.AttendanceLocation, error) {
	rows, err := db.DB.Query(ctx, `SELECT id, name, latitude, longitude, radius_m, is_active FROM attendance_locations WHERE is_active = TRUE ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []attendancemodel.AttendanceLocation{}
	for rows.Next() {
		var item attendancemodel.AttendanceLocation
		if err := rows.Scan(&item.ID, &item.Name, &item.Latitude, &item.Longitude, &item.RadiusM, &item.IsActive); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *AttendanceRepository) ListLocations(ctx context.Context) ([]attendancemodel.AttendanceLocation, error) {
	rows, err := db.DB.Query(ctx, `SELECT id, name, latitude, longitude, radius_m, is_active FROM attendance_locations ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []attendancemodel.AttendanceLocation{}
	for rows.Next() {
		var item attendancemodel.AttendanceLocation
		if err := rows.Scan(&item.ID, &item.Name, &item.Latitude, &item.Longitude, &item.RadiusM, &item.IsActive); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *AttendanceRepository) UserCanCheckOutside(ctx context.Context, userID int64) (bool, error) {
	var allowed bool
	err := db.DB.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM attendance_outside_user_permissions WHERE user_id = $1)
		OR EXISTS(
			SELECT 1 FROM attendance_group_members gm
			JOIN attendance_groups g ON g.id = gm.group_id AND g.is_active = TRUE
			JOIN attendance_outside_group_permissions p ON p.group_id = gm.group_id
			WHERE gm.user_id = $1
		)`, userID).Scan(&allowed)
	return allowed, err
}

func (r *AttendanceRepository) ListAttendanceUsers(ctx context.Context) ([]attendancemodel.AttendanceUserOption, error) {
	rows, err := db.DB.Query(ctx, `SELECT id, username, COALESCE(first_name,''), COALESCE(last_name,'') FROM users WHERE is_active=TRUE ORDER BY first_name,last_name,username`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []attendancemodel.AttendanceUserOption{}
	for rows.Next() {
		var item attendancemodel.AttendanceUserOption
		if err := rows.Scan(&item.ID, &item.Username, &item.FirstName, &item.LastName); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *AttendanceRepository) UpdateGeofenceConfig(ctx context.Context, req attendancemodel.UpdateGeofenceConfigRequest) error {
	_, err := db.DB.Exec(ctx, `UPDATE attendance_settings SET geofence_enabled=$1, max_location_accuracy_m=$2, check_in_open=$3, check_in_close=$4, check_out_open=$5, check_out_close=$6, updated_at=NOW() WHERE id=(SELECT id FROM attendance_settings ORDER BY id LIMIT 1)`, req.Enabled, req.MaxLocationAccuracyM, req.CheckInOpen, req.CheckInClose, req.CheckOutOpen, req.CheckOutClose)
	return err
}

func (r *AttendanceRepository) SaveLocation(ctx context.Context, id int64, req attendancemodel.SaveLocationRequest) (int64, error) {
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	if id == 0 {
		err := db.DB.QueryRow(ctx, `INSERT INTO attendance_locations(name,latitude,longitude,radius_m,is_active) VALUES($1,$2,$3,$4,$5) RETURNING id`, req.Name, req.Latitude, req.Longitude, req.RadiusM, active).Scan(&id)
		return id, err
	}
	_, err := db.DB.Exec(ctx, `UPDATE attendance_locations SET name=$2,latitude=$3,longitude=$4,radius_m=$5,is_active=$6,updated_at=NOW() WHERE id=$1`, id, req.Name, req.Latitude, req.Longitude, req.RadiusM, active)
	return id, err
}

func (r *AttendanceRepository) DeleteLocation(ctx context.Context, id int64) error {
	_, err := db.DB.Exec(ctx, `DELETE FROM attendance_locations WHERE id=$1`, id)
	return err
}

func (r *AttendanceRepository) ListGroups(ctx context.Context) ([]attendancemodel.AttendanceGroup, error) {
	rows, err := db.DB.Query(ctx, `SELECT g.id,g.name,g.description,g.is_active,COALESCE(array_agg(gm.user_id) FILTER (WHERE gm.user_id IS NOT NULL),'{}') FROM attendance_groups g LEFT JOIN attendance_group_members gm ON gm.group_id=g.id GROUP BY g.id ORDER BY g.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []attendancemodel.AttendanceGroup{}
	for rows.Next() {
		var item attendancemodel.AttendanceGroup
		if err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.IsActive, &item.MemberIDs); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *AttendanceRepository) SaveGroup(ctx context.Context, id int64, req attendancemodel.SaveGroupRequest) (int64, error) {
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	if id == 0 {
		err := db.DB.QueryRow(ctx, `INSERT INTO attendance_groups(name,description,is_active) VALUES($1,$2,$3) RETURNING id`, req.Name, req.Description, active).Scan(&id)
		return id, err
	}
	_, err := db.DB.Exec(ctx, `UPDATE attendance_groups SET name=$2,description=$3,is_active=$4,updated_at=NOW() WHERE id=$1`, id, req.Name, req.Description, active)
	return id, err
}

func (r *AttendanceRepository) DeleteGroup(ctx context.Context, id int64) error {
	_, err := db.DB.Exec(ctx, `DELETE FROM attendance_groups WHERE id=$1`, id)
	return err
}

func (r *AttendanceRepository) ReplaceGroupMembers(ctx context.Context, groupID int64, userIDs []int64) error {
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `DELETE FROM attendance_group_members WHERE group_id=$1`, groupID); err != nil {
		return err
	}
	for _, userID := range userIDs {
		if _, err = tx.Exec(ctx, `INSERT INTO attendance_group_members(group_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, groupID, userID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *AttendanceRepository) GetOutsideAccess(ctx context.Context) (attendancemodel.OutsideAccessRequest, error) {
	var result attendancemodel.OutsideAccessRequest
	err := db.DB.QueryRow(ctx, `SELECT COALESCE((SELECT array_agg(user_id) FROM attendance_outside_user_permissions),'{}'),COALESCE((SELECT array_agg(group_id) FROM attendance_outside_group_permissions),'{}')`).Scan(&result.UserIDs, &result.GroupIDs)
	return result, err
}

func (r *AttendanceRepository) ReplaceOutsideAccess(ctx context.Context, req attendancemodel.OutsideAccessRequest) error {
	tx, err := db.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `DELETE FROM attendance_outside_user_permissions`); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `DELETE FROM attendance_outside_group_permissions`); err != nil {
		return err
	}
	for _, id := range req.UserIDs {
		if _, err = tx.Exec(ctx, `INSERT INTO attendance_outside_user_permissions(user_id) VALUES($1) ON CONFLICT DO NOTHING`, id); err != nil {
			return err
		}
	}
	for _, id := range req.GroupIDs {
		if _, err = tx.Exec(ctx, `INSERT INTO attendance_outside_group_permissions(group_id) VALUES($1) ON CONFLICT DO NOTHING`, id); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
