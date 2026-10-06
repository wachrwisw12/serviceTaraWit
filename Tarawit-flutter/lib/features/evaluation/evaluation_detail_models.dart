/// Detailed evaluation instance for result viewing.
/// Mirrors the web frontend's `EvaluationSectionForm` type.
class EvaluationDetail {
  const EvaluationDetail({
    required this.id,
    required this.templateId,
    required this.templateName,
    required this.templateType,
    required this.status,
    required this.academicYear,
    required this.round,
    this.instanceName,
    this.startDate,
    this.endDate,
    this.updatedAt,
    this.target,
    this.evaluators = const [],
    this.fields = const [],
    this.questions = const [],
    this.sections = const [],
    this.comment,
    this.totalScore,
    this.averageScore,
    this.assignmentStatus,
  });

  factory EvaluationDetail.fromJson(Map<String, dynamic> json) {
    return EvaluationDetail(
      id: (json['id'] as num?)?.toInt() ?? 0,
      templateId: (json['template_id'] as num?)?.toInt() ?? 0,
      templateName: json['template_name'] as String? ?? '',
      templateType: json['template_type'] as String? ?? 'EVALUATION',
      status: json['status'] as String? ?? 'DRAFT',
      academicYear: (json['academic_year'] as num?)?.toInt() ?? 0,
      round: json['round'] as String? ?? '',
      instanceName: json['instance_name'] as String?,
      startDate: json['start_date'] as String?,
      endDate: json['end_date'] as String?,
      updatedAt: json['updated_at'] as String?,
      target: json['target'] != null
          ? DetailTarget.fromJson(json['target'] as Map<String, dynamic>)
          : null,
      evaluators: (json['evaluators'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(DetailEvaluator.fromJson)
          .toList(growable: false),
      fields: (json['fields'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(InstanceField.fromJson)
          .toList(growable: false),
      questions: (json['questions'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(InstanceQuestion.fromJson)
          .toList(growable: false),
      sections: (json['sections'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(InstanceSection.fromJson)
          .toList(growable: false),
      comment: json['comment'] as String?,
      totalScore: (json['total_score'] as num?)?.toDouble(),
      averageScore: (json['average_score'] as num?)?.toDouble(),
      assignmentStatus: json['assignment_status'] as String?,
    );
  }

  final int id;
  final int templateId;
  final String templateName;
  final String templateType;
  final String status;
  final int academicYear;
  final String round;
  final String? instanceName;
  final String? startDate;
  final String? endDate;
  final String? updatedAt;
  final DetailTarget? target;
  final List<DetailEvaluator> evaluators;
  final List<InstanceField> fields;
  final List<InstanceQuestion> questions;
  final List<InstanceSection> sections;
  final String? comment;
  final double? totalScore;
  final double? averageScore;
  final String? assignmentStatus;

  bool get isClosed => status.toUpperCase() == 'CLOSED';
  bool get isSurvey => templateType == 'SURVEY';
}

class DetailTarget {
  const DetailTarget({
    required this.id,
    required this.userId,
    required this.name,
    this.position,
    this.status,
  });

  factory DetailTarget.fromJson(Map<String, dynamic> json) => DetailTarget(
        id: (json['id'] as num?)?.toInt() ?? 0,
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        name: json['name'] as String? ?? '',
        position: json['position'] as String?,
        status: json['status'] as String?,
      );

  final int id;
  final int userId;
  final String name;
  final String? position;
  final String? status;
}

class DetailEvaluator {
  const DetailEvaluator({
    required this.userId,
    required this.nameSnapshot,
    this.positionSnapshot,
  });

  factory DetailEvaluator.fromJson(Map<String, dynamic> json) =>
      DetailEvaluator(
        userId: (json['user_id'] as num?)?.toInt() ?? 0,
        nameSnapshot: json['name_snapshort'] as String? ?? '',
        positionSnapshot: json['position_snapshort'] as String?,
      );

  final int userId;
  final String nameSnapshot;
  final String? positionSnapshot;
}

class InstanceField {
  const InstanceField({
    required this.id,
    required this.templateFieldId,
    required this.fieldKey,
    required this.label,
    required this.fieldType,
    this.placeholder,
    required this.isRequired,
    this.value,
    required this.sortOrder,
  });

  factory InstanceField.fromJson(Map<String, dynamic> json) => InstanceField(
        id: (json['id'] as num?)?.toInt() ?? 0,
        templateFieldId: (json['template_field_id'] as num?)?.toInt() ?? 0,
        fieldKey: json['field_key'] as String? ?? '',
        label: json['label'] as String? ?? '',
        fieldType: json['field_type'] as String? ?? 'text',
        placeholder: json['placeholder'] as String?,
        isRequired: json['required'] as bool? ?? false,
        value: json['value'] as String?,
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
      );

  final int id;
  final int templateFieldId;
  final String fieldKey;
  final String label;
  final String fieldType;
  final String? placeholder;
  final bool isRequired;
  final String? value;
  final int sortOrder;
}

class InstanceQuestion {
  const InstanceQuestion({
    required this.id,
    this.sectionId,
    this.category,
    required this.questionText,
    required this.questionType,
    this.maxScore,
    required this.sortOrder,
    this.choices = const [],
    this.selectedScore,
    this.evaluatorScores = const [],
  });

  factory InstanceQuestion.fromJson(Map<String, dynamic> json) =>
      InstanceQuestion(
        id: (json['id'] as num?)?.toInt() ?? 0,
        sectionId: (json['section_id'] as num?)?.toInt(),
        category: json['category'] as String?,
        questionText: json['question_text'] as String? ?? '',
        questionType: json['question_type'] as String? ?? 'score',
        maxScore: (json['max_score'] as num?)?.toInt(),
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
        choices: (json['choices'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(QuestionChoice.fromJson)
            .toList(growable: false),
        selectedScore: (json['selected_score'] as num?)?.toInt(),
        evaluatorScores: (json['evaluator_scores'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(EvaluatorScore.fromJson)
            .toList(growable: false),
      );

  final int id;
  final int? sectionId;
  final String? category;
  final String questionText;
  final String questionType;
  final int? maxScore;
  final int sortOrder;
  final List<QuestionChoice> choices;
  final int? selectedScore;
  final List<EvaluatorScore> evaluatorScores;

  /// Average score across all evaluators (rounded).
  double? get averageScore {
    if (evaluatorScores.isEmpty) return null;
    final total = evaluatorScores.fold<double>(0, (sum, e) => sum + e.score);
    return total / evaluatorScores.length;
  }
}

class QuestionChoice {
  const QuestionChoice({
    required this.id,
    required this.label,
    required this.score,
    required this.sortOrder,
  });

  factory QuestionChoice.fromJson(Map<String, dynamic> json) =>
      QuestionChoice(
        id: (json['id'] as num?)?.toInt() ?? 0,
        label: json['label'] as String? ?? '',
        score: (json['score'] as num?)?.toInt() ?? 0,
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
      );

  final int id;
  final String label;
  final int score;
  final int sortOrder;
}

class EvaluatorScore {
  const EvaluatorScore({
    required this.evaluatorId,
    required this.evaluatorName,
    required this.score,
  });

  factory EvaluatorScore.fromJson(Map<String, dynamic> json) =>
      EvaluatorScore(
        evaluatorId: (json['evaluator_id'] as num?)?.toInt() ?? 0,
        evaluatorName: json['evaluator_name'] as String? ?? '',
        score: (json['score'] as num?)?.toDouble() ?? 0,
      );

  final int evaluatorId;
  final String evaluatorName;
  final double score;
}

class InstanceSection {
  const InstanceSection({
    required this.id,
    required this.name,
    required this.sortOrder,
    this.questions = const [],
  });

  factory InstanceSection.fromJson(Map<String, dynamic> json) =>
      InstanceSection(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['name'] as String? ?? '',
        sortOrder: (json['sort_order'] as num?)?.toInt() ?? 0,
        questions: (json['questions'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(InstanceQuestion.fromJson)
            .toList(growable: false),
      );

  final int id;
  final String name;
  final int sortOrder;
  final List<InstanceQuestion> questions;
}
