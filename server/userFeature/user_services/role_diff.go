package userservices

func DiffRole(
	oldRoles []int64,
	newRoles []int64,
) (insertRoles []int64, deleteRoles []int64) {

	oldMap := make(map[int64]struct{})
	newMap := make(map[int64]struct{})

	for _, id := range oldRoles {
		oldMap[id] = struct{}{}
	}

	for _, id := range newRoles {
		newMap[id] = struct{}{}
	}

	// หา role ที่ต้องเพิ่ม
	for _, id := range newRoles {
		if _, ok := oldMap[id]; !ok {
			insertRoles = append(insertRoles, id)
		}
	}

	// หา role ที่ต้องลบ
	for _, id := range oldRoles {
		if _, ok := newMap[id]; !ok {
			deleteRoles = append(deleteRoles, id)
		}
	}

	return
}