import 'package:flutter/material.dart';

class ModulePage extends StatelessWidget {
  const ModulePage({required this.moduleId, super.key});

  final String moduleId;

  static const names = {
    'attendance': 'ลงเวลาของฉัน',
    'my-evaluations': 'งานประเมินของฉัน',
    'my-results': 'ผลประเมินของฉัน',
  };

  @override
  Widget build(BuildContext context) {
    final name = names[moduleId] ?? moduleId;
    return Scaffold(
      appBar: AppBar(title: Text(name)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.construction_rounded, size: 56, color: Colors.black38),
            const SizedBox(height: 16),
            Text(name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('พร้อมสำหรับเชื่อมต่อหน้าจอและ API ในขั้นถัดไป', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54)),
          ]),
        ),
      ),
    );
  }
}
