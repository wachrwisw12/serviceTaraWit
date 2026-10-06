.PHONY: build build-pi migrate-up migrate-status migrate-image

# ── Cross-compile ──────────────────────────────────────────────
# ใช้สำหรับ build binary ไปวางบน Pi (ARM64) ไม่ต้องผ่าน Docker
build:
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
		go build -trimpath -ldflags="-s -w" -o tarawit-api-arm64 .
	@echo "✅ build → tarawit-api-arm64 (linux/arm64)"

build-pi: build
	@echo "💡 scp tarawit-api-arm64 pi@<IP>:/path/to/server/ && restart API container"

# ── Migration ──────────────────────────────────────────────────
migrate-up:
	go run ./cmd/migrate up

migrate-status:
	go run ./cmd/migrate status

migrate-image:
	docker build -f Dockerfile.migrate -t tarawit-migrate .
