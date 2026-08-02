package userrepositories

import (
	"context"
	"tarawitApi/db"
	usermodel "tarawitApi/userFeature/user_model"
)


func (r *UserRepository) GetPersonTypeRepo() ([]usermodel.PersonType, error) {
	query := `
		SELECT r.id,r.code,r.name_th FROM person_types r
	`

	rows, err := db.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var PersonlistType []usermodel.PersonType

	for rows.Next() {
		var personTypes usermodel.PersonType

		err := rows.Scan(
			&personTypes.ID,
			&personTypes.Code,
			&personTypes.NameTh,
			
		)
		if err != nil {
			return nil, err
		}

		PersonlistType = append(PersonlistType,personTypes)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return PersonlistType, nil
}

