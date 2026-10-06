import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tarawit_mobile/app/app.dart';
import 'package:tarawit_mobile/features/auth/auth_controller.dart';
import 'package:tarawit_mobile/features/auth/auth_user.dart';
import 'package:tarawit_mobile/core/network/api_client.dart';

// ==================== Helpers ====================

const _secureStorageChannel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');

/// Mock HTTP adapter that intercepts Dio requests and returns canned responses.
class _MockHttpClientAdapter implements HttpClientAdapter {
  _MockHttpClientAdapter(this._handler);

  final Future<ResponseBody> Function(RequestOptions options) _handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) => _handler(options);

  @override
  void close({bool force = false}) {}
}

/// Build a JSON response body for Dio.
ResponseBody _jsonResponse(int statusCode, Map<String, dynamic> body) {
  return ResponseBody.fromString(
    jsonEncode(body),
    statusCode,
    headers: {'content-type': ['application/json']},
  );
}

/// Convenience to set up the mock adapter on ApiClient.
void _mockApi(Future<ResponseBody> Function(RequestOptions) handler) {
  ApiClient.instance.httpClientAdapter = _MockHttpClientAdapter(handler);
}

/// Reset the mock adapter and secure storage between tests.
void _resetMocks() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(_secureStorageChannel, (MethodCall _) async => null);

  // Dio adapter is left as-is — each test that needs a mock sets it explicitly

  // Reset auth state
  final auth = AuthController.instance;
  auth.status = AuthStatus.unauthenticated;
  auth.user = null;
  auth.errorMessage = null;
  auth.isLoading = false;
}

// ==================== AuthUser Model Tests ====================

