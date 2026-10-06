package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"tarawitApi/db"
	"tarawitApi/db/migrations"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	if len(os.Args) != 2 || (os.Args[1] != "up" && os.Args[1] != "status") {
		log.Fatal("usage: go run ./cmd/migrate [up|status]")
	}

	db.ConnectDB()
	defer db.DB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	switch os.Args[1] {
	case "status":
		statuses, err := migrations.ListStatus(ctx, db.DB)
		if err != nil {
			log.Fatal(err)
		}
		for _, status := range statuses {
			state := "pending"
			if status.Applied {
				state = "applied"
			}
			fmt.Printf("%-8s %s\n", state, status.Name)
		}
	case "up":
		databaseName := os.Getenv("POSTGRES_DB")
		if databaseName == "" || os.Getenv("MIGRATION_CONFIRM_DB") != databaseName {
			log.Fatal("refusing to migrate: MIGRATION_CONFIRM_DB must exactly match POSTGRES_DB")
		}
		completed, err := migrations.Up(ctx, db.DB)
		if err != nil {
			log.Fatal(err)
		}
		if len(completed) == 0 {
			fmt.Println("database is up to date")
			return
		}
		for _, name := range completed {
			fmt.Println("applied", name)
		}
	}
}
