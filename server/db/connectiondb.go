package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func ConnectDB() {
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbName := os.Getenv("POSTGRES_DB")

	connStr := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user,
		password,
		host,
		port,
		dbName,
		sslMode,
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cfg, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		log.Fatalf("❌ failed to parse db config: %v", err)
	}
	cfg.MaxConns = 20
	cfg.MinConns = 2
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		log.Fatalf("❌ failed to create db pool: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		log.Fatalf(
			"❌ failed to connect PostgreSQL host=%s port=%s db=%s user=%s: %v",
			host,
			port,
			dbName,
			user,
			err,
		)
	}

	DB = pool

	log.Printf(
		"✅ PostgreSQL connected host=%s port=%s db=%s user=%s",
		host,
		port,
		dbName,
		user,
	)
}