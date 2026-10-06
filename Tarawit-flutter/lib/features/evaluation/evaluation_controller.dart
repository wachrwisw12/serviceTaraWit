import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../core/network/api_client.dart';
import 'evaluation_models.dart';

class EvaluationController extends ChangeNotifier {
  List<MyEvaluationAssignment> _all = [];
  List<MyEvaluationAssignment> items = [];
  bool isLoading = true;
  String? errorMessage;

  // Filters
  String searchQuery = '';
  String roleFilter = 'all'; // 'all' | 'evaluator' | 'target'
  String statusFilter = 'all';

  // Summary
  int get evaluatorCount => _all.where((e) => e.isEvaluator).length;
  int get openCount => _all.where((e) => !e.isClosed).length;
  int get latestYear {
    if (_all.isEmpty) return 0;
    return _all.map((e) => e.academicYear).reduce((a, b) => a > b ? a : b);
  }

  /// Distinct status values found in the data.
  List<String> get availableStatuses {
    final set = _all.map((e) => e.status).toSet();
    return set.toList()..sort();
  }

  Future<void> load() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final response = await ApiClient.instance.get<List<dynamic>>(
        '/evaluation/instances/get-my-instance',
      );
      _all = (response.data ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MyEvaluationAssignment.fromJson)
          .toList(growable: false);
      _applyFilters();
    } on DioException catch (error) {
      errorMessage = _extractError(error, 'ไม่สามารถโหลดข้อมูลได้');
    } catch (_) {
      errorMessage = 'ไม่สามารถโหลดข้อมูลได้';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void updateSearch(String query) {
    searchQuery = query;
    _applyFilters();
    notifyListeners();
  }

  void updateRoleFilter(String role) {
    roleFilter = role;
    _applyFilters();
    notifyListeners();
  }

  void updateStatusFilter(String status) {
    statusFilter = status;
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    items = _all.where((item) {
      // Role filter
      if (roleFilter == 'evaluator' && !item.isEvaluator) return false;
      if (roleFilter == 'target' && !item.isTarget) return false;

      // Status filter
      if (statusFilter != 'all' && item.status != statusFilter) return false;

      // Search
      if (searchQuery.isNotEmpty) {
        final q = searchQuery.toLowerCase();
        if (!item.templateName.toLowerCase().contains(q)) return false;
      }

      return true;
    }).toList()
      ..sort((a, b) {
        // Sort by status priority: OPEN > DRAFT > CLOSED
        final statusOrder = {'OPEN': 0, 'DRAFT': 1, 'CLOSED': 2};
        final sa = statusOrder[a.status] ?? 3;
        final sb = statusOrder[b.status] ?? 3;
        if (sa != sb) return sa.compareTo(sb);
        // Then by updated_at descending
        final at = a.updatedAt ?? '';
        final bt = b.updatedAt ?? '';
        return bt.compareTo(at);
      });
  }

  String _extractError(DioException error, String fallback) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final msg = data['message'] ?? data['error'];
      if (msg is String && msg.isNotEmpty) return msg;
    }
    return fallback;
  }
}
