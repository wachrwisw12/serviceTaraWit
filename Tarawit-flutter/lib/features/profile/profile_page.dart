import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/services/biometric_service.dart';
import '../../shared/skeleton_loader.dart';
import '../auth/auth_controller.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _uploading = false;
  bool _changingPassword = false;
  bool _biometricEnabled = false;
  bool _biometricAvailable = false;
  String _biometricLabel = 'PIN / รหัสผ่าน';

  // Change password form
  final _passwordFormKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;

  @override
  void initState() {
    super.initState();
    _loadBiometricState();
  }

  Future<void> _loadBiometricState() async {
    final bioService = BiometricService.instance;
    final available = await bioService.isAvailable;
    final enabled = await bioService.isEnabled;
    final label = await bioService.biometricLabel;
    if (mounted) {
      setState(() {
        _biometricAvailable = available;
        _biometricEnabled = enabled;
        _biometricLabel = label;
      });
    }
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  // ---------- Avatar Upload ----------
  Future<void> _pickAndUploadAvatar() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );
    if (image == null) return;

    setState(() => _uploading = true);
    try {
      final file = File(image.path);
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: image.name,
        ),
      });
      await ApiClient.instance.post('/user/profile/avatar', data: formData);

      // Refresh user data so avatar_url updates
      await AuthController.instance.restoreSession();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('อัปเดตรูปโปรไฟล์สำเร็จ'),
            backgroundColor: Color(0xFF0F8A6A),
          ),
        );
      }
    } on DioException catch (error) {
      if (mounted) {
        final message = _extractError(error, 'อัปโหลดรูปไม่สำเร็จ');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('อัปโหลดรูปไม่สำเร็จ'), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  // ---------- Change Password ----------
  Future<void> _changePassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;

    final current = _currentPasswordController.text;
    final newPass = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;

    // Client-side validation (same as web)
    if (newPass.length < 8) {
      _showError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (newPass != confirm) {
      _showError('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPass == current) {
      _showError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม');
      return;
    }

    setState(() => _changingPassword = true);
    try {
      await ApiClient.instance.put('/user/change-password', data: {
        'current_password': current,
        'new_password': newPass,
      });

      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('เปลี่ยนรหัสผ่านสำเร็จ'),
            backgroundColor: Color(0xFF0F8A6A),
          ),
        );
      }
    } on DioException catch (error) {
      if (mounted) {
        final message = _extractError(error, 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
        _showError(message);
      }
    } catch (_) {
      if (mounted) _showError('เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      if (mounted) setState(() => _changingPassword = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Theme.of(context).colorScheme.error),
    );
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final msg = data['message'] ?? data['error'];
      if (msg is String && msg.isNotEmpty) return msg;
    }
    return fallback;
  }

  // ---------- Build ----------
  @override
  Widget build(BuildContext context) {
    final auth = AuthController.instance;
    final user = auth.user;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (user == null) {
      return const Scaffold(body: ProfileSkeleton());
    }

    final avatarUrl = user.avatarUrl;
    final hasAvatar = avatarUrl != null && avatarUrl.isNotEmpty;
    final fullName = [user.firstName, user.lastName].where((s) => s.isNotEmpty).join(' ');

    return Scaffold(
      appBar: AppBar(title: const Text('โปรไฟล์')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          // ===== Header =====
          Text(
            'โปรไฟล์ของฉัน',
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'ข้อมูลส่วนตัวและรูปโปรไฟล์ที่แสดงในระบบ',
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 20),

          // ===== Avatar Card =====
          Card(
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: colorScheme.primaryContainer,
                        backgroundImage: hasAvatar ? NetworkImage(avatarUrl) : null,
                        child: hasAvatar
                            ? null
                            : Text(
                                (user.firstName.isNotEmpty ? user.firstName[0] : user.username[0]).toUpperCase(),
                                style: TextStyle(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: colorScheme.onPrimaryContainer,
                                ),
                              ),
                      ),
                      Positioned(
                        right: -2,
                        bottom: -2,
                        child: IconButton.filled(
                          onPressed: _uploading ? null : _pickAndUploadAvatar,
                          style: IconButton.styleFrom(
                            backgroundColor: colorScheme.primary,
                            foregroundColor: colorScheme.onPrimary,
                            minimumSize: const Size(36, 36),
                            padding: EdgeInsets.zero,
                          ),
                          icon: _uploading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.camera_alt_rounded, size: 18),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          fullName.isNotEmpty ? fullName : 'ไม่ระบุชื่อ',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '@${user.username}',
                          style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                        if (_uploading) ...[
                          const SizedBox(height: 6),
                          Text(
                            'กำลังอัปโหลดรูป...',
                            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.primary),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ===== Personal Info Card =====
          Card(
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                  child: Text(
                    'ข้อมูลส่วนตัว',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                _InfoRow(
                  icon: Icons.person_outline_rounded,
                  label: 'ชื่อ-นามสกุล',
                  value: fullName.isNotEmpty ? fullName : '—',
                ),
                _InfoRow(
                  icon: Icons.account_circle_outlined,
                  label: 'ชื่อผู้ใช้',
                  value: user.username,
                ),
                _InfoRow(
                  icon: Icons.email_outlined,
                  label: 'อีเมล',
                  value: user.email ?? '—',
                ),
                _InfoRow(
                  icon: Icons.shield_outlined,
                  label: 'บทบาท',
                  value: user.roles.isNotEmpty ? null : '—',
                  trailing: user.roles.isNotEmpty
                      ? Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: user.roles
                              .map((r) => Chip(
                                    label: Text(r, style: const TextStyle(fontSize: 12)),
                                    visualDensity: VisualDensity.compact,
                                    padding: EdgeInsets.zero,
                                    labelPadding: const EdgeInsets.symmetric(horizontal: 8),
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ))
                              .toList(),
                        )
                      : null,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ===== Security Card (Biometric) =====
          if (_biometricAvailable)
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                    child: Row(
                      children: [
                        Icon(Icons.fingerprint_rounded, size: 20, color: colorScheme.onSurfaceVariant),
                        const SizedBox(width: 8),
                        Text(
                          'ความปลอดภัย',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  SwitchListTile(
                    title: Text('ล็อกอัตโนมัติด้วย$_biometricLabel'),
                    subtitle: Text(
                      _biometricEnabled
                          ? 'เมื่อเปิดแอปจะต้องยืนยันตัวตนด้วย$_biometricLabel'
                          : 'ปิดอยู่ — เปิดเพื่อความปลอดภัย',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    value: _biometricEnabled,
                    secondary: Icon(
                      _biometricEnabled ? Icons.lock_rounded : Icons.lock_open_rounded,
                      color: _biometricEnabled ? colorScheme.primary : colorScheme.onSurfaceVariant,
                    ),
                    onChanged: (value) async {
                      final bioService = BiometricService.instance;
                      if (value) {
                        // เปิด → ต้องยืนยันตัวตนก่อน
                        final success = await bioService.authenticate(
                          reason: 'กรุณายืนยันตัวตนเพื่อเปิดใช้งาน$_biometricLabel',
                        );
                        if (!success) return;
                      }
                      await bioService.setEnabled(value);
                      if (mounted) setState(() => _biometricEnabled = value);
                    },
                  ),
                ],
              ),
            ),
          if (_biometricAvailable) const SizedBox(height: 16),

          // ===== Change Password Card =====
          Card(
            clipBehavior: Clip.antiAlias,
            child: Form(
              key: _passwordFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                    child: Row(
                      children: [
                        Icon(Icons.key_rounded, size: 20, color: colorScheme.onSurfaceVariant),
                        const SizedBox(width: 8),
                        Text(
                          'เปลี่ยนรหัสผ่าน',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
                    child: TextFormField(
                      controller: _currentPasswordController,
                      obscureText: !_showCurrentPassword,
                      decoration: InputDecoration(
                        labelText: 'รหัสผ่านเดิม',
                        prefixIcon: const Icon(Icons.lock_outline, size: 20),
                        suffixIcon: IconButton(
                          icon: Icon(_showCurrentPassword ? Icons.visibility_off : Icons.visibility, size: 20),
                          onPressed: () => setState(() => _showCurrentPassword = !_showCurrentPassword),
                        ),
                      ),
                      validator: (v) => v == null || v.isEmpty ? 'กรุณากรอกรหัสผ่านเดิม' : null,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
                    child: TextFormField(
                      controller: _newPasswordController,
                      obscureText: !_showNewPassword,
                      decoration: InputDecoration(
                        labelText: 'รหัสผ่านใหม่',
                        helperText: 'อย่างน้อย 8 ตัวอักษร',
                        prefixIcon: const Icon(Icons.lock_outline, size: 20),
                        suffixIcon: IconButton(
                          icon: Icon(_showNewPassword ? Icons.visibility_off : Icons.visibility, size: 20),
                          onPressed: () => setState(() => _showNewPassword = !_showNewPassword),
                        ),
                      ),
                      validator: (v) => v == null || v.isEmpty ? 'กรุณากรอกรหัสผ่านใหม่' : null,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                    child: TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: !_showConfirmPassword,
                      decoration: InputDecoration(
                        labelText: 'ยืนยันรหัสผ่านใหม่',
                        prefixIcon: const Icon(Icons.lock_outline, size: 20),
                        suffixIcon: IconButton(
                          icon: Icon(_showConfirmPassword ? Icons.visibility_off : Icons.visibility, size: 20),
                          onPressed: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
                        ),
                      ),
                      validator: (v) => v == null || v.isEmpty ? 'กรุณายืนยันรหัสผ่านใหม่' : null,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: _changingPassword
                              ? null
                              : () {
                                  _currentPasswordController.clear();
                                  _newPasswordController.clear();
                                  _confirmPasswordController.clear();
                                },
                          child: const Text('ล้างข้อมูล'),
                        ),
                        const SizedBox(width: 8),
                        FilledButton.icon(
                          onPressed: _changingPassword ? null : _changePassword,
                          icon: _changingPassword
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.save_rounded, size: 18),
                          label: Text(_changingPassword ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ===== Logout =====
          Card(
            clipBehavior: Clip.antiAlias,
            child: ListTile(
              leading: const Icon(Icons.logout_rounded, color: Colors.red),
              title: const Text('ออกจากระบบ', style: TextStyle(color: Colors.red)),
              onTap: () async {
                await auth.logout();
                if (context.mounted) context.go('/login');
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final String? value;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(width: 14),
          SizedBox(
            width: 80,
            child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: trailing ??
                Text(
                  value ?? '—',
                  style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                ),
          ),
        ],
      ),
    );
  }
}
