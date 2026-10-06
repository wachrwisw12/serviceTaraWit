/// Evaluation task batch assigned to the current user as evaluator.
///
/// Mirrors the web frontend's `MyEvaluationTask` type from
/// `features/evaluation/api/MyTaskSlice.ts`.
class MyEvaluationTask {
  const MyEvaluationTask({
    required this.batchId,
    required this.title,
    required this.academicYear,
    required this.round,
    required this.totalTarget,
    required this.completedTarget,
    required this.status,
    required this.evaluatorId,
  });

  factory MyEvaluationTask.fromJson(Map<String, dynamic> json) => MyEvaluationTask(
        batchId: json['batch_id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        academicYear: (json['academic_year'] as num?)?.toInt() ?? 0,
        round: json['round'] as String? ?? '',
        totalTarget: (json['total_target'] as num?)?.toInt() ?? 0,
        completedTarget: (json['completed_target'] as num?)?.toInt() ?? 0,
        status: json['status'] as String? ?? 'open',
        evaluatorId: (json['evaluator_id'] as num?)?.toInt() ?? 0,
      );

  final String batchId;
  final String title;
  final int academicYear;
  final String round;
  final int totalTarget;
  final int completedTarget;
  final String status;
  final int evaluatorId;

  bool get isOpen => status == 'open';
  bool get isDraft => status == 'draft';
  bool get isClosed => status == 'closed';

  int get remaining => (totalTarget - completedTarget).clamp(0, totalTarget);

  /// Progress percentage (0–100).
  int get progress {
    if (totalTarget == 0) return 0;
    return ((completedTarget / totalTarget) * 100).round().clamp(0, 100);
  }
}

/// Evaluation instance assignment for the current user.
///
/// Mirrors the web frontend's `MyEvaluationAssignment` type from
/// `features/evaluation/types/EvaluationSectionForm_type.ts`.
class MyEvaluationAssignment {
  const MyEvaluationAssignment({
    required this.id,
    required this.templateId,
    required this.templateName,
    required this.templateType,
    required this.status,
    required this.role,
    required this.academicYear,
    required this.round,
    this.startDate,
    this.endDate,
    this.updatedAt,
    this.target,
    this.evaluators = const [],
    this.batchId,
    this.myAssignmentCount,
    this.mySubmittedCount,
    this.myPendingAssignmentId,
    this.myAssignments = const [],
  });

  factory MyEvaluationAssignment.fromJson(Map<String, dynamic> json) {
    return MyEvaluationAssignment(
      id: (json['id'] as num?)?.toInt() ?? 0,
      templateId: (json['template_id'] as num?)?.toInt() ?? 0,
      templateName: json['template_name'] as String? ?? '',
      templateType: json['template_type'] as String? ?? 'EVALUATION',
      status: json['status'] as String? ?? 'DRAFT',
      role: json['role'] as String? ?? 'target',
      academicYear: (json['academic_year'] as num?)?.toInt() ?? 0,
      round: json['round'] as String? ?? '',
      startDate: json['start_date'] as String?,
      endDate: json['end_date'] as String?,
      updatedAt: json['updated_at'] as String?,
      target: json['target'] != null
          ? EvaluationTarget.fromJson(json['target'] as Map<String, dynamic>)
          : null,
      evaluators: (json['evaluators'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(EvaluationEvaluator.fromJson)
          .toList(growable: false),
      batchId: json['batch_id'] as String?,
      myAssignmentCount: (json['my_assignment_count'] as num?)?.toInt(),
      mySubmittedCount: (json['my_submitted_count'] as num?)?.toInt(),
      myPendingAssignmentId: (json['my_pending_assignment_id'] as num?)?.toInt(),
      myAssignments: (json['my_assignments'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MyAssignmentInfo.fromJson)
          .toList(growable: false),
    );
  }

  final int id;
  final int templateId;
  final String templateName;
  final String templateType;
  final String status;
  final String role;
  final int academicYear;
  final String round;
  final String? startDate;
  final String? endDate;
  final String? updatedAt;
  final EvaluationTarget? target;
  final List<EvaluationEvaluator> evaluators;
  final String? batchId;
  final int? myAssignmentCount;
  final int? mySubmittedCount;
  final int? myPendingAssignmentId;
  final List<MyAssignmentInfo> myAssignments;

  bool get isEvaluator => role == 'evaluator' || role == 'both';
  bool get isTarget => role == 'target' || role == 'both';
  bool get isSurvey => templateType == 'SURVEY';
  bool get isOpen => status == 'OPEN';
  bool get isDraft => status == 'DRAFT';
  bool get isClosed => status == 'CLOSED';

  /// Progress percentage for evaluator role (0–100).
  int get evaluatorProgress {
    final total = myAssignmentCount ?? 0;
    if (total == 0) return 0;
    return (((mySubmittedCount ?? 0) / total) * 100).round().clamp(0, 100);
  }
}

class EvaluationTarget {
  const EvaluationTarget({
    required this.id,
    required this.name,
    this.position,
  });

  factory EvaluationTarget.fromJson(Map<String, dynamic> json) =>
      EvaluationTarget(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['name'] as String? ?? '',
        position: json['position'] as String?,
      );

  final int id;
  final String name;
  final String? position;
}

class EvaluationEvaluator {
  const EvaluationEvaluator({
    required this.userId,
    required this.nameSnapshot,
    this.positionSnapshot,
  });

  factory EvaluationEvaluator.fromJson(Map<String, dynamic> json) =>
      EvaluationEvaluator(
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        nameSnapshot: json['name_snapshort'] as String? ?? '',
        positionSnapshot: json['position_snapshort'] as String?,
      );

  final int userId;
  final String nameSnapshot;
  final String? positionSnapshot;
}

class MyAssignmentInfo {
  const MyAssignmentInfo({
    required this.assignmentId,
    required this.targetUserId,
    required this.targetName,
    this.targetPosition,
    required this.status,
  });

  factory MyAssignmentInfo.fromJson(Map<String, dynamic> json) =>
      MyAssignmentInfo(
        assignmentId: (json['assignment_id'] as num?)?.toInt() ?? 0,
        targetUserId: (json['target_user_id'] as num?)?.toInt() ?? 0,
        targetName: json['target_name'] as String? ?? '',
        targetPosition: json['target_position'] as String?,
        status: json['status'] as String? ?? 'pending',
      );

  final int assignmentId;
  final int targetUserId;
  final String targetName;
  final String? targetPosition;
  final String status;

  bool get isSubmitted => status == 'submitted';
}
