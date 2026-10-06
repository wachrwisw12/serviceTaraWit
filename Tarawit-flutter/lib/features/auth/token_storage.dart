import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/services.dart';

class TokenStorage {
  TokenStorage._();

  static final TokenStorage instance = TokenStorage._();
  static const _storage = FlutterSecureStorage();
  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';

  String? _sessionAccessToken;
  String? _sessionRefreshToken;

  Future<String?> readAccessToken() async {
    final session = _sessionAccessToken;
    if (session != null) return session;
    return _readPersistent(_accessKey);
  }

  Future<String?> readRefreshToken() async {
    final session = _sessionRefreshToken;
    if (session != null) return session;
    return _readPersistent(_refreshKey);
  }

  Future<String?> _readPersistent(String key) async {
    try {
      return await _storage.read(key: key);
    } on MissingPluginException {
      // ทำให้ widget tests ทำงานได้โดยไม่ต้องโหลด native plugin
      return null;
    }
  }

  Future<void> saveTokens(
      {required String accessToken,
      required String? refreshToken,
      required bool remember}) async {
    _sessionAccessToken = accessToken;
    _sessionRefreshToken = refreshToken;
    if (remember) {
      await _storage.write(key: _accessKey, value: accessToken);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _storage.write(key: _refreshKey, value: refreshToken);
      }
    } else {
      await _deletePersistentTokens();
    }
  }

  Future<void> updateRotatedTokens(
      {required String accessToken, required String? refreshToken}) async {
    final remembered = await _storage.containsKey(key: _refreshKey);
    await saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        remember: remembered);
  }

  Future<void> clear() async {
    _sessionAccessToken = null;
    _sessionRefreshToken = null;
    await _deletePersistentTokens();
  }

  Future<void> _deletePersistentTokens() async {
    await Future.wait([
      _storage.delete(key: _accessKey),
      _storage.delete(key: _refreshKey),
    ]);
  }
}
