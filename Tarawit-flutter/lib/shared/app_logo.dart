import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({this.size = 64, super.key});

  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: Image.asset(
        'assets/images/logo_tara.webp',
        width: size,
        height: size,
        fit: BoxFit.cover,
        semanticLabel: 'ตราโรงเรียนท่าแร่วิทยา',
      ),
    );
  }
}
