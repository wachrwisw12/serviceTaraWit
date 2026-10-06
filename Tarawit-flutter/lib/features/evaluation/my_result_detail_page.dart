import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../shared/skeleton_loader.dart';
import 'evaluation_detail_models.dart';

/// รายละเอียดผลประเมิน — เน้นดูคะแนน ไม่ต้องตารางเทียบ
class MyResultDetailPage extends StatefulWidget {
  const MyResultDetailPage({super.key, required this.instanceId});
  final int instanceId;

  @override
  State<MyResultDetailPage> createState() => _MyResultDetailPageState();
}

class _MyResultDetailPageState extends State<MyResultDetailPage> {
  bool _isLoading = true;
  String? _errorMessage;
  EvaluationDetail? _detail;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      final response = await ApiClient.instance.get<Map<String, dynamic>>(
        '/evaluation/instances/get-my-instanceByid/${widget.instanceId}',
      );
      if (mounted) setState(() => _detail = EvaluationDetail.fromJson(response.data ?? {}));
    } on DioException {
      if (mounted) setState(() => _errorMessage = 'ไม่สามารถโหลดรายละเอียดได้');
    } catch (_) {
      if (mounted) setState(() => _errorMessage = 'ไม่สามารถโหลดรายละเอียดได้');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// คำนวณคะแนนเฉลี่ยรวม
  double? get _averageScore {
    final all = <double>[];
    for (final q in _detail?.questions ?? []) {
      for (final es in q.evaluatorScores) {
        all.add(es.score);
      }
    }
    if (all.isEmpty) return null;
    return all.reduce((a, b) => a + b) / all.length;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(_detail?.templateName ?? 'ผลประเมิน')),
      body: _isLoading
          ? const ListSkeleton(itemCount: 4)
          : _errorMessage != null
              ? _ErrorState(message: _errorMessage!, onRetry: _loadDetail)
              : _detail == null
                  ? const Center(child: Text('ไม่พบข้อมูล'))
                  : _buildBody(theme),
    );
  }

  Widget _buildBody(ThemeData theme) {
    final detail = _detail!;
    final cs = theme.colorScheme;

    // Status color
    Color statusColor;
    String statusLabel;
    switch (detail.status) {
      case 'OPEN':
        statusColor = const Color(0xFFF59E0B);
        statusLabel = 'กำลังดำเนินการ';
        break;
      case 'CLOSED':
        statusColor = const Color(0xFF10B981);
        statusLabel = 'เสร็จสิ้น';
        break;
      default:
        statusColor = Colors.grey;
        statusLabel = detail.status;
    }

    return RefreshIndicator(
      onRefresh: _loadDetail,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ===== สรุป =====
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Score circle
                  SizedBox(
                    width: 80,
                    height: 80,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        CircularProgressIndicator(
                          value: 1,
                          strokeWidth: 8,
                          color: cs.outlineVariant,
                        ),
                        CircularProgressIndicator(
                          value: _averageScore != null ? (_averageScore! / 5).clamp(0.0, 1.0) : 0,
                          strokeWidth: 8,
                          strokeCap: StrokeCap.round,
                          color: _scoreColor(_averageScore ?? 0),
                        ),
                        Text(
                          _averageScore != null ? _averageScore!.toStringAsFixed(1) : '-',
                          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('คะแนนเฉลี่ย', style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                  const SizedBox(height: 16),
                  // Tags
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _Tag(label: statusLabel, color: statusColor),
                      const SizedBox(width: 8),
                      _Tag(label: 'ปี ${detail.academicYear}', color: cs.primary),
                      const SizedBox(width: 8),
                      _Tag(label: 'รอบ ${detail.round}', color: cs.primary),
                    ],
                  ),
                  if (detail.target != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      detail.target!.name,
                      style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                    ),
                    if (detail.target!.position != null)
                      Text(detail.target!.position!, style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant)),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ===== คะแนนรายข้อ =====
          Text('คะแนนรายข้อ', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          // Group by sections if available
          if (detail.sections.isNotEmpty)
            for (final section in detail.sections) ...[
              if (section.name.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.only(left: 4, top: 8, bottom: 4),
                  child: Text(section.name, style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                ),
              ],
              for (final q in section.questions)
                _QuestionTile(question: q),
            ]
          else
            for (final q in detail.questions)
              _QuestionTile(question: q),

          const SizedBox(height: 16),

          // ===== ผู้ประเมิน =====
          if (detail.evaluators.isNotEmpty) ...[
            Text('ผู้นิเทศ', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: detail.evaluators.map((e) => ListTile(
                  dense: true,
                  leading: CircleAvatar(
                    radius: 16,
                    child: Text(e.nameSnapshot.isNotEmpty ? e.nameSnapshot[0] : '?', style: const TextStyle(fontSize: 12)),
                  ),
                  title: Text(e.nameSnapshot, style: const TextStyle(fontSize: 13)),
                  subtitle: e.positionSnapshot != null ? Text(e.positionSnapshot!, style: const TextStyle(fontSize: 11)) : null,
                )).toList(),
              ),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Color _scoreColor(double s) {
    if (s >= 4.0) return const Color(0xFF10B981);
    if (s >= 3.0) return const Color(0xFFF59E0B);
    if (s >= 2.0) return const Color(0xFFF97316);
    return const Color(0xFFEF4444);
  }
}

// ─── Question Tile ────────────────────────────────────

class _QuestionTile extends StatelessWidget {
  const _QuestionTile({required this.question});
  final InstanceQuestion question;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final maxScore = question.maxScore ?? 5;
    final avg = question.averageScore;

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(question.questionText, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: avg != null ? (avg / maxScore).clamp(0.0, 1.0) : 0,
                      minHeight: 8,
                      backgroundColor: cs.outlineVariant,
                      valueColor: AlwaysStoppedAnimation(avg != null ? _barColor(avg) : cs.outline),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  avg != null ? '${avg.toStringAsFixed(1)}/$maxScore' : '-/$maxScore',
                  style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            // Show individual evaluator scores if more than 1
            if (question.evaluatorScores.length > 1) ...[
              const SizedBox(height: 6),
              Wrap(
                spacing: 12,
                children: question.evaluatorScores.map((es) => Text(
                  '${es.evaluatorName}: ${es.score.toStringAsFixed(1)}',
                  style: theme.textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant, fontSize: 11),
                )).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _barColor(double s) {
    if (s >= 4.0) return const Color(0xFF10B981);
    if (s >= 3.0) return const Color(0xFFF59E0B);
    if (s >= 2.0) return const Color(0xFFF97316);
    return const Color(0xFFEF4444);
  }
}

// ─── Tag ──────────────────────────────────────────────

class _Tag extends StatelessWidget {
  const _Tag({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
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
