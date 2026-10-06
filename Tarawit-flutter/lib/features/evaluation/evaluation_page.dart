import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../shared/skeleton_loader.dart';
import 'evaluation_controller.dart';
import 'evaluation_models.dart';

/// หน้ากิจกรรมการนิเทศ — เน้นการประมวลผล ไม่เน้นแสดงผลเยอะ
class EvaluationPage extends StatefulWidget {
  const EvaluationPage({super.key});

  @override
  State<EvaluationPage> createState() => _EvaluationPageState();
}

class _EvaluationPageState extends State<EvaluationPage> {
  final _controller = EvaluationController();

  @override
  void initState() {
    super.initState();
    _controller.load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(title: const Text('การประเมิน')),
          body: RefreshIndicator(
            onRefresh: _controller.load,
            child: _controller.isLoading
                ? const ListSkeleton(itemCount: 5)
                : _controller.errorMessage != null
                    ? _ErrorState(
                        message: _controller.errorMessage!,
                        onRetry: _controller.load,
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        children: [
                          // ===== ทางลัด 2 ปุ่ม =====
                          Row(
                            children: [
                              Expanded(
                                child: _QuickAction(
                                  icon: Icons.assignment_outlined,
                                  label: 'งานประเมิน',
                                  subtitle: 'มอบหมายใหม่',
                                  color: const Color(0xFF2563EB),
                                  onTap: () => context.goNamed('my-tasks'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _QuickAction(
                                  icon: Icons.assessment_rounded,
                                  label: 'ผลประเมิน',
                                  subtitle: 'ดูผลลัพธ์',
                                  color: const Color(0xFF10B981),
                                  onTap: () => context.goNamed('my-results'),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          // ===== รายการทั้งหมด =====
                          Text(
                            'รายการทั้งหมด',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),

                          if (_controller.items.isEmpty)
                            Card(
                              child: Padding(
                                padding: const EdgeInsets.all(32),
                                child: Center(
                                  child: Column(
                                    children: [
                                      Icon(Icons.inbox_outlined, size: 40, color: theme.colorScheme.outline),
                                      const SizedBox(height: 8),
                                      Text('ยังไม่มีรายการ', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                                    ],
                                  ),
                                ),
                              ),
                            )
                          else
                            ...List.generate(_controller.items.length, (i) {
                              return _EvalTile(item: _controller.items[i]);
                            }),
                        ],
                      ),
          ),
        );
      },
    );
  }
}

// ─── Quick Action Card ────────────────────────────────

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: color.withValues(alpha: 0.12),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 10),
              Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 2),
              Text(subtitle, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Evaluation Tile ──────────────────────────────────

class _EvalTile extends StatelessWidget {
  const _EvalTile({required this.item});

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

    // Role label
    String roleLabel = '';
    if (item.isSurvey) {
      roleLabel = 'แบบสอบถาม';
    } else if (item.isEvaluator && item.isTarget) {
      roleLabel = 'ผู้นิเทศ + ผู้รับประเมิน';
    } else if (item.isEvaluator) {
      roleLabel = 'ผู้นิเทศ';
    } else if (item.isTarget) {
      roleLabel = 'ผู้รับประเมิน';
    }

    // Action hint
    String actionHint = '';
    if (item.isEvaluator && item.isOpen && item.myPendingAssignmentId != null) {
      actionHint = 'ไปให้คะแนน →';
    } else if (item.isTarget && !item.isSurvey) {
      actionHint = 'ดูผล →';
    } else if (item.isSurvey && item.isOpen && item.myPendingAssignmentId != null) {
      actionHint = 'ตอบแบบสอบถาม →';
    }

    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            item.isSurvey ? Icons.quiz_outlined : Icons.fact_check_outlined,
            size: 20,
            color: statusColor,
          ),
        ),
        title: Text(
          item.templateName,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(statusLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
              ),
              if (roleLabel.isNotEmpty) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(roleLabel, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ),
              ],
            ],
          ),
        ),
        trailing: actionHint.isNotEmpty
            ? Text(actionHint, style: TextStyle(fontSize: 12, color: cs.primary, fontWeight: FontWeight.w500))
            : null,
        onTap: () {
          // Navigate based on role
          if (item.isEvaluator && item.isOpen && item.myPendingAssignmentId != null) {
            context.pushNamed('score-assignment', pathParameters: {'assignmentId': item.myPendingAssignmentId.toString()});
          } else if (item.isTarget) {
            context.pushNamed('my-result-detail', pathParameters: {'id': item.id.toString()});
          }
        },
      ),
    );
  }
}

// ─── Error State ──────────────────────────────────────

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded, size: 48, color: theme.colorScheme.error),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('ลองใหม่'),
            ),
          ],
        ),
      ),
    );
  }
}
