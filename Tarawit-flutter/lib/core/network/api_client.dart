import 'package:dio/dio.dart';

import '../../features/auth/token_storage.dart';
import '../config/app_config.dart';

class ApiClient {
  ApiClient._();

  static final TokenStorage _tokens = TokenStorage.instance;
  static Future<String?>? _refreshingToken;

  static BaseOptions get _options => BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 20),
        sendTimeout: const Duration(seconds: 20),
        responseType: ResponseType.json,
        headers: const {'Accept': 'application/json', 'X-Client-Platform': 'mobile'},
      );

  static final Dio _refreshClient = Dio(_options);
  static final Dio instance = _createClient();

  static Dio _createClient() {
    final dio = Dio(_options);
    dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokens.readAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final request = error.requestOptions;
          final isUnauthorized = error.response?.statusCode == 401;
          final isAuthCall = request.path.contains('/auth/signin') ||
              request.path.contains('/auth/refresh') ||
              request.path.contains('/auth/logout');
          final hasRetried = request.extra['retried'] == true;
          if (!isUnauthorized || isAuthCall || hasRetried) {
            handler.next(error);
            return;
          }

          _refreshingToken ??= _refreshAccessToken().whenComplete(() {
            _refreshingToken = null;
          });
          final token = await _refreshingToken;
          if (token == null) {
            handler.next(error);
            return;
          }

          request.extra['retried'] = true;
          request.headers['Authorization'] = 'Bearer $token';
          try {
            handler.resolve(await dio.fetch<dynamic>(request));
          } on DioException catch (retryError) {
            handler.next(retryError);
          }
        },
      ),
    );
    if (AppConfig.enableNetworkLogs) {
      // ไม่ log headers/body เพื่อไม่ให้ username, password และ token หลุดใน log
      dio.interceptors.add(
        LogInterceptor(
          requestHeader: false,
          requestBody: false,
          responseHeader: false,
          responseBody: false,
        ),
      );
    }
    return dio;
  }

  static Future<String?> _refreshAccessToken() async {
    final refreshToken = await _tokens.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await _tokens.clear();
      return null;
    }
    try {
      final response = await _refreshClient.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );
      final accessToken = response.data?['token'] as String?;
      final rotatedRefreshToken = response.data?['refresh_token'] as String?;
      if (accessToken == null || accessToken.isEmpty) return null;
      await _tokens.updateRotatedTokens(
        accessToken: accessToken,
        refreshToken: rotatedRefreshToken,
      );
      return accessToken;
    } on DioException catch (error) {
      if (error.response?.statusCode != 429) await _tokens.clear();
      return null;
    }
  }
}
