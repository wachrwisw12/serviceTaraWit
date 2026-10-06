/// System module configuration from API.
///
/// Mirrors the web frontend's `SystemModule` type from
/// `features/setting/api/moduleSettings.ts`.
class SystemModule {
  const SystemModule({
    required this.key,
    required this.name,
    required this.description,
    required this.enabled,
    required this.showOnWeb,
    required this.showOnMobile,
    required this.sortOrder,
    this.maintenanceMessage,
  });

  factory SystemModule.fromJson(Map<String, dynamic> json) => SystemModule(
        key: json['key'] as String? ?? '',
        name: json['name'] as String? ?? '',
        description: json['description'] as String? ?? '',
        enabled: json['enabled'] as bool? ?? false,
        showOnWeb: json['show_on_web'] as bool? ?? false,
        showOnMobile: json['show_on_mobile'] as bool? ?? false,
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
        maintenanceMessage: json['maintenance_message'] as String?,
      );

  final String key;
  final String name;
  final String description;
  final bool enabled;
  final bool showOnWeb;
  final bool showOnMobile;
  final int sortOrder;
  final String? maintenanceMessage;
}