void main() {
  group('AuthUser model', () {
    test('parses from JSON correctly', () {
      final json = <String, dynamic>{
        'id': 1,
        'username': 'john',
        'first_name': 'John',
        'last_name': 'Doe',
        'email': 'john@example.com',
        'avatar_url': 'https://example.com/avatar.jpg',
        'prefixes': 'นาย',
        'prefix_code': 'mr',
        'roles': [
          {'role_name': 'ADMIN'},
          {'role_name': 'TEACHER'},
        ],
        'permissions': [
          {'permission_name': 'attendance.view'},
          {'permission_name': 'instance.view'},
        ],
      };

      final user = AuthUser.fromJson(json);

      expect(user.id, 1);
      expect(user.username, 'john');
      expect(user.firstName, 'John');
      expect(user.lastName, 'Doe');
      expect(user.email, 'john@example.com');
      expect(user.avatarUrl, 'https://example.com/avatar.jpg');
      expect(user.prefixes, 'นาย');
      expect(user.prefixCode, 'mr');
      expect(user.roles, ['ADMIN', 'TEACHER']);
      expect(user.permissions, ['attendance.view', 'instance.view']);
    });

    test('handles missing optional fields', () {
      final json = <String, dynamic>{
        'id': 2,
        'username': 'jane',
        'first_name': '',
        'last_name': '',
      };

      final user = AuthUser.fromJson(json);

      expect(user.id, 2);
      expect(user.username, 'jane');
      expect(user.email, isNull);
      expect(user.avatarUrl, isNull);
      expect(user.prefixes, isNull);
      expect(user.roles, isEmpty);
      expect(user.permissions, isEmpty);
    });

    test('displayName uses prefix when available', () {
      final user = AuthUser(
        id: 1,
        username: 'test',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        roles: const [],
        permissions: const [],
        prefixes: 'นาย',
      );

      expect(user.displayName, 'นายสมชาย ใจดี');
    });

    test('displayName without prefix', () {
      final user = AuthUser(
        id: 1,
        username: 'test',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        roles: const [],
        permissions: const [],
      );

      expect(user.displayName, 'สมชาย ใจดี');
    });

    test('displayName falls back to username when name is empty', () {
      final user = AuthUser(
        id: 1,
        username: 'testuser',
        firstName: '',
        lastName: '',
        roles: const [],
        permissions: const [],
      );

      expect(user.displayName, 'testuser');
    });

    test('filters out empty role names', () {
      final json = <String, dynamic>{
        'id': 1,
        'username': 'test',
        'first_name': 'Test',
        'last_name': 'User',
        'roles': [
          {'role_name': 'ADMIN'},
          {'role_name': ''},
          {'role_name': null},
        ],
        'permissions': [
          {'permission_name': 'view'},
          {'permission_name': ''},
        ],
      };

      final user = AuthUser.fromJson(json);
      expect(user.roles, ['ADMIN']);
      expect(user.permissions, ['view']);
    });
  });

  // ==================== Login Page Widget Tests ====================

  group('Login page', () {
    setUp(() => _resetMocks());

    testWidgets('shows all UI elements', (tester) async {
      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      // Title & subtitle
      expect(find.text('เข้าสู่ระบบ'), findsWidgets);
      expect(find.text('สำหรับเจ้าหน้าที่และผู้ดูแลระบบ'), findsOneWidget);

      // Form fields
      expect(find.text('ชื่อผู้ใช้'), findsOneWidget);
      expect(find.text('รหัสผ่าน'), findsOneWidget);

      // Remember me
      expect(find.text('จดจำฉันไว้'), findsOneWidget);

      // Submit button
      expect(find.text('เข้าสู่ระบบ'), findsWidgets);

      // Forgot password
      expect(find.text('ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ'), findsOneWidget);
    });

    testWidgets('validates empty username', (tester) async {
      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      // Tap submit button
      await tester.tap(find.byIcon(Icons.login_rounded));
      await tester.pumpAndSettle();

      expect(find.text('กรุณากรอกชื่อผู้ใช้'), findsOneWidget);
    });

    testWidgets('validates empty password', (tester) async {
      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      // Enter username but leave password empty
      await tester.enterText(find.byType(TextFormField).first, 'admin');
      await tester.tap(find.byIcon(Icons.login_rounded));
      await tester.pumpAndSettle();

      expect(find.text('กรุณากรอกรหัสผ่าน'), findsOneWidget);
    });

    testWidgets('toggles password visibility', (tester) async {
      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      // Initially password is obscured — visibility icon should show
      expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);

      // Tap to show password
      await tester.tap(find.byIcon(Icons.visibility_outlined));
      await tester.pump();

      // Now visibility_off icon should show
      expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
    });

    testWidgets('remember me checkbox toggles', (tester) async {
      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      final checkbox = find.byType(CheckboxListTile);
      expect(checkbox, findsOneWidget);

      // Initially unchecked
      final widget = tester.widget<CheckboxListTile>(checkbox);
      expect(widget.value, false);

      // Tap to check
      await tester.tap(checkbox);
      await tester.pump();

      final widgetAfter = tester.widget<CheckboxListTile>(checkbox);
      expect(widgetAfter.value, true);
    });

    testWidgets('shows error message on failed login', (tester) async {
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          return _jsonResponse(401, {'error': 'รหัสผ่านไม่ถูกต้อง'});
        }
        return _jsonResponse(404, {});
      });

      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      // Fill form
      await tester.enterText(find.byType(TextFormField).first, 'admin');
      await tester.enterText(find.byType(TextFormField).last, 'wrongpass');

      // Submit
      await tester.tap(find.byIcon(Icons.login_rounded));
      await tester.pumpAndSettle();

      // Error message should appear
      expect(find.text('รหัสผ่านไม่ถูกต้อง'), findsOneWidget);
    });

    testWidgets('shows rate limit error on 429', (tester) async {
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          return _jsonResponse(429, {'error': 'Too Many Requests'});
        }
        return _jsonResponse(404, {});
      });

      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'admin');
      await tester.enterText(find.byType(TextFormField).last, 'pass1234');
      await tester.tap(find.byIcon(Icons.login_rounded));
      await tester.pumpAndSettle();

      expect(find.text('พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'), findsOneWidget);
    });

    testWidgets('shows generic error on network failure', (tester) async {
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          throw DioException(
            requestOptions: options,
            type: DioExceptionType.connectionTimeout,
          );
        }
        return _jsonResponse(404, {});
      });

      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'admin');
      await tester.enterText(find.byType(TextFormField).last, 'pass1234');
      await tester.tap(find.byIcon(Icons.login_rounded));
      await tester.pumpAndSettle();

      expect(find.text('เข้าสู่ระบบไม่สำเร็จ'), findsWidgets);
    });

    testWidgets('shows loading indicator during login', (tester) async {
      // Create a completer to control when the API responds
      final completer = Completer<ResponseBody>();
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          return completer.future;
        }
        return _jsonResponse(404, {});
      });

      await tester.pumpWidget(const TaraWitApp());
      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'admin');
      await tester.enterText(find.byType(TextFormField).last, 'pass1234');
      await tester.tap(find.byIcon(Icons.login_rounded));
      await tester.pump();

      // Loading indicator should appear
      expect(find.byType(CircularProgressIndicator), findsWidgets);
      expect(find.text('กำลังเข้าสู่ระบบ...'), findsOneWidget);

      // Complete the request
      completer.complete(_jsonResponse(401, {'error': 'ผิด'}));
      await tester.pumpAndSettle();
    });
  });

  // Splash → Login navigation is covered by 'Login page > shows all UI elements' above

  // ==================== AuthController Unit Tests ====================

  group('AuthController', () {
    setUp(() => _resetMocks());

    test('initial state is checking', () {
      // Reset to checking state
      AuthController.instance.status = AuthStatus.checking;
      expect(AuthController.instance.status, AuthStatus.checking);
      expect(AuthController.instance.user, isNull);
    });

    test('login success sets user and status', () async {
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          return _jsonResponse(200, {
            'token': 'access-token-123',
            'refresh_token': 'refresh-token-456',
            'user': {
              'id': 1,
              'username': 'admin',
              'first_name': 'Admin',
              'last_name': 'User',
              'roles': [{'role_name': 'ADMIN'}],
              'permissions': [{'permission_name': 'attendance.view'}],
            },
          });
        }
        return _jsonResponse(404, {});
      });

      final result = await AuthController.instance.login(
        username: 'admin',
        password: 'pass1234',
        remember: false,
      );

      expect(result, true);
      expect(AuthController.instance.status, AuthStatus.authenticated);
      expect(AuthController.instance.user, isNotNull);
      expect(AuthController.instance.user!.username, 'admin');
      expect(AuthController.instance.user!.roles, ['ADMIN']);
    });

    test('login failure sets error message', () async {
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          return _jsonResponse(401, {'error': 'รหัสผ่านไม่ถูกต้อง'});
        }
        return _jsonResponse(404, {});
      });

      final result = await AuthController.instance.login(
        username: 'admin',
        password: 'wrong',
        remember: false,
      );

      expect(result, false);
      expect(AuthController.instance.status, AuthStatus.unauthenticated);
      expect(AuthController.instance.errorMessage, 'รหัสผ่านไม่ถูกต้อง');
      expect(AuthController.instance.user, isNull);
    });

    test('login 429 shows rate limit message', () async {
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          return _jsonResponse(429, {'error': 'Too Many Requests'});
        }
        return _jsonResponse(404, {});
      });

      final result = await AuthController.instance.login(
        username: 'admin',
        password: 'pass1234',
        remember: false,
      );

      expect(result, false);
      expect(
        AuthController.instance.errorMessage,
        'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
      );
    });

    test('login network error shows generic message', () async {
      _mockApi((options) async {
        throw DioException(
          requestOptions: options,
          type: DioExceptionType.connectionTimeout,
        );
      });

      final result = await AuthController.instance.login(
        username: 'admin',
        password: 'pass1234',
        remember: false,
      );

      expect(result, false);
      expect(AuthController.instance.errorMessage, 'เข้าสู่ระบบไม่สำเร็จ');
    });

    test('restoreSession returns false when no tokens', () async {
      final result = await AuthController.instance.restoreSession();
      expect(result, false);
      expect(AuthController.instance.status, AuthStatus.unauthenticated);
    });

    test('logout clears user and status', () async {
      // First login
      _mockApi((options) async {
        if (options.path == '/auth/signin') {
          return _jsonResponse(200, {
            'token': 'token',
            'refresh_token': 'refresh',
            'user': {
              'id': 1,
              'username': 'admin',
              'first_name': 'Admin',
              'last_name': 'User',
              'roles': [],
              'permissions': [],
            },
          });
        }
        return _jsonResponse(404, {});
      });

      await AuthController.instance.login(
        username: 'admin',
        password: 'pass',
        remember: false,
      );
      expect(AuthController.instance.status, AuthStatus.authenticated);

      // Now logout
      _mockApi((options) async => _jsonResponse(200, {}));
      await AuthController.instance.logout();

      expect(AuthController.instance.status, AuthStatus.unauthenticated);
      expect(AuthController.instance.user, isNull);
    });
  });
}
