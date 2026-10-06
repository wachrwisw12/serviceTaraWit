import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../core/network/api_client.dart';
import 'auth_user.dart';
import 'token_storage.dart';

enum AuthStatus { checking, authenticated, unauthenticated }

class AuthController extends ChangeNotifier {
  AuthController._();

  static final AuthController instance = AuthController._();
  final TokenStorage _tokens = TokenStorage.instance;

  AuthStatus status = AuthStatus.checking;
  AuthUser? user;
  bool isLoading = false;
  String? errorMessage;

  Future<bool> login(
      {required String username,
      required String password,
      required bool remember}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final response = await ApiClient.instance.post<Map<String, dynamic>>(
        '/auth/signin',
        data: {'username': username.trim(), 'password': password},
      );
      final data = response.data;
      final accessToken = data?['token'] as String?;
      final refreshToken = data?['refresh_token'] as String?;
      final userJson = data?['user'] as Map<String, dynamic>?;
      if (accessToken == null || userJson == null) {
        throw const FormatException('Invalid login response');
      }
      await _tokens.saveTokens(
          accessToken: accessToken,
          refreshToken: refreshToken,
          remember: remember);
      user = AuthUser.fromJson(userJson);
      status = AuthStatus.authenticated;
      return true;
    } on DioException catch (error) {
      await _tokens.clear();
      status = AuthStatus.unauthenticated;
      errorMessage = _loginErrorMessage(error);
      return false;
    } catch (_) {
      await _tokens.clear();
      status = AuthStatus.unauthenticated;
      errorMessage = 'เข้าสู่ระบบไม่สำเร็จ';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> restoreSession() async {
    status = AuthStatus.checking;
    final accessToken = await _tokens.readAccessToken();
    final refreshToken = await _tokens.readRefreshToken();
    if (accessToken == null && refreshToken == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
    try {
      final response =
          await ApiClient.instance.get<Map<String, dynamic>>('/auth/me');
      final userJson = response.data?['user'] as Map<String, dynamic>?;
      if (userJson == null) {
        throw const FormatException('Invalid user response');
      }
      user = AuthUser.fromJson(userJson);
      status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (_) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final refreshToken = await _tokens.readRefreshToken();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      try {
        await ApiClient.instance.post<void>('/auth/logout', data: {'refresh_token': refreshToken});
      } catch (_) {}
    }
    await _tokens.clear();
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  String _loginErrorMessage(DioException error) {
    if (error.response?.statusCode == 429) {
      return 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
    }
    final data = error.response?.data;
    if (data is Map<String, dynamic> && data['error'] is String) {
      return data['error'] as String;
    }
    return 'เข้าสู่ระบบไม่สำเร็จ';
  }
}
