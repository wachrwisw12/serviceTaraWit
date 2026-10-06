# Tarawit API

## Database migrations

ไฟล์ Migration อยู่ใน `db/migrations` ระบบจะรันตามชื่อไฟล์ โดยแต่ละไฟล์อยู่ใน
transaction ของตัวเอง และบันทึกชื่อไฟล์, checksum และเวลาที่รันลงตาราง
`schema_migrations`

### Development

ตรวจสถานะ:

```bash
make migrate-status
```

รันรายการที่ยังค้าง โดยยืนยันชื่อฐานข้อมูลให้ตรงกับ `POSTGRES_DB`:

```bash
MIGRATION_CONFIRM_DB=tarawit_dev make migrate-up
```

### Production Docker

Migration ใช้ container แบบ one-shot แยกจาก API จึงใช้กับชุด Docker Production
อื่นได้ โดย build image จาก source revision เดียวกับ API:

```bash
docker build -f Dockerfile.migrate -t tarawit-migrate .
```

ตรวจสถานะด้วย environment/secret ของ Production:

```bash
docker run --rm --network <production-network> \
  --env-file <production-db-env-file> \
  tarawit-migrate status
```

รัน Migration โดยเพิ่ม `MIGRATION_CONFIRM_DB` ให้ตรงกับ `POSTGRES_DB` ในไฟล์ env:

```bash
docker run --rm --network <production-network> \
  --env-file <production-db-env-file> \
  -e MIGRATION_CONFIRM_DB=<production-database-name> \
  tarawit-migrate up
```

API container จะไม่รัน Migration อัตโนมัติ ให้สำรองฐานข้อมูล ตรวจ `status` และรัน
Migration container ให้สำเร็จก่อน deploy API เวอร์ชันใหม่

ห้ามแก้ไฟล์ Migration ที่เคยรันแล้ว เพราะ checksum จะไม่ตรง ให้สร้างไฟล์ `.sql`
รายการใหม่เสมอ

ค่าการเชื่อมต่อที่ใช้คือ `DB_HOST`, `DB_PORT`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB` และ `DB_SSLMODE`

## Attendance geofence

Migration `000003_attendance_geofence.sql` เพิ่มจุดลงเวลาหลายจุดพร้อมรัศมี,
กลุ่มลงเวลา, สิทธิ์ลงเวลานอกพื้นที่รายบุคคล/รายกลุ่ม และข้อมูลพิกัดสำหรับ
ตรวจสอบย้อนหลัง โดยค่าเริ่มต้นปิด geofence เพื่อไม่กระทบ client เดิม

API สำหรับผู้ใช้งาน:

- `GET /api/attendance/location-policy`
- `POST /api/attendance/check-in` body `{ "latitude": 13.0, "longitude": 100.0, "accuracy_m": 15 }`
- `POST /api/attendance/check-out` ใช้ body รูปแบบเดียวกัน

API สำหรับผู้มีสิทธิ์ `attendance.manage`:

- `GET|PUT /api/attendance/geofence-config`
- `POST /api/attendance/locations`
- `PUT|DELETE /api/attendance/locations/:id`
- `GET|POST /api/attendance/groups`
- `GET /api/attendance/users` (รายชื่อขั้นต่ำสำหรับเลือกสมาชิก/ข้อยกเว้น)
- `PUT|DELETE /api/attendance/groups/:id`
- `PUT /api/attendance/groups/:id/members`
- `GET|PUT /api/attendance/outside-access`

ระบบตรวจจุดที่เปิดใช้งานทุกจุดด้วยระยะ Haversine และยอมรับเมื่ออยู่ภายใน
รัศมีอย่างน้อยหนึ่งจุด หากอยู่นอกพื้นที่ต้องได้รับสิทธิ์ตรงจากรายบุคคลหรือ
ผ่านกลุ่ม จึงจะลงเวลาได้

ผู้มีสิทธิ์ `attendance.manage` แก้ไขบันทึกได้ผ่าน
`PUT /api/attendance/records/:id` โดยต้องส่ง `reason` อย่างน้อย 3 ตัวอักษร
ระบบคำนวณเวลาทำงานใหม่และบันทึกข้อมูลก่อน/หลังพร้อมผู้แก้ไขใน
`attendance_record_audit_logs` ประวัติอ่านได้จาก
`GET /api/attendance/records/:id/audit-logs`

ช่วงเวลาที่อนุญาตกำหนดผ่าน `PUT /api/attendance/geofence-config` ด้วย
`check_in_open`, `check_in_close`, `check_out_open`, `check_out_close` ระบบตรวจ
ตาม timezone ของโรงเรียนที่ Backend ก่อนบันทึกทุกครั้ง ช่วงเวลาข้ามเที่ยงคืน
รองรับได้ เช่น `22:00-02:00`

## Rate limiting behind a proxy

Production proxy must forward the original client IP in `X-Forwarded-For`.
Set `TRUSTED_PROXIES` to the proxy IP or internal network CIDR, separated by
commas when there is more than one value. Do not expose the API container
directly to the internet when trusting a private Docker network CIDR.

```env
TRUSTED_PROXIES=172.16.0.0/12
```
