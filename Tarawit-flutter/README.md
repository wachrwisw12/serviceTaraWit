# TaraWit Mobile

Flutter frontend สำหรับ iOS และ Android ใช้ Material 3 และ `go_router`

## เริ่มต้นใช้งาน

ต้องติดตั้ง Flutter stable ก่อน จากนั้นรัน:

```sh
cd Tarawit-flutter
flutter create --platforms=android,ios --org th.ac.tarawit .
flutter pub get
flutter run --dart-define-from-file=env/dev.json
```

คำสั่ง `flutter create` จะสร้าง native runner ใน `android/` และ `ios/` โดยไม่เขียนทับไฟล์ Dart ที่มีอยู่ จากนั้นเลือก simulator/emulator หรืออุปกรณ์จริงได้ตามปกติ

## Environment

- `env/dev.json` — development ใช้ backend บนเครื่องที่ `10.0.2.2:8000`
- `env/prod.json` — production ใช้ `https://folio-me.com/api`

คำสั่งที่ใช้บ่อย:

```sh
make run-dev
make run-prod
make build-android-prod
make build-ios-prod
```

แอปใช้ `Dio` ผ่าน `lib/core/network/api_client.dart` และอ่านค่าผ่าน
`lib/core/config/app_config.dart` โดย production จะปิด network logs อัตโนมัติ
หากรัน dev บน iOS Simulator ให้เปลี่ยน `API_BASE_URL` ใน `env/dev.json` เป็น
`http://localhost:8000/api`

## โครงสร้างหลัก

- `lib/app/router.dart` — เส้นทางทั้งหมดด้วย go_router
- `lib/core/theme/` — Material 3 theme และสีของระบบ
- `lib/core/config/` — environment configuration
- `lib/core/network/` — Dio API client
- `lib/features/` — หน้าจอแยกตาม feature
- `lib/shared/` — shell และ navigation ที่ใช้ร่วมกัน
- `assets/images/logo_tara.webp` — โลโก้เดียวกับ React frontend

เมื่อเปิดแอป route `/` จะแสดง Splash Screen ประมาณ 1.8 วินาที แล้วนำไปยัง
หน้า Login ผ่าน `go_router`

หน้า Login เชื่อม flow เดียวกับ Web แล้ว ได้แก่ `/auth/signin`, `/auth/me`,
`/auth/refresh` และ `/auth/logout` พร้อมเก็บ token ด้วย Secure Storage

Mobile app เน้นการใช้งานส่วนบุคคล ได้แก่ การลงเวลาของฉัน งานประเมินของฉัน
ผลประเมินของฉัน และโปรไฟล์ โดยไม่มีเมนูตั้งค่าระบบหรือเมนูดูแลผู้ใช้งาน

โมดูลลงเวลาของฉันเชื่อม API จริงแล้ว รองรับสถานะวันนี้ เวลาเข้า–ออก
การยืนยันก่อนลงเวลา ประวัติรายเดือน และสรุปตรงเวลา/มาสาย/ออกก่อนเวลา
พร้อมแผนที่ตำแหน่งแบบ realtime วงรัศมีพื้นที่ลงเวลา และตรวจความแม่นยำ GPS
ก่อนส่งพิกัดให้ backend ตรวจสอบซ้ำ

## สิทธิ์ตำแหน่งสำหรับแผนที่ลงเวลา

หลังสร้าง native runner ด้วย `flutter create` ให้เพิ่มบรรทัดนี้เหนือ `<application>`
ใน `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

และเพิ่มใน `ios/Runner/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>ใช้ตำแหน่งเพื่อแสดงพื้นที่และยืนยันการลงเวลาเข้าออก</string>
```

Android ต้องตั้ง `compileSdk` อย่างน้อย 35 ตามข้อกำหนดของ geolocator

> `flutter_secure_storage` รุ่นที่ใช้ต้องการ Android minSdk 23 ขึ้นไป
