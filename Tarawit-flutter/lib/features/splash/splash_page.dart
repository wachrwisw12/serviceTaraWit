import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/biometric_service.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/app_logo.dart';
import '../auth/auth_controller.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
    _scaleAnimation = Tween<double>(begin: .88, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward();
    _openApp();
  }

  Future<void> _openApp() async {
    final session = AuthController.instance.restoreSession();
    await Future<void>.delayed(const Duration(milliseconds: 1800));
    final authenticated = await session;
    if (!mounted) return;

    if (!authenticated) {
      context.go('/login');
      return;
    }

    // session restored → ตรวจ PIN setup
    final bioService = BiometricService.instance;
    final setupDone = await bioService.isSetupComplete;
    if (!mounted) return;

    if (!setupDone) {
      // ยังไม่เคยตั้งค่า PIN → ไปหน้า PIN setup
      context.go('/pin-setup');
      return;
    }

    // ตั้งค่า PIN แล้ว → ไปหน้าใส่ PIN
    final hasPin = await bioService.hasPin;
    if (!mounted) return;

    if (hasPin) {
      context.go('/pin-entry');
    } else {
      context.go('/dashboard');
    }  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.navy,
      body: SafeArea(
        child: Stack(
          children: [
            const Positioned(
              top: -90,
              right: -70,
              child: _Glow(size: 250, color: Color(0x330F8A6A)),
            ),
            const Positioned(
              bottom: -120,
              left: -90,
              child: _Glow(size: 300, color: Color(0x1FFFFFFF)),
            ),
            Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AppLogo(size: 112),
                      SizedBox(height: 24),
                      Text(
                        'IQAT SYSTEM',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          letterSpacing: .3,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'ระบบบริหารจัดการโรงเรียนท่าแร่วิทยา โรงเรียนท่าแร่วิทยา',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const Positioned(
              left: 0,
              right: 0,
              bottom: 28,
              child: Text(
                'IQAT SYSTEM',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white38,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}
