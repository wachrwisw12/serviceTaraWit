import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/biometric_service.dart';
import '../../shared/app_logo.dart';
import '../../shared/numeric_keypad.dart';
import 'auth_controller.dart';

/// หน้าใส่ PIN เพื่อเข้าสู่ระบบ (ใช้หลัง set PIN แล้ว)
class PinEntryPage extends StatefulWidget {
  const PinEntryPage({super.key});

  @override
  State<PinEntryPage> createState() => _PinEntryPageState();
}

class _PinEntryPageState extends State<PinEntryPage> {
  String _pin = '';
  String? _error;
  int _attempts = 0;
  static const _pinLength = 6;
  static const _maxAttempts = 5;

  void _onKeyPressed(String digit) {
    if (_pin.length >= _pinLength) return;
    if (_error != null) return; // lock after error
    setState(() {
      _pin += digit;
      _error = null;
    });

    // Auto-verify when full
    if (_pin.length == _pinLength) {
      Future.delayed(const Duration(milliseconds: 200), _verifyPin);
    }
  }

  void _onDelete() {
    if (_pin.isEmpty || _error != null) return;
    setState(() {
      _pin = _pin.substring(0, _pin.length - 1);
      _error = null;
    });
  }

  Future<void> _verifyPin() async {
    final bioService = BiometricService.instance;
    final correct = await bioService.verifyPin(_pin);

    if (!mounted) return;

    if (correct) {
      // PIN ถูก → เข้า Dashboard
      context.go('/dashboard');
    } else {
      _attempts++;
      setState(() {
        _error = 'PIN ไม่ถูกต้อง ($_attempts/$_maxAttempts)';
        _pin = '';
      });

      if (_attempts >= _maxAttempts) {
        // ลองผิดเกิน 5 ครั้ง → ไปหน้า login
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('ลองผิดเกิน 5 ครั้ง กรุณาเข้าสู่ระบบใหม่'),
              backgroundColor: Color(0xFFEF4444),
            ),
          );
          await AuthController.instance.logout();
          if (mounted) context.go('/login');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 40),

            // Logo
            const AppLogo(size: 64),
            const SizedBox(height: 24),

            // Title
            Text(
              'ใส่ PIN เพื่อเข้าสู่ระบบ',
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'กรอก PIN 6 หลักที่ตั้งไว้',
              style: theme.textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
            ),
            const SizedBox(height: 32),

            // PIN display
            PinDisplayText(
              pin: _pin,
              length: _pinLength,
              error: _error != null,
            ),

            // Error message
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: TextStyle(color: cs.error, fontSize: 14),
              ),
            ],
            const SizedBox(height: 8),

            // PIN dots
            PinDisplay(
              length: _pinLength,
              filledLength: _pin.length,
              error: _error != null,
            ),

            const Spacer(),

            // Numeric keypad
            NumericKeypad(
              onKeyPressed: _onKeyPressed,
              onDelete: _onDelete,
            ),

            // Logout button
            Padding(
              padding: const EdgeInsets.only(bottom: 24, top: 8),
              child: TextButton(
                onPressed: () async {
                  await AuthController.instance.logout();
                  if (context.mounted) context.go('/login');
                },
                child: Text(
                  'เข้าสู่ระบบด้วยบัญชีอื่น',
                  style: TextStyle(color: cs.onSurfaceVariant),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
