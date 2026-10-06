abstract final class AppConfig {
  static const environment = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'dev',
  );

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://folio-me.com/api',
  );

  static const enableNetworkLogs = bool.fromEnvironment(
    'ENABLE_NETWORK_LOGS',
    defaultValue: true,
  );

  static bool get isProduction => environment == 'prod';
}
