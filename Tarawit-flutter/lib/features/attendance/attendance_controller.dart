import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/network/api_client.dart';
import 'attendance_models.dart';

class AttendanceController extends ChangeNotifier {
  DateTime selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);
  AttendanceRecord? today;
  List<AttendanceRecord> records = const [];
  AttendanceSummary summary = const AttendanceSummary();
  bool isLoadingToday = true;
  bool isLoadingRecords = true;
  bool isSubmitting = false;
  bool isLoadingLocation = true;
  UserGeofencePolicy? locationPolicy;
  Position? currentPosition;
  AttendanceLocation? nearestLocation;
  double? nearestDistanceM;
  String? locationError;
  StreamSubscription<Position>? _positionSubscription;
  String? errorMessage;

  String get monthQuery => '${selectedMonth.year}-${selectedMonth.month.toString().padLeft(2, '0')}';
  bool get hasCheckedIn => today?.checkInAt != null;
  bool get hasCheckedOut => today?.checkOutAt != null;
  bool get hasAccuratePosition => currentPosition != null &&
      currentPosition!.accuracy <= (locationPolicy?.maxLocationAccuracyM ?? double.infinity);
  bool get isInsideArea => nearestLocation != null &&
      nearestDistanceM != null &&
      nearestDistanceM! <= nearestLocation!.radiusM;
  bool get isLocationAllowed {
    final policy = locationPolicy;
    if (policy == null) return false;
    if (!policy.enabled) return true;
    return hasAccuratePosition && (isInsideArea || policy.outsideAllowed);
  }
  bool get isCheckInWindowOpen => _isWithinWindow(locationPolicy?.checkInOpen, locationPolicy?.checkInClose);
  bool get isCheckOutWindowOpen => _isWithinWindow(locationPolicy?.checkOutOpen, locationPolicy?.checkOutClose);
  bool get canCheckInNow => isLocationAllowed && isCheckInWindowOpen;
  bool get canCheckOutNow => isLocationAllowed && isCheckOutWindowOpen;
  bool get canPerformNextAttendance => hasCheckedIn ? !hasCheckedOut && canCheckOutNow : canCheckInNow;

  String get attendanceEligibilityStatus {
    if (!isLocationAllowed) return locationStatus;
    if (!hasCheckedIn && !isCheckInWindowOpen) return 'อยู่นอกช่วงเวลาลงเข้างาน';
    if (hasCheckedIn && !hasCheckedOut && !isCheckOutWindowOpen) return 'อยู่นอกช่วงเวลาลงออกงาน';
    if (hasCheckedOut) return 'ลงเวลาเข้า–ออกครบแล้ว';
    return locationStatus;
  }

  String get locationStatus {
    final policy = locationPolicy;
    if (isLoadingLocation) return 'กำลังตรวจสอบตำแหน่ง...';
    if (policy == null) return locationError ?? 'ไม่สามารถตรวจสอบพื้นที่ได้';
    if (!policy.enabled) return 'ไม่จำกัดพื้นที่ลงเวลา';
    if (currentPosition == null) return locationError ?? 'กำลังค้นหาตำแหน่งของคุณ';
    if (!hasAccuratePosition) return 'สัญญาณ GPS ยังไม่แม่นยำพอ';
    if (isInsideArea) return 'อยู่ในพื้นที่ ลงเวลาได้';
    if (policy.outsideAllowed) return 'อยู่นอกพื้นที่ แต่คุณได้รับสิทธิ์ลงเวลา';
    return 'อยู่นอกพื้นที่ลงเวลา';
  }

  bool _isWithinWindow(String? open, String? close) {
    if (open == null || close == null) return false;
    int minutes(String value) {
      final parts = value.split(':');
      if (parts.length < 2) return -1;
      return (int.tryParse(parts[0]) ?? -24) * 60 + (int.tryParse(parts[1]) ?? -60);
    }
    final start = minutes(open);
    final end = minutes(close);
    final now = DateTime.now();
    final current = now.hour * 60 + now.minute;
    if (start < 0 || end < 0) return false;
    return start <= end ? current >= start && current <= end : current >= start || current <= end;
  }

  Future<void> load() async {
    errorMessage = null;
    await Future.wait([loadToday(), loadRecords(), loadLocationPolicy()]);
  }

  Future<void> loadLocationPolicy() async {
    isLoadingLocation = true;
    locationError = null;
    notifyListeners();
    try {
      final response = await ApiClient.instance.get<Map<String, dynamic>>('/attendance/location-policy');
      final data = response.data;
      if (data == null) throw const FormatException('Invalid location policy');
      locationPolicy = UserGeofencePolicy.fromJson(data);
      if (locationPolicy!.enabled || locationPolicy!.locations.isNotEmpty) await startLocationTracking();
    } on DioException catch (error) {
      locationError = _message(error, 'ไม่สามารถโหลดพื้นที่ลงเวลาได้');
    } catch (_) {
      locationError = 'ไม่สามารถโหลดพื้นที่ลงเวลาได้';
    } finally {
      isLoadingLocation = false;
      notifyListeners();
    }
  }

  Future<void> startLocationTracking() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      locationError = 'กรุณาเปิดบริการตำแหน่งบนอุปกรณ์';
      notifyListeners();
      return;
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      locationError = permission == LocationPermission.deniedForever
          ? 'กรุณาอนุญาตตำแหน่งจากการตั้งค่าอุปกรณ์'
          : 'ต้องอนุญาตตำแหน่งเพื่อลงเวลา';
      notifyListeners();
      return;
    }
    await _positionSubscription?.cancel();
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 3),
    ).listen(_updatePosition, onError: (_) {
      locationError = 'รับตำแหน่งปัจจุบันไม่สำเร็จ';
      notifyListeners();
    });
  }

  void _updatePosition(Position position) {
    currentPosition = position;
    locationError = null;
    nearestLocation = null;
    nearestDistanceM = null;
    for (final location in locationPolicy?.locations ?? const <AttendanceLocation>[]) {
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        location.latitude,
        location.longitude,
      );
      if (nearestDistanceM == null || distance < nearestDistanceM!) {
        nearestDistanceM = distance;
        nearestLocation = location;
      }
    }
    notifyListeners();
  }

  Future<void> loadToday() async {
    isLoadingToday = true;
    notifyListeners();
    try {
      final response = await ApiClient.instance.get<dynamic>('/attendance/today');
      final data = response.data;
      today = data is Map<String, dynamic> ? AttendanceRecord.fromJson(data) : null;
    } on DioException catch (error) {
      errorMessage = _message(error, 'ไม่สามารถโหลดข้อมูลลงเวลาวันนี้ได้');
    } finally {
      isLoadingToday = false;
      notifyListeners();
    }
  }

  Future<void> loadRecords() async {
    isLoadingRecords = true;
    notifyListeners();
    try {
      final response = await ApiClient.instance.get<Map<String, dynamic>>(
        '/attendance/my',
        queryParameters: {'month': monthQuery},
      );
      final data = response.data;
      records = (data?['records'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(AttendanceRecord.fromJson)
          .toList(growable: false);
      summary = AttendanceSummary.fromJson(data?['summary'] as Map<String, dynamic>?);
    } on DioException catch (error) {
      errorMessage = _message(error, 'ไม่สามารถโหลดประวัติการลงเวลาได้');
    } finally {
      isLoadingRecords = false;
      notifyListeners();
    }
  }

  Future<bool> checkIn() => _submit('/attendance/check-in', 'ลงเวลาเข้างานไม่สำเร็จ');
  Future<bool> checkOut() => _submit('/attendance/check-out', 'ลงเวลาออกงานไม่สำเร็จ');

  Future<bool> _submit(String path, String fallback) async {
    isSubmitting = true;
    errorMessage = null;
    notifyListeners();
    try {
      final position = currentPosition;
      final response = await ApiClient.instance.post<Map<String, dynamic>>(
        path,
        data: position == null
            ? null
            : {'latitude': position.latitude, 'longitude': position.longitude, 'accuracy_m': position.accuracy},
      );
      final data = response.data;
      if (data == null) throw const FormatException('Invalid attendance response');
      today = AttendanceRecord.fromJson(data);
      await loadRecords();
      return true;
    } on DioException catch (error) {
      errorMessage = _message(error, fallback);
      return false;
    } catch (_) {
      errorMessage = fallback;
      return false;
    } finally {
      isSubmitting = false;
      notifyListeners();
    }
  }

  Future<void> changeMonth(int offset) async {
    final next = DateTime(selectedMonth.year, selectedMonth.month + offset);
    final current = DateTime(DateTime.now().year, DateTime.now().month);
    if (next.isAfter(current)) return;
    selectedMonth = next;
    await loadRecords();
  }

  String _message(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['error'];
      if (message is String && message.isNotEmpty) return message;
    }
    return fallback;
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    super.dispose();
  }
}
