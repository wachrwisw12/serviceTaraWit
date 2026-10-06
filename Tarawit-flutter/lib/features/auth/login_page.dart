import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/biometric_service.dart';
import '../../shared/app_logo.dart';
import 'auth_controller.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _remember = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await AuthController.instance.login(
      username: _usernameController.text,
      password: _passwordController.text,
      remember: _remember,
    );
    if (!success || !mounted) return;

    // login สำเร็จ → ต้อง set PIN ก่อน
    final setupDone = await BiometricService.instance.isSetupComplete;
    if (!mounted) return;
    context.go(setupDone ? '/dashboard' : '/pin-setup');
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = AuthController.instance;
    return AnimatedBuilder(
      animation: auth,
      builder: (context, _) => Scaffold(
        body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: AppLogo(size: 76)),
                    const SizedBox(height: 24),
                    Text('เข้าสู่ระบบ', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    const Text('สำหรับเจ้าหน้าที่และผู้ดูแลระบบ', style: TextStyle(color: Colors.black54, fontSize: 13)),
                    const SizedBox(height: 32),
                    TextFormField(
                      controller: _usernameController,
                      enabled: !auth.isLoading,
                      decoration: const InputDecoration(labelText: 'ชื่อผู้ใช้', prefixIcon: Icon(Icons.person_outline)),
                      textInputAction: TextInputAction.next,
                      validator: (value) => value == null || value.trim().isEmpty ? 'กรุณากรอกชื่อผู้ใช้' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      enabled: !auth.isLoading,
                      obscureText: _obscurePassword,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'รหัสผ่าน',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        ),
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'กรุณากรอกรหัสผ่าน' : null,
                    ),
                    CheckboxListTile(
                      value: _remember,
                      onChanged: auth.isLoading ? null : (value) => setState(() => _remember = value ?? false),
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      title: const Text('จดจำฉันไว้', style: TextStyle(fontSize: 14)),
                    ),
                    if (auth.errorMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Theme.of(context).colorScheme.errorContainer, borderRadius: BorderRadius.circular(10)),
                        child: Row(children: [
                          Icon(Icons.error_outline, color: Theme.of(context).colorScheme.error),
                          const SizedBox(width: 10),
                          Expanded(child: Text(auth.errorMessage!, style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer))),
                        ]),
                      ),
                      const SizedBox(height: 16),
                    ],
                    FilledButton.icon(
                      onPressed: auth.isLoading ? null : _submit,
                      icon: auth.isLoading
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.login_rounded),
                      label: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Text(auth.isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.black38, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        ),
      ),
    );
  }
}
