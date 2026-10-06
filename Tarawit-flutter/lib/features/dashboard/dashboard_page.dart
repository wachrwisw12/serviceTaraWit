import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cached_network_image/cached_network_image.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../shared/app_logo.dart';
import '../../shared/skeleton_loader.dart';
import '../auth/auth_controller.dart';
import 'module_models.dart';

/// Module display config — maps API module key to icon, color, route, and required permission.
class _ModuleDisplay {
  const _ModuleDisplay({
    required this.icon,
    required this.color,
    required this.routeName,
    required this.permission,
    this.pathParams,
  });

  final IconData icon;
  final Color color;
  final String routeName;
  final String permission; // permission required to see this module
  final Map<String, String>? pathParams;
}

const _moduleDisplays = <String, _ModuleDisplay>{
  'attendance': _ModuleDisplay(
    icon: Icons.schedule_rounded,
    color: Color(0xFF2563EB),
    routeName: 'attendance',
    permission: 'attendance.view',
  ),
  'evaluation': _ModuleDisplay(
    icon: Icons.fact_check_outlined,
    color: Color(0xFF0F8A6A),
    routeName: 'evaluation',
    permission: 'instance.view',
  ),
  'personnel': _ModuleDisplay(
    icon: Icons.badge_outlined,
    color: Color(0xFF8B5CF6),
    routeName: 'module',
    permission: 'personnel.view',
    pathParams: {'moduleId': 'personnel'},
  ),
  'users': _ModuleDisplay(
    icon: Icons.group_outlined,
    color: Color(0xFFF97316),
    routeName: 'module',
    permission: 'user.view',
    pathParams: {'moduleId': 'users'},
  ),
  'reports': _ModuleDisplay(
    icon: Icons.bar_chart_outlined,
    color: Color(0xFF06B6D4),
    routeName: 'module',
    permission: 'report.view',
    pathParams: {'moduleId': 'reports'},
  ),
  'settings': _ModuleDisplay(
    icon: Icons.settings_outlined,
    color: Color(0xFF64748B),
    routeName: 'module',
    permission: 'setting.manage',
    pathParams: {'moduleId': 'settings'},
  ),
  'iqa': _ModuleDisplay(
    icon: Icons.verified_outlined,
    color: Color(0xFF10B981),
    routeName: 'module',
    permission: 'instance.view',
    pathParams: {'moduleId': 'iqa'},
  ),
};

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late final Future<List<SystemModule>> _enabledModules = _loadEnabledModules();

  Future<List<SystemModule>> _loadEnabledModules() async {
    final response = await ApiClient.instance.get<List<dynamic>>(
      '/modules/my',
      queryParameters: {'channel': 'mobile'},
    );
    final modules = (response.data ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(SystemModule.fromJson)
        .where((m) => m.enabled && m.showOnMobile)
        .toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    return modules;
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthController.instance.user;
    final now = DateTime.now();
    final weekdays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    final months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    final todayText = '${weekdays[now.weekday % 7]}ที่ ${now.day} ${months[now.month - 1]} ${now.year + 543}';

    return Scaffold(
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: _UserAvatar(user: user),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('IQAT SYSTEM', style: TextStyle(fontWeight: FontWeight.bold)),
            Text(todayText, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal, color: Colors.black54)),
          ],
        ),
        actions: [
          IconButton(onPressed: () {}, tooltip: 'การแจ้งเตือน', icon: const Icon(Icons.notifications_outlined)),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ===== Welcome Card =====
          Card(
            color: const Color(0xFF102A43),
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('โต๊ะทำงานของฉัน', style: TextStyle(color: Color(0xFF8CE0C7), fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(
                    'สวัสดี, ${user?.displayName ?? 'ผู้ใช้งาน'}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  const Text('งานและข้อมูลส่วนตัวของคุณอยู่ที่นี่', style: TextStyle(color: Colors.white70)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ===== Modules from API =====
          Text('งานของฉัน', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          FutureBuilder<List<SystemModule>>(
            future: _enabledModules,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const DashboardSkeleton();
              }

              final modules = snapshot.data;

              if (modules == null) {
                // API failed — show all modules as fallback (still check permissions)
                return _ModuleGrid(modules: _filterByPermission(_allFallbackModules()));
              }

              if (modules.isEmpty) {
                return const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: Text('ยังไม่มีส่วนงานที่เปิดให้ใช้งาน')),
                  ),
                );
              }

              return _ModuleGrid(modules: _filterByPermission(modules));
            },
          ),
        ],
      ),
    );
  }

  /// Fallback when API fails — show all modules (same as web fallback behavior).
  static List<SystemModule> _allFallbackModules() => _moduleDisplays.keys
      .map((key) => SystemModule(
            key: key,
            name: key,
            description: '',
            enabled: true,
            showOnWeb: true,
            showOnMobile: true,
            sortOrder: 0,
          ))
      .toList();

  /// Filter modules by user permissions.
  static List<SystemModule> _filterByPermission(List<SystemModule> modules) {
    final userPermissions = AuthController.instance.user?.permissions.toSet() ?? {};
    return modules.where((m) {
      final display = _moduleDisplays[m.key];
      if (display == null) return true; // unknown module → show
      return userPermissions.contains(display.permission);
    }).toList();
  }
}

class _ModuleGrid extends StatelessWidget {
  const _ModuleGrid({required this.modules});

  final List<SystemModule> modules;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 240,
        mainAxisExtent: 160,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: modules.length,
      itemBuilder: (context, index) {
        final module = modules[index];
        final display = _moduleDisplays[module.key];
        final icon = display?.icon ?? Icons.extension_outlined;
        final color = display?.color ?? Colors.grey;

        return Card(
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              if (display == null) return;
              context.goNamed(display.routeName, pathParameters: display.pathParams ?? {});
            },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    backgroundColor: color.withValues(alpha: .12),
                    child: Icon(icon, color: color),
                  ),
                  const Spacer(),
                  Text(
                    module.name.isNotEmpty ? module.name : module.key,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  if (module.description.isNotEmpty)
                    Text(
                      module.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// ─── User Avatar Widget ────────────────────────────────

class _UserAvatar extends StatelessWidget {
  const _UserAvatar({required this.user});
  final dynamic user; // AuthUser?

  @override
  Widget build(BuildContext context) {
    final avatarUrl = user?.avatarUrl;
    final hasAvatar = avatarUrl != null && avatarUrl.isNotEmpty;
    final cs = Theme.of(context).colorScheme;

    if (!hasAvatar) {
      return AppLogo(size: 40);
    }

    // Build full URL from AppConfig
    final baseUrl = AppConfig.apiBaseUrl.replaceAll('/api', '');
    final fullUrl = avatarUrl.startsWith('http')
        ? avatarUrl
        : '$baseUrl$avatarUrl';

    return CircleAvatar(
      radius: 20,
      backgroundColor: cs.primaryContainer,
      backgroundImage: CachedNetworkImageProvider(fullUrl),
      onBackgroundImageError: (_, __) {},
      child: hasAvatar
          ? null
          : Icon(Icons.person, color: cs.onPrimaryContainer),
    );
  }
}
