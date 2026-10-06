# 🔍 Checklist ก่อน Deploy ขึ้น Raspberry Pi (Prod)

## สิ่งที่ต้องทำบน Pi (SSH เข้าไปแล้วรัน)

### 1. Backup Database ก่อน (สำคัญ!)
```bash
# Backup ก่อนเสมอ
docker exec tarawit-postgres pg_dump -U yeawyow tarawitDB > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. เช็ค Migration State
```bash
docker exec tarawit-postgres psql -U yeawyow -d tarawitDB -c \
  "SELECT name, applied_at FROM schema_migrations ORDER BY name;"
```
- ถ้ามี `000003`-`000006` แล้ว → ✅ ดี
- ถ้ายังไม่มี → จะถูก auto-apply ตอน deploy

### 3. รัน Pre-Deploy Check
```bash
# Copy script ไป Pi แล้วรัน
scp pre-deploy-check.sh pi@<IP>:/path/to/project/
ssh pi@<IP>
./pre-deploy-check.sh tarawit-postgres
```
- ถ้า ALL CHECKS PASSED → deploy ได้เลย
- ถ้ามี FAIL → ต้องแก้ orphaned data ก่อน

### 4. สำคัญ! Build Binary สำหรับ ARM64
```bash
# บน Mac — build สำหรับ Pi (ARM64)
cd server && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
  go build -trimpath -ldflags="-s -w" -o tarawit-api . && cd ..
```
**อย่าลืม!** Pi ใช้ ARM64 ไม่ใช่ AMD64

### 5. Deploy binary จากเครื่องพัฒนา
```bash
# บน Mac/เครื่องพัฒนา — build, copy และสร้าง runtime container ใหม่
PI_HOST=pi@<IP> ./deploy-binary.sh
```

Docker จะไม่ compile Go บน Pi แต่จะนำ `server/tarawit-api-arm64` ใส่ใน
Alpine runtime image แล้ว replace เฉพาะ API container

---

## ความเสี่ยงที่อาจเกิด

### ถ้า Data บน Pi ตรงกับ Dev Dump
- Dev dump (`tarawit_dev_full.sql`) ถูก dump จาก Pi → ข้อมูลเหมือนกัน
- ✅ ปลอดภัย — ไม่มี orphaned data

### ถ้า Data บน Pi มีการแก้ไขหลัง Dump (Aug 23)
- อาจมี orphaned data ที่ dev ไม่มี
- ⚠️ ต้องรัน pre-deploy-check.sh บน Pi ก่อน

### ถ้า Migration 000003-000006 ยังไม่ได้ Apply บน Pi
- จะถูก auto-apply ตอน deploy
- ✅ ปลอดภัย — ใช้ `IF NOT EXISTS` ทุกตัว

---

## สรุปขั้นตอน

```bash
# 1. Backup
docker exec tarawit-postgres pg_dump -U yeawyow tarawitDB > backup.sql

# 2. เช็ค data
./pre-deploy-check.sh tarawit-postgres

# 3. Build สำหรับ Pi
cd server && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
  go build -trimpath -ldflags="-s -w" -o tarawit-api . && cd ..

# 4. Deploy จากเครื่องพัฒนา
PI_HOST=pi@<IP> ./deploy-binary.sh

# 5. Verify
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f api
```
