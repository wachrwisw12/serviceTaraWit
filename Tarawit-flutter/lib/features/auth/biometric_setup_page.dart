import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/biometric_service.dart';
import '../../shared/app_logo.dart';

/// หน้าตั้งค่า Face ID / PIN หลัง login ครั้งแรก
class BiometricSetupPage extends StatefulWidget {
  const BiometricSetupPage({super.key});

  @override
  State<BiometricSetupPage> createState() => _BiometricSetupPageState();
}

class _BiometricSetupPageState extends State<BiometricSetupPage> {
  bool _isSettingUp = false;
  String? _errorMessage;
  bool _biometricAvailable = false;
  String _biometricLabel = '';

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final bioService = BiometricService.instance;
    final available = await bioService.isAvailable;
    final label = await bioService.biometricLabel;
    if (mounted) {
      setState(() {
        _biometricAvailable = available;
        _biometricLabel = label;
      });
    }
  }

  Future<void> _setupBiometric() async {
    setState(() {
      _isSettingUp = true;
      _errorMessage = null;
    });

    final bioService = BiometricService.instance;
    final success = await bioService.authenticate(
      reason: 'กรุณาสแกนหน้าหรือลายนิ้วมือเพื่อตั้งค่า',
    );

    if (!mounted) return;

    if (success) {
      await bioService.setEnabled(true);
      await bioService.markSetupComplete();
      if (mounted) context.go('/dashboard');
    } else {
      setState(() {
        _isSettingUp = false;
        _errorMessage = 'การตั้งค่าไม่สำเร็จ กรุณาลองใหม่';
      });
    }
  }

  Future<void> _skipSetup() async {
    final bioService = BiometricService.instance;
    await bioService.setEnabled(false);
    await bioService.markSetupComplete();
    if (mounted) context.go('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppLogo(size: 80),
                const SizedBox(height: 32),
                Icon(
                  _biometricAvailable
                      ? Icons.face_rounded
                      : Icons.lock_rounded,
                  size: 64,
                  color: colorScheme.primary,
                ),
                const SizedBox(height: 24),
                Text(
                  'ตั้งค่าความปลอดภัย',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _biometricAvailable
                      ? 'ตั้งค่า $_biometricLabel เพื่อเข้าสู่ระบบได้สะดวกและปลอดภัยยิ่งขึ้น'
                      : 'ตั้งค่า PIN เพื่อเข้าสู่ระบบได้สะดวกและปลอดภัยยิ่งขึ้น',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 40),

                // Setup button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _isSettingUp ? null : _setupBiometric,
                    icon: _isSettingUp
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Icon(
                            _biometricAvailable
                                ? Icons.face_rounded
                                : Icons.pin_rounded,
                          ),
                    label: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: Text(
                        _isSettingUp
                            ? 'กำลังตั้งค่า...'
                            : _biometricAvailable
                                ? 'ตั้งค่า $_biometricLabel'
                                : 'ตั้งค่า PIN',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Error message
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: colorScheme.error),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(color: colorScheme.onErrorContainer),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // PIN setup button
                if (_biometricAvailable) ...[
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _isSettingUp ? null : () => context.go('/pin-setup'),
                    child: Text(
                      'ตั้งค่า PIN แทน',
                      style: TextStyle(color: colorScheme.onSurfaceVariant),
                    ),
                  ),
                ],

                // Skip button
                TextButton(
                  onPressed: _isSettingUp ? null : _skipSetup,
                  child: Text(
                    'ข้ามไปก่อน',
                    style: TextStyle(color: colorScheme.onSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
