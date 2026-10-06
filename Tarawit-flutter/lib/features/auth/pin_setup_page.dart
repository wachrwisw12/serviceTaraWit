import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/biometric_service.dart';
import '../../shared/app_logo.dart';
import '../../shared/numeric_keypad.dart';

/// หน้าตั้งค่า PIN หลัง login ครั้งแรก
/// แสดงปุ่มตัวเลขกลางจอ ให้ใส่ PIN 6 หลัก
class PinSetupPage extends StatefulWidget {
  const PinSetupPage({super.key});

  @override
  State<PinSetupPage> createState() => _PinSetupPageState();
}

class _PinSetupPageState extends State<PinSetupPage> {
  String _pin = '';
  String? _error;
  bool _isConfirming = false;
  String? _firstPin;

  static const _pinLength = 6;

  void _onKeyPressed(String digit) {
    if (_pin.length >= _pinLength) return;
    setState(() {
      _pin += digit;
      _error = null;
    });

    // Auto-submit when full
    if (_pin.length == _pinLength) {
      Future.delayed(const Duration(milliseconds: 200), _handleComplete);
    }
  }

  void _onDelete() {
    if (_pin.isEmpty) return;
    setState(() {
      _pin = _pin.substring(0, _pin.length - 1);
      _error = null;
    });
  }

  void _handleComplete() {
    if (!_isConfirming) {
      // ครั้งแรก → จำไว้ แล้วให้ยืนยัน
      setState(() {
        _firstPin = _pin;
        _pin = '';
        _isConfirming = true;
      });
    } else {
      // ครั้งที่ 2 → ตรวจว่าตรงกันไหม
      if (_pin == _firstPin) {
        _savePin();
      } else {
        setState(() {
          _error = 'PIN ไม่ตรงกัน กรุณาลองใหม่';
          _pin = '';
          _isConfirming = false;
          _firstPin = null;
        });
      }
    }
  }

  Future<void> _savePin() async {
    final bioService = BiometricService.instance;

    // Save PIN + mark setup complete
    final pin = _pin;
    if (pin.isEmpty) return;
    await bioService.savePin(pin);
    await bioService.setEnabled(true);
    await bioService.markSetupComplete();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ตั้งค่า PIN สำเร็จ'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
      context.go('/dashboard');
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
              _isConfirming ? 'ยืนยัน PIN' : 'ตั้งค่า PIN',
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _isConfirming
                  ? 'กรอก PIN อีกครั้งเพื่อยืนยัน'
                  : 'กรอก PIN 6 หลักเพื่อเข้าสู่ระบบ',
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

            // PIN dots (small)
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
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
