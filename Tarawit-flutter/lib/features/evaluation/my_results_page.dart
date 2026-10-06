import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../shared/skeleton_loader.dart';
import 'evaluation_models.dart';

/// ผลประเมินของฉัน — เน้นดูผลเร็ว ไม่ต้องกรองเยอะ
class MyResultsPage extends StatefulWidget {
  const MyResultsPage({super.key});

  @override
  State<MyResultsPage> createState() => _MyResultsPageState();
}

class _MyResultsPageState extends State<MyResultsPage> {
  bool _isLoading = true;
  String? _errorMessage;
  List<MyEvaluationAssignment> _results = [];

  @override
  void initState() {
    super.initState();
    _loadResults();
  }

  Future<void> _loadResults() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      final response = await ApiClient.instance.get<List<dynamic>>(
        '/evaluation/instances/get-my-instance',
      );
      final all = (response.data ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MyEvaluationAssignment.fromJson)
          .where((item) => item.isTarget)
          .toList()
        ..sort((a, b) {
          if (a.isClosed && !b.isClosed) return 1;
          if (!a.isClosed && b.isClosed) return -1;
          return (b.updatedAt ?? '').compareTo(a.updatedAt ?? '');
        });
      if (mounted) setState(() => _results = all);
    } on DioException {
      if (mounted) setState(() => _errorMessage = 'ไม่สามารถโหลดข้อมูลได้');
    } catch (_) {
      if (mounted) setState(() => _errorMessage = 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('ผลประเมินของฉัน')),
      body: _isLoading
          ? const ListSkeleton(itemCount: 5)
          : _errorMessage != null
              ? _ErrorState(message: _errorMessage!, onRetry: _loadResults)
              : RefreshIndicator(
                  onRefresh: _loadResults,
                  child: _results.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.inbox_outlined, size: 56, color: theme.colorScheme.outline),
                              const SizedBox(height: 12),
                              Text('ยังไม่มีผลประเมิน', style: theme.textTheme.bodyMedium),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          itemCount: _results.length,
                          itemBuilder: (context, index) {
                            final item = _results[index];
                            return _ResultTile(item: item);
                          },
                        ),
                ),
    );
  }
}

// ─── Result Tile ──────────────────────────────────────

class _ResultTile extends StatelessWidget {
  const _ResultTile({required this.item});

  final MyEvaluationAssignment item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    Color statusColor;
    String statusLabel;
    switch (item.status) {
      case 'OPEN':
        statusColor = const Color(0xFFF59E0B);
        statusLabel = 'กำลังดำเนินการ';
        break;
      case 'DRAFT':
        statusColor = Colors.grey;
        statusLabel = 'ฉบับร่าง';
        break;
      case 'CLOSED':
        statusColor = const Color(0xFF10B981);
        statusLabel = 'เสร็จสิ้น';
        break;
      default:
        statusColor = Colors.grey;
        statusLabel = item.status;
    }

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          context.pushNamed('my-result-detail', pathParameters: {'id': item.id.toString()});
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  item.isClosed ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
                  color: statusColor,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.templateName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(statusLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'ปี ${item.academicYear} รอบ ${item.round}',
                          style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: cs.outline),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded, size: 48, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh_rounded, size: 18), label: const Text('ลองใหม่')),
          ],
        ),
      ),
    );
  }
}
