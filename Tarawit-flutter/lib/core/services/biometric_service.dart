import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

/// ให้บริการยืนยันตัวตนด้วย biometric (指纹/ใบหน้า) หรือ PIN ของระบบ
/// ใช้ local_auth — ไม่เก็บข้อมูล biometric ใหม่ ใช้ของระบบล้วนๆ
class BiometricService {
  BiometricService._();

  static final BiometricService instance = BiometricService._();
  final LocalAuthentication _auth = LocalAuthentication();
  static const _storage = FlutterSecureStorage();
  static const _enabledKey = 'biometric_enabled';
  static const _setupKey = 'biometric_setup_complete';
  static const _pinKey = 'user_pin_hash';

  // ── ตรวจว่าเครื่องรองรับอะไรบ้าง ─────────────────────────
  Future<bool> get isDeviceSupported async {
    try {
      return await _auth.isDeviceSupported();
    } on PlatformException {
      return false;
    }
  }

  Future<bool> get canCheckBiometrics async {
    try {
      return await _auth.canCheckBiometrics;
    } on PlatformException {
      return false;
    }
  }

  /// รวมกัน: เครื่องรองรับ + มี biometric registered
  Future<bool> get isAvailable async {
    final supported = await isDeviceSupported;
    final biometrics = await canCheckBiometrics;
    return supported && biometrics;
  }

  /// รายชื่อ biometric types ที่เครื่องมี (face, fingerprint, iris)
  Future<List<BiometricType>> get availableBiometrics async {
    try {
      return await _auth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// ชื่อประเภท biometric สำหรับแสดงผล (ภาษาไทย)
  Future<String> get biometricLabel async {
    final types = await availableBiometrics;
    if (types.contains(BiometricType.face)) return 'Face ID';
    if (types.contains(BiometricType.fingerprint)) return 'ลายนิ้วมือ';
    if (types.contains(BiometricType.iris)) return ' iris';
    return 'PIN / รหัสผ่าน';
  }

  // ── ยืนยันตัวตน ─────────────────────────────────────────
  // ลอง Face ID ก่อน → ถ้าไม่ได้ค่อย PIN/ลายนิ้ว
  Future<bool> authenticate({String? reason}) async {
    final msg = reason ?? 'กรุณายืนยันตัวตนเพื่อเข้าสู่ระบบ';

    // ขั้นที่ 1: ลอง biometric (Face ID / ลายนิ้วมือ) ก่อน — ไม่ให้ใส่ PIN
    try {
      final biometricOnly = await _auth.authenticate(
        localizedReason: msg,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,  // บังคับ biometric ก่อน ห้าม PIN
          useErrorDialogs: true,
        ),
      );
      if (biometricOnly) return true;
    } on PlatformException {
      // biometric ไม่พร้อม → ข้ามไปขั้นที่ 2
    }

    // ขั้นที่ 2: biometric ไม่ได้ → ให้ PIN / password fallback
    try {
      return await _auth.authenticate(
        localizedReason: msg,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false, // อนุญาต PIN/password
          useErrorDialogs: true,
        ),
      );
    } on PlatformException {
      return false;
    }
  }

  // ── PIN storage ────────────────────────────────────────
  Future<void> savePin(String pin) async {
    // Simple hash: reversed + salt (ไม่ใช้ bcrypt เพราะเป็น PIN 6 หลัก)
    final hash = _simpleHash(pin);
    try {
      await _storage.write(key: _pinKey, value: hash);
    } on MissingPluginException {
      // widget tests
    }
  }

  Future<bool> verifyPin(String pin) async {
    try {
      final stored = await _storage.read(key: _pinKey);
      if (stored == null) return false;
      return stored == _simpleHash(pin);
    } on MissingPluginException {
      return false;
    }
  }

  Future<bool> get hasPin async {
    try {
      final stored = await _storage.read(key: _pinKey);
      return stored != null && stored.isNotEmpty;
    } on MissingPluginException {
      return false;
    }
  }

  String _simpleHash(String pin) {
    // Simple hash for PIN: reverse + combine with salt
    final reversed = pin.split('').reversed.join();
    final salt = 'tarawit_2026';
    return '$reversed$salt'.hashCode.toRadixString(16);
  }

  // ── setup complete flag ─────────────────────────────────
  Future<bool> get isSetupComplete async {
    try {
      final value = await _storage.read(key: _setupKey);
      return value == 'true';
    } on MissingPluginException {
      return false;
    }
  }

  Future<void> markSetupComplete() async {
    try {
      await _storage.write(key: _setupKey, value: 'true');
    } on MissingPluginException {
      // widget tests
    }
  }

  // ── ตั้งค่าเปิด/ปิด ─────────────────────────────────────
  Future<bool> get isEnabled async {
    try {
      final value = await _storage.read(key: _enabledKey);
      return value == 'true';
    } on MissingPluginException {
      return false;
    }
  }

  Future<void> setEnabled(bool value) async {
    try {
      await _storage.write(key: _enabledKey, value: value.toString());
    } on MissingPluginException {
      // widget tests
    }
  }
}
