class AuthUser {
  const AuthUser({
    required this.id,
    required this.username,
    required this.firstName,
    required this.lastName,
    required this.roles,
    required this.permissions,
    this.email,
    this.avatarUrl,
    this.prefixes,
    this.prefixCode,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: (json['id'] as num?)?.toInt() ?? 0,
        username: json['username'] as String? ?? '',
        firstName: json['first_name'] as String? ?? '',
        lastName: json['last_name'] as String? ?? '',
        email: json['email'] as String?,
        avatarUrl: json['avatar_url'] as String?,
        prefixes: json['prefixes'] as String?,
        prefixCode: json['prefix_code'] as String?,
        roles: (json['roles'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map((item) => item['role_name'] as String? ?? '')
            .where((item) => item.isNotEmpty)
            .toList(growable: false),
        permissions: (json['permissions'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map((item) => item['permission_name'] as String? ?? '')
            .where((item) => item.isNotEmpty)
            .toList(growable: false),
      );

  final int id;
  final String username;
  final String firstName;
  final String lastName;
  final String? email;
  final String? avatarUrl;
  final String? prefixes;
  final String? prefixCode;
  final List<String> roles;
  final List<String> permissions;

  String get displayName {
    final prefix = prefixes ?? '';
    final name = '$prefix$firstName $lastName'.trim();
    return name.isEmpty ? username : name;
  }
}
