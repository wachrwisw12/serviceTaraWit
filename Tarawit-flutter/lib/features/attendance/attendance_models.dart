class AttendanceRecord {
  const AttendanceRecord({
    required this.id,
    required this.recordDate,
    required this.status,
    this.checkInAt,
    this.checkOutAt,
    this.workMinutes,
    this.note,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: (json['id'] as num?)?.toInt() ?? 0,
      recordDate: json['record_date'] as String? ?? '',
      checkInAt: _parseDateTime(json['check_in_at']),
      checkOutAt: _parseDateTime(json['check_out_at']),
      status: json['status'] as String? ?? 'working',
      workMinutes: (json['work_minutes'] as num?)?.toInt(),
      note: json['note'] as String?,
    );
  }

  final int id;
  final String recordDate;
  final DateTime? checkInAt;
  final DateTime? checkOutAt;
  final String status;
  final int? workMinutes;
  final String? note;

  static DateTime? _parseDateTime(dynamic value) {
    if (value is! String || value.isEmpty) return null;
    return DateTime.tryParse(value)?.toLocal();
  }
}

class AttendanceSummary {
  const AttendanceSummary({
    this.working = 0,
    this.present = 0,
    this.late = 0,
    this.earlyLeave = 0,
  });

  factory AttendanceSummary.fromJson(Map<String, dynamic>? json) {
    return AttendanceSummary(
      working: (json?['working'] as num?)?.toInt() ?? 0,
      present: (json?['present'] as num?)?.toInt() ?? 0,
      late: (json?['late'] as num?)?.toInt() ?? 0,
      earlyLeave: (json?['early_leave'] as num?)?.toInt() ?? 0,
    );
  }

  final int working;
  final int present;
  final int late;
  final int earlyLeave;
}

class AttendanceLocation {
  const AttendanceLocation({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.radiusM,
  });

  factory AttendanceLocation.fromJson(Map<String, dynamic> json) => AttendanceLocation(
        id: (json['id'] as num?)?.toInt() ?? 0,
        name: json['name'] as String? ?? 'จุดลงเวลา',
        latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
        longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
        radiusM: (json['radius_m'] as num?)?.toDouble() ?? 0,
      );

  final int id;
  final String name;
  final double latitude;
  final double longitude;
  final double radiusM;
}

class UserGeofencePolicy {
  const UserGeofencePolicy({
    required this.enabled,
    required this.maxLocationAccuracyM,
    required this.outsideAllowed,
    required this.locations,
    required this.checkInOpen,
    required this.checkInClose,
    required this.checkOutOpen,
    required this.checkOutClose,
  });

  factory UserGeofencePolicy.fromJson(Map<String, dynamic> json) => UserGeofencePolicy(
        enabled: json['enabled'] as bool? ?? false,
        maxLocationAccuracyM: (json['max_location_accuracy_m'] as num?)?.toDouble() ?? 100,
        outsideAllowed: json['outside_allowed'] as bool? ?? false,
        locations: (json['locations'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(AttendanceLocation.fromJson)
            .toList(growable: false),
        checkInOpen: json['check_in_open'] as String? ?? '00:00:00',
        checkInClose: json['check_in_close'] as String? ?? '23:59:59',
        checkOutOpen: json['check_out_open'] as String? ?? '00:00:00',
        checkOutClose: json['check_out_close'] as String? ?? '23:59:59',
      );

  final bool enabled;
  final double maxLocationAccuracyM;
  final bool outsideAllowed;
  final List<AttendanceLocation> locations;
  final String checkInOpen;
  final String checkInClose;
  final String checkOutOpen;
  final String checkOutClose;
}
