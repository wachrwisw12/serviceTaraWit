import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_client.dart';
import '../../shared/skeleton_loader.dart';
import 'evaluation_detail_models.dart';

/// หน้าให้คะแนน — กดเลือกคะแนนรายข้อ แล้วส่ง
class ScoreAssignmentPage extends StatefulWidget {
  const ScoreAssignmentPage({super.key, required this.assignmentId});

  final int assignmentId;

  @override
  State<ScoreAssignmentPage> createState() => _ScoreAssignmentPageState();
}

class _ScoreAssignmentPageState extends State<ScoreAssignmentPage> {
  bool _isLoading = true;
  String? _errorMessage;
  EvaluationDetail? _detail;

  // answers: question_id → score
  final Map<int, int> _answers = {};
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      final response = await ApiClient.instance.get<Map<String, dynamic>>(
        '/evaluation/evaluator/assignments/${widget.assignmentId}',
      );
      final data = response.data;
      if (mounted) {
        setState(() {
          _detail = data != null ? EvaluationDetail.fromJson(data) : null;
          _isLoading = false;
          if (data == null) _errorMessage = 'ไม่พบข้อมูล';
        });
      }
    } on DioException {
      if (mounted) setState(() { _errorMessage = 'ไม่สามารถโหลดข้อมูลได้'; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() { _errorMessage = 'ไม่สามารถโหลดข้อมูลได้'; _isLoading = false; });
    }
  }

  void _setScore(int questionId, int score) {
    setState(() => _answers[questionId] = score);
  }

  int get _totalQuestions => _detail?.questions.length ?? 0;
  int get _answeredCount => _answers.length;
  bool get _isComplete => _totalQuestions > 0 && _answeredCount == _totalQuestions;
  double get _averageScore {
    if (_answers.isEmpty) return 0;
    return _answers.values.reduce((a, b) => a + b) / _answers.length;
  }

  Future<void> _submit() async {
    if (!_isComplete) return;

    setState(() => _isSubmitting = true);
    try {
      final answers = _answers.entries.map((e) => {
        'question_id': e.key,
        'score': e.value,
      }).toList();

      await ApiClient.instance.post(
        '/evaluation/evaluator/assignments/${widget.assignmentId}/submit',
        data: {'answers': answers},
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('บันทึกคะแนนเรียบร้อยแล้ว'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        context.pop();
      }
    } on DioException catch (error) {
      final data = error.response?.data;
      final msg = data is Map<String, dynamic> ? (data['message'] ?? data['error'])?.toString() : null;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg ?? 'บันทึกคะแนนไม่สำเร็จ'), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('บันทึกคะแนนไม่สำเร็จ'), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_detail?.templateName ?? 'ให้คะแนน'),
        actions: [
          if (_detail != null)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '$_answeredCount/$_totalQuestions',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: _isComplete ? const Color(0xFF10B981) : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const ListSkeleton(itemCount: 5)
          : _errorMessage != null
              ? _ErrorState(message: _errorMessage!, onRetry: _loadDetail)
              : _detail == null
                  ? const Center(child: Text('ไม่พบข้อมูล'))
                  : _buildForm(theme),
      bottomNavigationBar: _detail != null ? _buildSubmitBar(theme) : null,
    );
  }

  Widget _buildForm(ThemeData theme) {
    final detail = _detail!;
    final cs = theme.colorScheme;

    // Group questions by section
    final sections = detail.sections;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      children: [
        // Target info
        if (detail.target != null) ...[
          Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(
                  detail.target!.name.isNotEmpty ? detail.target!.name[0] : '?',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(detail.target!.name, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: detail.target!.position != null ? Text(detail.target!.position!) : null,
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Score overview
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _ScoreStat(label: 'ให้แล้ว', value: '$_answeredCount', color: const Color(0xFF10B981)),
                _ScoreStat(label: 'เหลือ', value: '${_totalQuestions - _answeredCount}', color: const Color(0xFFF59E0B)),
                _ScoreStat(label: 'เฉลี่ย', value: _answers.isNotEmpty ? _averageScore.toStringAsFixed(1) : '-', color: cs.primary),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Questions by section or flat
        if (sections.isNotEmpty)
          for (final section in sections) ...[
            if (section.name.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 8),
                child: Text(
                  section.name,
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
            for (final q in section.questions)
              _ScoreQuestion(
                question: q,
                score: _answers[q.id],
                onScoreChanged: (score) => _setScore(q.id, score),
              ),
            const SizedBox(height: 12),
          ]
        else
          for (final q in detail.questions)
            _ScoreQuestion(
              question: q,
              score: _answers[q.id],
              onScoreChanged: (score) => _setScore(q.id, score),
            ),
      ],
    );
  }

  Widget _buildSubmitBar(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Progress
            if (_totalQuestions > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: _answeredCount / _totalQuestions,
                          minHeight: 6,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$_answeredCount/$_totalQuestions ข้อ',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            // Submit button
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: (_isComplete && !_isSubmitting) ? _submit : null,
                icon: _isSubmitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.check_rounded),
                label: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Text(_isSubmitting ? 'กำลังบันทึก...' : _isComplete ? 'บันทึกคะแนน' : 'กรุณาให้คะแนนให้ครบทุกข้อ'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Score Question Widget ────────────────────────────

class _ScoreQuestion extends StatelessWidget {
  const _ScoreQuestion({
    required this.question,
    this.score,
    required this.onScoreChanged,
  });

  final InstanceQuestion question;
  final int? score;
  final ValueChanged<int> onScoreChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final maxScore = question.maxScore ?? 5;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question text
            Text(question.questionText, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 10),

            // Score buttons (1 to maxScore)
            if (question.choices.isNotEmpty)
              // Choice-based scoring
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: question.choices.map((c) {
                  final isSelected = score == c.score;
                  return ChoiceChip(
                    label: Text('${c.score} - ${c.label}', style: TextStyle(fontSize: 13)),
                    selected: isSelected,
                    onSelected: (_) => onScoreChanged(c.score),
                    selectedColor: cs.primary.withValues(alpha: 0.15),
                    labelStyle: TextStyle(
                      color: isSelected ? cs.primary : cs.onSurface,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  );
                }).toList(),
              )
            else
              // Number scale (1 to maxScore)
              Row(
                children: List.generate(maxScore, (index) {
                  final value = index + 1;
                  final isSelected = score == value;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: GestureDetector(
                        onTap: () => onScoreChanged(value),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? cs.primary : cs.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              '$value',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isSelected ? Colors.white : cs.onSurface,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),

            // Show selected score
            if (score != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.check_circle_rounded, size: 16, color: const Color(0xFF10B981)),
                  const SizedBox(width: 4),
                  Text(
                    'ให้คะแนน $score/$maxScore',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF10B981)),
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

// ─── Score Stat ───────────────────────────────────────

class _ScoreStat extends StatelessWidget {
  const _ScoreStat({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ],
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
