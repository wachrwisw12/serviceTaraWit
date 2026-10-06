import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../shared/skeleton_loader.dart';
import 'evaluation_models.dart';

class MyTasksPage extends StatefulWidget {
  const MyTasksPage({super.key});

  @override
  State<MyTasksPage> createState() => _MyTasksPageState();
}

class _MyTasksPageState extends State<MyTasksPage> {
  List<MyEvaluationTask> _tasks = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await ApiClient.instance.get<Map<String, dynamic>>(
        '/evaluation/my-tasks',
      );
      final data = response.data?['data'];
      _tasks = (data is List ? data : const [])
          .whereType<Map<String, dynamic>>()
          .map(MyEvaluationTask.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      _errorMessage = _extractError(error, 'โหลดรายการประเมินไม่สำเร็จ');
    } catch (_) {
      _errorMessage = 'โหลดรายการประเมินไม่สำเร็จ';
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final msg = data['message'] ?? data['error'];
      if (msg is String && msg.isNotEmpty) return msg;
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('งานประเมินของฉัน')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            const SizedBox(height: 8),

            // Content
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: ListSkeleton(itemCount: 5),
              )
            else if (_errorMessage != null)
              _ErrorBanner(message: _errorMessage!)
            else if (_tasks.isEmpty)
              const _EmptyState()
            else
              ...List.generate(_tasks.length, (index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _TaskCard(task: _tasks[index]),
                );
              }),
          ],
        ),
      ),
    );
  }
}

// ==================== Task Card ====================

class _TaskCard extends StatelessWidget {
  const _TaskCard({required this.task});
  final MyEvaluationTask task;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final statusInfo = _statusMeta(task.status);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title + status
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.fact_check_outlined,
                    size: 18,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        task.title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ปี ${task.academicYear} · รอบ ${task.round}',
                        style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                _Badge(label: statusInfo.label, color: statusInfo.color),
              ],
            ),

            // Progress
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'ผู้ถูกประเมิน ${task.totalTarget} คน',
                  style: TextStyle(fontSize: 12, color: colorScheme.onSurfaceVariant),
                ),
                Text(
                  '${task.completedTarget}/${task.totalTarget}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: task.totalTarget > 0 ? task.completedTarget / task.totalTarget : 0,
                minHeight: 6,
                backgroundColor: colorScheme.surfaceContainerHighest,
              ),
            ),

            // Remaining
            if (task.remaining > 0 && task.isOpen) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.pending_actions_rounded, size: 14, color: colorScheme.error),
                  const SizedBox(width: 4),
                  Text(
                    'ยังเหลือ ${task.remaining} รายการ',
                    style: TextStyle(fontSize: 12, color: colorScheme.error),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ==================== Helpers ====================

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: Theme.of(context).colorScheme.error),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Center(
          child: Column(
            children: [
              const Icon(Icons.assignment_outlined, size: 48, color: Colors.black26),
              const SizedBox(height: 12),
              const Text('ยังไม่มีรายการประเมินที่ได้รับมอบหมาย', style: TextStyle(color: Colors.black54)),
            ],
          ),
        ),
      ),
    );
  }
}

({String label, Color color}) _statusMeta(String status) => switch (status) {
      'open' => (label: 'กำลังดำเนินการ', color: const Color(0xFFF59E0B)),
      'draft' => (label: 'ฉบับร่าง', color: const Color(0xFF6B7280)),
      'closed' => (label: 'เสร็จสิ้น', color: const Color(0xFF0F8A6A)),
      _ => (label: status, color: const Color(0xFF6B7280)),
    };
