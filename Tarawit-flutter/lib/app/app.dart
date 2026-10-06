import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import 'router.dart';

class TaraWitApp extends StatelessWidget {
  const TaraWitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'IQAT SYSTEM',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: appRouter,
    );
  }
}

